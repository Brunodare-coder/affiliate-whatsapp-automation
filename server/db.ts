import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  AffiliateLink,
  Automation,
  AutomationTarget,
  Campaign,
  GroupTarget,
  InsertAffiliateLink,
  InsertAutomation,
  InsertAutomationTarget,
  InsertCampaign,
  InsertGroupTarget,
  InsertMercadoLivreConfig,
  InsertMonitoredGroup,
  InsertPostLog,
  InsertSendLog,
  InsertSendTarget,
  InsertUser,
  InsertWhatsappInstance,
  MercadoLivreConfig,
  MonitoredGroup,
  PostLog,
  SendLog,
  SendTarget,
  WhatsappInstance,
  affiliateLinks,
  automationTargets,
  automations,
  botSettings,
  campaigns,
  groupTargets,
  mercadoLivreConfig,
  monitoredGroups,
  postLogs,
  sendLogs,
  sendTargets,
  shopeeConfig,
  amazonConfig,
  magazineLuizaConfig,
  aliexpressConfig,
  subscriptions,
  pixPayments,
  users,
  whatsappInstances,
  systemSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  // Local auth fields
  if (user.passwordHash !== undefined) {
    values.passwordHash = user.passwordHash ?? null;
    updateSet.passwordHash = user.passwordHash ?? null;
  }
  if (user.resetToken !== undefined) {
    values.resetToken = user.resetToken ?? null;
    updateSet.resetToken = user.resetToken ?? null;
  }
  if (user.resetTokenExpiresAt !== undefined) {
    values.resetTokenExpiresAt = user.resetTokenExpiresAt ?? null;
    updateSet.resetTokenExpiresAt = user.resetTokenExpiresAt ?? null;
  }
  if (user.emailVerified !== undefined) {
    values.emailVerified = user.emailVerified;
    updateSet.emailVerified = user.emailVerified;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserResetToken(userId: number, token: string | null, expiresAt: Date | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ resetToken: token, resetTokenExpiresAt: expiresAt }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash, resetToken: null, resetTokenExpiresAt: null }).where(eq(users.id, userId));
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  return result[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ── Campaigns ──────────────────────────────────────────────────────────────

export async function getCampaigns(userId: number): Promise<Campaign[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number, userId: number): Promise<Campaign | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId))).limit(1);
  return result[0];
}

export async function createCampaign(data: InsertCampaign): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateCampaign(id: number, userId: number, data: Partial<InsertCampaign>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(campaigns).set(data).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
}

export async function deleteCampaign(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
}

// ── Affiliate Links ────────────────────────────────────────────────────────

export async function getAffiliateLinks(userId: number, campaignId?: number): Promise<AffiliateLink[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(affiliateLinks.userId, userId)];
  if (campaignId) conditions.push(eq(affiliateLinks.campaignId, campaignId));
  return db.select().from(affiliateLinks).where(and(...conditions)).orderBy(desc(affiliateLinks.createdAt));
}

export async function getAffiliateLinkById(id: number, userId: number): Promise<AffiliateLink | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(affiliateLinks).where(and(eq(affiliateLinks.id, id), eq(affiliateLinks.userId, userId))).limit(1);
  return result[0];
}

export async function getActiveAffiliateLinks(userId: number): Promise<AffiliateLink[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliateLinks).where(and(eq(affiliateLinks.userId, userId), eq(affiliateLinks.isActive, true)));
}

export async function createAffiliateLink(data: InsertAffiliateLink): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(affiliateLinks).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateAffiliateLink(id: number, userId: number, data: Partial<InsertAffiliateLink>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(affiliateLinks).set(data).where(and(eq(affiliateLinks.id, id), eq(affiliateLinks.userId, userId)));
}

export async function deleteAffiliateLink(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(affiliateLinks).where(and(eq(affiliateLinks.id, id), eq(affiliateLinks.userId, userId)));
}

export async function incrementLinkClickCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(affiliateLinks).set({ clickCount: sql`${affiliateLinks.clickCount} + 1` }).where(eq(affiliateLinks.id, id));
}

// ── WhatsApp Instances ─────────────────────────────────────────────────────

