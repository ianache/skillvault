import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { authConfig } from "../../auth";

describe("NextAuth redirect callback", () => {
  let originalEnv: string | undefined;

  before(() => {
    originalEnv = process.env.AUTH_KEYCLOAK_ISSUER;
    process.env.AUTH_KEYCLOAK_ISSUER = "https://oauth2.qa.comsatel.com.pe/realms/Apps";
  });

  after(() => {
    process.env.AUTH_KEYCLOAK_ISSUER = originalEnv;
  });

  test("allows redirect to Keycloak issuer URL", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const targetUrl = "https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/logout?id_token_hint=abc";
    const result = await redirectCallback({ url: targetUrl, baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, targetUrl);
  });

  test("allows relative URLs by appending to baseUrl", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "/dashboard", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010/dashboard");
  });

  test("allows URLs with same origin as baseUrl", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "http://localhost:3010/catalog", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010/catalog");
  });

  test("denies redirect to untrusted external domains and falls back to baseUrl", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "https://evil.com/logout", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010");
  });

  test("rejects protocol-relative open redirect URLs", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "//evil.com/phishing", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010");
  });

  test("rejects keycloak url when origin does not match issuer origin", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const spoofedUrl = "https://evil.com/https://oauth2.qa.comsatel.com.pe/realms/Apps/logout";
    const result = await redirectCallback({ url: spoofedUrl, baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010");
  });
});
