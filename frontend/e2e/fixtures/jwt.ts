import { createSign, generateKeyPairSync } from "node:crypto";

// Generate a test RSA key pair once per worker process.
// Each worker has its own process, so this is isolated per worker.
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const TEST_KID = "e2e-test-key-1";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function createIdToken(params: {
  issuer: string;
  clientId: string;
  subject: string;
  nonce: string;
  email?: string;
  name?: string;
}): string {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT", kid: TEST_KID };
  const payload = {
    iss: params.issuer,
    sub: params.subject,
    aud: params.clientId,
    iat: now,
    exp: now + 3600,
    nonce: params.nonce,
    email: params.email ?? "test@example.com",
    name: params.name ?? "E2E Test User",
    picture: "https://example.com/avatar.png",
    updated_at: "2024-01-01T00:00:00.000Z",
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey);

  return `${signingInput}.${base64url(signature)}`;
}

export function getTestJwks() {
  const jwk = publicKey.export({ format: "jwk" }) as Record<string, string>;
  return {
    keys: [
      {
        ...jwk,
        kty: "RSA",
        use: "sig",
        alg: "RS256",
        kid: TEST_KID,
      },
    ],
  };
}
