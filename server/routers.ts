import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  adminGrantSubscription,
  adminListUsers,
  adminRevokeSubscription,
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
  getShopeeConfig,
  upsertShopeeConfig,
  deleteShopeeConfig,
  getAmazonConfig,
  upsertAmazonConfig,
  deleteAmazonConfig,
  getMagazineLuizaConfig,
  upsertMagazineLuizaConfig,
  deleteMagazineLuizaConfig,
  getAliexpressConfig,
  upsertAliexpressConfig,
  deleteAliexpressConfig,
  getBotSettings,
  upsertBotSettings,
  listSendLogs,
  getSendLogStats,
  getOrCreateSubscription,
  getSubscription,
  activateSubscription,
  createPixPayment,
  getPixPayment,
  getPendingPixPayment,
  markPixPaymentPaid,
  isSubscriptionActive,
} from "./db";
import { generatePixQRCode, generateTxid } from "./pix";
import { whatsappManager } from "./whatsapp";
import { notifyOwner } from "./_core/notification";
import { invalidateUserCache } from "./cache";

// ── Admin Router ────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new Error("Acesso negado: apenas administradores podem acessar este recurso");
  }
  return next({ ctx });
});

const adminRouter = router({
  listUsers: adminProcedure.query(async () => {
    return await adminListUsers();
  }),
  grantSubscription: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        plan: z.enum(["basic", "premium"]),
        months: z.number().min(1).max(24),
      })
    )
    .mutation(async ({ input }) => {
      await adminGrantSubscription(input.userId, input.plan, input.months);
      return { success: true };
    }),
  revokeSubscription: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await adminRevokeSubscription(input.userId);
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
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
        invalidateUserCache(ctx.user.id);
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

  // ── Shopee Config ────────────────────────────────────────────────────────
  shopee: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getShopeeConfig(ctx.user.id);
      return config ?? null;
    }),
    saveConfig: protectedProcedure
      .input(z.object({ appId: z.string().optional(), secret: z.string().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        await upsertShopeeConfig(ctx.user.id, { appId: input.appId || null, secret: input.secret || null, isActive: input.isActive ?? true });
        invalidateUserCache(ctx.user.id);
        return { success: true };
      }),
    deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteShopeeConfig(ctx.user.id);
      invalidateUserCache(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Amazon Config ────────────────────────────────────────────────────────
  amazon: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getAmazonConfig(ctx.user.id);
      return config ?? null;
    }),
    saveConfig: protectedProcedure
      .input(z.object({
        tag: z.string().optional(),
        ubidAcbbr: z.string().optional(),
        atAcbbr: z.string().optional(),
        xAcbb: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertAmazonConfig(ctx.user.id, {
          tag: input.tag || null,
          ubidAcbbr: input.ubidAcbbr || null,
          atAcbbr: input.atAcbbr || null,
          xAcbb: input.xAcbb || null,
          isActive: input.isActive ?? true,
        });
        invalidateUserCache(ctx.user.id);
        return { success: true };
      }),
    deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAmazonConfig(ctx.user.id);
      invalidateUserCache(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Magazine Luiza Config ────────────────────────────────────────────────
  magazineLuiza: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getMagazineLuizaConfig(ctx.user.id);
      return config ?? null;
    }),
    saveConfig: protectedProcedure
      .input(z.object({ tag: z.string().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        await upsertMagazineLuizaConfig(ctx.user.id, { tag: input.tag || null, isActive: input.isActive ?? true });
        invalidateUserCache(ctx.user.id);
        return { success: true };
      }),
    deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteMagazineLuizaConfig(ctx.user.id);
      invalidateUserCache(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── AliExpress Config ────────────────────────────────────────────────────
  aliexpress: router({
    getConfig: protectedProcedure.query(async ({ ctx }) => {
      const config = await getAliexpressConfig(ctx.user.id);
      return config ?? null;
    }),
    saveConfig: protectedProcedure
      .input(z.object({ trackId: z.string().optional(), cookie: z.string().optional(), isActive: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        await upsertAliexpressConfig(ctx.user.id, { trackId: input.trackId || null, cookie: input.cookie || null, isActive: input.isActive ?? true });
        invalidateUserCache(ctx.user.id);
        return { success: true };
      }),
    deleteConfig: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAliexpressConfig(ctx.user.id);
      invalidateUserCache(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Bot Settings ─────────────────────────────────────────────────────────
  botSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getBotSettings(ctx.user.id);
      return settings ?? {
        scheduleEnabled: false,
        scheduleWindows: [],
        delayMinutes: 0,
        delayPerGroup: false,
        delayGlobal: false,
        includeGroupLink: false,
        feedGlobalEnabled: false,
        feedGlobalTargets: [],
        clickablePreview: false,
        linkOrder: 'first' as const,
        cmdStickerEnabled: false,
        cmdDeleteLinksEnabled: false,
      };
    }),
    save: protectedProcedure
      .input(z.object({
        scheduleEnabled: z.boolean().optional(),
        scheduleWindows: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        delayMinutes: z.number().min(0).optional(),
        delayPerGroup: z.boolean().optional(),
        delayGlobal: z.boolean().optional(),
        includeGroupLink: z.boolean().optional(),
        feedGlobalEnabled: z.boolean().optional(),
        feedGlobalTargets: z.array(z.number()).optional(),
        clickablePreview: z.boolean().optional(),
        linkOrder: z.enum(['first', 'last']).optional(),
        cmdStickerEnabled: z.boolean().optional(),
        cmdDeleteLinksEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertBotSettings(ctx.user.id, input as any);
        invalidateUserCache(ctx.user.id);
        return { success: true };
      }),
  }),

  // ── Assinatura e Pagamento PIX ────────────────────────────────────────────────────────
  subscription: router({
    // Retorna status da assinatura do usuário (cria trial se não existir)
    get: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getOrCreateSubscription(ctx.user.id);
      if (!sub) return null;
      const now = new Date();
      // Verificar se trial expirou
      if (sub.status === "trial" && sub.trialEndsAt && now > sub.trialEndsAt) {
        return { ...sub, status: "expired" as const, isActive: false };
      }
      // Verificar se assinatura expirou
      if (sub.status === "active" && sub.currentPeriodEnd && now > sub.currentPeriodEnd) {
        return { ...sub, status: "expired" as const, isActive: false };
      }
      const isActive =
        (sub.status === "trial" && sub.trialEndsAt ? now < sub.trialEndsAt : false) ||
        (sub.status === "active" && sub.currentPeriodEnd ? now < sub.currentPeriodEnd : false);
      return { ...sub, isActive };
    }),

    // Gera QR Code PIX para o plano escolhido
    createPayment: protectedProcedure
      .input(z.object({ plan: z.enum(["basic", "premium"]) }))
      .mutation(async ({ ctx, input }) => {
        const amount = input.plan === "basic" ? 50.0 : 100.0;
        const txid = generateTxid();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

        const { payload, qrCodeBase64 } = await generatePixQRCode({
          pixKey: "41186875852",
          amount,
          merchantName: "ProAfiliados Bot",
          merchantCity: "SAO PAULO",
          txid,
          description: input.plan === "basic" ? "Plano Basic 50" : "Plano Premium 100",
        });

        const payment = await createPixPayment({
          userId: ctx.user.id,
          plan: input.plan,
          amount: amount * 100, // em centavos
          pixKey: "41186875852",
          txid,
          qrCodePayload: payload,
          qrCodeImage: qrCodeBase64,
          expiresAt,
        });

        return {
          txid,
          qrCodePayload: payload,
          qrCodeImage: qrCodeBase64,
          amount,
          expiresAt,
          plan: input.plan,
        };
      }),

    // Verifica se o pagamento foi confirmado (polling do frontend)
    checkPayment: protectedProcedure
      .input(z.object({ txid: z.string() }))
      .query(async ({ ctx, input }) => {
        const payment = await getPixPayment(input.txid);
        if (!payment || payment.userId !== ctx.user.id) {
          return { status: "not_found" as const };
        }
        // Verificar se expirou
        if (payment.status === "pending" && payment.expiresAt && new Date() > payment.expiresAt) {
          return { status: "expired" as const };
        }
        return { status: payment.status };
      }),

    // Ativa o plano manualmente (admin ou após confirmação manual)
    // Em produção, isso seria chamado por um webhook do banco
    confirmPayment: protectedProcedure
      .input(z.object({ txid: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const payment = await getPixPayment(input.txid);
        if (!payment || payment.userId !== ctx.user.id) {
          throw new Error("Pagamento não encontrado");
        }
        if (payment.status === "paid") {
          return { success: true, alreadyPaid: true };
        }
        // Marcar como pago e ativar assinatura
        await markPixPaymentPaid(input.txid);
        await activateSubscription(ctx.user.id, payment.plan);
        await notifyOwner({
          title: "Novo pagamento recebido!",
          content: `Usuário ${ctx.user.name || ctx.user.id} pagou o plano ${payment.plan} (R$ ${(payment.amount / 100).toFixed(2)}) - TXID: ${input.txid}`,
        });
        return { success: true, alreadyPaid: false };
      }),

    // Retorna pagamento pendente do usuário
    getPendingPayment: protectedProcedure.query(async ({ ctx }) => {
      return getPendingPixPayment(ctx.user.id);
    }),
  }),

  // ── Logs de Envio ────────────────────────────────────────────────────────
  sendLogs: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["all", "sent", "failed", "pending"]).default("all"),
        limit: z.number().min(1).max(500).default(100),
      }))
      .query(async ({ ctx, input }) => {
        return listSendLogs(ctx.user.id, input.status, input.limit);
      }),
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        return getSendLogStats(ctx.user.id);
      }),
  }),
  // ── Suporte / Recuperação de Acesso ────────────────────────────────────
  support: router({
    sendRequest: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        message: z.string().min(10).max(2000),
      }))
      .mutation(async ({ input }) => {
        const content = `Nome: ${input.name}\nE-mail: ${input.email}\n\nMensagem:\n${input.message}`;
        await notifyOwner({
          title: `[Suporte] Solicitação de ${input.name}`,
          content,
        });
        return { success: true };
      }),
  }),

  // ── Envio Manual ─────────────────────────────────────────────────────────
  manualSend: router({
    send: protectedProcedure
      .input(z.object({
        instanceId: z.number(),
        targetGroupIds: z.array(z.number()),
        message: z.string().min(1),
        replaceLinks: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const instance = await getWhatsappInstanceById(input.instanceId, ctx.user.id);
        if (!instance) throw new Error("Instância não encontrada");
        const isConnected = whatsappManager.isConnected(input.instanceId);
        if (!isConnected) throw new Error("WhatsApp não está conectado");
        const groups = await getMonitoredGroups(ctx.user.id);
        const targets = groups.filter(g => input.targetGroupIds.includes(g.id) && g.enviarOfertas);
        if (targets.length === 0) throw new Error("Nenhum grupo de destino válido selecionado");
        let sentCount = 0;
        for (const target of targets) {
          try {
            const ok = await whatsappManager.sendTextMessage(input.instanceId, target.groupJid, input.message);
            if (ok) sentCount++;
          } catch (err) {
            console.error(`[ManualSend] Erro ao enviar para ${target.groupName}:`, err);
          }
        }
        return { success: true, sentCount };
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
