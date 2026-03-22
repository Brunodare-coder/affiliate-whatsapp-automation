# Affiliate WhatsApp Automation - TODO

## Banco de Dados & Schema
- [x] Tabela de campanhas (campaigns)
- [x] Tabela de links de afiliado (affiliate_links)
- [x] Tabela de instâncias WhatsApp (whatsapp_instances)
- [x] Tabela de grupos monitorados (monitored_groups)
- [x] Tabela de destinos de envio (send_targets)
- [x] Tabela de automações (automations)
- [x] Tabela de logs de posts processados (post_logs)
- [x] Tabela de logs de envio por destino (send_logs)

## Backend - Campanhas & Links
- [x] CRUD de campanhas
- [x] CRUD de links de afiliado por campanha
- [x] Categorização de links por campanha

## Backend - WhatsApp Integration
- [x] Integração com Baileys (conexão WhatsApp Web)
- [x] Gerenciamento de instâncias WhatsApp (QR code, status)
- [x] Monitoramento de grupos específicos
- [x] Detecção de links em mensagens recebidas
- [x] Substituição automática de links por links de afiliado
- [x] Envio automático de posts modificados para destinos configurados
- [x] Suporte a mídia (imagens, vídeos) nos posts

## Backend - LLM & Automação
- [x] Análise de conteúdo de posts com LLM
- [x] Sugestão automática de campanha por tipo de produto
- [x] Sistema de regras de automação configuráveis

## Backend - Logs & Notificações
- [x] Sistema de logs de posts processados
- [x] Histórico de envios por destino
- [x] Notificações ao proprietário (novos posts, erros)

## Frontend - Layout & Design
- [x] Design system dark theme com cores verde/azul (estilo tech/automação)
- [x] AppLayout com sidebar navigation recolhível
- [x] Página Home/Landing com CTA de login

## Frontend - Dashboard
- [x] Dashboard principal com métricas (posts processados, links substituídos, envios)
- [x] Cards de status da conexão WhatsApp
- [x] Atividade recente com links para logs

## Frontend - Campanhas & Links
- [x] Página de listagem de campanhas com cores
- [x] Formulário de criação/edição de campanha
- [x] Gerenciamento de links de afiliado por campanha
- [x] Categorização e palavras-chave para IA

## Frontend - WhatsApp Config
- [x] Página de conexão WhatsApp (QR code scan)
- [x] Gerenciamento de grupos monitorados
- [x] Configuração de destinos de envio (grupos e contatos)
- [x] Configuração de automações com seleção de grupos e destinos

## Frontend - Logs & Histórico
- [x] Página de logs com paginação
- [x] Detalhes de cada post processado (original vs modificado)
- [x] Status de envios por destino
- [x] Estatísticas de performance

## Testes
- [x] Testes unitários para lógica de substituição de links
- [x] Testes para auth.logout

## Integração Mercado Livre Afiliados
- [x] Tabela de configurações ML por usuário (tag, cookie ssid, matt_tool_id, social_tag)
- [x] Procedure para salvar/ler configurações ML
- [x] Lógica de geração de links ML afiliado (substituição de links ML nos posts)
- [x] Modal de configurações ML igual ao ProAfiliados (campos: Tag, Cookie ssid, Matt Tool ID, Tag Perfil Social)
- [x] Botão "Configurar Mercado Livre" no Dashboard/Campanhas
- [x] Indicador de status da integração ML no Dashboard

## Redesign Dashboard (estilo ProAfiliados)
- [x] Card "Status do Bot" com indicador Online/Offline e link para detalhes
- [x] Card "Logs de Envio" com acesso rápido
- [x] Seção "Conexão WhatsApp" com QR code integrado no dashboard
- [x] Guia de 4 passos (Configurar Afiliados → Conectar WhatsApp → Adicionar Grupos → Bot no Ar!)
- [x] Cards de ação rápida: Configurar Ofertas, Envio Manual, Envio em Massa, Postar no Status
- [x] Remover layout antigo de métricas e substituir pelo novo design

