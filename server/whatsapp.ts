import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as fs from "fs";
import * as path from "path";
import * as QRCode from "qrcode";
import { EventEmitter } from "events";
import {
  getMonitoredGroups,
  getAutomations,
  getAutomationTargets,
  getSendTargets,
  getActiveAffiliateLinks,
  getMercadoLivreConfig,
  getShopeeConfig,
  getAmazonConfig,
  getMagazineLuizaConfig,
  getAliexpressConfig,
  getBotSettings,
  getGroupTargets,
  getUsersWithFeedGlobalEnabled,
  createPostLog,
  updatePostLog,
  createSendLog,
  updateSendLog,
  updateWhatsappInstance,
  getSubscription,
  getSystemSetting,
} from "./db";
import { processMessageWithLLM } from "./llm-processor";
import { storagePut } from "./storage";
import { botCache, cacheKey, TTL } from "./cache";
import { notifyOwner } from "./_core/notification";
import { diagInfo, diagWarn, diagError, diagSuccess } from "./diagLogger";

const SESSION_DIR = process.env.SESSION_DIR || "/tmp/whatsapp-sessions";

// ── Per-user message processing queue ─────────────────────────────────────
// Limits concurrent processing per user to prevent DB overload
const userQueues = new Map<number, Promise<void>>();

function enqueueForUser(userId: number, task: () => Promise<void>): void {
  const current = userQueues.get(userId) ?? Promise.resolve();
  const next = current.then(() => task()).catch((err) => {
    console.error(`[Queue] Error processing task for user ${userId}:`, err);
  });
  userQueues.set(userId, next);
  // Cleanup resolved queue entry after task completes
  next.finally(() => {
    if (userQueues.get(userId) === next) userQueues.delete(userId);
  });
}

// ── Cached DB helpers ──────────────────────────────────────────────────────
async function cachedGetMonitoredGroups(userId: number, instanceId?: number) {
  const key = cacheKey.monitoredGroups(userId, instanceId);
  const cached = botCache.get<Awaited<ReturnType<typeof getMonitoredGroups>>>(key);
  if (cached) return cached;
  const data = await getMonitoredGroups(userId, instanceId);
  botCache.set(key, data, TTL.MONITORED_GROUPS);
  return data;
}

