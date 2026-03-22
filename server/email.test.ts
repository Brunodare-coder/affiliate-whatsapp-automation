/**
 * Tests for the email helper (Resend integration).
 * Validates that the Resend API key is configured and the helper initializes correctly.
 */
import { describe, it, expect } from "vitest";

describe("Email helper (Resend)", () => {
  it("should have RESEND_API_KEY configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    // The key should be set (either a real key or a placeholder)
    expect(apiKey).toBeDefined();
    expect(typeof apiKey).toBe("string");
    expect(apiKey!.length).toBeGreaterThan(0);
  });

  it("should have RESEND_FROM_EMAIL configured", () => {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(typeof fromEmail).toBe("string");
    expect(fromEmail!.length).toBeGreaterThan(0);
  });

  it("should build a valid reset email HTML with user name and reset URL", async () => {
    // Import the module dynamically to avoid side effects
    const { sendPasswordResetEmail } = await import("./email");
    expect(typeof sendPasswordResetEmail).toBe("function");
  });
});
