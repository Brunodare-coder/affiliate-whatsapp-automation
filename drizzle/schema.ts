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
  targetJid: varchar("targetJid", { length: 255 }).notNull(),
  targetName: varchar("targetName", { length: 255 }),
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