async function cachedGetAutomations(userId: number) {
  const key = cacheKey.automations(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getAutomations>>>(key);
  if (cached) return cached;
  const data = await getAutomations(userId);
  botCache.set(key, data, TTL.AUTOMATIONS);
  return data;
}

async function cachedGetAffiliateLinks(userId: number) {
  const key = cacheKey.affiliateLinks(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getActiveAffiliateLinks>>>(key);
  if (cached) return cached;
  const data = await getActiveAffiliateLinks(userId);
  botCache.set(key, data, TTL.AFFILIATE_LINKS);
  return data;
}

async function cachedGetMlConfig(userId: number) {
  const key = cacheKey.mlConfig(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getMercadoLivreConfig>>>(key);
  if (cached !== null) return cached;
  const data = await getMercadoLivreConfig(userId);
  botCache.set(key, data ?? null, TTL.AFFILIATE_CONFIG);
  return data;
}

async function cachedGetShopeeConfig(userId: number) {
  const key = cacheKey.shopeeConfig(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getShopeeConfig>>>(key);
  if (cached !== null) return cached;
  const data = await getShopeeConfig(userId);
  botCache.set(key, data ?? null, TTL.AFFILIATE_CONFIG);
  return data;
}

async function cachedGetAmazonConfig(userId: number) {
  const key = cacheKey.amazonConfig(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getAmazonConfig>>>(key);
  if (cached !== null) return cached;
  const data = await getAmazonConfig(userId);
  botCache.set(key, data ?? null, TTL.AFFILIATE_CONFIG);
  return data;
}

async function cachedGetMagaluConfig(userId: number) {
  const key = cacheKey.magaluConfig(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getMagazineLuizaConfig>>>(key);
  if (cached !== null) return cached;
  const data = await getMagazineLuizaConfig(userId);
  botCache.set(key, data ?? null, TTL.AFFILIATE_CONFIG);
  return data;
}

async function cachedGetAliConfig(userId: number) {
  const key = cacheKey.aliConfig(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getAliexpressConfig>>>(key);
  if (cached !== null) return cached;
  const data = await getAliexpressConfig(userId);
  botCache.set(key, data ?? null, TTL.AFFILIATE_CONFIG);
  return data;
}

async function cachedGetBotSettings(userId: number) {
  const key = cacheKey.botSettings(userId);
  const cached = botCache.get<Awaited<ReturnType<typeof getBotSettings>>>(key);
  if (cached !== null) return cached;
  const data = await getBotSettings(userId);
  botCache.set(key, data ?? null, TTL.BOT_SETTINGS);
  return data;
}

async function cachedGetFeedSubscribers() {
  const key = cacheKey.feedSubscribers();
  const cached = botCache.get<Awaited<ReturnType<typeof getUsersWithFeedGlobalEnabled>>>(key);
  if (cached) return cached;
  const data = await getUsersWithFeedGlobalEnabled();
  botCache.set(key, data, TTL.FEED_SUBSCRIBERS);
  return data;
}

export interface WhatsAppMessage {
  key: {
    remoteJid?: string | null;
    fromMe?: boolean | null;
    id?: string | null;
    participant?: string | null;
  };
  message?: {
    conversation?: string | null;
    extendedTextMessage?: { text?: string | null } | null;
    imageMessage?: { caption?: string | null; url?: string | null; mimetype?: string | null } | null;
    videoMessage?: { caption?: string | null; url?: string | null; mimetype?: string | null } | null;
    documentMessage?: { caption?: string | null; url?: string | null; mimetype?: string | null; fileName?: string | null } | null;
    audioMessage?: { url?: string | null; mimetype?: string | null } | null;
    stickerMessage?: { url?: string | null } | null;
  } | null;
  pushName?: string | null;
  messageTimestamp?: number | bigint | null;
}

// Cache the Baileys version so we don't fetch it on every connect (network roundtrip)
let cachedBaileysVersion: [number, number, number] | null = null;
async function getBaileysVersion(): Promise<[number, number, number]> {
  if (cachedBaileysVersion) return cachedBaileysVersion;
  try {
    const { version } = await fetchLatestBaileysVersion();
    cachedBaileysVersion = version;
    // Refresh every 6 hours
    setTimeout(() => { cachedBaileysVersion = null; }, 6 * 60 * 60 * 1000);
    return version;
  } catch {
    // Fallback to a known stable version if network fails
    return [2, 3000, 1023456789];
  }
}

export class WhatsAppManager extends EventEmitter {
  private sockets: Map<number, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<number, string> = new Map();
  private reconnectTimers: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
    // Pre-warm the version cache on startup so first connect is instant
    getBaileysVersion().catch(() => {});
  }

  async connectInstance(instanceId: number, userId: number): Promise<void> {
    if (this.sockets.has(instanceId)) {
      console.log(`[WhatsApp] Instance ${instanceId} already connected`);
      return;
    }

    const sessionPath = path.join(SESSION_DIR, `instance_${instanceId}`);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    try {
      const [{ state, saveCreds }, version] = await Promise.all([
        useMultiFileAuthState(sessionPath),
        getBaileysVersion(),
      ]);

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, console as any),
        },
        printQRInTerminal: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        connectTimeoutMs: 20000,
        defaultQueryTimeoutMs: 15000,
        keepAliveIntervalMs: 10000,
        getMessage: async (_key) => {
          return undefined;
        },
      });

      this.sockets.set(instanceId, sock);

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            this.qrCodes.set(instanceId, qrDataUrl);
            await updateWhatsappInstance(instanceId, { status: "qr_pending", qrCode: qrDataUrl });
            this.emit("qr", instanceId, qrDataUrl);
          } catch (err) {
            console.error("[WhatsApp] QR generation error:", err);
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          const wasConnected = this.sockets.has(instanceId); // was previously connected

          await updateWhatsappInstance(instanceId, { status: "disconnected", qrCode: null });
          this.sockets.delete(instanceId);
          this.qrCodes.delete(instanceId);
          this.emit("disconnected", instanceId);

          // Notify owner when WhatsApp disconnects unexpectedly (not on manual logout)
          if (shouldReconnect && wasConnected) {
            notifyOwner({
              title: "⚠️ WhatsApp Desconectado",
              content: `Sua instância do WhatsApp (ID: ${instanceId}) foi desconectada inesperadamente. O sistema tentará reconectar automaticamente em 30 segundos.\n\nCódigo de erro: ${statusCode || "desconhecido"}`,
            }).catch(console.error);
          }

          if (shouldReconnect) {
            // Auto-reconnect after 30s for unexpected disconnections
            const delay = wasConnected ? 30000 : 5000;
            console.log(`[WhatsApp] Instance ${instanceId} disconnected. Reconnecting in ${delay / 1000}s...`);
            const timer = setTimeout(() => {
              this.reconnectTimers.delete(instanceId);
              this.connectInstance(instanceId, userId).catch(console.error);
            }, delay);
            this.reconnectTimers.set(instanceId, timer);
          } else {
            // Logged out - clear session
            fs.rmSync(sessionPath, { recursive: true, force: true });
          }
        } else if (connection === "open") {
          const phoneNumber = sock.user?.id?.split(":")[0] || undefined;
          await updateWhatsappInstance(instanceId, {
            status: "connected",
            qrCode: null,
            phoneNumber,
            lastConnectedAt: new Date(),
          });
          this.qrCodes.delete(instanceId);
          this.emit("connected", instanceId, phoneNumber);
          console.log(`[WhatsApp] Instance ${instanceId} connected as ${phoneNumber}`);
        } else if (connection === "connecting") {
          await updateWhatsappInstance(instanceId, { status: "connecting" });
        }
      });

      sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;
        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          const jid = msg.key.remoteJid || 'unknown';
          const isGroup = jid.endsWith('@g.us');
          diagInfo(userId, 'MSG', `Recebida | grupo=${isGroup} | jid=${jid} | temConteúdo=${!!msg.message}`);
          if (!isGroup) {
            diagInfo(userId, 'MSG', `Ignorando: não é grupo (${jid})`);
            continue;
          }
          await this.handleIncomingMessage(instanceId, userId, msg as WhatsAppMessage);
        }
      });
    } catch (err) {
      console.error(`[WhatsApp] Failed to connect instance ${instanceId}:`, err);
      await updateWhatsappInstance(instanceId, { status: "disconnected" });
      throw err;
    }
  }

  async disconnectInstance(instanceId: number): Promise<void> {
    const timer = this.reconnectTimers.get(instanceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(instanceId);
    }
    const sock = this.sockets.get(instanceId);
    if (sock) {
      await sock.logout();
      this.sockets.delete(instanceId);
      this.qrCodes.delete(instanceId);
    }
    await updateWhatsappInstance(instanceId, { status: "disconnected", qrCode: null });
  }

  /**
   * Force-close the socket without logging out (keeps auth files intact).
   * Used when refreshing the QR Code — we want a new QR without losing the session.
   */
  async forceDisconnectForQR(instanceId: number): Promise<void> {
    const timer = this.reconnectTimers.get(instanceId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(instanceId);
    }
    const sock = this.sockets.get(instanceId);
    if (sock) {
      try { sock.end(undefined); } catch (_) {}
      this.sockets.delete(instanceId);
      this.qrCodes.delete(instanceId);
    }
    await updateWhatsappInstance(instanceId, { status: "disconnected", qrCode: null });
  }

  getQRCode(instanceId: number): string | undefined {
    return this.qrCodes.get(instanceId);
  }

  isConnected(instanceId: number): boolean {
    return this.sockets.has(instanceId);
  }

  async getGroups(instanceId: number): Promise<{ id: string; subject: string; participantCount: number }[]> {
    const sock = this.sockets.get(instanceId);
    if (!sock) {
      console.warn(`[WhatsApp] getGroups: no socket for instance ${instanceId}`);
      return [];
    }
    // Retry up to 3 times with 2s delay if groups come back empty (socket may not be fully ready)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const groups = await sock.groupFetchAllParticipating();
        const result = Object.values(groups).map((g) => ({
          id: g.id,
          subject: g.subject,
          participantCount: g.participants?.length || 0,
        }));
        console.log(`[WhatsApp] getGroups instance ${instanceId}: found ${result.length} groups (attempt ${attempt})`);
        if (result.length > 0 || attempt === 3) return result;
        // Wait before retry if empty
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`[WhatsApp] Failed to fetch groups (attempt ${attempt}):`, err);
        if (attempt === 3) return [];
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return [];
  }

  async sendTextMessage(instanceId: number, jid: string, text: string): Promise<boolean> {
    const sock = this.sockets.get(instanceId);
    if (!sock) return false;
    try {
      await sock.sendMessage(jid, { text });
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Failed to send text to ${jid}:`, err);
      return false;
    }
  }

  async sendImageMessage(instanceId: number, jid: string, imageUrl: string, caption?: string): Promise<boolean> {
    const sock = this.sockets.get(instanceId);
    if (!sock) return false;
    try {
      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: caption || "",
      });
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Failed to send image to ${jid}:`, err);
      return false;
    }
  }

  async sendVideoMessage(instanceId: number, jid: string, videoUrl: string, caption?: string): Promise<boolean> {
    const sock = this.sockets.get(instanceId);
    if (!sock) return false;
    try {
      await sock.sendMessage(jid, {
        video: { url: videoUrl },
        caption: caption || "",
      });
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Failed to send video to ${jid}:`, err);
      return false;
    }
  }

  private handleIncomingMessage(instanceId: number, userId: number, msg: WhatsAppMessage): void {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;
    if (!remoteJid.endsWith("@g.us")) return;
    // Enqueue per-user to prevent DB overload under high concurrency
    enqueueForUser(userId, () => this._processIncomingMessage(instanceId, userId, msg, remoteJid));
  }

  private async _processIncomingMessage(instanceId: number, userId: number, msg: WhatsAppMessage, remoteJid: string): Promise<void> {
    try {
      // Check if this group is monitored with buscarOfertas active
      const monitoredGroupsList = await cachedGetMonitoredGroups(userId, instanceId);
      diagInfo(userId, 'GRUPOS', `${monitoredGroupsList.length} monitorados | buscarOfertas: ${monitoredGroupsList.filter(g => g.isActive && g.buscarOfertas).length} ativos`);
      const activeMonitored = monitoredGroupsList.filter(
        (g) => g.isActive && g.groupJid === remoteJid && g.buscarOfertas
      );
      if (activeMonitored.length > 0) {
        diagSuccess(userId, 'GRUPOS', `Grupo ${remoteJid} está monitorado com buscarOfertas ativo ✓`);
      } else {
        diagWarn(userId, 'GRUPOS', `Grupo ${remoteJid} NÃO está configurado para buscar ofertas. Grupos configurados: ${monitoredGroupsList.filter(g=>g.buscarOfertas).map(g => g.groupName || g.groupJid).join(', ') || 'nenhum'}`);
      }
      if (activeMonitored.length === 0) {
        // Also check espelharConteudo groups
        const mirrorGroups = monitoredGroupsList.filter(
          (g) => g.isActive && g.groupJid === remoteJid && g.espelharConteudo
        );
        if (mirrorGroups.length === 0) return;
        // Handle espelharConteudo: forward message as-is to all enviarOfertas groups
        const allEnviar = monitoredGroupsList.filter(
          (g) => g.isActive && g.enviarOfertas && g.groupJid !== remoteJid
        );
        if (allEnviar.length === 0) return;
        const { text, mediaType, mediaUrl } = extractMessageContent(msg);
        if (!text && !mediaUrl) return;
        const sock = this.sockets.get(instanceId);
        if (!sock) return;
        for (const target of allEnviar) {
          try {
            await sock.sendMessage(target.groupJid, { forward: msg as any });
            console.log(`[WhatsApp] Mirrored message to ${target.groupName || target.groupJid}`);
          } catch (e) {
            console.error(`[WhatsApp] Failed to mirror to ${target.groupJid}:`, e);
          }
        }
        return;
      }

      console.log(`[WhatsApp] Incoming message in monitored group: ${remoteJid} (${activeMonitored[0]?.groupName || 'unknown'})`);

      // Find automations for this group
      const allAutomations = await cachedGetAutomations(userId);
      const matchingAutomations = allAutomations.filter(
        (a) => a.isActive && a.instanceId === instanceId && activeMonitored.some((g) => g.id === a.sourceGroupId)
      );
      
      if (matchingAutomations.length === 0) {
        // No automation configured but group has buscarOfertas — use default dispatch
        // Find all enviarOfertas groups as fallback
        const enviarGroups = monitoredGroupsList.filter(
          (g) => g.isActive && g.enviarOfertas && g.groupJid !== remoteJid
        );
        if (enviarGroups.length === 0) {
          console.log(`[WhatsApp] No automations and no enviarOfertas groups. Skipping.`);
          return;
        }
        // Create a synthetic automation for default dispatch
        const { text, mediaType, mediaUrl } = extractMessageContent(msg);
        if (!text && !mediaUrl) return;
        const [links, mlConfig, shopeeConfig, amazonConfig, magaluConfig, aliConfig, botSettings] = await Promise.all([
          cachedGetAffiliateLinks(userId),
          cachedGetMlConfig(userId),
          cachedGetShopeeConfig(userId),
          cachedGetAmazonConfig(userId),
          cachedGetMagaluConfig(userId),
          cachedGetAliConfig(userId),
          cachedGetBotSettings(userId),
        ]);
        const syntheticAutomation = {
          id: 0,
          sourceGroupId: activeMonitored[0].id,
          instanceId,
          campaignId: null,
          useLlmSuggestion: false,
          sendDelay: 0,
          isActive: true,
          generateMarketing: activeMonitored[0].generateMarketing || false,
        };
        await this.processAutomation(instanceId, userId, syntheticAutomation, msg, text, mediaType, mediaUrl, links, remoteJid, mlConfig || null, shopeeConfig || null, amazonConfig || null, magaluConfig || null, aliConfig || null, botSettings || null);
        return;
      }

      // Extract message content
      const { text, mediaType, mediaUrl } = extractMessageContent(msg);
      if (!text && !mediaUrl) return;

      // Get active affiliate links and configs (all from cache, parallel fetch on miss)
      const [links, mlConfig, shopeeConfig, amazonConfig, magaluConfig, aliConfig, botSettings] = await Promise.all([
        cachedGetAffiliateLinks(userId),
        cachedGetMlConfig(userId),
        cachedGetShopeeConfig(userId),
        cachedGetAmazonConfig(userId),
        cachedGetMagaluConfig(userId),
        cachedGetAliConfig(userId),
        cachedGetBotSettings(userId),
      ]);

      for (const automation of matchingAutomations) {
        // Enrich automation with source group flags (generateMarketing, replaceImage)
        const sourceGroup = activeMonitored.find((g) => g.id === automation.sourceGroupId);
        const enrichedAutomation = {
          ...automation,
          generateMarketing: sourceGroup?.generateMarketing || false,
          replaceImage: sourceGroup?.substituirImagem || false,
        };
        await this.processAutomation(instanceId, userId, enrichedAutomation, msg, text, mediaType, mediaUrl, links, remoteJid, mlConfig || null, shopeeConfig || null, amazonConfig || null, magaluConfig || null, aliConfig || null, botSettings || null);
      }

      // ── Feed Global: dispatch to other users who have Feed Global enabled ──
      await this.dispatchToFeedGlobalSubscribers(instanceId, userId, msg, text, mediaType, mediaUrl, remoteJid);

    } catch (err) {
      console.error("[WhatsApp] Error handling incoming message:", err);
    }
  }

  /**
   * When a message is detected in a monitored group, dispatch it to all other users
   * that have Feed Global enabled, replacing affiliate links with their own configs.
   */
  private async dispatchToFeedGlobalSubscribers(
    instanceId: number,
    sourceUserId: number,
    msg: WhatsAppMessage,
    text: string | null,
    mediaType: string,
    mediaUrl: string | null,
    sourceGroupJid: string,
  ): Promise<void> {
    try {
      const subscribers = await cachedGetFeedSubscribers();
      if (subscribers.length === 0) return;

      for (const subscriber of subscribers) {
        // Skip the user who owns the source group (they already receive via normal automation)
        if (subscriber.userId === sourceUserId) continue;

        try {
          // Get subscriber's monitored groups
          const subscriberGroups = await cachedGetMonitoredGroups(subscriber.userId);

          // Determine target JIDs: either selected targets or all enviarOfertas groups
          let targetJids: { jid: string; name: string }[] = [];

          if (subscriber.targetGroupIds.length > 0) {
            // Use explicitly selected target groups
            for (const targetId of subscriber.targetGroupIds) {
              const g = subscriberGroups.find((sg) => sg.id === targetId && sg.isActive);
              if (g && g.groupJid) {
                targetJids.push({ jid: g.groupJid, name: g.groupName || g.groupJid });
              }
            }
          } else {
            // Fallback: all enviarOfertas groups
            targetJids = subscriberGroups
              .filter((g) => g.isActive && g.enviarOfertas)
              .map((g) => ({ jid: g.groupJid, name: g.groupName || g.groupJid }));
          }

          if (targetJids.length === 0) continue;

          // Get subscriber's affiliate configs (from cache, parallel fetch on miss)
          const [subLinks, subMlConfig, subShopeeConfig, subAmazonConfig, subMagaluConfig, subAliConfig] = await Promise.all([
            cachedGetAffiliateLinks(subscriber.userId),
            cachedGetMlConfig(subscriber.userId),
            cachedGetShopeeConfig(subscriber.userId),
            cachedGetAmazonConfig(subscriber.userId),
            cachedGetMagaluConfig(subscriber.userId),
            cachedGetAliConfig(subscriber.userId),
          ]);

          // Process text: replace links with subscriber's affiliate links
          let processedText = text || "";
          if (text && subLinks.length > 0) {
            const result = replaceLinksInText(text, subLinks);
            processedText = result.text;
          }
          if (subMlConfig?.isActive && subMlConfig.tag && processedText) {
            const r = replaceMercadoLivreLinks(processedText, subMlConfig);
            if (r.replaced > 0) processedText = r.text;
          }
          if (subShopeeConfig?.isActive && subShopeeConfig.appId && processedText) {
            const r = replaceShopeeLinks(processedText, subShopeeConfig);
            if (r.replaced > 0) processedText = r.text;
          }
          if (subAmazonConfig?.isActive && subAmazonConfig.tag && processedText) {
            const r = replaceAmazonLinks(processedText, subAmazonConfig);
            if (r.replaced > 0) processedText = r.text;
          }
          if (subMagaluConfig?.isActive && subMagaluConfig.tag && processedText) {
            const r = replaceMagazineLuizaLinks(processedText, subMagaluConfig);
            if (r.replaced > 0) processedText = r.text;
          }
          if (subAliConfig?.isActive && subAliConfig.trackId && processedText) {
            const r = replaceAliexpressLinks(processedText, subAliConfig);
            if (r.replaced > 0) processedText = r.text;
          }

          // Download media if present
          let uploadedMediaUrl: string | null = null;
          if ((mediaType === "image" || mediaType === "video") && msg.message) {
            try {
              const buffer = await downloadMediaMessage(msg as any, "buffer", {}) as Buffer;
              if (buffer && buffer.length > 0) {
                const ext = mediaType === "image" ? "jpg" : "mp4";
                const mimeType = mediaType === "image" ? "image/jpeg" : "video/mp4";
                const fileKey = `feed-global/${subscriber.userId}-${Date.now()}.${ext}`;
                const { url } = await storagePut(fileKey, buffer, mimeType);
                uploadedMediaUrl = url;
              }
            } catch (mediaErr) {
              console.error(`[FeedGlobal] Failed to download media for user ${subscriber.userId}:`, mediaErr);
            }
          }

          // Send to all target groups (with logging)
          for (const target of targetJids) {
            // Create a dummy postLogId=0 for feed global (no automation)
            const globalPostLogId = await createPostLog({
              userId: subscriber.userId,
              automationId: 0,
              instanceId,
              sourceGroupJid,
              sourceGroupName: undefined,
              originalContent: text || undefined,
              processedContent: processedText || undefined,
              llmSuggestion: undefined,
              linksFound: 0,
              linksReplaced: 0,
            }).catch(() => 0);
            const globalSendLogId = await createSendLog({
              postLogId: globalPostLogId,
              userId: subscriber.userId,
              platform: undefined,
              targetJid: target.jid,
              targetName: target.name,
              messageContent: processedText || undefined,
              status: "pending",
              source: "global",
            }).catch(() => 0);
            try {
              let sent = false;
              if (uploadedMediaUrl && mediaType === "image") {
                sent = await this.sendImageMessage(instanceId, target.jid, uploadedMediaUrl, processedText || undefined);
              } else if (uploadedMediaUrl && mediaType === "video") {
                sent = await this.sendVideoMessage(instanceId, target.jid, uploadedMediaUrl, processedText || undefined);
              } else if (processedText) {
                sent = await this.sendTextMessage(instanceId, target.jid, processedText);
              }
              if (globalSendLogId) await updateSendLog(globalSendLogId, { status: sent ? "sent" : "failed", sentAt: sent ? new Date() : undefined });
              console.log(`[FeedGlobal] Sent to user ${subscriber.userId} group ${target.name}`);
            } catch (sendErr: any) {
              console.error(`[FeedGlobal] Failed to send to ${target.jid}:`, sendErr.message);
              if (globalSendLogId) await updateSendLog(globalSendLogId, { status: "failed", errorMessage: sendErr.message });
            }
          }
        } catch (subErr) {
          console.error(`[FeedGlobal] Error processing subscriber ${subscriber.userId}:`, subErr);
        }
      }
    } catch (err) {
      console.error("[FeedGlobal] Error dispatching to subscribers:", err);
    }
  }

  private async processAutomation(
    instanceId: number,
    userId: number,
    automation: any,
    msg: WhatsAppMessage,
    text: string | null,
    mediaType: string,
    mediaUrl: string | null,
    links: any[],
    sourceGroupJid: string,
    mlConfig: { tag?: string | null; mattToolId?: string | null; socialTag?: string | null; isActive?: boolean } | null = null,
    shopeeConfig: { appId?: string | null; isActive?: boolean } | null = null,
    amazonConfig: { tag?: string | null; isActive?: boolean } | null = null,
    magaluConfig: { tag?: string | null; isActive?: boolean } | null = null,
    aliConfig: { trackId?: string | null; isActive?: boolean } | null = null,
    botSettings: { linkOrder?: string | null; includeGroupLink?: boolean | null; clickablePreview?: boolean | null; delayMinutes?: number | null } | null = null
  ): Promise<void> {
    const groupMeta = await this.getGroupName(instanceId, sourceGroupJid);

    // Create post log
    const logId = await createPostLog({
      userId,
      automationId: automation.id,
      instanceId,
      sourceGroupJid,
      sourceGroupName: groupMeta,
      senderJid: msg.key.participant || msg.key.remoteJid || undefined,
      senderName: msg.pushName || undefined,
      originalContent: text || undefined,
      mediaType: mediaType as any,
      status: "pending",
      linksFound: 0,
      linksReplaced: 0,
    });

    diagInfo(userId, 'AUTOMAÇÃO', `Processando | grupo=${sourceGroupJid} | texto=${text ? text.substring(0, 80) + '...' : 'VAZIO'} | mídia=${mediaType || 'nenhuma'}`);
    diagInfo(userId, 'CONFIG', `ML=${mlConfig?.isActive ? 'ativo (tag:' + mlConfig.tag + ')' : 'inativo'} | Shopee=${shopeeConfig?.isActive ? 'ativo' : 'inativo'} | Amazon=${amazonConfig?.isActive ? 'ativo' : 'inativo'} | Links=${links.length}`);
    try {
      let processedText = text || "";
      let linksFound = 0;
      let linksReplaced = 0;
      let selectedCampaignId: number | undefined;
      let selectedCampaignName: string | undefined;
      let llmSuggestion: string | undefined;

      // Use LLM to suggest campaign if enabled
      if (automation.useLlmSuggestion && text) {
        const llmResult = await processMessageWithLLM(text, links);
        llmSuggestion = llmResult.suggestion;
        if (llmResult.campaignId) {
          selectedCampaignId = llmResult.campaignId;
          selectedCampaignName = llmResult.campaignName;
        }
      }

      // Use automation's campaign if no LLM suggestion
      if (!selectedCampaignId && automation.campaignId) {
        selectedCampaignId = automation.campaignId;
      }

      // Filter links by campaign
      const campaignLinks = selectedCampaignId
        ? links.filter((l) => l.campaignId === selectedCampaignId)
        : links;

      // Expand short links (meli.la, amzn.to, etc.) before affiliate substitution
      if (processedText) {
        try {
          processedText = await expandShortLinksInText(processedText);
        } catch {
          // ignore expansion errors
        }
      }

      // Replace links in text (affiliate links)
      if (processedText && campaignLinks.length > 0) {
        const result = replaceLinksInText(processedText, campaignLinks);
        processedText = result.text;
        linksFound = result.linksFound;
        linksReplaced = result.linksReplaced;
        if (result.linksReplaced > 0) {
          diagSuccess(userId, 'LINKS', `${result.linksFound} links encontrados, ${result.linksReplaced} substituídos por links de afiliado`);
        } else {
          diagWarn(userId, 'LINKS', `${result.linksFound} links encontrados mas nenhum substituído (verifique os links de campanha)`);
        }
      } else {
        diagWarn(userId, 'LINKS', `Nenhum link de campanha configurado ou texto vazio`);
      }

      // Replace Mercado Livre links with affiliate tag
      if (mlConfig && mlConfig.isActive && mlConfig.tag && processedText) {
        diagInfo(userId, 'LINKS', `Texto antes ML (150 chars): ${processedText.substring(0, 150)}`);
        const mlResult = replaceMercadoLivreLinks(processedText, mlConfig);
        diagInfo(userId, 'LINKS', `ML: ${mlResult.found} encontrados, ${mlResult.replaced} substituídos (tag=${mlConfig.tag}, socialTag=${mlConfig.socialTag || 'não configurado'})`);
        if (mlResult.replaced > 0) {
          processedText = mlResult.text;
          linksFound = Math.max(linksFound, mlResult.found);
          linksReplaced += mlResult.replaced;
          diagSuccess(userId, 'LINKS', `ML substituído: ${mlResult.replaced} link(s) com tag ${mlConfig.tag}`);
        } else if (mlResult.found > 0) {
          diagWarn(userId, 'LINKS', `ML: ${mlResult.found} link(s) encontrado(s) mas não substituído(s) - verifique a configuração`);
        }
      } else if (processedText && /mercadolivre\.com\.br/i.test(processedText)) {
        diagWarn(userId, 'LINKS', `Link ML detectado mas configuração ML inativa ou sem tag`);
      }

      // Replace Shopee links with affiliate tag
      if (shopeeConfig && shopeeConfig.isActive && shopeeConfig.appId && processedText) {
        const shopeeResult = replaceShopeeLinks(processedText, shopeeConfig);
        if (shopeeResult.replaced > 0) {
          processedText = shopeeResult.text;
          linksFound = Math.max(linksFound, shopeeResult.found);
          linksReplaced += shopeeResult.replaced;
        }
      }

      // Replace Amazon links with affiliate tag
      if (amazonConfig && amazonConfig.isActive && amazonConfig.tag && processedText) {
        const amazonResult = replaceAmazonLinks(processedText, amazonConfig);
        if (amazonResult.replaced > 0) {
          processedText = amazonResult.text;
          linksFound = Math.max(linksFound, amazonResult.found);
          linksReplaced += amazonResult.replaced;
        }
      }

      // Replace Magazine Luiza links with affiliate tag
      if (magaluConfig && magaluConfig.isActive && magaluConfig.tag && processedText) {
        const magaluResult = replaceMagazineLuizaLinks(processedText, magaluConfig);
        if (magaluResult.replaced > 0) {
          processedText = magaluResult.text;
          linksFound = Math.max(linksFound, magaluResult.found);
          linksReplaced += magaluResult.replaced;
        }
      }

      // Replace AliExpress links with affiliate tag
      if (aliConfig && aliConfig.isActive && aliConfig.trackId && processedText) {
        const aliResult = replaceAliexpressLinks(processedText, aliConfig);
        if (aliResult.replaced > 0) {
          processedText = aliResult.text;
          linksFound = Math.max(linksFound, aliResult.found);
          linksReplaced += aliResult.replaced;
        }
      }

      // Remove links de convite do WhatsApp (chat.whatsapp.com) antes de repostar
      // Esses links pertencem ao grupo de origem e não devem ser divulgados
      if (processedText) {
        const WA_LINK_RE = /https?:\/\/chat\.whatsapp\.com\/[^\s<>"{}|\\^`[\]]*/gi;
        const INVITE_KEYWORD_RE = /(?:participe|entre no grupo|acesse o grupo|grupo\s*:)/i;

        // Processar cada linha individualmente para remover apenas o trecho de convite
        processedText = processedText
          .split('\n')
          .map(line => {
            if (!WA_LINK_RE.test(line)) return line; // linha sem link WhatsApp: preservar
            WA_LINK_RE.lastIndex = 0;

            // Se a linha contém palavra-chave de convite: remover apenas o trecho após a última URL de produto
            // Estratégia: dividir por 2+ espaços e remover segmentos que contêm o link WhatsApp
            const segments = line.split(/(\s{2,})/);
            const filtered = segments.filter(seg => !WA_LINK_RE.test(seg) || !INVITE_KEYWORD_RE.test(seg));
            WA_LINK_RE.lastIndex = 0;

            // Se ainda houver link WhatsApp (sem palavra-chave), removê-lo diretamente
            const joined = filtered.join('');
            return joined.replace(WA_LINK_RE, '').trim();
          })
          .filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return false;
            // Remover linhas que ficaram só com texto de convite sem link
            const isOrphanInvite = INVITE_KEYWORD_RE.test(trimmed) && !trimmed.includes('http');
            return !isOrphanInvite;
          })
          .join('\n')
          .trim();

        processedText = processedText.replace(/\n{3,}/g, '\n\n').trim();
      }

      // Generate marketing phrase with AI if enabled
      if (automation.generateMarketing && processedText) {
        try {
          const { invokeLLM } = await import("./_core/llm");
          const marketingResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um especialista em marketing de afiliados para grupos de WhatsApp. 
Sua tarefa é reescrever mensagens de oferta de produtos para torná-las mais persuasivas e atraentes.

Regras:
- Mantenha TODOS os links exatamente como estão (não altere nenhuma URL)
- Mantenha os preços e informações do produto
- Use emojis estrategicamente (máx 5 por mensagem)
- Tom urgente e persuasivo (ex: "Corre!", "Só hoje!", "Imperdível!")
- Máximo 200 palavras
- Não adicione hashtags
- Não invente informações que não estão na mensagem original`,
              },
              {
                role: "user",
                content: `Reescreva esta mensagem de oferta com linguagem de marketing mais persuasiva:\n\n${processedText}`,
              },
            ],
          });
          const rawContent = marketingResponse?.choices?.[0]?.message?.content;
          const marketingText = typeof rawContent === 'string' ? rawContent : null;
          if (marketingText && marketingText.trim()) {
            // Verify all original URLs are preserved in the marketing text
            const urlRegex = /https?:\/\/\S+/gi;
            const originalUrls = processedText.match(urlRegex) || [];
            const marketingUrls = marketingText.match(urlRegex) || [];
            const allUrlsPreserved = originalUrls.every(url => marketingUrls.some(mu => mu.includes(url.substring(0, 30))));
            if (allUrlsPreserved || originalUrls.length === 0) {
              processedText = marketingText.trim();
              llmSuggestion = marketingText.trim();
            }
          }
        } catch (llmErr) {
          console.error(`[WhatsApp] Failed to generate marketing text:`, llmErr);
          // Continue with original text if LLM fails
        }
      }

      // Apply link order (first or last)
      if (botSettings?.linkOrder === 'last' && processedText) {
        // Move links to end of message
        const urlRegexOrder = /https?:\/\/\S+/gi;
        const urls = processedText.match(urlRegexOrder) || [];
        if (urls.length > 0) {
          let textWithoutUrls = processedText;
          for (const url of urls) {
            textWithoutUrls = textWithoutUrls.replace(url, '').trim();
          }
          processedText = textWithoutUrls + '\n\n' + urls.join('\n');
        }
      }

      // Apply ad text for basic plan (hasAds)
      if (processedText) {
        try {
          const subscription = await getSubscription(userId);
          if (subscription?.hasAds && subscription.status === "active") {
            const configuredAdText = await getSystemSetting("ad_text");
            const adText = configuredAdText ?? "⚠️ _Mensagem enviada pelo AutoAfiliado_ | autoafiliado.manus.space";
            processedText = processedText + "\n\n" + adText;
          }
        } catch {
          // ignore subscription fetch errors
        }
      }

      // If no content at all, skip
      if (!processedText && !mediaUrl) {
        await updatePostLog(logId, { status: "skipped" });
        return;
      }

      // Se o texto contém links de afiliado conhecidos mas nenhum foi substituído, não repostar
      // Isso evita repostar links de outros afiliados sem substituir pela tag do usuário
      const hasKnownAffiliateLinks = processedText && (
        /mercadolivre\.com\.br/i.test(processedText) ||
        /shopee\.com\.br/i.test(processedText) ||
        /amazon\.com\.br/i.test(processedText) ||
        /magazineluiza\.com\.br/i.test(processedText) ||
        /aliexpress\.com/i.test(processedText) ||
        /amzn\.to/i.test(processedText) ||
        /meli\.la/i.test(processedText) ||
        /s\.shopee\.com\.br/i.test(processedText)
      );
      if (hasKnownAffiliateLinks && linksReplaced === 0) {
        diagWarn(userId, 'LINKS', `⚠️ BLOQUEADO: mensagem contém links de afiliado mas nenhum foi substituído pela sua tag. Verifique configurações de afiliado.`);
        await updatePostLog(logId, { status: "skipped", linksFound, linksReplaced });
        return;
      }

      await updatePostLog(logId, {
        processedContent: processedText,
        linksFound,
        linksReplaced,
        campaignId: selectedCampaignId,
        campaignName: selectedCampaignName,
        llmSuggestion,
        status: "processed",
      });

      // Get destination groups via group_targets (sourceGroupId → target monitored groups with enviarOfertas)
      // The automation's sourceGroupId is a monitored_group id
      const sourceGroupRecord = (await getMonitoredGroups(userId, instanceId)).find(
        (g) => g.id === automation.sourceGroupId
      );

       let targetJids: { jid: string; name: string; inviteLink?: string | null }[] = [];
      // First try: group_targets (explicitly configured targets for this source group)
      const groupTargetsList = await getGroupTargets(userId, automation.sourceGroupId);
      if (groupTargetsList.length > 0) {
        const allMonitored = await getMonitoredGroups(userId, instanceId);
        for (const gt of groupTargetsList) {
          const targetGroup = allMonitored.find((g) => g.id === gt.targetGroupId && g.isActive);
          if (targetGroup && targetGroup.groupJid) {
            targetJids.push({ jid: targetGroup.groupJid, name: targetGroup.groupName || targetGroup.groupJid, inviteLink: targetGroup.inviteLink });
          }
        }
      }
      // Fallback: automation_targets → send_targets (legacy path)
      if (targetJids.length === 0) {
        const automationTargetsList = await getAutomationTargets(automation.id);
        if (automationTargetsList.length > 0) {
          const allSendTargets = await getSendTargets(userId, instanceId);
          for (const at of automationTargetsList) {
            const st = allSendTargets.find((t) => t.id === at.sendTargetId && t.isActive);
            if (st) {
              targetJids.push({ jid: st.targetJid, name: st.targetName || st.targetJid });
            }
          }
        }
      }
      // Last fallback: all groups with enviarOfertas active for this instance
      if (targetJids.length === 0) {
        const allMonitored = await getMonitoredGroups(userId, instanceId);
        const enviarGroups = allMonitored.filter(
          (g) => g.isActive && g.enviarOfertas && g.groupJid !== sourceGroupRecord?.groupJid
        );
        for (const g of enviarGroups) {
          if (g.groupJid) {
            targetJids.push({ jid: g.groupJid, name: g.groupName || g.groupJid, inviteLink: g.inviteLink });
          }
        }
      }

      if (targetJids.length === 0) {
        diagWarn(userId, 'ENVIO', `Nenhum grupo de destino encontrado para a automação ${automation.id}. Configure grupos com "Enviar Ofertas" ativo.`);
        await updatePostLog(logId, { status: "skipped" });
        return;
      }

      diagInfo(userId, 'ENVIO', `Enviando para ${targetJids.length} grupo(s): ${targetJids.map(t => t.name).join(', ')}`);
      console.log(`[WhatsApp] Dispatching to ${targetJids.length} groups:`, targetJids.map(t => t.name));

      // Download media from WhatsApp if present, upload to S3 for reliable reuse
      let uploadedMediaUrl: string | null = null;
      let uploadedMediaType = mediaType;
      if ((mediaType === "image" || mediaType === "video") && msg.message) {
        try {
          const buffer = await downloadMediaMessage(
            msg as any,
            "buffer",
            {},
          ) as Buffer;
          if (buffer && buffer.length > 0) {
            const ext = mediaType === "image" ? "jpg" : "mp4";
            const mimeType = mediaType === "image" ? "image/jpeg" : "video/mp4";
            const fileKey = `whatsapp-media/${userId}-${Date.now()}.${ext}`;
            const { url } = await storagePut(fileKey, buffer, mimeType);
            uploadedMediaUrl = url;
            console.log(`[WhatsApp] Media uploaded to S3: ${uploadedMediaUrl}`);
          }
        } catch (mediaErr) {
          console.error(`[WhatsApp] Failed to download/upload media:`, mediaErr);
          // Continue with text-only if media download fails
        }
      }

      // If replaceImage is enabled and no media was found, try to fetch product image from ML/Amazon
      if (automation.replaceImage && !uploadedMediaUrl && processedText) {
        try {
          const productImageUrl = await fetchProductImage(processedText);
          if (productImageUrl) {
            // Download the product image and upload to S3
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const imgResponse = await fetch(productImageUrl, {
              signal: controller.signal,
              headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36" },
            });
            clearTimeout(timeout);
            if (imgResponse.ok) {
              const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
              const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
              const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
              const fileKey = `product-images/${userId}-${Date.now()}.${ext}`;
              const { url } = await storagePut(fileKey, imgBuffer, contentType);
              uploadedMediaUrl = url;
              uploadedMediaType = 'image';
              console.log(`[WhatsApp] Product image fetched and uploaded: ${uploadedMediaUrl}`);
            }
          }
        } catch (imgErr) {
          console.error(`[WhatsApp] Failed to fetch product image:`, imgErr);
          // Continue without image if fetch fails
        }
      }

      // Apply send delay
      if (automation.sendDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, automation.sendDelay * 1000));
      }

      // Detect which platform was used for link replacement
      let detectedPlatform = "";
      const originalText = text || "";
      if (mlConfig?.tag && processedText !== originalText && processedText.includes(mlConfig.tag)) detectedPlatform = "mercadolivre";
      else if (shopeeConfig?.appId && processedText !== originalText) detectedPlatform = "shopee";
      else if (amazonConfig?.tag && processedText !== originalText) detectedPlatform = "amazon";
      else if (magaluConfig?.tag && processedText !== originalText) detectedPlatform = "magalu";
      else if (aliConfig?.trackId && processedText !== originalText) detectedPlatform = "aliexpress";

      // Send to all target groups
      let allSent = true;
      for (const target of targetJids) {
        // Adicionar link de convite do grupo destino se configurado e habilitado
        let finalText = processedText;
        if (botSettings?.includeGroupLink && target.inviteLink && finalText) {
          const inviteUrl = target.inviteLink.startsWith('http')
            ? target.inviteLink
            : `https://chat.whatsapp.com/${target.inviteLink}`;
          finalText = `${finalText}\n\n🚀 *Participe do grupo:* ${inviteUrl}`;
        }

        const sendLogId = await createSendLog({
          postLogId: logId,
          userId,
          platform: detectedPlatform || undefined,
          targetJid: target.jid,
          targetName: target.name,
          messageContent: finalText || text || undefined,
          status: "pending",
          source: "bot",
        });
        let sent = false;
        try {
          if (uploadedMediaUrl && uploadedMediaType === "image") {
            sent = await this.sendImageMessage(instanceId, target.jid, uploadedMediaUrl, finalText || undefined);
          } else if (uploadedMediaUrl && uploadedMediaType === "video") {
            sent = await this.sendVideoMessage(instanceId, target.jid, uploadedMediaUrl, finalText || undefined);
          } else if (finalText) {
            sent = await this.sendTextMessage(instanceId, target.jid, finalText);
          } else {
            // Forward original message as-is
            const sock = this.sockets.get(instanceId);
            if (sock && msg.key) {
              await sock.sendMessage(target.jid, { forward: msg as any });
              sent = true;
            }
          }

          await updateSendLog(sendLogId, {
            status: sent ? "sent" : "failed",
            sentAt: sent ? new Date() : undefined,
          });
          if (sent) {
            diagSuccess(userId, 'ENVIO', `✓ Enviado para "${target.name}" (${target.jid})`);
          } else {
            diagError(userId, 'ENVIO', `✗ Falha ao enviar para "${target.name}" (${target.jid})`);
          }
          if (!sent) allSent = false;
        } catch (err: any) {
          console.error(`[WhatsApp] Failed to send to ${target.jid}:`, err.message);
          diagError(userId, 'ENVIO', `✗ Erro ao enviar para "${target.name}": ${err.message}`);
          await updateSendLog(sendLogId, { status: "failed", errorMessage: err.message });
          allSent = false;
        }
      }

      await updatePostLog(logId, {
        status: allSent ? "sent" : "failed",
        sentAt: allSent ? new Date() : undefined,
      });
    } catch (err: any) {
      console.error("[WhatsApp] Error processing automation:", err);
      await updatePostLog(logId, { status: "failed", errorMessage: err.message });
    }
  }

  private async getGroupName(instanceId: number, jid: string): Promise<string> {
    const sock = this.sockets.get(instanceId);
    if (!sock) return jid;
    try {
      const metadata = await sock.groupMetadata(jid);
      return metadata.subject || jid;
    } catch {
      return jid;
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractMessageContent(msg: WhatsAppMessage): {
  text: string | null;
  mediaType: string;
  mediaUrl: string | null;
} {
  const m = msg.message;
  if (!m) return { text: null, mediaType: "text", mediaUrl: null };

  if (m.conversation) return { text: m.conversation, mediaType: "text", mediaUrl: null };
  if (m.extendedTextMessage?.text) return { text: m.extendedTextMessage.text, mediaType: "text", mediaUrl: null };
  if (m.imageMessage) return { text: m.imageMessage.caption || null, mediaType: "image", mediaUrl: m.imageMessage.url || null };
  if (m.videoMessage) return { text: m.videoMessage.caption || null, mediaType: "video", mediaUrl: m.videoMessage.url || null };
  if (m.documentMessage) return { text: m.documentMessage.caption || null, mediaType: "document", mediaUrl: m.documentMessage.url || null };
  if (m.audioMessage) return { text: null, mediaType: "audio", mediaUrl: m.audioMessage.url || null };
  if (m.stickerMessage) return { text: null, mediaType: "sticker", mediaUrl: m.stickerMessage.url || null };

  return { text: null, mediaType: "text", mediaUrl: null };
}

// ── Resolução de links encurtados ──────────────────────────────────────────
// Domínios de encurtamento conhecidos das plataformas
const SHORT_LINK_DOMAINS = [
  "meli.la",          // Mercado Livre
  "mercadolivre.com", // ML internacional
  "amzn.to",          // Amazon
  "amzn.eu",          // Amazon Europa
  "bit.ly",           // Genérico
  "tinyurl.com",      // Genérico
  "encurtador.com.br",// Genérico BR
  "s.shopee.com.br",  // Shopee
  "shp.ee",           // Shopee encurtado
  "go.magalu.com",    // Magazine Luiza
  "mglu.me",          // Magazine Luiza
  "ali.ski",          // AliExpress
  "a.aliexpress.com", // AliExpress
  "click.aliexpress.com", // AliExpress
];

/**
 * Resolve um link encurtado para o URL final seguindo redirecionamentos HTTP.
 * Usa User-Agent de browser para evitar bloqueios.
 */
async function resolveShortLink(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);
    return response.url || url;
  } catch {
    return url; // Em caso de erro, retorna o URL original
  }
}

