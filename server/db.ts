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
  campaigns,
  groupTargets,
  mercadoLivreConfig,
  monitoredGroups,
  postLogs,
  sendLogs,
  sendTargets,
  users,
  whatsappInstances,
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
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
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
