import type { Page } from "@playwright/test";
import { createIdToken, getTestJwks } from "./jwt";

export const TEST_AUTH0_DOMAIN = "test.auth0.local";
export const TEST_CLIENT_ID = "test-client-id";
export const TEST_ISSUER = `https://${TEST_AUTH0_DOMAIN}/`;

export const TEST_USER = {
  sub: "auth0|e2e-test-user",
  name: "E2E Test User",
  email: "test@example.com",
  picture: "https://example.com/avatar.png",
};

const oidcConfig = {
  issuer: TEST_ISSUER,
  authorization_endpoint: `https://${TEST_AUTH0_DOMAIN}/authorize`,
  token_endpoint: `https://${TEST_AUTH0_DOMAIN}/oauth/token`,
  userinfo_endpoint: `https://${TEST_AUTH0_DOMAIN}/userinfo`,
  jwks_uri: `https://${TEST_AUTH0_DOMAIN}/.well-known/jwks.json`,
  response_types_supported: ["code"],
  subject_types_supported: ["public"],
  id_token_signing_alg_values_supported: ["RS256"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
};

/**
 * Sets up route mocks to simulate a fully authenticated Auth0 session.
 *
 * Flow:
 *  1. App calls checkSession() which triggers a silent auth iframe.
 *  2. The iframe navigates to /authorize?prompt=none&response_mode=web_message.
 *  3. Our mock serves HTML that postMessages back with {code, state}.
 *  4. The SDK exchanges the code at /oauth/token.
 *  5. We return a valid signed JWT using a test RSA key pair.
 *  6. The JWKS endpoint serves the corresponding public key for verification.
 */
export async function setupAuth0Mocks(page: Page): Promise<void> {
  // Nonce is captured from the authorize request and used in the JWT.
  // This variable is scoped per page instance, so tests are isolated.
  let capturedNonce = "";

  // OIDC discovery
  await page.route(
    `https://${TEST_AUTH0_DOMAIN}/.well-known/openid-configuration`,
    async (route) => {
      await route.fulfill({ json: oidcConfig });
    },
  );

  // JWKS (public key for JWT signature verification)
  await page.route(
    `https://${TEST_AUTH0_DOMAIN}/.well-known/jwks.json`,
    async (route) => {
      await route.fulfill({ json: getTestJwks() });
    },
  );

  // Authorize endpoint — handles both silent auth (iframe) and interactive login
  await page.route(
    `https://${TEST_AUTH0_DOMAIN}/authorize**`,
    async (route) => {
      const url = new URL(route.request().url());
      capturedNonce = url.searchParams.get("nonce") ?? "";
      const state = url.searchParams.get("state") ?? "";
      const prompt = url.searchParams.get("prompt");

      if (prompt === "none") {
        // Silent auth: respond via web_message postMessage
        // The SDK's _runIframe() listens for this message on window.
        await route.fulfill({
          contentType: "text/html",
          body: `<!DOCTYPE html>
<html>
<script>
  var params = new URLSearchParams(window.location.search);
  window.parent.postMessage(
    { type: 'authorization_response', response: { code: 'e2e-auth-code', state: params.get('state') } },
    '*'
  );
</script>
</html>`,
        });
      } else {
        // Interactive login redirect: send code back as query params
        const redirectUri =
          url.searchParams.get("redirect_uri") ?? "http://127.0.0.1:5173";
        await route.fulfill({
          status: 302,
          headers: {
            location: `${redirectUri}?code=e2e-auth-code&state=${encodeURIComponent(state)}`,
          },
        });
      }
    },
  );

  // Token exchange — returns a properly signed JWT using the test key pair
  await page.route(
    `https://${TEST_AUTH0_DOMAIN}/oauth/token`,
    async (route) => {
      const idToken = createIdToken({
        issuer: TEST_ISSUER,
        clientId: TEST_CLIENT_ID,
        subject: TEST_USER.sub,
        nonce: capturedNonce,
        email: TEST_USER.email,
        name: TEST_USER.name,
      });

      await route.fulfill({
        json: {
          access_token: "e2e-test-access-token",
          id_token: idToken,
          token_type: "Bearer",
          expires_in: 86400,
          scope: "openid profile email",
        },
      });
    },
  );

  // Userinfo endpoint
  await page.route(
    `https://${TEST_AUTH0_DOMAIN}/userinfo`,
    async (route) => {
      await route.fulfill({ json: TEST_USER });
    },
  );

  // Logout endpoint
  await page.route(
    `https://${TEST_AUTH0_DOMAIN}/v2/logout**`,
    async (route) => {
      await route.fulfill({ status: 200, body: "" });
    },
  );
}