/**
 * Verifica se um URL é de um domínio encurtador conhecido.
 */
function isShortLink(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SHORT_LINK_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

/**
 * Expande todos os links encurtados em um texto, substituindo-os pelos URLs reais.
 * Processa em paralelo com limite de concorrência para não sobrecarregar.
 */
export async function expandShortLinksInText(text: string): Promise<string> {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const allUrls = text.match(urlRegex) || [];
  const shortUrls = allUrls.filter(isShortLink);

  if (shortUrls.length === 0) return text;

  // Resolve todos os links encurtados em paralelo (máx. 5 por vez)
  const uniqueShortUrls = Array.from(new Set(shortUrls));
  const resolvedPairs: Array<{ original: string; resolved: string }> = [];

  // Processar em lotes de 5
  for (let i = 0; i < uniqueShortUrls.length; i += 5) {
    const batch = uniqueShortUrls.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (url) => ({ original: url, resolved: await resolveShortLink(url) }))
    );
    for (const r of results) {
      resolvedPairs.push(r);
    }
  }

  // Substituir no texto
  let expandedText = text;
  for (const pair of resolvedPairs) {
    if (pair.original !== pair.resolved) {
      // Escapa caracteres especiais de regex no URL original
      const escaped = pair.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expandedText = expandedText.replace(new RegExp(escaped, "g"), pair.resolved);
    }
  }

  return expandedText;
}

