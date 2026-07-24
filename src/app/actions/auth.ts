"use server";

import { auth, signIn, signOut } from "@/auth";

function buildKeycloakLogoutUrl(idToken?: string): string | null {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  if (!issuer) return null;

  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  if (idToken) {
    logoutUrl.searchParams.set("id_token_hint", idToken);
  }
  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  logoutUrl.searchParams.set("post_logout_redirect_uri", baseUrl);
  return logoutUrl.toString();
}

export async function loginAction() {
  await signIn("keycloak");
}

export async function logoutAction() {
  const session = await auth();
  const keycloakLogoutUrl = buildKeycloakLogoutUrl(session?.idToken);
  await signOut({ redirectTo: keycloakLogoutUrl ?? "/" });
}