## Refatoração Página de Grupos (estilo ProAfiliados)
- [x] Adicionar colunas ao schema: buscarOfertas, espelharConteudo, enviarOfertas, substituirImagem
- [x] Procedure para listar grupos do WhatsApp conectado em tempo real
- [x] Procedure para salvar configuração de flags por grupo
- [x] Procedure para configurar alvos (quais grupos de envio recebem de qual grupo de origem)
- [x] Página de Grupos: lista todos os grupos do WA com toggles por grupo
- [x] Modal "Configurar Alvos" para grupos com Buscar Ofertas ativo
- [x] Atualizar lógica de processamento de mensagens para usar as novas flags

## Correção Fluxo Grupos e Automações
- [x] Grupos: permitir adicionar grupos manualmente (JID ou nome) sem precisar do WA conectado
- [x] Grupos: mostrar grupos salvos no DB mesmo sem WA conectado
- [x] Grupos: botão "Sincronizar do WhatsApp" para puxar grupos quando conectado
- [x] Automações: corrigir seletor de grupo de origem para usar grupos salvos no DB
- [x] Automações: corrigir seletor de destinos para usar grupos com enviarOfertas ativo
- [x] Automações: simplificar formulário de criação

## Correção Sincronização de Grupos WA
- [x] Restaurar instâncias WhatsApp automaticamente no startup do servidor
- [x] Melhorar getGroups com retry (3 tentativas) quando socket não está pronto
- [x] syncGroupsFromWA: reconectar automaticamente se socket perdido após restart
- [x] Melhorar mensagens de erro na sincronização
- [x] Corrigir getGroups no Baileys para buscar grupos da conta conectada
- [x] Melhorar feedback do botão Sincronizar (mostrar quantos grupos encontrados)
- [x] Garantir que grupos sejam carregados após conexão do WA

## Novas Funcionalidades ProAfiliados (Fase 2)

### Credenciais de Afiliados
- [x] Tabela shopee_config (AppID + Senha)
- [x] Tabela amazon_config (Tag + Cookie de sessão)
- [x] Tabela magazine_luiza_config (Tag)
- [x] Tabela aliexpress_config (Track ID + Cookie)
- [x] Procedures CRUD para cada plataforma
- [x] Modais de configuração no frontend

### Configurações Globais do Bot
- [x] Tabela bot_settings (agendamento, delay, link_do_grupo, feed_global, preview_clicavel, ordem_link)
- [x] Procedures para salvar/ler bot_settings
- [x] Modal Agendamento Automático (ligar/desligar por horário)
- [x] Modal Delay entre Postagens (minutos, delay por grupo, delay global)
- [x] Modal Comandos do Bot (!s, !r, !ban, !add)
- [x] Modal Link do Grupo nas Mensagens (toggle incluir link de convite)
- [x] Toggle Feed Global no Dashboard

### Envio Manual e em Massa
- [x] Modal Envio Manual (colar link + enviar com afiliado)
- [x] Modal Envio em Massa (texto/foto para grupos)

### Adicionar Membros
- [x] Modal Adicionar Membros aos Grupos de Disparo
- [x] Carregar membros de grupos selecionados
- [x] Adicionar membros com delay humanizado

### Página de Configurações Completa
- [x] Seção CREDENCIAIS com cards para todas as plataformas
- [x] Seção AUTOMAÇÃO com cards: Agendamento, Delay, Comandos, Figurinhas
- [x] Seção FERRAMENTAS com cards: Indicações, Link do Grupo, Add Membros, Tutoriais
- [x] Feed Global com toggle e grupos alvo
- [x] Preview Clicável toggle

### Correção de Links
- [x] Corrigir substituição de links ML (usar API real de afiliados)
- [x] Implementar substituição de links Shopee via API
- [x] Implementar substituição de links Amazon (tag de afiliado)
- [x] Ordem do link: Primeiro/Último no grupo

