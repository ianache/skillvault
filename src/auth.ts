import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

function extractKeycloakRoles(profile: Record<string, unknown>, clientId?: string): string[] {
  const realmRoles = (profile.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const clientRoles = clientId
    ? (profile.resource_access as Record<string, { roles?: string[] }> | undefined)?.[clientId]?.roles ?? []
    : [];
  // This realm's "roles" client scope mappers (realm_access/resource_access) aren't flagged
  // "Add to ID token" in Keycloak, so they never reach `profile` here. The `skillvault` client
  // has its own dedicated mapper that puts client roles into a flat `roles` claim instead —
  // read that too so authorization works against the ID token Keycloak actually issues.
  const flatRoles = Array.isArray(profile.roles) ? (profile.roles as string[]) : [];
  return [...new Set([...realmRoles, ...clientRoles, ...flatRoles])];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
      profile(profile) {
        const roles = extractKeycloakRoles(profile as Record<string, unknown>, process.env.AUTH_KEYCLOAK_ID);
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          roles,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, profile, account }) {
      if (user && "roles" in user && Array.isArray(user.roles)) {
        token.roles = user.roles as string[];
      } else if (profile) {
        token.roles = extractKeycloakRoles(profile as Record<string, unknown>, process.env.AUTH_KEYCLOAK_ID);
      }
      // Needed for RP-initiated (federated) logout against Keycloak's end_session_endpoint.
      if (account?.id_token) {
        token.idToken = account.id_token;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.roles = (token.roles as string[]) ?? [];
      session.idToken = token.idToken as string | undefined;
      return session;
    },
  },
});
