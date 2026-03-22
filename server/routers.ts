import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAffiliateLink,
  createAutomation,
  createMonitoredGroup,
  createPostLog,
  createSendTarget,
  createWhatsappInstance,
  deleteAffiliateLink,
  deleteAutomation,
  deleteCampaign,
  deleteMonitoredGroup,
  deleteSendTarget,
  deleteWhatsappInstance,
  getAffiliateLinks,
  getAutomationById,
  getAutomationTargets,
  getAutomations,
  getCampaignById,
  getCampaigns,
  getMonitoredGroups,
  getPostLogById,
  getPostLogStats,
  getPostLogs,
  getSendLogs,
  getSendTargets,
  getWhatsappInstanceById,
  getWhatsappInstances,
  setAutomationTargets,
  updateAffiliateLink,
  updateAutomation,
  updateCampaign,
  updateMonitoredGroup,
  updateSendTarget,
  updateWhatsappInstance,
  createCampaign,
  getMercadoLivreConfig,
  upsertMercadoLivreConfig,
  getGroupTargets,
  setGroupTargets,
} from "./db";
import { whatsappManager } from "./whatsapp";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Campaigns ──────────────────────────────────────────────────────────
  campaigns: router({
    list: protectedProcedure.query(({ ctx }) => getCampaigns(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getCampaignById(input.id, ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          category: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createCampaign({ ...input, userId: ctx.user.id });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          color: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCampaign(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCampaign(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Affiliate Links ────────────────────────────────────────────────────
  affiliateLinks: router({
    list: protectedProcedure
      .input(z.object({ campaignId: z.number().optional() }))
      .query(({ ctx, input }) => getAffiliateLinks(ctx.user.id, input.campaignId)),

    create: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          name: z.string().min(1).max(255),
          originalPattern: z.string().min(1),
          affiliateUrl: z.string().url(),
          keywords: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createAffiliateLink({ ...input, userId: ctx.user.id });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          originalPattern: z.string().optional(),
          affiliateUrl: z.string().url().optional(),
          keywords: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateAffiliateLink(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAffiliateLink(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── WhatsApp Instances ─────────────────────────────────────────────────
  whatsapp: router({
    listInstances: protectedProcedure.query(({ ctx }) => getWhatsappInstances(ctx.user.id)),

    createInstance: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        const id = await createWhatsappInstance({
          userId: ctx.user.id,
          name: input.name,
          status: "disconnected",
        });
        return { id };
      }),

    deleteInstance: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await whatsappManager.disconnectInstance(input.id);
        await deleteWhatsappInstance(input.id, ctx.user.id);
        return { success: true };
      }),

    connect: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const instance = await getWhatsappInstanceById(input.instanceId, ctx.user.id);
        if (!instance) throw new Error("Instance not found");
        await whatsappManager.connectInstance(input.instanceId, ctx.user.id);
        return { success: true };
      }),

    disconnect: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await whatsappManager.disconnectInstance(input.instanceId);
        return { success: true };
      }),

    getQRCode: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const instance = await getWhatsappInstanceById(input.instanceId, ctx.user.id);
        if (!instance) throw new Error("Instance not found");
        const qrCode = whatsappManager.getQRCode(input.instanceId) || instance.qrCode;
        return { qrCode, status: instance.status };
      }),

    getGroups: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const instance = await getWhatsappInstanceById(input.instanceId, ctx.user.id);
        if (!instance) throw new Error("Instance not found");
        return whatsappManager.getGroups(input.instanceId);
      }),

    // Monitored Groups
    listMonitoredGroups: protectedProcedure
      .input(z.object({ instanceId: z.number().optional() }))
      .query(({ ctx, input }) => getMonitoredGroups(ctx.user.id, input.instanceId)),

    addMonitoredGroup: protectedProcedure
      .input(
        z.object({
          instanceId: z.number().optional().default(0),
          groupJid: z.string(),
          groupName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createMonitoredGroup({ ...input, instanceId: input.instanceId ?? 0, userId: ctx.user.id, isActive: true });
        return { id };
      }),

    // Sync groups from WA into DB
    syncGroupsFromWA: protectedProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const instance = await getWhatsappInstanceById(input.instanceId, ctx.user.id);
        if (!instance) throw new Error("Instance not found");
        // If socket is not active but DB says connected, try to reconnect first
        if (!whatsappManager.isConnected(input.instanceId)) {
          if (instance.status === "connected") {
            console.log(`[WhatsApp] syncGroupsFromWA: socket not active, reconnecting instance ${input.instanceId}...`);
            await whatsappManager.connectInstance(input.instanceId, ctx.user.id);
            // Wait for connection to establish
            await new Promise((r) => setTimeout(r, 5000));
          } else {
            throw new Error("WhatsApp não está conectado. Conecte primeiro na página WhatsApp.");
          }
        }
        const waGroups = await whatsappManager.getGroups(input.instanceId);
        if (waGroups.length === 0) {
          throw new Error("Nenhum grupo encontrado. O WhatsApp pode estar sincronizando. Aguarde alguns segundos e tente novamente.");
        }
        const existing = await getMonitoredGroups(ctx.user.id, input.instanceId);
        const existingJids = new Set(existing.map((g) => g.groupJid));
        let added = 0;
        for (const g of waGroups) {
          if (!existingJids.has(g.id)) {
            await createMonitoredGroup({ instanceId: input.instanceId, userId: ctx.user.id, groupJid: g.id, groupName: g.subject, isActive: true });
            added++;
          }
        }
        return { added, total: waGroups.length };
      }),

    updateMonitoredGroup: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          groupName: z.string().optional(),
          isActive: z.boolean().optional(),
          buscarOfertas: z.boolean().optional(),
          espelharConteudo: z.boolean().optional(),
          enviarOfertas: z.boolean().optional(),
          substituirImagem: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateMonitoredGroup(id, ctx.user.id, data);
        return { success: true };
      }),

    removeMonitoredGroup: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteMonitoredGroup(input.id, ctx.user.id);
        return { success: true };
      }),

    // Group Targets (alvos de disparo por grupo de origem)
    getGroupTargets: protectedProcedure
      .input(z.object({ sourceGroupId: z.number().optional() }))
      .query(({ ctx, input }) => getGroupTargets(ctx.user.id, input.sourceGroupId)),

    setGroupTargets: protectedProcedure
      .input(z.object({ sourceGroupId: z.number(), targetGroupIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        await setGroupTargets(ctx.user.id, input.sourceGroupId, input.targetGroupIds);
        return { success: true };
      }),

    // Send Targets
    listSendTargets: protectedProcedure
      .input(z.object({ instanceId: z.number().optional() }))
      .query(({ ctx, input }) => getSendTargets(ctx.user.id, input.instanceId)),

    addSendTarget: protectedProcedure
      .input(
        z.object({
          instanceId: z.number(),
          targetJid: z.string(),
          targetName: z.string().optional(),
          targetType: z.enum(["group", "contact"]).default("group"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createSendTarget({ ...input, userId: ctx.user.id, isActive: true });
        return { id };
      }),

    updateSendTarget: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          targetName: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateSendTarget(id, ctx.user.id, data);
        return { success: true };
      }),

    removeSendTarget: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSendTarget(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Automations ────────────────────────────────────────────────────────
  automations: router({
    list: protectedProcedure.query(({ ctx }) => getAutomations(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const automation = await getAutomationById(input.id, ctx.user.id);
        if (!automation) return null;
        const targets = await getAutomationTargets(input.id);
        return { ...automation, targets };
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          instanceId: z.number(),
          sourceGroupId: z.number(),
          campaignId: z.number().optional(),
          useLlmSuggestion: z.boolean().default(false),
          sendDelay: z.number().min(0).default(0),
          targetIds: z.array(z.number()).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { targetIds, ...automationData } = input;
        const id = await createAutomation({ ...automationData, userId: ctx.user.id });
        await setAutomationTargets(id, targetIds);
        await notifyOwner({
          title: "Nova automação criada",
          content: `Automação "${input.name}" foi criada com sucesso.`,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          instanceId: z.number().optional(),
          sourceGroupId: z.number().optional(),
          campaignId: z.number().nullable().optional(),
          useLlmSuggestion: z.boolean().optional(),
          isActive: z.boolean().optional(),
          sendDelay: z.number().min(0).optional(),
          targetIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, targetIds, ...data } = input;
        await updateAutomation(id, ctx.user.id, data as any);
        if (targetIds !== undefined) {
          await setAutomationTargets(id, targetIds);
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteAutomation(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Logs ───────────────────────────────────────────────────────────────
  logs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ ctx, input }) => getPostLogs(ctx.user.id, input.limit, input.offset)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const log = await getPostLogById(input.id, ctx.user.id);
        if (!log) return null;
        const sendDetails = await getSendLogs(input.id);
        return { ...log, sendDetails };
      }),

    stats: protectedProcedure.query(({ ctx }) => getPostLogStats(ctx.user.id)),
  }),

  // ── Mercado Livre Config ─────────────────────────────────────────────────────────
  mercadoLivre: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getMercadoLivreConfig(ctx.user.id);
      return config ?? null;
    }),

    saveConfig: protectedProcedure
      .input(
        z.object({
          tag: z.string().optional(),
          cookieSsid: z.string().optional(),
          mattToolId: z.string().optional(),
          socialTag: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertMercadoLivreConfig(ctx.user.id, {
          tag: input.tag || null,
          cookieSsid: input.cookieSsid || null,
          mattToolId: input.mattToolId || null,
          socialTag: input.socialTag || null,
          isActive: input.isActive ?? true,
        });
        return { success: true };
      }),

    // Gera um link de afiliado ML a partir de uma URL de produto
    generateLink: protectedProcedure
      .input(z.object({ productUrl: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const config = await getMercadoLivreConfig(ctx.user.id);
        if (!config || !config.tag) {
          throw new Error("Configure sua Tag do Mercado Livre primeiro.");
        }
        const affiliateUrl = buildMercadoLivreAffiliateUrl(input.productUrl, config);
        return { affiliateUrl };
      }),
  }),
});

// Gera URL de afiliado do Mercado Livre com tag e parâmetros corretos
function buildMercadoLivreAffiliateUrl(
  productUrl: string,
  config: { tag?: string | null; mattToolId?: string | null; socialTag?: string | null }
): string {
  try {
    const url = new URL(productUrl);
    // Adiciona tag de rastreamento
    if (config.tag) url.searchParams.set("matt_from", config.tag);
    // Adiciona Matt Tool ID se disponível
    if (config.mattToolId) url.searchParams.set("matt_tool", config.mattToolId);
    return url.toString();
  } catch {
    return productUrl;
  }
}

export type AppRouter = typeof appRouter;