## Feed Global (Nova Funcionalidade)
- [x] Schema: tabela global_feed_settings (userId, isActive, targetGroupIds JSON, clickablePreview)
- [x] DB helpers: getGlobalFeedSettings, upsertGlobalFeedSettings
- [x] tRPC procedures: globalFeed.get, globalFeed.save
- [x] Página /feed-global com toggle, lista de grupos alvo (checkboxes) e Preview Clicável
- [x] Integração no processamento: quando Feed Global ativo, replicar mensagens para grupos alvo selecionados
- [x] Adicionar item de menu "Feed Global" no AppLayout

## Redesign Grupos + Credenciais (Fase 3)
- [x] Schema Amazon: adicionar campos ubidAcbbr, atAcbbr, xAcbb (3 cookies separados)
- [x] Migrar banco de dados com novos campos Amazon
- [x] Remover aba Campanhas do menu (AppLayout)
- [x] Redesenhar página de Grupos igual ao ProAfiliados (Buscar Ofertas, Enviar Ofertas, Configurar Alvos modal laranja, Espelhar, Substituir Imagem, Ordem do Link)
- [x] Corrigir modal Amazon: 3 campos de cookie (ubid_acbbr, at_acbbr, x_acbb)
- [x] Corrigir modal Shopee: AppID + Senha com instruções corretas
- [x] Corrigir modal Magazine Luiza: Tag com formato magazinevoce.com.br/SUA_TAG/produto/...

## Logs de Envio (Redesign - Fase 4)
- [x] Schema: tabela send_logs com campos platform, status, targetGroup, messageContent, errorMessage, createdAt
- [x] DB helpers: createSendLog, listSendLogs, getSendLogStats
- [x] tRPC procedures: sendLogs.list, sendLogs.stats
- [x] Integrar createSendLog no fluxo de envio do whatsapp.ts
- [x] Redesenhar página /logs com contadores Total/Sucesso/Erros/Pendente, filtros e cards de log

## Sistema de Assinatura e Pagamento PIX
- [ ] Schema: tabela subscriptions (userId, plan, status, expiresAt, trialEndsAt, hasAds)
- [ ] Schema: tabela pix_payments (id, userId, subscriptionId, amount, pixKey, txid, qrCode, status, paidAt)
- [ ] DB helpers: getSubscription, upsertSubscription, createPixPayment, updatePixPayment
- [ ] Backend: geração de QR Code PIX (EMV/Copia e Cola) com chave CPF 41186875852
- [ ] Backend: procedure subscription.get (retorna status trial/ativo/expirado)
- [ ] Backend: procedure subscription.createPayment (gera PIX para plano escolhido)
- [ ] Backend: procedure subscription.checkPayment (verifica se pagamento foi confirmado)
- [ ] Backend: procedure subscription.activatePlan (ativa plano após pagamento)
- [ ] Trial automático de 60 minutos ao criar conta (campo trialEndsAt no user ou subscriptions)
- [ ] Bloqueio de conectar WhatsApp se trial expirado e sem assinatura ativa
- [ ] Lógica de anúncio automático nos links (plano com anúncios)
- [ ] Página /assinatura com card gradiente roxo/azul igual ao print
- [ ] Modal de pagamento PIX com QR Code, Copia e Cola e timer de expiração
- [ ] Notificação ao owner quando pagamento é confirmado

## Painel Admin
- [ ] Backend: procedure admin.listUsers (listar todos os usuários com status de assinatura)
- [ ] Backend: procedure admin.grantSubscription (ativar plano + N meses para qualquer usuário)
- [ ] Backend: procedure admin.revokeSubscription (cancelar assinatura de qualquer usuário)
- [ ] Página /admin com tabela de usuários, status, plano, vencimento e ações
- [ ] Proteção da rota /admin (somente role=admin)
- [ ] Formulário para selecionar plano e quantidade de meses ao ativar

