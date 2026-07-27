import NextAuth, { type NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import {
  getEffectiveSkillVaultRoles,
  normalizeSkillVaultRoles,
  resolveSkillVaultJwtRoles,
} from "@/lib/auth/role-policy";
import { ensureUser } from "@/lib/users/service";

export const authConfig: NextAuthConfig = {
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
    async signIn({ user }) {
      if (user?.id) {
        try {
          await ensureUser({
            id: user.id,
            username: user.name ?? user.email ?? user.id,
            email: user.email ?? "",
            keycloakRoles: (user as any).roles,
          });
        } catch (error) {
          console.error("Failed to synchronize user session with database:", error);
        }
      }
      return true;
    },
    redirect({ url, baseUrl }) {
      const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
      // Allow redirecting to Keycloak issuer URL
      if (issuer) {
        try {
          const urlObj = new URL(url);
          const issuerObj = new URL(issuer);
          if (urlObj.origin === issuerObj.origin && url.startsWith(issuer)) {
            return url;
          }
        } catch (e) {
          // Ignore invalid URL
        }
      }
      
      // Allow relative callback URLs (excluding protocol-relative URLs)
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same-origin redirects
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (e) {
        // Fallback to baseUrl if URL parsing fails
      }
      
      return baseUrl;
    },
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