export function replaceLinksInText(
  text: string,
  affiliateLinks: { originalPattern: string; affiliateUrl: string }[]
): { text: string; linksFound: number; linksReplaced: number } {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const foundUrls = text.match(urlRegex) || [];
  let linksFound = foundUrls.length;
  let linksReplaced = 0;
  let processedText = text;

  for (const url of foundUrls) {
    for (const link of affiliateLinks) {
      try {
        const pattern = link.originalPattern.trim();
        if (url.includes(pattern) || url.match(new RegExp(pattern, "i"))) {
          processedText = processedText.replace(url, link.affiliateUrl);
          linksReplaced++;
          break;
        }
      } catch {
        // Invalid regex pattern, skip
      }
    }
  }

  return { text: processedText, linksFound, linksReplaced };
}

// Singleton instance
export const whatsappManager = new WhatsAppManager();

// Substitui links do Mercado Livre adicionando tag de afiliado
export function replaceMercadoLivreLinks(
  text: string,
  config: { tag?: string | null; mattToolId?: string | null; socialTag?: string | null }
): { text: string; found: number; replaced: number } {
  // Padrão único abrangente para todos os subdomínios do Mercado Livre
  const mlPattern = /https?:\/\/[a-z0-9-]*\.?mercadolivre\.com\.br\/[^\s<>"{}|\\^`[\]]*/gi;

  const matches = text.match(mlPattern) || [];
  const found = matches.length;
  let replaced = 0;

  const processedText = text.replace(mlPattern, (url) => {
    try {
      const urlObj = new URL(url);
      const isSocialLink = urlObj.pathname.startsWith("/social/");

      if (isSocialLink) {
        // Formato /social/CODIGO?matt_tool=ID&matt_word=CODIGO
        // Substituir o slug /social/OUTRO_USUARIO pelo slug do nosso usuário
        // Tratar 'NULL' (string literal) como ausente
        const validSocialTag = config.socialTag && config.socialTag !== 'NULL' && config.socialTag.trim() !== '' ? config.socialTag.trim() : null;
        if (validSocialTag) {
          urlObj.pathname = `/social/${validSocialTag}`;
        }
        // Substituir matt_tool pelo ID do usuário e matt_word pelo tag do usuário
        if (config.mattToolId) urlObj.searchParams.set("matt_tool", config.mattToolId);
        if (config.tag) urlObj.searchParams.set("matt_word", config.tag);
        // Remover rastreamento do afiliado original
        urlObj.searchParams.delete("ref");
        urlObj.searchParams.delete("forceInApp");
      } else {
        // Formato normal de produto: adicionar matt_from e matt_tool
        // Remove parâmetros de rastreamento de afiliados de terceiros
        urlObj.searchParams.delete("matt_word");   // nome do afiliado original
        urlObj.searchParams.delete("ref");          // token de rastreamento externo
        urlObj.searchParams.delete("forceInApp");   // parâmetro interno do ML
        // Adiciona nosso tag de rastreamento (sobrescreve se já existir)
        if (config.tag) urlObj.searchParams.set("matt_from", config.tag);
        // Adiciona Matt Tool ID se disponível (sobrescreve o do afiliado original)
        if (config.mattToolId) urlObj.searchParams.set("matt_tool", config.mattToolId);
      }

      replaced++;
      return urlObj.toString();
    } catch {
      return url;
    }
  });

  return { text: processedText, found, replaced };
}

// ── Substituição de links Shopee ─────────────────────────────────────────────
export function replaceShopeeLinks(
  text: string,
  config: { appId?: string | null }
): { text: string; found: number; replaced: number } {
  // Padrão para links da Shopee (s.shopee.com.br, shopee.com.br)
  const shopeePattern = /https?:\/\/(?:[a-z0-9-]+\.)?shopee\.com\.br\/[^\s<>"{}|\\^`[\]]*/gi;
  const matches = text.match(shopeePattern) || [];
  const found = matches.length;
  let replaced = 0;

  if (!config.appId || found === 0) return { text, found, replaced };

  // Para Shopee, o link de afiliado é gerado via API; aqui apenas marcamos com o appId como parâmetro
  const processedText = text.replace(shopeePattern, (url) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("af_id", config.appId!);
      replaced++;
      return urlObj.toString();
    } catch {
      return url;
    }
  });

  return { text: processedText, found, replaced };
}