## Correção Bug Cache instanceId (Fase 35)
- [x] Corrigir invalidateUserCache para usar invalidatePrefix e limpar todas as chaves de grupos (com e sem instanceId)
- [x] Migrar grupos monitorados de instanceId=1 para instanceId=30003 (ID real da instância WhatsApp)
- [x] Confirmar via logs de diagnóstico: 5 grupos com buscarOfertas ativos detectados corretamente

## Melhorias de Layout (Fase 5)
- [x] Dashboard: remover seção "Mercado Livre Configurado" do rodapé
- [x] Dashboard: adicionar banner trial/assinatura no topo com botão "Assinatura"
  - [x] Unificar "Configurar Ofertas" e "Automações" em uma única página
  - [x] Remover aba "Automações" do menu (manter só "Configurar Ofertas")
- [x] Painel Admin: garantir visível só para admins no menu
- [ ] Corrigir duplicações gerais no layout

## Landing Page de Marketing (Fase 6)
- [x] Redesenhar Home.tsx como landing page profissional de marketing
- [x] Hero section com headline impactante, subheadline e CTA principal
- [x] Seção "Como funciona" com 4 passos visuais
- [x] Seção de funcionalidades com cards detalhados (5 plataformas, automação, etc.)
- [x] Seção de planos e preços (Trial grátis, Basic R$50, Premium R$100)
- [x] Seção de depoimentos/prova social
- [x] Seção FAQ
- [x] CTA final com botão de cadastro
- [x] Header com logo, navegação e botão "Entrar"
- [x] Footer com links e informações

## Redesign Premium + Escalabilidade (Fase 7)
- [x] Atualizar index.html com fontes premium (Inter + Space Grotesk)
- [x] Atualizar index.css com animações e efeitos visuais premium
- [x] Redesenhar Home.tsx com layout premium e chamativo
- [x] Sistema de suporte/recuperação de acesso (página /support, procedure support.sendRequest)
- [x] Cache em memória para configs de afiliado (server/cache.ts, TTL por categoria)
- [x] Fila de processamento de mensagens por usuário (enqueueForUser)
- [x] Paralelização de fetch de configs com Promise.all
- [x] Invalidação de cache automática ao salvar configurações

## Auth Própria (Substituir Manus OAuth - Fase 8)
- [ ] Schema: adicionar campos passwordHash, resetToken, resetTokenExpiresAt na tabela users
- [ ] Instalar bcryptjs para hash de senha
- [ ] Criar server/auth.ts com helpers: hashPassword, verifyPassword, createLocalSession
- [ ] Atualizar server/_core/sdk.ts: authenticateRequest usar userId em vez de openId
- [ ] Backend: procedure auth.register (e-mail + senha + nome)
- [ ] Backend: procedure auth.login (e-mail + senha → cookie de sessão)
- [ ] Backend: procedure auth.logout (limpar cookie)
- [ ] Backend: procedure auth.forgotPassword (gerar token + notificar owner)
- [ ] Backend: procedure auth.resetPassword (token + nova senha)
- [ ] Frontend: página /login com formulário e-mail + senha
- [ ] Frontend: página /register com formulário nome + e-mail + senha
- [ ] Frontend: página /forgot-password com formulário de e-mail
- [ ] Frontend: página /reset-password com formulário de nova senha
- [ ] Atualizar const.ts: getLoginUrl() → retornar '/login'
- [ ] Atualizar AppLayout e Home.tsx para usar /login em vez de OAuth URL
- [ ] Remover rota /api/oauth/callback do servidor

## Recuperação de Senha por E-mail + Admin (Fase 9)

- [ ] Definir senha do admin diretamente no banco (solução imediata)
- [ ] Integrar Resend para envio de e-mail de recuperação de senha
- [ ] Criar helper sendPasswordResetEmail no servidor
- [ ] Atualizar procedure forgotPassword para enviar e-mail real
- [ ] Criar painel admin para gerenciar/redefinir senhas de usuários
- [ ] Adicionar procedure admin.setUserPassword no backend

## Melhorias Fase 10

- [x] Configurar RESEND_API_KEY via secrets para envio real de e-mails
- [x] Adicionar troca de senha na página de Configurações do usuário
- [x] Adicionar busca e filtro na tabela de usuários do painel Admin

