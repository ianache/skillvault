import test from "node:test";
import assert from "node:assert/strict";
import { authConfig } from "./auth";

test("redirect callback allows Keycloak issuer URL", async () => {
  process.env.AUTH_KEYCLOAK_ISSUER = "https://keycloak.example.com/realms/master";
  const redirect = authConfig.callbacks?.redirect;
  assert(redirect);

  const keycloakUrl = "https://keycloak.example.com/realms/master/protocol/openid-connect/logout";
  const result = await redirect({ url: keycloakUrl, baseUrl: "http://localhost:3000" });
  assert.equal(result, keycloakUrl);
});

test("redirect callback allows relative URLs", async () => {
  const redirect = authConfig.callbacks?.redirect;
  assert(redirect);

  const result = await redirect({ url: "/dashboard", baseUrl: "http://localhost:3000" });
  assert.equal(result, "http://localhost:3000/dashboard");
});

test("redirect callback allows same origin URLs", async () => {
  const redirect = authConfig.callbacks?.redirect;
  assert(redirect);

  const sameOriginUrl = "http://localhost:3000/some/path";
  const result = await redirect({ url: sameOriginUrl, baseUrl: "http://localhost:3000" });
  assert.equal(result, sameOriginUrl);
});

test("redirect callback falls back to baseUrl for external untrusted URLs", async () => {
  process.env.AUTH_KEYCLOAK_ISSUER = "https://keycloak.example.com/realms/master";
  const redirect = authConfig.callbacks?.redirect;
  assert(redirect);

  const untrustedUrl = "https://malicious.com/phishing";
  const result = await redirect({ url: untrustedUrl, baseUrl: "http://localhost:3000" });
  assert.equal(result, "http://localhost:3000");
});

test("redirect callback rejects protocol-relative open redirect URLs", async () => {
  const redirect = authConfig.callbacks?.redirect;
  assert(redirect);

  const result = await redirect({ url: "//evil.com/phishing", baseUrl: "http://localhost:3000" });
  assert.equal(result, "http://localhost:3000");
});

test("redirect callback rejects keycloak url when origin does not match issuer origin", async () => {
  process.env.AUTH_KEYCLOAK_ISSUER = "https://keycloak.example.com/realms/master";
  const redirect = authConfig.callbacks?.redirect;
  assert(redirect);

  const spoofedUrl = "https://evil.com/https://keycloak.example.com/realms/master/logout";
  const result = await redirect({ url: spoofedUrl, baseUrl: "http://localhost:3000" });
  assert.equal(result, "http://localhost:3000");
});
