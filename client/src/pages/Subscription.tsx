import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, Copy, CreditCard, Loader2, RefreshCw, Shield, XCircle, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function trialCountdown(trialEndsAt: Date | string | null | undefined) {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

// ── PIX Modal ─────────────────────────────────────────────────────────────
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
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const confirmMutation = trpc.subscription.confirmPayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setConfirmed(true);
        toast.success("Pagamento confirmado! Plano ativado com sucesso.");
        setTimeout(() => onConfirmed(), 2000);
      }
    },
    onError: (err) => {
      toast.error("Erro ao confirmar: " + err.message);
    },
  });

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        clearInterval(interval);
        return;
      }
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

  function handleConfirm() {
    confirmMutation.mutate({ txid });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">Pagar com PIX</h2>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xl leading-none">×</button>
          </div>
          <p className="text-sm text-white/50 mt-1">
            Plano {plan === "basic" ? "Com Anúncios" : "Sem Anúncios"} — R$ {amount.toFixed(2)}/mês
          </p>
        </div>

        <div className="p-5 space-y-4">
          {confirmed ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">Pagamento Confirmado!</h3>
              <p className="text-white/60 mt-2">Seu plano foi ativado com sucesso.</p>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl">
                  <img
                    src={qrCodeImage.startsWith("data:") ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-white/60">Expira em:</span>
                <span className={`font-mono font-bold ${timeLeft === "Expirado" ? "text-red-400" : "text-yellow-400"}`}>
                  {timeLeft}
                </span>
              </div>

              {/* Copia e Cola */}
              <div className="space-y-2">
                <p className="text-xs text-white/50 text-center">ou use o código Copia e Cola:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={qrCodePayload}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 font-mono truncate"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyPix}
                    className="flex-shrink-0 border-white/20 text-white/70 hover:text-white"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-3 text-xs text-blue-300 space-y-1">
                <p className="font-semibold text-blue-200">Como pagar:</p>
                <p>1. Abra o app do seu banco</p>
                <p>2. Escolha pagar com PIX → QR Code ou Copia e Cola</p>
                <p>3. Após pagar, clique em "Já Paguei" abaixo</p>
              </div>

              {/* Confirm button */}
              <Button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                {confirmMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verificando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Já Paguei</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Subscription() {
  const utils = trpc.useUtils();
  const [pixData, setPixData] = useState<{
    txid: string;
    qrCodeImage: string;
    qrCodePayload: string;
    amount: number;
    plan: "basic" | "premium";
    expiresAt: Date;
  } | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sub, isLoading, refetch } = trpc.subscription.get.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const createPaymentMutation = trpc.subscription.createPayment.useMutation({
    onSuccess: (data) => {
      setPixData({
        txid: data.txid,
        qrCodeImage: data.qrCodeImage,
        qrCodePayload: data.qrCodePayload,
        amount: data.amount,
        plan: data.plan,
        expiresAt: new Date(data.expiresAt),
      });
    },
    onError: (err) => {
      toast.error("Erro ao gerar PIX: " + err.message);
    },
  });

  // Trial countdown
  useEffect(() => {
    if (sub?.status === "trial" && sub.trialEndsAt) {
      timerRef.current = setInterval(() => {
        setCountdown(trialCountdown(sub.trialEndsAt));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sub?.status, sub?.trialEndsAt]);

  function handleChoosePlan(plan: "basic" | "premium") {
    createPaymentMutation.mutate({ plan });
  }

  function handlePaymentConfirmed() {
    setPixData(null);
    refetch();
    utils.subscription.get.invalidate();
  }

  const isActive = sub?.isActive;
  const isExpired = sub?.status === "expired";
  const isTrial = sub?.status === "trial";

  return (
    <AppLayout title="Assinatura">
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu plano e pagamentos</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Subscription Card */}
            <div className="relative rounded-2xl overflow-hidden p-6"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    {isTrial ? "Período de Teste" : sub?.plan === "premium" ? "Assinatura Premium" : "Assinatura Basic"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/30 text-green-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        {isTrial ? "Trial Ativo" : "Ativa"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500/30 text-red-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        {isExpired ? "Expirada" : "Inativa"}
                      </span>
                    )}
                    {isTrial && sub?.trialEndsAt && (
                      <span className="text-white/70 text-xs">
                        {isActive ? `Expira em: ${countdown || trialCountdown(sub.trialEndsAt)}` : "Trial expirado"}
                      </span>
                    )}
                    {!isTrial && sub?.currentPeriodEnd && (
                      <span className="text-white/70 text-xs">
                        Venc: {formatDate(sub.currentPeriodEnd)}
                      </span>
                    )}
                  </div>

                  {/* Info sobre anúncios */}
                  {isActive && !isTrial && (
                    <p className="text-white/60 text-xs mt-2 flex items-center gap-1">
                      <span>ⓘ</span>
                      {sub?.hasAds ? 'O que significa "com anúncios"?' : "Plano sem anúncios ativo"}
                    </p>
                  )}
                </div>
              </div>

              {/* Plan buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChoosePlan("basic")}
                  disabled={createPaymentMutation.isPending}
                  className="flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-white/20 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  R$ 50/mês - Com anúncios
                </button>
                <button
                  onClick={() => handleChoosePlan("premium")}
                  disabled={createPaymentMutation.isPending}
                  className="flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-white/20 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {createPaymentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  R$ 100/mês - Sem anúncios
                </button>
              </div>
            </div>

            {/* Plan comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Basic */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-foreground">Plano Basic</h3>
                </div>
                <p className="text-2xl font-bold text-blue-400">R$ 50<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Bot ativo 24/7</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Todas as plataformas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Feed Global</li>
                  <li className="flex items-center gap-2 text-yellow-400/80"><span className="w-4 h-4 flex-shrink-0 text-center text-xs">⚠</span> Links com anúncio do sistema</li>
                </ul>
                <Button
                  onClick={() => handleChoosePlan("basic")}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Assinar Basic
                </Button>
              </div>

              {/* Premium */}
              <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-5 space-y-3 relative">
                <div className="absolute -top-3 right-4">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">RECOMENDADO</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-foreground">Plano Premium</h3>
                </div>
                <p className="text-2xl font-bold text-purple-400">R$ 100<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Bot ativo 24/7</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Todas as plataformas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Feed Global</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> Links sem anúncios</li>
                </ul>
                <Button
                  onClick={() => handleChoosePlan("premium")}
                  disabled={createPaymentMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Assinar Premium
                </Button>
              </div>
            </div>

            {/* What is "with ads"? */}
            <div className="rounded-xl bg-yellow-950/20 border border-yellow-800/30 p-4 text-sm text-yellow-200/80">
              <p className="font-semibold text-yellow-200 mb-1">ⓘ O que significa "com anúncios"?</p>
              <p>No plano Basic, os links compartilhados pelo bot incluem automaticamente um anúncio do sistema ao final da mensagem. No plano Premium, os links são enviados sem nenhum anúncio adicional.</p>
            </div>

            {/* Refresh button */}
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground gap-2">
                <RefreshCw className="w-4 h-4" /> Atualizar status
              </Button>
            </div>
          </>
        )}
      </div>

      {/* PIX Modal */}
      {pixData && (
        <PixModal
          {...pixData}
          onClose={() => setPixData(null)}
          onConfirmed={handlePaymentConfirmed}
        />
      )}
    </AppLayout>
  );
}
