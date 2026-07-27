import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import {
  getEffectiveSkillVaultRoles,
  normalizeSkillVaultRoles,
  resolveSkillVaultJwtRoles,
} from "@/lib/auth/role-policy";

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
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          roles: getEffectiveSkillVaultRoles(
            profile as Record<string, unknown>,
            process.env.AUTH_KEYCLOAK_ID,
          ),
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, profile, account }) {
      token.roles = resolveSkillVaultJwtRoles({
        userRoles: user && "roles" in user ? user.roles : undefined,
        profile: profile as Record<string, unknown> | undefined,
        tokenRoles: token.roles,
        clientId: process.env.AUTH_KEYCLOAK_ID,
      });
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
      session.user.roles = normalizeSkillVaultRoles(token.roles);
      session.idToken = token.idToken as string | undefined;
      return session;
    },
  },
});
