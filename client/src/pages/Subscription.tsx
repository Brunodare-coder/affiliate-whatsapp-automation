import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, Copy, CreditCard, Loader2, RefreshCw, Shield, Star, XCircle, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function trialCountdown(trialEndsAt: Date | string | null | undefined) {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

interface PixModalProps {
  txid: string;
  qrCodeImage: string;
  qrCodePayload: string;
  amount: number;
  plan: "basic" | "premium";
  expiresAt: Date | string;
  onClose: () => void;
  onConfirmed: () => void;
}

function PixModal({ txid, qrCodeImage, qrCodePayload, amount, plan, expiresAt, onClose, onConfirmed }: PixModalProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const confirmMutation = trpc.subscription.confirmPayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setConfirmed(true);
        toast.success("Pagamento confirmado! Plano ativado com sucesso.");
        setTimeout(() => onConfirmed(), 2000);
      }
    },
    onError: (err) => toast.error("Erro ao confirmar: " + err.message),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expirado"); clearInterval(interval); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  function copyPix() {
    navigator.clipboard.writeText(qrCodePayload);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden" style={{ background: "oklch(0.10 0.018 250)" }}>
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5 text-green-400" style={{ width: "18px", height: "18px" }} />
              </div>
              <div>
                <h2 className="text-base font-bold section-title">Pagar com PIX</h2>
                <p className="text-xs text-muted-foreground">Plano {plan === "basic" ? "Basic" : "Premium"} — R$ {amount.toFixed(2)}/mês</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {confirmed ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold section-title">Pagamento Confirmado!</h3>
              <p className="text-muted-foreground mt-2 text-sm">Seu plano foi ativado com sucesso.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <img
                    src={qrCodeImage.startsWith("data:") ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`}
                    alt="QR Code PIX"
                    className="w-44 h-44"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-muted-foreground">Expira em:</span>
                <span className={`font-mono font-bold ${timeLeft === "Expirado" ? "text-red-400" : "text-yellow-400"}`}>{timeLeft}</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">ou use o código Copia e Cola:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={qrCodePayload}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-muted-foreground font-mono truncate"
                  />
                  <Button size="sm" variant="outline" onClick={copyPix} className="flex-shrink-0 border-white/10 bg-white/5 hover:bg-white/10">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/20 p-3 text-xs text-blue-300/80 space-y-1.5" style={{ background: "oklch(0.58 0.20 220 / 0.06)" }}>
                <p className="font-semibold text-blue-300">Como pagar:</p>
                {["Abra o app do seu banco", "Escolha pagar com PIX → QR Code ou Copia e Cola", "Após pagar, clique em \"Já Paguei\" abaixo"].map((s, i) => (
                  <p key={i}>{i + 1}. {s}</p>
                ))}
              </div>

              <Button
                onClick={() => confirmMutation.mutate({ txid })}
                disabled={confirmMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/25 border-0 h-11"
              >
                {confirmMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verificando...</>
                  : <><CheckCircle2 className="w-4 h-4 mr-2" />Já Paguei</>
                }
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Subscription() {
  const utils = trpc.useUtils();
  const [pixData, setPixData] = useState<{
    txid: string; qrCodeImage: string; qrCodePayload: string;
    amount: number; plan: "basic" | "premium"; expiresAt: Date;
  } | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sub, isLoading, refetch } = trpc.subscription.get.useQuery(undefined, { refetchInterval: 30000 });

  const createPaymentMutation = trpc.subscription.createPayment.useMutation({
    onSuccess: (data) => {
      setPixData({ txid: data.txid, qrCodeImage: data.qrCodeImage, qrCodePayload: data.qrCodePayload, amount: data.amount, plan: data.plan, expiresAt: new Date(data.expiresAt) });
    },
    onError: (err) => toast.error("Erro ao gerar PIX: " + err.message),
  });

  useEffect(() => {
    if (sub?.status === "trial" && sub.trialEndsAt) {
      timerRef.current = setInterval(() => setCountdown(trialCountdown(sub.trialEndsAt)), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sub?.status, sub?.trialEndsAt]);

  const isActive = sub?.isActive;
  const isExpired = sub?.status === "expired";
  const isTrial = sub?.status === "trial";

  const features = [
    "Bot ativo 24/7",
    "Todas as plataformas (ML, Shopee, Amazon, Mag. Luiza, AliExpress)",
    "Feed Global de ofertas",
    "Logs de envio detalhados",
    "Anti-ban com delay humanizado",
  ];

  return (
    <AppLayout title="Assinatura">
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

        {/* Status card */}
        {!isLoading && sub && (
          <div className="relative overflow-hidden rounded-2xl p-6 border"
            style={{
              background: isActive
                ? "linear-gradient(135deg, oklch(0.68 0.22 145 / 0.15) 0%, oklch(0.65 0.18 280 / 0.10) 50%, oklch(0.58 0.20 220 / 0.08) 100%)"
                : "linear-gradient(135deg, oklch(0.55 0.22 25 / 0.12) 0%, oklch(0.55 0.22 25 / 0.06) 100%)",
              borderColor: isActive ? "oklch(0.68 0.22 145 / 0.25)" : "oklch(0.55 0.22 25 / 0.25)",
            }}>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(oklch(0.8 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.8 0 0) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

            <div className="relative flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-green-500/20 border border-green-500/25" : "bg-red-500/20 border border-red-500/25"}`}>
                <Shield className={`w-6 h-6 ${isActive ? "text-green-400" : "text-red-400"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black section-title">
                    {isTrial ? "Período de Teste" : sub.plan === "premium" ? "Plano Premium" : "Plano Basic"}
                  </h2>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {isTrial ? "Trial Ativo" : "Ativa"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 text-xs font-bold px-2.5 py-1 rounded-full border border-red-500/20">
                      <XCircle className="w-3 h-3" />
                      {isExpired ? "Expirada" : "Inativa"}
                    </span>
                  )}
                </div>
                {isTrial && sub.trialEndsAt && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-400" />
                    {isActive ? `Expira em: ` : "Trial expirado"}
                    {isActive && <span className="font-mono font-bold text-yellow-400">{countdown || trialCountdown(sub.trialEndsAt)}</span>}
                  </p>
                )}
                {!isTrial && sub.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-1">Vence em: <strong className="text-foreground">{formatDate(sub.currentPeriodEnd)}</strong></p>
                )}
                {isActive && !isTrial && sub.hasAds && (
                  <p className="text-xs text-yellow-400/70 mt-1.5">⚠ Plano com anúncios ativos</p>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Plan cards */}
        {!isLoading && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Basic */}
            <div className="relative rounded-2xl border border-white/8 overflow-hidden transition-all duration-200 hover:border-blue-500/30 hover:-translate-y-0.5"
              style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold section-title">Plano Basic</h3>
                    <p className="text-xs text-muted-foreground">Com anúncios do sistema</p>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black section-title text-blue-400">R$ 50</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-2.5 text-sm text-yellow-400/80">
                    <span className="w-4 h-4 flex-shrink-0 text-center text-xs">⚠</span>
                    Links com anúncio do sistema
                  </li>
                </ul>
                <Button
                  onClick={() => createPaymentMutation.mutate({ plan: "basic" })}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold border-0 shadow-lg shadow-blue-500/20 h-11"
                >
                  {createPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Assinar Basic — R$ 50/mês
                </Button>
              </div>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border border-purple-500/30 overflow-hidden transition-all duration-200 hover:border-purple-500/50 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.18 280 / 0.12) 0%, oklch(0.58 0.20 220 / 0.08) 100%)" }}>
              {/* Recommended badge */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  RECOMENDADO
                </div>
              </div>
              <div className="p-5 space-y-4 pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold section-title">Plano Premium</h3>
                    <p className="text-xs text-muted-foreground">Sem anúncios — máxima performance</p>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black section-title text-purple-400">R$ 100</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-2.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  <li className="flex items-center gap-2.5 text-sm text-green-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <strong>Links sem nenhum anúncio</strong>
                  </li>
                </ul>
                <Button
                  onClick={() => createPaymentMutation.mutate({ plan: "premium" })}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold border-0 shadow-lg shadow-purple-500/25 h-11"
                >
                  {createPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Assinar Premium — R$ 100/mês
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info box */}
        {!isLoading && (
          <div className="rounded-2xl border border-yellow-500/15 p-4 text-sm" style={{ background: "oklch(0.72 0.18 60 / 0.06)" }}>
            <p className="font-bold text-yellow-300 mb-1.5 flex items-center gap-2">
              <span>ⓘ</span> O que significa "com anúncios"?
            </p>
            <p className="text-muted-foreground leading-relaxed">
              No plano Basic, os links compartilhados pelo bot incluem automaticamente uma mensagem de divulgação do sistema ao final. No plano Premium, os links são enviados sem nenhum texto adicional.
            </p>
          </div>
        )}

        {!isLoading && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground gap-2 hover:text-foreground">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar status
            </Button>
          </div>
        )}
      </div>

      {pixData && (
        <PixModal
          {...pixData}
          onClose={() => setPixData(null)}
          onConfirmed={() => { setPixData(null); refetch(); utils.subscription.get.invalidate(); }}
        />
      )}
    </AppLayout>
  );
}