export async function getWhatsappInstances(userId: number): Promise<WhatsappInstance[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whatsappInstances).where(eq(whatsappInstances.userId, userId)).orderBy(desc(whatsappInstances.createdAt));
}

export async function getWhatsappInstanceById(id: number, userId: number): Promise<WhatsappInstance | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(whatsappInstances).where(and(eq(whatsappInstances.id, id), eq(whatsappInstances.userId, userId))).limit(1);
  return result[0];
}

export async function createWhatsappInstance(data: InsertWhatsappInstance): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(whatsappInstances).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateWhatsappInstance(id: number, data: Partial<InsertWhatsappInstance>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(whatsappInstances).set(data).where(eq(whatsappInstances.id, id));
}

export async function deleteWhatsappInstance(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(whatsappInstances).where(and(eq(whatsappInstances.id, id), eq(whatsappInstances.userId, userId)));
}

// ── Monitored Groups ───────────────────────────────────────────────────────

export async function getMonitoredGroups(userId: number, instanceId?: number): Promise<MonitoredGroup[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(monitoredGroups.userId, userId)];
  if (instanceId) conditions.push(eq(monitoredGroups.instanceId, instanceId));
  return db.select().from(monitoredGroups).where(and(...conditions)).orderBy(desc(monitoredGroups.createdAt));
}

export async function createMonitoredGroup(data: InsertMonitoredGroup): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(monitoredGroups).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateMonitoredGroup(id: number, userId: number, data: Partial<InsertMonitoredGroup>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(monitoredGroups).set(data).where(and(eq(monitoredGroups.id, id), eq(monitoredGroups.userId, userId)));
}

export async function deleteMonitoredGroup(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(monitoredGroups).where(and(eq(monitoredGroups.id, id), eq(monitoredGroups.userId, userId)));
}

// ── Group Targets (alvos de disparo por grupo de origem) ──────────────────

export async function getGroupTargets(userId: number, sourceGroupId?: number): Promise<GroupTarget[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(groupTargets.userId, userId)];
  if (sourceGroupId) conditions.push(eq(groupTargets.sourceGroupId, sourceGroupId));
  return db.select().from(groupTargets).where(and(...conditions));
}

export async function setGroupTargets(userId: number, sourceGroupId: number, targetGroupIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Remove existing targets for this source group
  await db.delete(groupTargets).where(and(eq(groupTargets.userId, userId), eq(groupTargets.sourceGroupId, sourceGroupId)));
  // Insert new targets
  if (targetGroupIds.length > 0) {
    await db.insert(groupTargets).values(targetGroupIds.map((targetGroupId) => ({ userId, sourceGroupId, targetGroupId })));
  }
}

// ── Send Targets ───────────────────────────────────────────────────────────

export async function getSendTargets(userId: number, instanceId?: number): Promise<SendTarget[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(sendTargets.userId, userId)];
  if (instanceId) conditions.push(eq(sendTargets.instanceId, instanceId));
  return db.select().from(sendTargets).where(and(...conditions)).orderBy(desc(sendTargets.createdAt));
}

export async function createSendTarget(data: InsertSendTarget): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sendTargets).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateSendTarget(id: number, userId: number, data: Partial<InsertSendTarget>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sendTargets).set(data).where(and(eq(sendTargets.id, id), eq(sendTargets.userId, userId)));
}

export async function deleteSendTarget(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(sendTargets).where(and(eq(sendTargets.id, id), eq(sendTargets.userId, userId)));
}

// ── Automations ────────────────────────────────────────────────────────────

export async function getAutomations(userId: number): Promise<Automation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(automations).where(eq(automations.userId, userId)).orderBy(desc(automations.createdAt));
}

export async function getAutomationById(id: number, userId: number): Promise<Automation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(automations).where(and(eq(automations.id, id), eq(automations.userId, userId))).limit(1);
  return result[0];
}

