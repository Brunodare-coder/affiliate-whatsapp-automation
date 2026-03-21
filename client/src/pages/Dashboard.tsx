import AppLayout from "@/components/AppLayout";
import MercadoLivreConfigModal from "@/components/MercadoLivreConfigModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Eye,
  Link2,
  Loader2,
  MessageSquarePlus,
  Send,
  Settings,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();
  const { data: automations } = trpc.automations.list.useQuery();
  const { data: recentLogs } = trpc.logs.list.useQuery({ limit: 3, offset: 0 });
  const { data: stats } = trpc.logs.stats.useQuery();
  const { data: mlConfig } = trpc.mercadoLivre.getConfig.useQuery();
  const [showMlModal, setShowMlModal] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const connectedInstance = instances?.find((i) => i.status === "connected");
  const isOnline = !!connectedInstance;
  const hasAffiliate = !!(mlConfig?.tag || (campaigns && campaigns.length > 0));
  const hasGroups = !!(automations && automations.length > 0);
  const activeAutomations = automations?.filter((a) => a.isActive) || [];

  // Determine step completion
  const step1Done = hasAffiliate;
  const step2Done = isOnline;
  const step3Done = hasGroups;
  const step4Done = step1Done && step2Done && step3Done && activeAutomations.length > 0;

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 md:p-6 space-y-3 max-w-3xl mx-auto">

        {/* STATUS DO BOT */}
        <Link href="/whatsapp">
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Status do Bot</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-muted-foreground"}`}
                  />
                  <span className={`font-bold text-base ${isOnline ? "text-green-400" : "text-foreground"}`}>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  {isOnline && connectedInstance && (
                    <span className="text-xs text-muted-foreground">— {connectedInstance.name}</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>

        {/* ATIVIDADE — Logs de Envio */}
        <Link href="/logs">
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Atividade</p>
                <p className="font-bold text-base">Logs de Envio</p>
                {stats && (
                  <p className="text-xs text-muted-foreground">
                    {stats.total} processados · {stats.sent} enviados · {stats.linksReplaced} links substituídos
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>

        {/* CONEXÃO WHATSAPP */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <p className="font-bold text-base">Conexão WhatsApp</p>
          </div>
          <div className="p-4">
            {!instances || instances.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Nenhum número conectado ainda.</p>
                <Button asChild className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold">
                  <Link href="/whatsapp">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Conectar WhatsApp
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {instances.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          inst.status === "connected"
                            ? "bg-green-400"
                            : inst.status === "qr_pending" || inst.status === "connecting"
                            ? "bg-yellow-400 animate-pulse"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">{inst.name}</span>
                      {inst.phoneNumber && (
                        <span className="text-xs text-muted-foreground">{inst.phoneNumber}</span>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        inst.status === "connected"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : inst.status === "qr_pending"
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : ""
                      }`}
                    >
                      {inst.status === "connected"
                        ? "Conectado"
                        : inst.status === "qr_pending"
                        ? "QR Pendente"
                        : inst.status === "connecting"
                        ? "Conectando"
                        : "Desconectado"}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" asChild className="w-full border-border">
                  <Link href="/whatsapp">
                    <Settings className="w-3.5 h-3.5 mr-2" />
                    Gerenciar conexões
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* GUIA DE 4 PASSOS */}
        {showGuide && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">Configure em 4 passos simples</p>
                  <p className="text-xs text-muted-foreground">
                    O bot converte links em links de afiliado e dispara automaticamente nos seus grupos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-border">
              {/* Step 1 */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {step1Done ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">1</span>
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm">Configurar Afiliados</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Insira suas credenciais de pelo menos uma loja (Shopee, ML, Amazon...).
                </p>
                {step1Done ? (
                  <p className="text-xs font-semibold text-green-400">Configurado</p>
                ) : (
                  <button
                    onClick={() => setShowMlModal(true)}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Configurar agora →
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {step2Done ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">2</span>
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm">Conectar WhatsApp</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Escaneie o QR Code ou use o código de pareamento para vincular seu número.
                </p>
                {step2Done ? (
                  <p className="text-xs font-semibold text-green-400">Conectado</p>
                ) : (
                  <Link href="/whatsapp" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Conecte seu WhatsApp acima →
                  </Link>
                )}
              </div>

              {/* Step 3 */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {step3Done ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">3</span>
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm">Adicionar Grupos</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Precisa de 1 grupo <strong>Buscar Ofertas</strong> + 1 <strong>Enviar Ofertas</strong>, ou ative o Feed Global com grupos alvo configurados.
                </p>
                {step3Done ? (
                  <p className="text-xs font-semibold text-green-400">{automations?.length} automação(ões) ativa(s)</p>
                ) : (
                  <Link href="/automations" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Precisa de 1 grupo Buscar Ofertas + 1 Enviar Ofertas →
                  </Link>
                )}
              </div>

              {/* Step 4 */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {step4Done ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">4</span>
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm">Bot no Ar!</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Com tudo configurado, o bot já funciona. Ajuste agendamento e delay quando quiser.
                </p>
                {step4Done ? (
                  <p className="text-xs font-semibold text-green-400">Funcionando!</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Aguardando passos anteriores</p>
                )}
              </div>
            </div>

            {/* How it works toggle */}
            <div className="border-t border-border">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {showHowItWorks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Como o bot funciona?
              </button>
              {showHowItWorks && (
                <div className="px-4 pb-4 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                  <p>1. O bot monitora os grupos de <strong className="text-foreground">Buscar Ofertas</strong> que você configurar.</p>
                  <p>2. Quando alguém posta um link de produto (ML, Amazon, Shopee...), o bot detecta automaticamente.</p>
                  <p>3. O link é substituído pelo seu link de afiliado com sua tag de rastreamento.</p>
                  <p>4. O post modificado é reenviado para os grupos de <strong className="text-foreground">Enviar Ofertas</strong> configurados.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AÇÕES RÁPIDAS — DISPARO */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Disparo</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Configurar Ofertas */}
            <Link href="/automations">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/30 transition-colors">
                  <Settings className="w-5 h-5 text-pink-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Configurar Ofertas</p>
                  <p className="text-xs text-muted-foreground truncate">Monitorar + grupos de disparo</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>

            {/* Envio Manual */}
            <Link href="/campaigns">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                  <Link2 className="w-5 h-5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Envio Manual</p>
                  <p className="text-xs text-muted-foreground truncate">Cole um link e envie já com su...</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>

            {/* Envio em Massa */}
            <Link href="/groups">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Envio em Massa</p>
                  <p className="text-xs text-muted-foreground truncate">Texto e/ou foto para grupos</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>

            {/* Postar no Status */}
            <Link href="/logs">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                  <Eye className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Postar no Status</p>
                  <p className="text-xs text-muted-foreground truncate">Postar ofertas no seu Status</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>
          </div>
        </div>

        {/* Mercado Livre config banner (se não configurado) */}
        {!mlConfig?.tag && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-300">
                Configure sua <strong>Tag do Mercado Livre</strong> para substituir links ML automaticamente.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowMlModal(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold flex-shrink-0 ml-3"
            >
              Configurar
            </Button>
          </div>
        )}

        {mlConfig?.tag && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">
                Mercado Livre configurado — Tag: <strong>{mlConfig.tag}</strong>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMlModal(true)}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 flex-shrink-0 ml-3"
            >
              <Settings className="w-3 h-3 mr-1" /> Editar
            </Button>
          </div>
        )}

      </div>

      <MercadoLivreConfigModal open={showMlModal} onClose={() => setShowMlModal(false)} />
    </AppLayout>
  );
}
