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
    if (!sock) return [];
    try {
      const groups = await sock.groupFetchAllParticipating();
      return Object.values(groups).map((g) => ({
        id: g.id,
        subject: g.subject,
        participantCount: g.participants?.length || 0,
      }));
    } catch (err) {
      console.error("[WhatsApp] Failed to fetch groups:", err);
      return [];
    }
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

      for (const automation of matchingAutomations) {
        await this.processAutomation(instanceId, userId, automation, msg, text, mediaType, mediaUrl, links, remoteJid);
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
    sourceGroupJid: string
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

      // Replace links in text
      if (text && campaignLinks.length > 0) {
        const result = replaceLinksInText(text, campaignLinks);
        processedText = result.text;
        linksFound = result.linksFound;
        linksReplaced = result.linksReplaced;
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