export async function createAutomation(data: InsertAutomation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(automations).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateAutomation(id: number, userId: number, data: Partial<InsertAutomation>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(automations).set(data).where(and(eq(automations.id, id), eq(automations.userId, userId)));
}

export async function deleteAutomation(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(automations).where(and(eq(automations.id, id), eq(automations.userId, userId)));
}

export async function getAutomationTargets(automationId: number): Promise<AutomationTarget[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(automationTargets).where(eq(automationTargets.automationId, automationId));
}

export async function setAutomationTargets(automationId: number, targetIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(automationTargets).where(eq(automationTargets.automationId, automationId));
  if (targetIds.length > 0) {
    await db.insert(automationTargets).values(targetIds.map((id) => ({ automationId, sendTargetId: id })));
  }
}

// ── Post Logs ──────────────────────────────────────────────────────────────

export async function getPostLogs(userId: number, limit = 50, offset = 0): Promise<PostLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postLogs).where(eq(postLogs.userId, userId)).orderBy(desc(postLogs.createdAt)).limit(limit).offset(offset);
}

export async function getPostLogById(id: number, userId: number): Promise<PostLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(postLogs).where(and(eq(postLogs.id, id), eq(postLogs.userId, userId))).limit(1);
  return result[0];
}

export async function createPostLog(data: InsertPostLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postLogs).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updatePostLog(id: number, data: Partial<InsertPostLog>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(postLogs).set(data).where(eq(postLogs.id, id));
}

export async function getPostLogStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, failed: 0, linksReplaced: 0 };
  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      sent: sql<number>`SUM(CASE WHEN ${postLogs.status} = 'sent' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${postLogs.status} = 'failed' THEN 1 ELSE 0 END)`,
      linksReplaced: sql<number>`SUM(${postLogs.linksReplaced})`,
    })
    .from(postLogs)
    .where(eq(postLogs.userId, userId));
  return result[0] ?? { total: 0, sent: 0, failed: 0, linksReplaced: 0 };
}

// ── Send Logs ──────────────────────────────────────────────────────────────

export async function getSendLogs(postLogId: number): Promise<SendLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sendLogs).where(eq(sendLogs.postLogId, postLogId));
}

export async function createSendLog(data: InsertSendLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sendLogs).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateSendLog(id: number, data: Partial<InsertSendLog>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sendLogs).set(data).where(eq(sendLogs.id, id));
}

// ── Mercado Livre Config ───────────────────────────────────────────────────

export async function getMercadoLivreConfig(userId: number): Promise<MercadoLivreConfig | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mercadoLivreConfig).where(eq(mercadoLivreConfig.userId, userId)).limit(1);
  return result[0];
}

export async function upsertMercadoLivreConfig(userId: number, data: Omit<InsertMercadoLivreConfig, "userId">): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(mercadoLivreConfig).values({ userId, ...data }).onDuplicateKeyUpdate({
    set: {
      tag: data.tag,
      cookieSsid: data.cookieSsid,
      mattToolId: data.mattToolId,
      socialTag: data.socialTag,
      isActive: data.isActive,
    },
  });
}

