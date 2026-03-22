import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Campanhas de afiliado
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  color: varchar("color", { length: 20 }).default("#22c55e"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// Links de afiliado
export const affiliateLinks = mysqlTable("affiliate_links", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  originalPattern: text("originalPattern").notNull(), // padrão/domínio original a detectar
  affiliateUrl: text("affiliateUrl").notNull(),        // URL de afiliado para substituir
  keywords: text("keywords"),                          // palavras-chave para LLM identificar
  clickCount: int("clickCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = typeof affiliateLinks.$inferInsert;

// Instâncias WhatsApp (conexões)
export const whatsappInstances = mysqlTable("whatsapp_instances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 30 }),
  status: mysqlEnum("status", ["disconnected", "connecting", "connected", "qr_pending"]).default("disconnected").notNull(),
  qrCode: text("qrCode"),                              // QR code base64 para conexão
  sessionData: text("sessionData"),                    // dados de sessão serializada
  lastConnectedAt: timestamp("lastConnectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappInstance = typeof whatsappInstances.$inferSelect;
export type InsertWhatsappInstance = typeof whatsappInstances.$inferInsert;

// Grupos monitorados
export const monitoredGroups = mysqlTable("monitored_groups", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  userId: int("userId").notNull(),
  groupJid: varchar("groupJid", { length: 255 }).notNull(), // JID do grupo no WhatsApp
  groupName: varchar("groupName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  // Flags de comportamento por grupo
  buscarOfertas: boolean("buscarOfertas").default(false).notNull(),   // monitorar links neste grupo
  espelharConteudo: boolean("espelharConteudo").default(false).notNull(), // replicar sem converter
  enviarOfertas: boolean("enviarOfertas").default(false).notNull(),   // receber mensagens processadas
  substituirImagem: boolean("substituirImagem").default(false).notNull(), // buscar imagem da loja
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitoredGroup = typeof monitoredGroups.$inferSelect;
export type InsertMonitoredGroup = typeof monitoredGroups.$inferInsert;

// Alvos de disparo: grupo de origem → grupo de destino
export const groupTargets = mysqlTable("group_targets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceGroupId: int("sourceGroupId").notNull(), // grupo com buscarOfertas ativo
  targetGroupId: int("targetGroupId").notNull(), // grupo com enviarOfertas ativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupTarget = typeof groupTargets.$inferSelect;
export type InsertGroupTarget = typeof groupTargets.$inferInsert;

// Destinos de envio (grupos/contatos para onde enviar)
export const sendTargets = mysqlTable("send_targets", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: int("instanceId").notNull(),
  userId: int("userId").notNull(),
  targetJid: varchar("targetJid", { length: 255 }).notNull(), // JID do destino
  targetName: varchar("targetName", { length: 255 }),
  targetType: mysqlEnum("targetType", ["group", "contact"]).default("group").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SendTarget = typeof sendTargets.$inferSelect;
export type InsertSendTarget = typeof sendTargets.$inferInsert;

// Automações (regras de monitoramento → substituição → envio)
export const automations = mysqlTable("automations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  instanceId: int("instanceId").notNull(),
  sourceGroupId: int("sourceGroupId").notNull(),       // grupo de origem a monitorar
  campaignId: int("campaignId"),                       // campanha padrão (pode ser null para usar LLM)
  useLlmSuggestion: boolean("useLlmSuggestion").default(false).notNull(), // usar LLM para sugerir campanha
  isActive: boolean("isActive").default(true).notNull(),
  sendDelay: int("sendDelay").default(0).notNull(),    // delay em segundos antes de enviar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = typeof automations.$inferInsert;

// Relação automação → destinos de envio
export const automationTargets = mysqlTable("automation_targets", {
  id: int("id").autoincrement().primaryKey(),
  automationId: int("automationId").notNull(),
  sendTargetId: int("sendTargetId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AutomationTarget = typeof automationTargets.$inferSelect;
export type InsertAutomationTarget = typeof automationTargets.$inferInsert;

// Logs de posts processados
export const postLogs = mysqlTable("post_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  automationId: int("automationId"),
  instanceId: int("instanceId").notNull(),
  sourceGroupJid: varchar("sourceGroupJid", { length: 255 }).notNull(),
  sourceGroupName: varchar("sourceGroupName", { length: 255 }),
  senderJid: varchar("senderJid", { length: 255 }),
  senderName: varchar("senderName", { length: 255 }),
  originalContent: text("originalContent"),            // conteúdo original da mensagem
  processedContent: text("processedContent"),          // conteúdo após substituição
  linksFound: int("linksFound").default(0).notNull(),
  linksReplaced: int("linksReplaced").default(0).notNull(),
  campaignId: int("campaignId"),
  campaignName: varchar("campaignName", { length: 255 }),
  llmSuggestion: text("llmSuggestion"),               // sugestão do LLM
  mediaType: mysqlEnum("mediaType", ["text", "image", "video", "document", "sticker", "audio"]).default("text"),
  mediaUrl: text("mediaUrl"),                          // URL da mídia no S3
  status: mysqlEnum("status", ["pending", "processed", "sent", "failed", "skipped"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostLog = typeof postLogs.$inferSelect;
export type InsertPostLog = typeof postLogs.$inferInsert;

// Detalhes de envio por destino
export const sendLogs = mysqlTable("send_logs", {
  id: int("id").autoincrement().primaryKey(),
  postLogId: int("postLogId").notNull(),
  userId: int("userId").notNull(),
  platform: varchar("platform", { length: 50 }),  // mercadolivre, shopee, amazon, magalu, aliexpress
  targetJid: varchar("targetJid", { length: 255 }).notNull(),
  targetName: varchar("targetName", { length: 255 }),
  messageContent: text("messageContent"),  // conteúdo da mensagem enviada
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SendLog = typeof sendLogs.$inferSelect;
export type InsertSendLog = typeof sendLogs.$inferInsert;

// Configurações do Mercado Livre Afiliados por usuário
export const mercadoLivreConfig = mysqlTable("mercado_livre_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tag: varchar("tag", { length: 255 }),                    // Tag de rastreamento (ex: bq20260201142328)
  cookieSsid: text("cookieSsid"),                          // Cookie ssid para autenticação
  mattToolId: varchar("mattToolId", { length: 100 }),      // Matt Tool ID (para links de listas/ofertas)
  socialTag: varchar("socialTag", { length: 255 }),        // Tag do Perfil Social (/social/SLUG)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MercadoLivreConfig = typeof mercadoLivreConfig.$inferSelect;
export type InsertMercadoLivreConfig = typeof mercadoLivreConfig.$inferInsert;

// Configurações da Shopee Afiliados
export const shopeeConfig = mysqlTable("shopee_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  appId: varchar("appId", { length: 255 }),
  secret: text("secret"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopeeConfig = typeof shopeeConfig.$inferSelect;
export type InsertShopeeConfig = typeof shopeeConfig.$inferInsert;

// Configurações da Amazon Afiliados
export const amazonConfig = mysqlTable("amazon_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tag: varchar("tag", { length: 255 }),
  // 3 cookies separados conforme documentação Amazon Afiliados
  ubidAcbbr: text("ubidAcbbr"),    // Cookie ubid-acbbr (ex: 132-1170792-6134451)
  atAcbbr: text("atAcbbr"),        // Cookie at-acbbr (token longo)
  xAcbb: text("xAcbb"),            // Cookie x-acbb (token longo)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AmazonConfig = typeof amazonConfig.$inferSelect;
export type InsertAmazonConfig = typeof amazonConfig.$inferInsert;

// Configurações do Magazine Luiza Afiliados
export const magazineLuizaConfig = mysqlTable("magazine_luiza_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tag: varchar("tag", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MagazineLuizaConfig = typeof magazineLuizaConfig.$inferSelect;
export type InsertMagazineLuizaConfig = typeof magazineLuizaConfig.$inferInsert;

// Configurações do AliExpress Afiliados
export const aliexpressConfig = mysqlTable("aliexpress_config", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  trackId: varchar("trackId", { length: 255 }),
  cookie: text("cookie"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AliexpressConfig = typeof aliexpressConfig.$inferSelect;
export type InsertAliexpressConfig = typeof aliexpressConfig.$inferInsert;

// Configurações globais do bot
export const botSettings = mysqlTable("bot_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Agendamento
  scheduleEnabled: boolean("scheduleEnabled").default(false).notNull(),
  scheduleWindows: json("scheduleWindows"),  // [{start: "08:00", end: "22:00"}]
  // Delay entre postagens
  delayMinutes: int("delayMinutes").default(0).notNull(),
  delayPerGroup: boolean("delayPerGroup").default(false).notNull(),
  delayGlobal: boolean("delayGlobal").default(false).notNull(),
  // Link do grupo
  includeGroupLink: boolean("includeGroupLink").default(false).notNull(),
  // Feed Global
  feedGlobalEnabled: boolean("feedGlobalEnabled").default(false).notNull(),
  feedGlobalTargets: json("feedGlobalTargets"),  // array de groupIds alvo
  // Preview Clicável
  clickablePreview: boolean("clickablePreview").default(false).notNull(),
  // Ordem do link
  linkOrder: mysqlEnum("linkOrder", ["first", "last"]).default("first").notNull(),
  // Comandos do bot
  cmdStickerEnabled: boolean("cmdStickerEnabled").default(false).notNull(),
  cmdDeleteLinksEnabled: boolean("cmdDeleteLinksEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = typeof botSettings.$inferInsert;

// ── Assinaturas ───────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["trial", "basic", "premium"]).default("trial").notNull(),
  // basic = R$50/mês com anúncios, premium = R$100/mês sem anúncios
  status: mysqlEnum("status", ["trial", "active", "expired", "cancelled"]).default("trial").notNull(),
  hasAds: boolean("hasAds").default(true).notNull(), // true = plano com anúncios
  trialEndsAt: timestamp("trialEndsAt"),   // 60 min após criação da conta
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),   // data de vencimento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ── Pagamentos PIX ────────────────────────────────────────────────────────
export const pixPayments = mysqlTable("pix_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["basic", "premium"]).notNull(),
  // basic = R$50, premium = R$100
  amount: int("amount").notNull(), // em centavos: 5000 ou 10000
  pixKey: varchar("pixKey", { length: 255 }).notNull(),
  txid: varchar("txid", { length: 64 }).notNull().unique(), // ID único da transação
  qrCodePayload: text("qrCodePayload"), // string EMV (Copia e Cola)
  qrCodeImage: text("qrCodeImage"),    // base64 do QR Code
  status: mysqlEnum("status", ["pending", "paid", "expired", "cancelled"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt"),   // PIX expira em 30 min
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PixPayment = typeof pixPayments.$inferSelect;
export type InsertPixPayment = typeof pixPayments.$inferInsert;
