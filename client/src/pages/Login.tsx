import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Eye, EyeOff, Loader2, MessageSquare } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotHint, setShowForgotHint] = useState(false);

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setErrorMsg(null);
      await utils.auth.me.invalidate();
      navigate("/dashboard");
    },
    onError: (err) => {
      const msg = err.message || "E-mail ou senha incorretos";
      setErrorMsg(msg);
      // If account was created via OAuth, show hint to use forgot password
      if (msg.includes("criada via") || msg.includes("login externo")) {
        setShowForgotHint(true);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowForgotHint(false);
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-shadow">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-white">AutoAfiliado</div>
                <div className="text-xs text-gray-400">Bot de Afiliados para WhatsApp</div>
              </div>
            </div>
          </Link>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">Entrar na sua conta</CardTitle>
            <CardDescription className="text-gray-400">
              Acesse o painel e gerencie suas automações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11"
                  autoComplete="email"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    Senha
                  </Label>
                  <Link href="/forgot-password" className="text-xs text-green-400 hover:text-green-300 transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11 pr-10"
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  <p>{errorMsg}</p>
                  {showForgotHint && (
                    <Link href="/forgot-password" className="mt-2 inline-flex items-center gap-1 text-green-400 hover:text-green-300 font-medium transition-colors">
                      → Definir senha agora
                    </Link>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200 mt-2"
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                  Criar conta grátis
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs flex items-center justify-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Precisa de ajuda?{" "}
                <Link href="/support" className="text-gray-400 hover:text-gray-200 transition-colors">
                  Fale com o suporte
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2025 AutoAfiliado. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
