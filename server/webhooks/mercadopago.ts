/**
 * Mercado Pago Webhook Handler
 *
 * Receives payment notifications from Mercado Pago and automatically
 * activates user subscriptions when PIX payments are confirmed.
 *
 * Webhook URL: /api/webhooks/mercadopago
 * Configure this URL in your Mercado Pago developer panel.
 */

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { markPixPaymentPaid, activateSubscription } from "../db";
import { getPixPaymentStatus } from "../mercadopago";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../email";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users, pixPayments } from "../../drizzle/schema";

/**
 * Validate Mercado Pago webhook signature.
 * MP sends: x-signature header with ts=...;v1=HMAC_SHA256
 * and x-request-id header.
 * The signed string is: id;request-id;ts
 */
function validateMPSignature(req: Request): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret configured, skip validation (dev mode)
    console.warn("[MP Webhook] No MERCADOPAGO_WEBHOOK_SECRET set, skipping signature validation");
    return true;
  }

  try {
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;

    if (!xSignature) {
      console.warn("[MP Webhook] Missing x-signature header");
      return false;
    }

    // Parse ts and v1 from x-signature header
    // Format: ts=1704908010;v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0c9c4c8b8e5d8d6e3f8a7b2
    const parts: Record<string, string> = {};
    xSignature.split(";").forEach(part => {
      const [key, value] = part.split("=");
      if (key && value) parts[key.trim()] = value.trim();
    });

    const ts = parts["ts"];
    const v1 = parts["v1"];

    if (!ts || !v1) {
      console.warn("[MP Webhook] Invalid x-signature format");
      return false;
    }

    // Build the manifest string: id;request-id;ts
    const dataId = req.query.id as string || req.body?.data?.id?.toString() || "";
    const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;

    // Compute HMAC-SHA256
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const computed = hmac.digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(v1, "hex")
    );

    if (!isValid) {
      console.warn(`[MP Webhook] Signature mismatch. Computed: ${computed}, Received: ${v1}`);
    }

    return isValid;
  } catch (err) {
    console.error("[MP Webhook] Signature validation error:", err);
    return false;
  }
}

export function registerMercadoPagoWebhook(app: Express) {
  /**
   * POST /api/webhooks/mercadopago
   *
   * Mercado Pago sends a notification when a payment status changes.
   * We verify the payment status via the MP API and activate the subscription.
   */
  app.post("/api/webhooks/mercadopago", async (req: Request, res: Response) => {
    try {
      // Validate webhook signature
      if (!validateMPSignature(req)) {
        console.warn("[MP Webhook] Invalid signature — rejecting request");
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Mercado Pago sends different notification types
      const { type, data, action } = req.body;

      console.log("[MP Webhook] Received:", JSON.stringify({ type, action, data }));

      // We only care about payment notifications
      if (type !== "payment" && action !== "payment.updated" && action !== "payment.created") {
        return res.status(200).json({ received: true });
      }

      const mpPaymentId = data?.id ? String(data.id) : null;
      if (!mpPaymentId) {
        console.warn("[MP Webhook] No payment ID in notification");
        return res.status(200).json({ received: true });
      }

      // Verify payment status via MP API
      const mpStatus = await getPixPaymentStatus(mpPaymentId);
      console.log(`[MP Webhook] Payment ${mpPaymentId} status: ${mpStatus}`);

      if (mpStatus !== "approved") {
        // Not approved yet — acknowledge but don't activate
        return res.status(200).json({ received: true, status: mpStatus });
      }

      // Find the payment in our DB by MP payment ID (stored in pixKey field)
      const db = await getDb();
      if (!db) {
        console.error("[MP Webhook] Database not available");
        return res.status(500).json({ error: "Database unavailable" });
      }

      const [payment] = await db
        .select()
        .from(pixPayments)
        .where(eq(pixPayments.pixKey, mpPaymentId))
        .limit(1);

      if (!payment) {
        console.warn(`[MP Webhook] Payment ${mpPaymentId} not found in DB`);
        return res.status(200).json({ received: true, note: "payment not in db" });
      }

      if (payment.status === "paid") {
        // Already processed — idempotent response
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      // Mark as paid and activate subscription
      await markPixPaymentPaid(payment.txid);
      await activateSubscription(payment.userId, payment.plan);

      console.log(`[MP Webhook] Activated ${payment.plan} for user ${payment.userId}`);

      // Get user info for notification
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payment.userId))
        .limit(1);

      const amountBrl = (payment.amount / 100).toFixed(2);
      const planLabel = payment.plan === "basic" ? "Basic (R$50/mês)" : "Premium (R$100/mês)";

      // Notify owner
      await notifyOwner({
        title: "Pagamento PIX confirmado automaticamente!",
        content: `Usuário ${user?.name ?? payment.userId} (${user?.email ?? "sem email"}) pagou o plano ${planLabel} - R$${amountBrl} - TXID: ${payment.txid} - MP ID: ${mpPaymentId}`,
      });

      // Send confirmation email to user
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Pagamento confirmado! Seu plano está ativo",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22c55e;">Pagamento confirmado!</h2>
              <p>Olá, <strong>${user.name ?? "usuário"}</strong>!</p>
              <p>Seu pagamento PIX de <strong>R$${amountBrl}</strong> foi confirmado com sucesso.</p>
              <p>Seu plano <strong>${planLabel}</strong> está ativo agora.</p>
              <p>Acesse o painel para começar a usar todos os recursos:</p>
              <a href="https://autoafiliado.manus.space/dashboard"
                 style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
                Acessar Dashboard
              </a>
              <p style="color: #666; margin-top: 24px; font-size: 14px;">
                TXID: ${payment.txid}
              </p>
            </div>
          `,
        });
      }

      return res.status(200).json({ received: true, activated: true });
    } catch (error) {
      console.error("[MP Webhook] Error processing webhook:", error);
      // Always return 200 to prevent MP from retrying indefinitely
      return res.status(200).json({ received: true, error: "processing error" });
    }
  });

  // GET endpoint for Mercado Pago validation (some versions ping with GET)
  app.get("/api/webhooks/mercadopago", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", service: "AutoAfiliado PIX Webhook" });
  });
}
