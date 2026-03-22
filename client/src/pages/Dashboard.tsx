import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Link2,
  Loader2,
  Mail,
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
      setRemaining(Math.max(0, ts - Date.now()));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [trialEndsAt]);
  const totalSecs = Math.floor(remaining / 1000);
  return { remaining, mins: Math.floor(totalSecs / 60), secs: totalSecs % 60, expired: remaining === 0 };
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: instances } = trpc.whatsapp.listInstances.useQuery(undefined, { refetchInterval: 5000, refetchIntervalInBackground: true });
  const { data: automations } = trpc.automations.list.useQuery();
  const { data: stats } = trpc.logs.stats.useQuery();
  const { data: sub } = trpc.subscription.get.useQuery(undefined, { refetchInterval: 30000 });
  const [showGuide, setShowGuide] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [emailBannerDismissed, setEmailBannerDismissed] = useState(false);

  const resendVerification = trpc.auth.resendVerification.useMutation({
    onSuccess: () => import("sonner").then(({ toast }) => toast.success("E-mail de verificação reenviado!")),
    onError: (e) => import("sonner").then(({ toast }) => toast.error(e.message)),
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

  const stepsCompleted = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  const progressPct = (stepsCompleted / 4) * 100;

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">

        {/* ── BANNER E-MAIL NÃO VERIFICADO ─────────────────────── */}
        {user && !user.emailVerified && !emailBannerDismissed && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-yellow-500/8 border border-yellow-500/25 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4.5 h-4.5 text-yellow-400" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-300">E-mail não verificado</p>
                <p className="text-xs text-yellow-400/70">
                  Verifique <span className="font-medium text-yellow-300">{user.email}</span> para garantir acesso total.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs h-8"
                onClick={() => resendVerification.mutate()}
                disabled={resendVerification.isPending}
              >
                {resendVerification.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                Reenviar
              </Button>
              <button onClick={() => setEmailBannerDismissed(true)} className="text-yellow-400/50 hover:text-yellow-400 transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── BANNER TRIAL / ASSINATURA ─────────────────────────── */}
        {isTrial && !trial.expired && (
          <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border border-blue-500/25 backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, oklch(0.58 0.20 220 / 0.12) 0%, oklch(0.65 0.18 280 / 0.08) 100%)" }}>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(oklch(0.8 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.8 0 0) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4.5 h-4.5 text-blue-400" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-300">Período de Teste Ativo</p>
                <p className="text-xs text-blue-400/70">
                  Tempo restante:{" "}
                  <span className="font-mono font-bold text-blue-300 text-sm">
                    {String(trial.mins).padStart(2, "0")}:{String(trial.secs).padStart(2, "0")}
                  </span>
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="relative bg-blue-500 hover:bg-blue-400 text-white font-semibold flex-shrink-0 ml-3 shadow-lg shadow-blue-500/30 border-0">
              <Link href="/subscription">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Ver Planos
              </Link>
            </Button>
          </div>
        )}

        {isExpired && (
          <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border border-red-500/25 backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 25 / 0.12) 0%, oklch(0.55 0.22 25 / 0.06) 100%)" }}>
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-red-400" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-300">Período de Teste Expirado</p>
                <p className="text-xs text-red-400/70">Assine agora para continuar usando o bot.</p>
              </div>
            </div>
            <Button asChild size="sm" className="relative bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-bold flex-shrink-0 ml-3 shadow-lg shadow-red-500/30 border-0">
              <Link href="/subscription">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Assinar Agora
              </Link>
            </Button>
          </div>
        )}

        {sub?.isActive && !isTrial && (
          <div className="relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border border-green-500/20 backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 145 / 0.10) 0%, oklch(0.58 0.20 220 / 0.06) 100%)" }}>
            <div className="relative flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-400" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-300">
                  Assinatura {sub.plan === "premium" ? "Premium" : "Basic"} Ativa
                  {sub.hasAds && <span className="ml-1.5 text-xs text-green-400/60 font-normal">(com anúncios)</span>}
                </p>
                {sub.currentPeriodEnd && (
                  <p className="text-xs text-green-400/60">Vence em {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}</p>
                )}
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="relative border-green-500/25 text-green-400 hover:bg-green-500/10 flex-shrink-0 ml-3">
              <Link href="/subscription">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Gerenciar
              </Link>
            </Button>
          </div>
        )}

        {/* ── STATS ROW ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Links Substituídos",
              value: stats?.linksReplaced ?? 0,
              icon: Link2,
              color: "text-green-400",
              bg: "bg-green-500/10",
              border: "border-green-500/15",
            },
            {
              label: "Posts Processados",
              value: stats?.total ?? 0,
              icon: BarChart3,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/15",
            },
            {
              label: "Enviados",
              value: stats?.sent ?? 0,
              icon: Zap,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              border: "border-purple-500/15",
            },
            {
              label: "Automações Ativas",
              value: activeAutomations.length,
              icon: Bot,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              border: "border-cyan-500/15",
            },
          ].map((s) => (
            <div key={s.label} className={`stat-card p-4 border ${s.border}`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black section-title ${s.color}`}>{s.value.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── STATUS DO BOT + CONEXÃO ───────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Bot status */}
          <Link href="/whatsapp">
            <div className={`group relative overflow-hidden p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              isOnline
                ? "border-green-500/25 hover:border-green-500/40"
                : "border-white/8 hover:border-white/15"
            }`}
              style={{ background: isOnline
                ? "linear-gradient(135deg, oklch(0.68 0.22 145 / 0.10) 0%, oklch(0.58 0.20 220 / 0.06) 100%)"
                : "oklch(0.12 0.018 250 / 0.8)"
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${isOnline ? "bg-green-500/20" : "bg-white/5"}`}>
                    {isOnline
                      ? <Wifi className="w-6 h-6 text-green-400" />
                      : <WifiOff className="w-6 h-6 text-muted-foreground" />
                    }
                    {isOnline && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background animate-pulse" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Status do Bot</p>
                    <p className={`font-black text-lg section-title ${isOnline ? "text-green-400" : "text-foreground"}`}>
                      {isOnline ? "Online" : "Offline"}
                    </p>
                    {isOnline && connectedInstance && (
                      <p className="text-xs text-muted-foreground">{connectedInstance.name}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </Link>

          {/* Logs activity */}
          <Link href="/logs">
            <div className="group relative overflow-hidden p-5 rounded-2xl border border-white/8 hover:border-blue-500/30 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Atividade</p>
                    <p className="font-black text-lg section-title">Logs de Envio</p>
                    {stats && (
                      <p className="text-xs text-muted-foreground">
                        {stats.total} processados · {stats.sent} enviados
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* ── CONEXÃO WHATSAPP ──────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
          <div className="flex items-center gap-3 p-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Smartphone className="w-4.5 h-4.5 text-white" style={{ width: "18px", height: "18px" }} />
            </div>
            <p className="font-bold text-base section-title">Conexão WhatsApp</p>
          </div>
          <div className="p-4">
            {!instances || instances.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Nenhum número conectado ainda.</p>
                <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/25 border-0">
                  <Link href="/whatsapp">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Conectar WhatsApp
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {instances.map((inst) => (
                  <div key={inst.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        inst.status === "connected" ? "bg-green-400 shadow-sm shadow-green-400/50"
                        : inst.status === "qr_pending" || inst.status === "connecting" ? "bg-yellow-400 animate-pulse"
                        : "bg-muted-foreground"
                      }`} />
                      <span className="text-sm font-semibold">{inst.name}</span>
                      {inst.phoneNumber && <span className="text-xs text-muted-foreground">{inst.phoneNumber}</span>}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      inst.status === "connected" ? "bg-green-500/15 text-green-400"
                      : inst.status === "qr_pending" ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-white/5 text-muted-foreground"
                    }`}>
                      {inst.status === "connected" ? "Conectado"
                        : inst.status === "qr_pending" ? "QR Pendente"
                        : inst.status === "connecting" ? "Conectando"
                        : "Desconectado"}
                    </span>
                  </div>
                ))}
                <Button variant="outline" asChild className="w-full border-white/10 bg-white/3 hover:bg-white/6 text-foreground mt-1">
                  <Link href="/whatsapp">
                    <Settings className="w-3.5 h-3.5 mr-2" />
                    Gerenciar conexões
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── GUIA DE 4 PASSOS ──────────────────────────────────── */}
        {showGuide && (
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400/20 to-blue-500/20 border border-green-500/20 flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-green-400" style={{ width: "18px", height: "18px" }} />
                </div>
                <div>
                  <p className="font-bold text-sm section-title">Configure em 4 passos</p>
                  <p className="text-xs text-muted-foreground">
                    {stepsCompleted}/4 concluídos
                  </p>
                </div>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-4">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Steps grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 p-4 pt-3">
              {[
                { done: step1Done, num: 1, title: "Assinar Plano", desc: "Ative sua assinatura para usar sem limitações.", link: "/subscription", linkLabel: "Ver planos", doneLabel: "Ativo" },
                { done: step2Done, num: 2, title: "Conectar WhatsApp", desc: "Escaneie o QR Code para vincular seu número.", link: "/whatsapp", linkLabel: "Conectar agora", doneLabel: "Conectado" },
                { done: step3Done, num: 3, title: "Configurar Grupos", desc: "1 grupo Buscar Ofertas + 1 Enviar Ofertas.", link: "/groups", linkLabel: "Configurar grupos", doneLabel: `${automations?.length || 0} automação(ões)` },
                { done: step4Done, num: 4, title: "Bot no Ar!", desc: "Com tudo configurado, o bot funciona 24/7.", link: null, linkLabel: null, doneLabel: "Funcionando! 🚀" },
              ].map((step, i) => (
                <div key={i} className={`p-4 space-y-2.5 ${i < 3 ? "border-r border-white/5" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step.done
                      ? "bg-gradient-to-br from-green-400 to-emerald-500 text-black shadow-sm shadow-green-500/30"
                      : "bg-white/8 text-muted-foreground border border-white/10"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>
                  <p className="font-bold text-sm section-title leading-tight">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  {step.done ? (
                    <p className="text-xs font-semibold text-green-400">{step.doneLabel}</p>
                  ) : step.link ? (
                    <Link href={step.link} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                      {step.linkLabel} <ChevronRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aguardando passos anteriores</p>
                  )}
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="border-t border-white/5">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {showHowItWorks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Como o bot funciona?
              </button>
              {showHowItWorks && (
                <div className="px-5 pb-4 text-xs text-muted-foreground space-y-2 leading-relaxed border-t border-white/5 pt-3">
                  {[
                    "O bot monitora os grupos de <strong>Buscar Ofertas</strong> que você configurar.",
                    "Quando alguém posta um link de produto (ML, Amazon, Shopee...), o bot detecta automaticamente.",
                    "O link é substituído pelo seu link de afiliado com sua tag de rastreamento.",
                    "O post modificado é reenviado para os grupos de <strong>Enviar Ofertas</strong> configurados.",
                  ].map((text, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p dangerouslySetInnerHTML={{ __html: text.replace(/<strong>/g, '<strong class="text-foreground font-semibold">') }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AÇÕES RÁPIDAS ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-orange-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ações Rápidas</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/groups", icon: Settings, label: "Configurar Ofertas", desc: "Grupos de monitoramento", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/15", hover: "hover:border-pink-500/30" },
              { href: "/settings", icon: Link2, label: "Envio Manual", desc: "Cole um link e envie já", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/15", hover: "hover:border-orange-500/30" },
              { href: "/settings", icon: Users, label: "Envio em Massa", desc: "Texto/foto para grupos", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/15", hover: "hover:border-green-500/30" },
              { href: "/feed-global", icon: Globe, label: "Feed Global", desc: "Links de todos os usuários", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/15", hover: "hover:border-cyan-500/30" },
            ].map((action) => (
              <Link key={action.href + action.label} href={action.href}>
                <div className={`group flex flex-col gap-3 p-4 rounded-2xl border ${action.border} ${action.hover} transition-all duration-200 hover:-translate-y-0.5 cursor-pointer`}
                  style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm section-title ${action.color}`}>{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
