/**
 * Mercado Livre OAuth2 com PKCE
 * Fluxo: Authorization Code + PKCE (code_challenge_method=S256)
 *
 * Endpoints:
 *   GET /api/oauth/ml/start    → gera PKCE, salva em sessão, redireciona para ML
 *   GET /api/oauth/ml/callback → troca code por access_token, salva no banco
 */

import crypto from "crypto";
import { Request, Response } from "express";
import { getDb } from "./db";
import { mercadoLivreConfig } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";

const ML_CLIENT_ID = process.env.ML_CLIENT_ID!;
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET!;
const ML_AUTH_URL = "https://auth.mercadolivre.com.br/authorization";
const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token";
const ML_REDIRECT_URI = "https://autoafiliado.manus.space/api/oauth/ml/callback";

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// ── Token management ─────────────────────────────────────────────────────────

interface MlTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token?: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<MlTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: ML_CLIENT_ID,
    client_secret: ML_CLIENT_SECRET,
    code,
    redirect_uri: ML_REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ML token exchange failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<MlTokenResponse>;
}

export async function refreshMlToken(refreshToken: string): Promise<MlTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ML_CLIENT_ID,
    client_secret: ML_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ML token refresh failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<MlTokenResponse>;
}

/**
 * Retorna um access_token válido para o usuário.
 * Se o token estiver expirado, tenta renovar via refresh_token.
 * Retorna null se não houver token ou se não for possível renovar.
 */
export async function getValidMlAccessToken(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [config] = await db
    .select()
    .from(mercadoLivreConfig)
    .where(eq(mercadoLivreConfig.userId, userId))
    .limit(1);

  if (!config || !config.mlAccessToken) return null;

  // Verificar se o token ainda é válido (com 5 min de margem)
  const now = new Date();
  const expiresAt = config.mlTokenExpiresAt;
  const isExpired = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (!isExpired) {
    return config.mlAccessToken;
  }

  // Tentar renovar com refresh_token
  if (!config.mlRefreshToken) return null;

  try {
    const tokenData = await refreshMlToken(config.mlRefreshToken);
    const newExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const db2 = await getDb();
    if (!db2) return tokenData.access_token;
    await db2
      .update(mercadoLivreConfig)
      .set({
        mlAccessToken: tokenData.access_token,
        mlRefreshToken: tokenData.refresh_token ?? config.mlRefreshToken,
        mlTokenExpiresAt: newExpiresAt,
      })
      .where(eq(mercadoLivreConfig.userId, userId));

    return tokenData.access_token;
  } catch {
    return null;
  }
}

/**
 * Gera um link de afiliado ML usando o access_token OAuth.
 * Testa múltiplos endpoints até encontrar o que funciona.
 */
export async function generateMlAffiliateLink(
  accessToken: string,
  mlUserId: string,
  productUrl: string,
  tag?: string | null
): Promise<string> {
  // Adicionar a tag de afiliado na URL se disponível
  let urlWithTag = productUrl;
  if (tag) {
    try {
      const u = new URL(productUrl);
      u.searchParams.set("matt_from", tag);
      urlWithTag = u.toString();
    } catch {
      // URL inválida, usar como está
    }
  }

  // Tentar endpoint de encurtamento via API ML
  const endpoints = [
    {
      url: `https://api.mercadolibre.com/affiliates/${mlUserId}/links`,
      body: { url: urlWithTag },
    },
    {
      url: `https://api.mercadolibre.com/affiliates/links`,
      body: { url: urlWithTag, user_id: mlUserId },
    },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ep.body),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = (await res.json()) as { short_url?: string; url?: string; affiliate_url?: string };
        const shortUrl = data.short_url || data.url || data.affiliate_url;
        if (shortUrl) return shortUrl;
      }
    } catch {
      // Tentar próximo endpoint
    }
  }

  // Fallback: retornar URL com tag (sem encurtar)
  return urlWithTag;
}

// ── Express route handlers ────────────────────────────────────────────────────

// In-memory store para code_verifier (em produção usar Redis ou sessão)
const pkceStore = new Map<string, { codeVerifier: string; userId: number; createdAt: number }>();

// Limpar entradas antigas a cada 10 minutos
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of Array.from(pkceStore.entries())) {
    if (value.createdAt < tenMinutesAgo) pkceStore.delete(key);
  }
}, 10 * 60 * 1000);

export async function handleMlOAuthStart(req: Request, res: Response): Promise<void> {
  let userId: number;
  try {
    const user = await sdk.authenticateRequest(req);
    userId = user.id;
  } catch {
    res.status(401).json({ error: "Não autenticado. Faça login primeiro." });
    return;
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString("hex");

  // Salvar code_verifier associado ao state
  pkceStore.set(state, { codeVerifier, userId, createdAt: Date.now() });

  const authUrl = new URL(ML_AUTH_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", ML_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", ML_REDIRECT_URI);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  res.redirect(authUrl.toString());
}

export async function handleMlOAuthCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    res.redirect(`/settings?ml_oauth_error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code || !state) {
    res.redirect("/settings?ml_oauth_error=missing_params");
    return;
  }

  const pkceData = pkceStore.get(state);
  if (!pkceData) {
    res.redirect("/settings?ml_oauth_error=invalid_state");
    return;
  }

  pkceStore.delete(state);

  try {
    const tokenData = await exchangeCodeForToken(code, pkceData.codeVerifier);

    // Buscar nickname da conta ML
    let nickname = "";
    try {
      const userRes = await fetch(
        `https://api.mercadolibre.com/users/${tokenData.user_id}`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      if (userRes.ok) {
        const userData = (await userRes.json()) as { nickname?: string };
        nickname = userData.nickname ?? "";
      }
    } catch {
      // Ignorar erro ao buscar nickname
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Upsert: atualizar ou criar config ML com os tokens
    await db
      .insert(mercadoLivreConfig)
      .values({
        userId: pkceData.userId,
        mlAccessToken: tokenData.access_token,
        mlRefreshToken: tokenData.refresh_token ?? null,
        mlTokenExpiresAt: expiresAt,
        mlUserId: String(tokenData.user_id),
        mlNickname: nickname,
        isActive: true,
      })
      .onDuplicateKeyUpdate({
        set: {
          mlAccessToken: tokenData.access_token,
          mlRefreshToken: tokenData.refresh_token ?? null,
          mlTokenExpiresAt: expiresAt,
          mlUserId: String(tokenData.user_id),
          mlNickname: nickname,
        },
      });

    res.redirect("/settings?ml_oauth_success=1");
  } catch (err) {
    console.error("[ML OAuth] Callback error:", err);
    res.redirect(`/settings?ml_oauth_error=${encodeURIComponent(String(err))}`);
  }
}
