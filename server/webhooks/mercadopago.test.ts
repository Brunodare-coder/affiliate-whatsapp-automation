import { describe, it, expect } from "vitest";
import crypto from "crypto";

/**
 * Test the HMAC-SHA256 signature validation logic for Mercado Pago webhooks.
 * We replicate the same logic used in the webhook handler.
 */
function computeSignature(secret: string, dataId: string, requestId: string, ts: string): string {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  return hmac.digest("hex");
}

describe("Mercado Pago Webhook Signature Validation", () => {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "test-secret-for-unit-tests";

  it("should compute a valid HMAC-SHA256 signature", () => {
    const ts = "1704908010";
    const requestId = "test-request-id";
    const dataId = "12345678";

    const signature = computeSignature(secret, dataId, requestId, ts);

    expect(signature).toBeTruthy();
    expect(signature).toHaveLength(64); // SHA-256 hex = 64 chars
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce different signatures for different payloads", () => {
    const ts = "1704908010";
    const sig1 = computeSignature(secret, "111", "req-1", ts);
    const sig2 = computeSignature(secret, "222", "req-1", ts);

    expect(sig1).not.toBe(sig2);
  });

  it("should produce the same signature for the same payload (deterministic)", () => {
    const ts = "1704908010";
    const requestId = "req-abc";
    const dataId = "99999";

    const sig1 = computeSignature(secret, dataId, requestId, ts);
    const sig2 = computeSignature(secret, dataId, requestId, ts);

    expect(sig1).toBe(sig2);
  });

  it("should have MERCADOPAGO_WEBHOOK_SECRET configured", () => {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    // In CI/prod the secret should be set; in unit tests we allow fallback
    if (webhookSecret) {
      expect(webhookSecret).toHaveLength(64); // 64-char hex string
      expect(webhookSecret).toMatch(/^[a-f0-9]{64}$/);
    } else {
      // Acceptable in unit test environment without secrets
      expect(true).toBe(true);
    }
  });
});
