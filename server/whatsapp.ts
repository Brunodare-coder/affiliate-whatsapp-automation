import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
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
  createPostLog,
  updatePostLog,
  createSendLog,
  updateSendLog,
  updateWhatsappInstance,
} from "./db";
import { processMessageWithLLM } from "./llm-processor";
import { storagePut } from "./storage";

const SESSION_DIR = process.env.SESSION_DIR || "/tmp/whatsapp-sessions";

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

export class WhatsAppManager extends EventEmitter {
  private sockets: Map<number, ReturnType<typeof makeWASocket>> = new Map();
  private qrCodes: Map<number, string> = new Map();
  private reconnectTimers: Map<number, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
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
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, console as any),
        },
        printQRInTerminal: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
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
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          await updateWhatsappInstance(instanceId, { status: "disconnected", qrCode: null });
          this.sockets.delete(instanceId);
          this.qrCodes.delete(instanceId);
          this.emit("disconnected", instanceId);

          if (shouldReconnect) {
            const timer = setTimeout(() => {
              this.reconnectTimers.delete(instanceId);
              this.connectInstance(instanceId, userId).catch(console.error);
            }, 5000);
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

  private async handleIncomingMessage(instanceId: number, userId: number, msg: WhatsAppMessage): Promise<void> {
    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;

    // Only process group messages
    if (!remoteJid.endsWith("@g.us")) return;

    try {
      // Check if this group is monitored
      const monitoredGroupsList = await getMonitoredGroups(userId, instanceId);
      const activeMonitored = monitoredGroupsList.filter((g) => g.isActive && g.groupJid === remoteJid);
      if (activeMonitored.length === 0) return;

      // Find automations for this group
      const allAutomations = await getAutomations(userId);
      const matchingAutomations = allAutomations.filter(
        (a) => a.isActive && a.instanceId === instanceId && activeMonitored.some((g) => g.id === a.sourceGroupId)
      );
      if (matchingAutomations.length === 0) return;

      // Extract message content
      const { text, mediaType, mediaUrl } = extractMessageContent(msg);
      if (!text && !mediaUrl) return;

      // Get active affiliate links
      const links = await getActiveAffiliateLinks(userId);

      // Get affiliate configs for all platforms
      const mlConfig = await getMercadoLivreConfig(userId);
      const shopeeConfig = await getShopeeConfig(userId);
      const amazonConfig = await getAmazonConfig(userId);
      const magaluConfig = await getMagazineLuizaConfig(userId);
      const aliConfig = await getAliexpressConfig(userId);
      const botSettings = await getBotSettings(userId);

      for (const automation of matchingAutomations) {
        await this.processAutomation(instanceId, userId, automation, msg, text, mediaType, mediaUrl, links, remoteJid, mlConfig || null, shopeeConfig || null, amazonConfig || null, magaluConfig || null, aliConfig || null, botSettings || null);
      }
    } catch (err) {
      console.error("[WhatsApp] Error handling incoming message:", err);
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

      // Replace links in text (affiliate links)
      if (text && campaignLinks.length > 0) {
        const result = replaceLinksInText(text, campaignLinks);
        processedText = result.text;
        linksFound = result.linksFound;
        linksReplaced = result.linksReplaced;
      }

      // Replace Mercado Livre links with affiliate tag
      if (mlConfig && mlConfig.isActive && mlConfig.tag && processedText) {
        const mlResult = replaceMercadoLivreLinks(processedText, mlConfig);
        if (mlResult.replaced > 0) {
          processedText = mlResult.text;
          linksFound = Math.max(linksFound, mlResult.found);
          linksReplaced += mlResult.replaced;
        }
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

      // If no links found/replaced, skip
      if (linksFound === 0 && !mediaUrl) {
        await updatePostLog(logId, { status: "skipped" });
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

      // Get send targets for this automation
      const automationTargetsList = await getAutomationTargets(automation.id);
      const allTargets = await getSendTargets(userId, instanceId);
      const targets = allTargets.filter(
        (t) => t.isActive && automationTargetsList.some((at) => at.sendTargetId === t.id)
      );

      if (targets.length === 0) {
        await updatePostLog(logId, { status: "skipped" });
        return;
      }

      // Apply send delay
      if (automation.sendDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, automation.sendDelay * 1000));
      }

      // Send to all targets
      let allSent = true;
      for (const target of targets) {
        const sendLogId = await createSendLog({
          postLogId: logId,
          targetJid: target.targetJid,
          targetName: target.targetName || undefined,
          status: "pending",
        });

        let sent = false;
        try {
          if (mediaType === "image" && mediaUrl) {
            sent = await this.sendImageMessage(instanceId, target.targetJid, mediaUrl, processedText);
          } else if (mediaType === "video" && mediaUrl) {
            sent = await this.sendVideoMessage(instanceId, target.targetJid, mediaUrl, processedText);
          } else {
            sent = await this.sendTextMessage(instanceId, target.targetJid, processedText);
          }

          await updateSendLog(sendLogId, {
            status: sent ? "sent" : "failed",
            sentAt: sent ? new Date() : undefined,
          });
          if (!sent) allSent = false;
        } catch (err: any) {
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
  config: { tag?: string | null; mattToolId?: string | null }
): { text: string; found: number; replaced: number } {
  // Padrão único abrangente para todos os subdomínios do Mercado Livre
  const mlPattern = /https?:\/\/[a-z0-9-]*\.?mercadolivre\.com\.br\/[^\s<>"{}|\\^`[\]]*/gi;

  const matches = text.match(mlPattern) || [];
  const found = matches.length;
  let replaced = 0;

  const processedText = text.replace(mlPattern, (url) => {
    try {
      const urlObj = new URL(url);
      // Adiciona tag de rastreamento
      if (config.tag) urlObj.searchParams.set("matt_from", config.tag);
      // Adiciona Matt Tool ID se disponível
      if (config.mattToolId) urlObj.searchParams.set("matt_tool", config.mattToolId);
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
      urlObj.searchParams.set("tag", config.tag!);
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