// ── Substituição de links Amazon ─────────────────────────────────────────────
export function replaceAmazonLinks(
  text: string,
  config: { tag?: string | null }
): { text: string; found: number; replaced: number } {
  // Padrão para links da Amazon Brasil
  const amazonPattern = /https?:\/\/(?:[a-z0-9-]+\.)?amazon\.com\.br\/[^\s<>"{}|\\^`[\]]*/gi;
  const matches = text.match(amazonPattern) || [];
  const found = matches.length;
  let replaced = 0;

  if (!config.tag || found === 0) return { text, found, replaced };

  const processedText = text.replace(amazonPattern, (url) => {
    try {
      const urlObj = new URL(url);
      // Substitui o tag do afiliado original pelo do usuário
      urlObj.searchParams.set("tag", config.tag!);
      // Remove parâmetros de rastreamento do afiliado original
      // (presentes quando amzn.to é expandido)
      urlObj.searchParams.delete("dib");
      urlObj.searchParams.delete("dib_tag");
      urlObj.searchParams.delete("sbo");
      replaced++;
      return urlObj.toString();
    } catch {
      return url;
    }
  });

  return { text: processedText, found, replaced };
}

// ── Substituição de links Magazine Luiza ─────────────────────────────────────
export function replaceMagazineLuizaLinks(
  text: string,
  config: { tag?: string | null }
): { text: string; found: number; replaced: number } {
  // Padrão para links da Magazine Luiza
  const magaluPattern = /https?:\/\/(?:[a-z0-9-]+\.)?magazineluiza\.com\.br\/[^\s<>"{}|\\^`[\]]*/gi;
  const matches = text.match(magaluPattern) || [];
  const found = matches.length;
  let replaced = 0;

  if (!config.tag || found === 0) return { text, found, replaced };

  const processedText = text.replace(magaluPattern, (url) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("utm_source", "afiliados");
      urlObj.searchParams.set("utm_medium", config.tag!);
      replaced++;
      return urlObj.toString();
    } catch {
      return url;
    }
  });

  return { text: processedText, found, replaced };
}