// ── Shopee Config ──────────────────────────────────────────────────────────
export async function getShopeeConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(shopeeConfig).where(eq(shopeeConfig.userId, userId)).limit(1);
  return result[0] ?? null;
}
export async function upsertShopeeConfig(userId: number, data: { appId?: string | null; secret?: string | null; isActive?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(shopeeConfig).values({ userId, appId: data.appId, secret: data.secret, isActive: data.isActive ?? true }).onDuplicateKeyUpdate({
    set: { appId: data.appId, secret: data.secret, isActive: data.isActive ?? true },
  });
}
export async function deleteShopeeConfig(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(shopeeConfig).where(eq(shopeeConfig.userId, userId));
}

// ── Amazon Config ──────────────────────────────────────────────────────────
export async function getAmazonConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(amazonConfig).where(eq(amazonConfig.userId, userId)).limit(1);
  return result[0] ?? null;
}
export async function upsertAmazonConfig(userId: number, data: { tag?: string | null; ubidAcbbr?: string | null; atAcbbr?: string | null; xAcbb?: string | null; isActive?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(amazonConfig).values({ userId, tag: data.tag, ubidAcbbr: data.ubidAcbbr, atAcbbr: data.atAcbbr, xAcbb: data.xAcbb, isActive: data.isActive ?? true }).onDuplicateKeyUpdate({
    set: { tag: data.tag, ubidAcbbr: data.ubidAcbbr, atAcbbr: data.atAcbbr, xAcbb: data.xAcbb, isActive: data.isActive ?? true },
  });
}
export async function deleteAmazonConfig(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(amazonConfig).where(eq(amazonConfig.userId, userId));
}

// ── Magazine Luiza Config ──────────────────────────────────────────────────
export async function getMagazineLuizaConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(magazineLuizaConfig).where(eq(magazineLuizaConfig.userId, userId)).limit(1);
  return result[0] ?? null;
}
export async function upsertMagazineLuizaConfig(userId: number, data: { tag?: string | null; isActive?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(magazineLuizaConfig).values({ userId, tag: data.tag, isActive: data.isActive ?? true }).onDuplicateKeyUpdate({
    set: { tag: data.tag, isActive: data.isActive ?? true },
  });
}
export async function deleteMagazineLuizaConfig(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(magazineLuizaConfig).where(eq(magazineLuizaConfig.userId, userId));
}

// ── AliExpress Config ──────────────────────────────────────────────────────
export async function getAliexpressConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aliexpressConfig).where(eq(aliexpressConfig.userId, userId)).limit(1);
  return result[0] ?? null;
}
export async function upsertAliexpressConfig(userId: number, data: { trackId?: string | null; cookie?: string | null; isActive?: boolean }): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aliexpressConfig).values({ userId, trackId: data.trackId, cookie: data.cookie, isActive: data.isActive ?? true }).onDuplicateKeyUpdate({
    set: { trackId: data.trackId, cookie: data.cookie, isActive: data.isActive ?? true },
  });
}
export async function deleteAliexpressConfig(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(aliexpressConfig).where(eq(aliexpressConfig.userId, userId));
}

// ── Bot Settings ───────────────────────────────────────────────────────────
export async function getBotSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(botSettings).where(eq(botSettings.userId, userId)).limit(1);
  return result[0] ?? null;
}
export async function upsertBotSettings(userId: number, data: Partial<Omit<typeof botSettings.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(botSettings).values({ userId, ...data } as any).onDuplicateKeyUpdate({ set: data as any });
}

// ── Feed Global ───────────────────────────────────────────────────────────────

/**
 * Returns all users that have Feed Global enabled.
 * Used by the WhatsApp message processor to dispatch to Feed Global subscribers.
 */
export async function getUsersWithFeedGlobalEnabled(): Promise<Array<{ userId: number; targetGroupIds: number[]; clickablePreview: boolean }>> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(botSettings)
    .where(eq(botSettings.feedGlobalEnabled, true));
  return result.map((r) => ({
    userId: r.userId,
    targetGroupIds: (r.feedGlobalTargets as number[]) ?? [],
    clickablePreview: r.clickablePreview,
  }));
}

export async function listSendLogs(userId: number, status?: string, limit = 100): Promise<SendLog[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(sendLogs.userId, userId)];
  if (status && status !== "all") {
    conditions.push(eq(sendLogs.status, status as "pending" | "sent" | "failed"));
  }
  return db.select().from(sendLogs).where(and(...conditions)).orderBy(desc(sendLogs.createdAt)).limit(limit);
}

export async function getSendLogStats(userId: number): Promise<{ total: number; success: number; errors: number; pending: number }> {
  const db = await getDb();
  if (!db) return { total: 0, success: 0, errors: 0, pending: 0 };
  const all = await db.select().from(sendLogs).where(eq(sendLogs.userId, userId));
  return {
    total: all.length,
    success: all.filter((l) => l.status === "sent").length,
    errors: all.filter((l) => l.status === "failed").length,
    pending: all.filter((l) => l.status === "pending").length,
  };
}

// ── Assinaturas ───────────────────────────────────────────────────────────

export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (existing) return existing;

  // Criar trial de 60 minutos
  const trialEndsAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(subscriptions).values({
    userId,
    plan: "trial",
    status: "trial",
    hasAds: true,
    trialEndsAt,
  });
  const [created] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return created;
}

export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return sub ?? null;
}