## Bug Fix

- [x] Corrigir redirecionamento após login (usuário fica na tela de login após clicar em Entrar)

## Pagamento PIX + Verificação de E-mail

- [x] Configurar MERCADOPAGO_ACCESS_TOKEN via secrets
- [x] Instalar SDK mercadopago
- [x] Criar helper mercadopago.ts para gerar QR Code PIX via API MP
- [x] Procedure subscription.createPayment - gera QR Code PIX via MP
- [x] Procedure subscription.confirmPayment - verifica e confirma pagamento
- [x] Webhook /api/webhooks/mercadopago - confirma pagamento automaticamente e ativa plano
- [x] Página /subscription com QR Code, código copia e cola e timer
- [x] Verificação de e-mail no cadastro (token + página /verify-email)
- [x] Procedure auth.verifyEmail e auth.resendVerification
- [x] Notificação ao admin quando novo usuário se cadastra

## Melhorias UX - Fase 11

- [ ] Banner de e-mail não verificado no Dashboard com botão "Reenviar e-mail"
- [ ] Unificar "Configurar Ofertas" e "Automações" em uma única página "/automations"
- [ ] Remover entradas duplicadas do menu lateral no AppLayout

## Melhorias de UX (Fase 10)
- [x] Dashboard: banner de e-mail não verificado com botão "Reenviar" e dismiss
- [x] Unificar páginas "Configurar Ofertas" e "Automações" em abas dentro de /groups
- [x] Remover item "Automações" do menu lateral (AppLayout)
- [x] Redirecionar /automations para /groups automaticamente

## Redesign Completo das Páginas Internas (Fase 10)
- [x] AppLayout: sidebar premium com gradientes e glassmorphism igual à landing page
- [x] Dashboard: cards stat premium, gradientes, tipografia Space Grotesk
- [x] WhatsApp Connect: redesign com visual premium
- [x] Groups/Automações: abas premium, cards de grupo e automação com glassmorphism
- [x] Subscription: redesign com visual premium
- [x] Logs: redesign com visual premium
- [x] Settings: redesign com cards premium e seções bem definidas
- [x] Admin: redesign com stats cards, tabela de usuários premium
- [x] Campaigns: redesign com grid de cards premium
- [x] CampaignDetail: redesign com cards de links premium

## Correções e Investigações (Fase 11)
- [x] Remover card Feed Global duplicado da página de Configurações (já existe página /feed-global)
- [x] Implementar anúncios para plano R$50 (hasAds) no processamento de mensagens
- [x] Verificar substituição de links de afiliado (ML, Amazon, Shopee, Magalu, AliExpress) - funcionando
- [x] Documentar diferença entre Grupos e Automações para o usuário

## Personalização do Anúncio no Admin (Fase 12)
- [x] Schema: tabela system_settings com campo ad_text (texto do anúncio configurável)
- [x] DB helpers: getSystemSetting, upsertSystemSetting
- [x] tRPC procedures: admin.getAdText, admin.saveAdText (protegido por role=admin)
- [x] Painel Admin: seção "Configurações do Anúncio" com textarea + preview + botão salvar
- [x] whatsapp.ts: buscar ad_text do banco em vez de usar texto fixo

## Correção de Links Encurtados (Fase 13)
- [x] Implementar resolução de links encurtados antes da substituição de afiliado
- [x] Suporte a meli.la (Mercado Livre), amzn.to (Amazon), s.shopee.com.br (Shopee), bit.ly, encurtador.com.br
- [x] Testar com exemplos reais: meli.la/1k7ypTV → mercadolivre.com.br + tag MEUTAG123 aplicado corretamente
- [x] Limpar parâmetros de rastreamento de terceiros (matt_word, ref, forceInApp) antes de aplicar o nosso tag

