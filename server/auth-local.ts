/**
 * Local authentication helpers.
 * Replaces Manus OAuth with email + password auth.
 * Sessions use the same cookie (app_session_id) and HS256 JWT format
 * so the rest of the codebase (context.ts, protectedProcedure) stays unchanged.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./_core/env";
import * as db from "./db";
import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

// ── Password helpers ──────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Session JWT helpers ───────────────────────────────────────────────────

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(ENV.cookieSecret);
}

/**
 * Creates a signed JWT session token for a local user.
 * Payload mirrors the Manus OAuth format so sdk.verifySession() still works.
 */
export async function createLocalSessionToken(openId: string, name: string): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

  return new SignJWT({
    openId,   // use the real openId so sdk.authenticateRequest finds the user
    appId: ENV.appId || "local",
    name: name || "(sem nome)",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
}

/**
 * Verifies a session JWT and returns the userId embedded in openId.
 * Returns null if the token is invalid or expired.
 */
export async function verifyLocalSession(cookieValue: string | undefined | null): Promise<{ userId: number } | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, getSessionSecret(), { algorithms: ["HS256"] });
    const openId = payload.openId as string | undefined;
    if (!openId || !openId.startsWith("local:")) return null;
    const userId = parseInt(openId.replace("local:", ""), 10);
    if (isNaN(userId)) return null;
    return { userId };
  } catch {
    return null;
  }
}

// ── Reset token helpers ───────────────────────────────────────────────────

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
}

// ── Cookie helpers ────────────────────────────────────────────────────────

export function setSessionCookie(res: Response, req: Request, token: string): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export function clearSessionCookie(res: Response, req: Request): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}

// ── DB helpers for local auth ─────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  return db.getUserByEmail(email);
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: number; openId: string; name: string | null; email: string | null }> {
  // Check if email already registered
  const existing = await db.getUserByEmail(data.email);
  if (existing) {
    throw new Error("E-mail já cadastrado. Faça login ou use outro e-mail.");
  }

  const passwordHash = await hashPassword(data.password);
  const openId = `local:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`;

  await db.upsertUser({
    openId,
    name: data.name,
    email: data.email,
    loginMethod: "email",
    lastSignedIn: new Date(),
    passwordHash,
    emailVerified: false,
  });

  const user = await db.getUserByEmail(data.email);
  if (!user) throw new Error("Erro ao criar conta. Tente novamente.");
  return user;
}
