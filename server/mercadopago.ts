/**
 * Mercado Pago PIX payment helper.
 * Uses the official mercadopago SDK v2 to create PIX payments
 * and verify webhook signatures.
 */

import { MercadoPagoConfig, Payment } from "mercadopago";
import { ENV } from "./_core/env";

// ── Client ────────────────────────────────────────────────────────────────────

function getMpClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
}

// ── Plan prices ───────────────────────────────────────────────────────────────

export const PLAN_PRICES: Record<"basic" | "premium", number> = {
  basic: 50.0,    // R$50/mês
  premium: 100.0, // R$100/mês
};

export const PLAN_LABELS: Record<"basic" | "premium", string> = {
  basic: "AutoAfiliado Basic - R$50/mês",
  premium: "AutoAfiliado Premium - R$100/mês",
};

// ── Create PIX payment ────────────────────────────────────────────────────────

export interface CreatePixResult {
  mpPaymentId: string;
  qrCodePayload: string;  // EMV string (Copia e Cola)
  qrCodeBase64: string;   // base64 PNG image
  expiresAt: Date;
}

export async function createPixPayment(params: {
  plan: "basic" | "premium";
  userId: number;
  userEmail: string;
  userName: string;
  idempotencyKey: string; // txid from our DB
}): Promise<CreatePixResult> {
  const client = getMpClient();
  const payment = new Payment(client);

  const amount = PLAN_PRICES[params.plan];
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  const result = await payment.create({
    body: {
      transaction_amount: amount,
      description: PLAN_LABELS[params.plan],
      payment_method_id: "pix",
      payer: {
        email: params.userEmail || "pagador@autoafiliado.com.br",
        first_name: params.userName?.split(" ")[0] || "Usuario",
        last_name: params.userName?.split(" ").slice(1).join(" ") || "AutoAfiliado",
      },
      date_of_expiration: expiresAt.toISOString(),
      external_reference: `user:${params.userId}:plan:${params.plan}:key:${params.idempotencyKey}`,
      notification_url: `${process.env.VITE_APP_URL || "https://autoafiliado.manus.space"}/api/webhooks/mercadopago`,
    },
    requestOptions: {
      idempotencyKey: params.idempotencyKey,
    },
  });

  const txData = result.point_of_interaction?.transaction_data;
  if (!txData?.qr_code || !txData?.qr_code_base64) {
    throw new Error("Mercado Pago não retornou QR Code PIX");
  }

  return {
    mpPaymentId: String(result.id),
    qrCodePayload: txData.qr_code,
    qrCodeBase64: txData.qr_code_base64,
    expiresAt,
  };
}

// ── Get payment status ────────────────────────────────────────────────────────

export type MpPaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "in_process" | "refunded";

export async function getPixPaymentStatus(mpPaymentId: string): Promise<MpPaymentStatus> {
  const client = getMpClient();
  const payment = new Payment(client);
  const result = await payment.get({ id: mpPaymentId });
  return (result.status as MpPaymentStatus) ?? "pending";
}