// ── Substituição de links AliExpress ─────────────────────────────────────────
export function replaceAliexpressLinks(
  text: string,
  config: { trackId?: string | null }
): { text: string; found: number; replaced: number } {
  // Padrão para links do AliExpress
  const aliPattern = /https?:\/\/(?:[a-z0-9-]+\.)?aliexpress\.com\/[^\s<>"{}|\\^`[\]]*/gi;
  const matches = text.match(aliPattern) || [];
  const found = matches.length;
  let replaced = 0;

  if (!config.trackId || found === 0) return { text, found, replaced };

  const processedText = text.replace(aliPattern, (url) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("aff_trace_key", config.trackId!);
      replaced++;
      return urlObj.toString();
    } catch {
      return url;
    }
  });

  return { text: processedText, found, replaced };
}

// ── Busca de imagem do produto ────────────────────────────────────────────────
/**
 * Tenta buscar a imagem principal de um produto a partir de um link de produto.
 * Suporta Mercado Livre e Amazon Brasil.
 * Retorna a URL da imagem ou null se não encontrar.
 */
async function fetchProductImage(text: string): Promise<string | null> {
  // Extrair o primeiro link de produto do texto
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const urls = text.match(urlRegex) || [];
  
  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      // Mercado Livre
      if (hostname.includes('mercadolivre.com.br') || hostname.includes('mercadolibre.com')) {
        const imageUrl = await fetchMercadoLivreImage(url);
        if (imageUrl) return imageUrl;
      }
      
      // Amazon Brasil
      if (hostname.includes('amazon.com.br')) {
        const imageUrl = await fetchAmazonImage(url);
        if (imageUrl) return imageUrl;
      }
    } catch {
      // Continue to next URL
    }
  }
  
  return null;
}

