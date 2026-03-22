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
