import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Conta criada com sucesso! Bem-vindo ao AutoAfiliado!");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar conta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
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
    registerMutation.mutate({ name, email, password });
  };

  const benefits = [
    "7 dias de teste grátis",
    "Sem cartão de crédito",
    "Suporte via WhatsApp",
  ];

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

        {/* Benefits */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">Criar conta grátis</CardTitle>
            <CardDescription className="text-gray-400">
              Comece a automatizar seus links de afiliado hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300 text-sm font-medium">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11"
                  autoComplete="name"
                  disabled={registerMutation.isPending}
                />
              </div>

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
                  disabled={registerMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                  Senha
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
                    disabled={registerMutation.isPending}
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
                  Confirmar senha
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11"
                  autoComplete="new-password"
                  disabled={registerMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200 mt-2"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</>
                ) : (
                  "Criar conta grátis"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Ao criar uma conta, você concorda com nossos{" "}
                <span className="text-gray-400">Termos de Uso</span> e{" "}
                <span className="text-gray-400">Política de Privacidade</span>.
              </p>
            </form>

            <div className="mt-6 text-center border-t border-white/10 pt-4">
              <p className="text-gray-400 text-sm">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
                  Fazer login
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
