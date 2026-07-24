"use server";

import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";

function buildKeycloakLogoutUrl(idToken?: string): string | null {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  if (!issuer || !idToken) return null;

  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("id_token_hint", idToken);
  logoutUrl.searchParams.set("post_logout_redirect_uri", process.env.AUTH_URL ?? "/");
  return logoutUrl.toString();
}

export async function loginAction() {
  await signIn("keycloak");
}

export async function logoutAction() {
  const session = await auth();
  const keycloakLogoutUrl = buildKeycloakLogoutUrl(session?.idToken);
  await signOut({ redirect: false });
  redirect(keycloakLogoutUrl ?? "/");
}