export async function activateSubscription(
  userId: number,
  plan: "basic" | "premium"
) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const hasAds = plan === "basic";

  await db
    .insert(subscriptions)
    .values({
      userId,
      plan,
      status: "active",
      hasAds,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    })
    .onDuplicateKeyUpdate({
      set: {
        plan,
        status: "active",
        hasAds,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
}

// ── Pagamentos PIX ────────────────────────────────────────────────────────
export async function createPixPayment(data: {
  userId: number;
  plan: "basic" | "premium";
  amount: number;
  pixKey: string;
  txid: string;
  qrCodePayload: string;
  qrCodeImage: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(pixPayments).values(data);
  const [payment] = await db
    .select()
    .from(pixPayments)
    .where(eq(pixPayments.txid, data.txid))
    .limit(1);
  return payment;
}

export async function getPixPayment(txid: string) {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db
    .select()
    .from(pixPayments)
    .where(eq(pixPayments.txid, txid))
    .limit(1);
  return payment ?? null;
}

export async function getPendingPixPayment(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db
    .select()
    .from(pixPayments)
    .where(and(eq(pixPayments.userId, userId), eq(pixPayments.status, "pending")))
    .orderBy(desc(pixPayments.createdAt))
    .limit(1);
  return payment ?? null;
}

export async function markPixPaymentPaid(txid: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(pixPayments)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(pixPayments.txid, txid));
}

export async function isSubscriptionActive(userId: number): Promise<boolean> {
  const sub = await getSubscription(userId);
  if (!sub) return false;
  if (sub.status === "trial") {
    return sub.trialEndsAt ? new Date() < sub.trialEndsAt : false;
  }
  if (sub.status === "active") {
    return sub.currentPeriodEnd ? new Date() < sub.currentPeriodEnd : false;
  }
  return false;
}

// ============================================================
// ADMIN FUNCTIONS
// ============================================================

export async function adminListUsers(): Promise<Array<{
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    hasAds: boolean;
    isActive: boolean;
  } | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
  const result = [];
  for (const u of allUsers) {
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, u.id))
      .limit(1);
    const s = sub[0] ?? null;
    const now = Date.now();
    let isActive = false;
    if (s) {
      if (s.status === "active" && s.currentPeriodEnd && s.currentPeriodEnd.getTime() > now) isActive = true;
      if (s.status === "trial" && s.trialEndsAt && s.trialEndsAt.getTime() > now) isActive = true;
    }
    result.push({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      subscription: s
        ? {
            plan: s.plan,
            status: s.status,
            currentPeriodEnd: s.currentPeriodEnd,
            hasAds: s.hasAds,
            isActive,
          }
        : null,
    });
  }
  return result;
}

export async function adminGrantSubscription(
  userId: number,
  plan: "basic" | "premium",
  months: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  const now = new Date();
  // Se já tem assinatura ativa, estende a partir do vencimento atual
  let baseDate = now;
  if (existing[0]?.currentPeriodEnd && existing[0].currentPeriodEnd > now) {
    baseDate = existing[0].currentPeriodEnd;
  }
  const newPeriodEnd = new Date(baseDate);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months);
  const hasAds = plan === "basic";
  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({ plan, status: "active", currentPeriodEnd: newPeriodEnd, currentPeriodStart: now, hasAds, updatedAt: now })
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      plan,
      status: "active",
      currentPeriodEnd: newPeriodEnd,
      currentPeriodStart: now,
      hasAds,
      trialEndsAt: now,
    });
  }
}

export async function adminRevokeSubscription(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  await db
    .update(subscriptions)
    .set({ status: "expired", currentPeriodEnd: now, updatedAt: now })
      .where(eq(subscriptions.userId, userId));
}


// ── Email Verification ────────────────────────────────────────────────────────

export async function setEmailVerifyToken(userId: number, token: string, expiry: Date) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ emailVerifyToken: token, emailVerifyExpiry: expiry })
    .where(eq(users.id, userId));
}

export async function getUserByEmailVerifyToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.emailVerifyToken, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function markEmailVerified(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null })
    .where(eq(users.id, userId));
}

// ── System Settings (Admin) ───────────────────────────────────────────────────
export async function getSystemSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function upsertSystemSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