## Formato de Link Social ML (Fase 14)
- [ ] Atualizar replaceMercadoLivreLinks para preservar /social/CODIGO e substituir matt_tool + matt_word pelo do usuário
- [ ] Suporte ao campo mattToolId e mattWord no mlConfig
- [ ] Testar com exemplo: mercadolivre.com.br/social/bq20260201142328?matt_tool=78912023&matt_word=bq20260201142328
- [x] replaceMercadoLivreLinks: substituir matt_tool e matt_word pelo do usuário em links /social/CODIGO
- [x] Verificar e testar expansão de amzn.to + aplicação do tag Amazon (dib, dib_tag, sbo removidos)

## Limpeza de Mensagens (Fase 15)
- [ ] Remover automaticamente links chat.whatsapp.com das mensagens antes de repostar
- [ ] Verificar expansão de meli.la para /social/ vs produto direto
- [ ] Corrigir: remover links chat.whatsapp.com de terceiros mas adicionar o link do grupo configurado pelo usuário
- [ ] Verificar onde o inviteLink do grupo destino é adicionado na mensagem enviada

## Correção Link de Convite e Limpeza de Mensagens (Fase 16)
- [x] Remover links chat.whatsapp.com de terceiros das mensagens antes de repostar
- [x] Verificar expansão de meli.la: confirma que cai em /social/ (correto)
- [x] Schema: adicionar campo inviteLink na tabela monitored_groups
- [x] Migrar banco com ALTER TABLE monitored_groups ADD COLUMN inviteLink
- [x] Procedure updateMonitoredGroup: aceitar campo inviteLink
- [x] UI Grupos: campo de input para link de convite (visível quando enviarOfertas + includeGroupLink ativos)
- [x] whatsapp.ts: adicionar link de convite do grupo destino ao final da mensagem quando includeGroupLink=true

## Simplificação Grupos (Fase 17)
- [x] Remover aba Automações da página Groups.tsx
- [x] Deixar página Grupos sem abas (só os cards de grupo com toggles)
- [x] Processamento continua usando a lógica de Configurar Alvos (group_targets) - sem alteração no backend

## Reorganização Página Configurar Ofertas (Fase 18)
- [x] Corrigir botão Atualizar para recarregar dados corretamente
- [x] Adicionar botão "Desativar Todos" para desligar todos os toggles de uma vez
- [x] Criar filtros visuais: "Todos / Origem (Buscar) / Disparo (Enviar)"
- [x] Badges de Origem/Disparo nos cards de grupo
- [x] Renomear "Configurar Alvos" para "Grupos de Disparo" com texto mais claro
- [x] Modal Grupos de Disparo: explicar claramente origem vs destino

## Melhoria Seção de Ajuda (Fase 19)
- [x] Reescrever seção "Como usar" com fluxo passo a passo visual (Origem → Disparo)

## Auditoria de Isolamento por Usuário (Fase 20)
- [x] Verificar que getMonitoredGroups filtra por userId — OK
- [x] Verificar que getGroupTargets filtra por userId — OK
- [x] Verificar que todas as mutations (add, update, remove) validam que o grupo pertence ao userId — OK
- [x] Confirmar que o modal Grupos de Disparo mostra apenas grupos do usuário logado — OK (query usa ctx.user.id)

## Correção UX Grupos de Disparo (Fase 21)
- [x] Ocultar botão "Grupos de Disparo" em grupos com Enviar Ofertas ativo (grupos de disparo não precisam configurar alvos)
- [x] Mostrar botão "Grupos de Disparo" apenas quando Buscar Ofertas está ativo
- [x] Mostrar info azul "Este grupo recebe ofertas de outros grupos de origem" quando só Enviar Ofertas está ativo

