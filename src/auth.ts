import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

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
        // Keycloak puts roles in realm_access/resource_access, not a flat
        // "roles" claim — the default provider profile() drops both.
        const realmRoles = (profile.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
        const clientRoles =
          (profile.resource_access as Record<string, { roles?: string[] }> | undefined)?.[
            process.env.AUTH_KEYCLOAK_ID!
          ]?.roles ?? [];
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          roles: [...new Set([...realmRoles, ...clientRoles])],
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account && profile) {
        // Extract client roles from the Keycloak token claim "roles"
        const p = profile as Record<string, unknown>;
        const roles = Array.isArray(p.roles) ? (p.roles as string[]) : [];
        token.roles = roles;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.roles = (token.roles as string[]) ?? [];
      return session;
    },
  },
});
