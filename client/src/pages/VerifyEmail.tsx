import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }
    verifyMutation.mutate({ token });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white font-bold text-xl">AutoAfiliado</span>
          </div>
        </div>

        <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-green-400 mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-bold text-white mb-2">Verificando seu e-mail...</h1>
              <p className="text-white/50 text-sm">Aguarde um momento.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">E-mail verificado!</h1>
              <p className="text-white/60 text-sm mb-6">
                Seu endereço de e-mail foi confirmado com sucesso. Você será redirecionado para o dashboard em instantes.
              </p>
              <Link href="/dashboard">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold">
                  Ir para o Dashboard
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">Link inválido</h1>
              <p className="text-white/60 text-sm mb-2">{errorMsg}</p>
              <p className="text-white/40 text-xs mb-6">
                O link pode ter expirado (válido por 24h) ou já ter sido usado.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-white/20 text-white/70 hover:text-white mb-3">
                  Ir para o Dashboard
                </Button>
              </Link>
              <p className="text-white/40 text-xs">
                No dashboard, você pode solicitar um novo e-mail de verificação.
              </p>
            </>
          )}

          {status === "no-token" && (
            <>
              <Mail className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">Link incompleto</h1>
              <p className="text-white/60 text-sm mb-6">
                Este link de verificação está incompleto. Verifique se copiou o link completo do e-mail.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-white/20 text-white/70 hover:text-white">
                  Ir para o Dashboard
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
