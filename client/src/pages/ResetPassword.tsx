import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Extract token from URL query string
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/login"), 2000);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao redefinir senha");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    resetMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Link inválido</h2>
            <p className="text-gray-400 text-sm">
              Este link de redefinição de senha é inválido ou expirou.
            </p>
            <Link href="/forgot-password">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                Solicitar novo link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {!success ? (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">Redefinir senha</CardTitle>
                <CardDescription className="text-gray-400">
                  Escolha uma nova senha para sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                      Nova senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11 pr-10"
                        autoComplete="new-password"
                        disabled={resetMutation.isPending}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                      Confirmar nova senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11"
                      autoComplete="new-password"
                      disabled={resetMutation.isPending}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resetMutation.isPending}
                    className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200"
                  >
                    {resetMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redefinindo...</>
                    ) : (
                      "Redefinir senha"
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Senha redefinida!</h2>
              <p className="text-gray-400 text-sm">
                Sua senha foi alterada com sucesso. Redirecionando para o login...
              </p>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  Ir para o login
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2025 AutoAfiliado. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
