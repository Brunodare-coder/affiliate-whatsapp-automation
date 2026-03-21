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