## Imagem + Frase de Marketing (Fase 22)
- [x] Copiar e reenviar imagem do produto original junto com a mensagem
- [x] Gerar frase de marketing com IA (invokeLLM) antes de repostar a oferta
- [x] Toggle "Substituir Imagem" implementado — busca imagem do ML/Amazon quando mensagem não tem imagem
- [x] Toggle "Gerar Frase com IA" adicionado — reescreve texto da oferta com linguagem persuasiva
- [x] Adicionar campo generateMarketing ao schema Zod do updateMonitoredGroup no routers.ts
- [x] Adicionar toggle "Gerar Frase com IA" na UI de grupos (Groups.tsx) com ícone Sparkles
- [x] Atualizar seção "Como usar" com descrição dos novos toggles
- [x] Atualizar botão "Desativar Todos" para incluir generateMarketing

## Preview Frase de IA nos Logs (Fase 23)
- [x] Verificar que llmSuggestion é retornado na query de logs (tRPC)
- [x] Adicionar seção "Frase gerada pela IA" nos cards de log da página /logs
- [x] Exibir llmSuggestion com destaque visual (badge IA + texto em caixa destacada)
- [x] Mostrar o campo apenas quando llmSuggestion não for nulo/vazio
- [x] listSendLogs: JOIN com post_logs para trazer llmSuggestion e originalContent
- [x] Adicionar badge ✨ IA no header do card quando frase foi gerada
- [x] Botão expandir/recolher para ver mensagem original (antes da IA)

## Bug Fix - Feed Global (Fase 24)
- [x] Corrigir botão "Atualizar" da página /feed-global — agora chama syncGroupsFromWA (sincroniza grupos do WhatsApp) em vez de apenas refetchGroups (recarregar banco)

## QR Code WhatsApp mais rápido (Fase 25)
- [x] Investigar gargalo: fetchLatestBaileysVersion() fazia chamada HTTP a cada conexão
- [x] Backend: cache da versão Baileys (6h TTL) + pre-warm no startup + Promise.all para paralelizar auth+version
- [x] Backend: timeouts otimizados (connectTimeoutMs: 20s, keepAliveIntervalMs: 10s)
- [x] Frontend: polling mais agressivo (1.5s no status connecting, 2s no qr_pending)
- [x] Frontend: estado visual "Gerando QR Code..." com spinner enquanto status=connecting

## Bug Fix - QR Code "tenta mais tarde" (Fase 26)
- [ ] Investigar erro "tenta mais tarde" ao escanear QR Code no celular
- [ ] Corrigir versão/configuração do Baileys para aceitar conexão

## Bug Fix - Botão Atualizar QR Code (Fase 26b)
- [x] Adicionado método forceDisconnectForQR no WhatsAppManager (fecha socket sem logout)
- [x] Adicionada procedure refreshQR no tRPC (disconnect + delay 1.5s + reconnect)
- [x] Botão "Atualizar QR" agora chama refreshQR.mutate() em vez de refetch()
- [x] Botão mostra spinner "Gerando novo QR..." enquanto aguarda
- [x] Tela "QR Code não disponível" agora tem botão "Gerar QR" que também chama refreshQR

## Bug Fix - Erro JSON na página /logs (Fase 27)
- [x] Diagnosticado: erro era transitório (502 do proxy durante restart do servidor)
- [x] QueryClient global: retry automático até 3x para erros 502/503/HTML com backoff exponencial
- [x] Query sendLogs.list: retry local específico para erros de HTML/502
- [x] UI: estado de erro amigável "Erro ao carregar logs" com botão "Tentar novamente"

## Bug Fix - Substituição de afiliado ML errada (Fase 28)
- [x] Diagnosticado: replaceMercadoLivreLinks não substituía o pathname /social/OUTRO_USUARIO
- [x] Corrigido: agora substitui urlObj.pathname = /social/${config.socialTag} quando socialTag está configurado
- [x] Testado: link /social/victorhugoborowski → /social/MEUTAG com matt_word e matt_tool corretos
- [x] socialTag já estava no schema e retornado pelo getMercadoLivreConfig

## Melhoria - Status WhatsApp mais rápido (Fase 29)
- [x] AppLayout: query listInstances com refetchInterval 5s em todas as páginas
- [x] Dashboard: refetchInterval 5s adicionado ao listInstances
- [x] Sidebar: badge ON/OFF/... ao lado do item WhatsApp com cores verde/amarelo/vermelho
- [x] Ícone WhatsApp: ponto colorido no canto superior direito do ícone (verde=conectado, amarelo=conectando, vermelho=desconectado)
- [x] Badge pisca em amarelo quando está conectando/aguardando QR

