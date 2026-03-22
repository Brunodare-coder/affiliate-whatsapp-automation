import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Link2,
  Loader2,
  Mail,
  MessageSquarePlus,
  Send,
  Settings,
  Shield,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

function useTrialCountdown(trialEndsAt: Date | number | null | undefined) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!trialEndsAt) return;
    const update = () => {
      const ts = trialEndsAt instanceof Date ? trialEndsAt.getTime() : (trialEndsAt as number);
      const diff = ts - Date.now();
      setRemaining(Math.max(0, diff));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [trialEndsAt]);

  const totalSecs = Math.floor(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return { remaining, mins, secs, expired: remaining === 0 };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: automations } = trpc.automations.list.useQuery();
  const { data: stats } = trpc.logs.stats.useQuery();
  const { data: sub } = trpc.subscription.get.useQuery(undefined, { refetchInterval: 30000 });
  const [showGuide, setShowGuide] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);

  const resendVerification = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      import("sonner").then(({ toast }) => toast.success("E-mail de verificação reenviado!"));
    },
    onError: (e) => {
      import("sonner").then(({ toast }) => toast.error(e.message));
    },
  });

  const connectedInstance = instances?.find((i) => i.status === "connected");
  const isOnline = !!connectedInstance;
  const hasGroups = !!(automations && automations.length > 0);
  const activeAutomations = automations?.filter((a) => a.isActive) || [];

  const step1Done = !!(sub?.isActive);
  const step2Done = isOnline;
  const step3Done = hasGroups;
  const step4Done = step1Done && step2Done && step3Done && activeAutomations.length > 0;

  const trial = useTrialCountdown(sub?.trialEndsAt);
  const isTrial = sub?.status === "trial";
  const isExpired = sub?.status === "expired" || (!sub?.isActive && trial.expired);

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 md:p-6 space-y-3 max-w-3xl mx-auto">

        {/* BANNER E-MAIL NÃO VERIFICADO */}
        {user && !user.emailVerified && !emailBannerDismissed && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-300">E-mail não verificado</p>
                <p className="text-xs text-yellow-400/80">
                  Verifique seu e-mail <span className="font-medium">{user.email}</span> para garantir acesso total.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs"
                onClick={() => resendVerification.mutate()}
                disabled={resendVerification.isPending}
              >
                {resendVerification.isPending ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Mail className="w-3 h-3 mr-1" />
                )}
                Reenviar
              </Button>
              <button
                onClick={() => setEmailBannerDismissed(true)}
                className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* BANNER TRIAL / ASSINATURA */}
        {isTrial && !trial.expired && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-300">Período de Teste</p>
                <p className="text-xs text-blue-400/80">
                  Tempo restante:{" "}
                  <span className="font-mono font-bold text-blue-300">
                    {String(trial.mins).padStart(2, "0")}:{String(trial.secs).padStart(2, "0")}
                  </span>
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold flex-shrink-0 ml-3">
              <Link href="/subscription">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Assinatura
              </Link>
            </Button>
          </div>
        )}

        {isExpired && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">Período de Teste Expirado</p>
                <p className="text-xs text-red-400/80">Assine para continuar usando o bot.</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-red-500 hover:bg-red-400 text-white font-semibold flex-shrink-0 ml-3">
              <Link href="/subscription">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Assinar Agora
              </Link>
            </Button>
          </div>
        )}

        {sub?.isActive && !isTrial && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-300">
                  Assinatura {sub.plan === "premium" ? "Premium" : "Basic"} Ativa
                  {sub.hasAds && <span className="ml-1 text-xs text-green-400/70">(com anúncios)</span>}
                </p>
                {sub.currentPeriodEnd && (
                  <p className="text-xs text-green-400/70">
                    Vence em {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 flex-shrink-0 ml-3">
              <Link href="/subscription">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Assinatura
              </Link>
            </Button>
          </div>
        )}

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
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-muted-foreground"}`} />
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
                <p className="font-semibold text-sm">Assinar Plano</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ative sua assinatura para usar o bot sem limitações.
                </p>
                {step1Done ? (
                  <p className="text-xs font-semibold text-green-400">Ativo</p>
                ) : (
                  <Link href="/subscription" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Ver planos →
                  </Link>
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
                  Escaneie o QR Code para vincular seu número.
                </p>
                {step2Done ? (
                  <p className="text-xs font-semibold text-green-400">Conectado</p>
                ) : (
                  <Link href="/whatsapp" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Conectar agora →
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
                <p className="font-semibold text-sm">Configurar Grupos</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  1 grupo <strong>Buscar Ofertas</strong> + 1 <strong>Enviar Ofertas</strong>.
                </p>
                {step3Done ? (
                  <p className="text-xs font-semibold text-green-400">{automations?.length} automação(ões)</p>
                ) : (
                  <Link href="/groups" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Configurar grupos →
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
                  Com tudo configurado, o bot já funciona automaticamente.
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
            <Link href="/groups">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/30 transition-colors">
                  <Settings className="w-5 h-5 text-pink-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Configurar Ofertas</p>
                  <p className="text-xs text-muted-foreground truncate">Grupos de monitoramento</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>

            {/* Envio Manual */}
            <Link href="/settings">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                  <Link2 className="w-5 h-5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Envio Manual</p>
                  <p className="text-xs text-muted-foreground truncate">Cole um link e envie já</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>

            {/* Envio em Massa */}
            <Link href="/settings">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Envio em Massa</p>
                  <p className="text-xs text-muted-foreground truncate">Texto/foto para grupos</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>

            {/* Feed Global */}
            <Link href="/feed-global">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Feed Global</p>
                  <p className="text-xs text-muted-foreground truncate">Links de todos os usuários</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
              </div>
            </Link>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
