/**
 * Email sending helper using Resend.
 * Falls back to a notification to the owner if RESEND_API_KEY is not configured.
 */

import { Resend } from "resend";
import { notifyOwner } from "./_core/notification";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const APP_NAME = "AutoAfiliado";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `noreply@autoafiliado.manus.space`;
const APP_URL = process.env.APP_URL || "https://autoafiliado.manus.space";

/**
 * Sends a password reset email to the user.
 * If Resend is not configured, falls back to notifying the owner.
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string | null;
  token: string;
}): Promise<{ sent: boolean; fallback: boolean }> {
  const { to, name, token } = params;
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const displayName = name || "Usuário";

  const resend = getResend();

  if (resend) {
    try {
      await resend.emails.send({
        from: `${APP_NAME} <${FROM_EMAIL}>`,
        to,
        subject: `Redefinição de senha — ${APP_NAME}`,
        html: buildResetEmailHtml({ displayName, resetUrl }),
        text: buildResetEmailText({ displayName, resetUrl }),
      });
      return { sent: true, fallback: false };
    } catch (err) {
      console.error("[Email] Resend error:", err);
      // Fall through to owner notification
    }
  }

  // Fallback: notify owner so they can manually send the link
  await notifyOwner({
    title: `🔑 Recuperação de senha — ${to}`,
    content: [
      `Usuário: ${displayName} (${to})`,
      ``,
      `⚠️ Resend não configurado — envie o link manualmente:`,
      resetUrl,
    ].join("\n"),
  });

  return { sent: false, fallback: true };
}

// ── Email templates ───────────────────────────────────────────────────────────

function buildResetEmailHtml(params: { displayName: string; resetUrl: string }): string {
  const { displayName, resetUrl } = params;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#059669);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="font-size:20px;">🤖</span>
                </div>
                <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;">Redefinição de senha</h1>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Olá, <strong style="color:#e2e8f0;">${displayName}</strong>!<br/><br/>
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                  Redefinir minha senha
                </a>
              </div>
              <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">
                Se você não solicitou a redefinição de senha, ignore este e-mail — sua senha permanece a mesma.
              </p>
              <p style="color:#64748b;font-size:12px;margin:0;">
                Ou copie e cole este link no navegador:<br/>
                <a href="${resetUrl}" style="color:#22c55e;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                © 2026 ${APP_NAME} · Bot de Afiliados para WhatsApp
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetEmailText(params: { displayName: string; resetUrl: string }): string {
  const { displayName, resetUrl } = params;
  return `Olá, ${displayName}!

Recebemos uma solicitação para redefinir a senha da sua conta no ${APP_NAME}.

Acesse o link abaixo para criar uma nova senha (válido por 1 hora):
${resetUrl}

Se você não solicitou a redefinição de senha, ignore este e-mail.

— Equipe ${APP_NAME}`;
}