## Melhorias WhatsApp (Fase 30)
- [x] Notificação ao dono via notifyOwner quando WhatsApp desconectar inesperadamente (não em logout manual)
- [x] Auto-reconexão: delay de 30s quando estava conectado, 5s quando ainda estava conectando
- [x] Sidebar: badge mostra ●1234 (últimos 4 dígitos do número) quando conectado
- [x] Sidebar: badge mostra OFF (vermelho) quando desconectado, ... (amarelo) quando conectando

## Bug Fix - Lentidão QR Code e Página WhatsApp (Fase 31)
- [x] Diagnosticado: listInstances retornava qrCode (base64 ~3KB) em TODAS as páginas a cada 5s
- [x] Criada getWhatsappInstancesLight no db.ts: exclui qrCode e sessionData
- [x] listInstances agora usa versão light (rápida) para polling do sidebar/dashboard
- [x] listInstancesFull: nova procedure com qrCode, usada APENAS na página WhatsApp
- [x] WhatsAppConnect: polling adaptativo (2s quando conectando, 5s quando idle)
- [x] getQRCode: já usa memória primeiro (Map<instanceId, qrDataUrl>) - confirma que é rápido

## Origem nos Logs de Envio (Fase 32)
- [x] Adicionado campo source ENUM('bot','global') DEFAULT 'bot' na tabela send_logs
- [x] Backend processAutomation: createSendLog com source='bot'
- [x] Backend dispatchToFeedGlobalSubscribers: agora cria postLog + sendLog com source='global' para cada envio
- [x] Feed Global: logs de envio agora aparecem na página /logs com origem identificada
- [x] UI Logs.tsx: badge azul 'Feed Global' (ícone Globe) e badge roxo 'Bot' (ícone Bot) em cada card

## Bug Fix - Bot não detecta links (Fase 33)
- [x] Diagnosticado: bot recebia mensagens mas nenhum grupo estava configurado com buscarOfertas ativo
- [x] Logs de diagnóstico confirmaram: [Diag][GRUPOS] 0 monitorados | buscarOfertas: 0 ativos

## Logs de Diagnóstico (Fase 33b)
- [x] Criado módulo diagLogger.ts com logs em memória por usuário (200 entradas max)
- [x] Adicionado diagInfo/diagWarn/diagError/diagSuccess no fluxo completo do whatsapp.ts
- [x] Procedure tRPC diag.getLogs e diag.clearLogs adicionadas ao routers.ts
- [x] Página /diagnostico criada com terminal ao vivo, filtros por categoria e auto-scroll
- [x] Item Diagnóstico adicionado na sidebar do AppLayout (badge rosa, ícone Activity)

## Notificação de Envio Bem-Sucedido (Fase 34)
- [x] Backend: procedure sendLogs.latestSent retorna o envio mais recente com status=sent
- [x] AppLayout: polling a cada 3s comparando ID do último envio
- [x] Banner verde animado (slide-in-from-top) no centro do topo da tela
- [x] Mostra: plataforma, grupo destino, prévia do conteúdo (80 chars)
- [x] Auto-fechar após 5 segundos com botão X para fechar manualmente
- [x] Não exibe na primeira carga (só quando chega envio novo após abrir o app)

## Bug Fix - buscarOfertas não reconhecido (Fase 35)
- [ ] Investigar por que grupos com buscarOfertas=true não são reconhecidos pelo bot
- [ ] Corrigir a query de busca de grupos monitorados

## Navegação Rápida (Fase 36)
- [x] Dashboard: adicionar botão/link "Ver Logs" que navega para a página /logs

## Correção Layout Diagnóstico (Fase 37)
- [x] Página /diagnostico: adicionar AppLayout com barra lateral e menus de navegação