/**
 * Busca a imagem principal de um produto do Mercado Livre via Open Graph meta tag.
 */
async function fetchMercadoLivreImage(productUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(productUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Try og:image meta tag first
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch?.[1]) {
      const imgUrl = ogImageMatch[1];
      // ML images are usually in format: http2.mlstatic.com/D_NQ_NP_...
      if (imgUrl.includes('mlstatic.com') || imgUrl.includes('mercadolivre')) {
        return imgUrl;
      }
    }
    
    // Try to find product image in JSON-LD or data attributes
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch?.[1]) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        const imageUrl = jsonData?.image?.[0] || jsonData?.image;
        if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) return imageUrl;
      } catch {
        // ignore JSON parse errors
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Busca a imagem principal de um produto da Amazon via Open Graph meta tag.
 */
async function fetchAmazonImage(productUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(productUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Try og:image meta tag
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch?.[1]) {
      const imgUrl = ogImageMatch[1];
      if (imgUrl.includes('amazon') || imgUrl.includes('ssl-images-amazon') || imgUrl.includes('images-amazon')) {
        return imgUrl;
      }
    }
    
    // Try to find main product image in data-a-dynamic-image attribute
    const dynamicImageMatch = html.match(/data-a-dynamic-image=["']({[^"']+})["']/);
    if (dynamicImageMatch?.[1]) {
      try {
        const images = JSON.parse(dynamicImageMatch[1].replace(/&quot;/g, '"'));
        const imageUrls = Object.keys(images);
        if (imageUrls.length > 0) return imageUrls[0];
      } catch {
        // ignore
      }
    }
    
    return null;
  } catch {
    return null;
  }
}
