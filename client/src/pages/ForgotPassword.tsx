import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSent(true);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao processar solicitação");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Informe seu e-mail");
      return;
    }
    forgotMutation.mutate({ email });
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
          {!sent ? (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Esqueci minha senha</CardTitle>
                <CardDescription className="text-gray-400">
                  Informe seu e-mail e enviaremos as instruções de recuperação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                      E-mail cadastrado
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500/20 h-11"
                      autoComplete="email"
                      disabled={forgotMutation.isPending}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={forgotMutation.isPending}
                    className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200"
                  >
                    {forgotMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                    ) : (
                      "Enviar instruções"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Solicitação enviada!</CardTitle>
                <CardDescription className="text-gray-400">
                  Se o e-mail <strong className="text-gray-300">{email}</strong> estiver cadastrado, você receberá as instruções em breve.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-300">
                  <p className="font-medium mb-1">Como funciona?</p>
                  <p className="text-yellow-300/80">
                    Nossa equipe receberá sua solicitação e entrará em contato com o link de redefinição de senha. 
                    Verifique também seu WhatsApp ou entre em contato pelo suporte.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href="/support">
                    <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:bg-white/5">
                      Falar com o suporte
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full text-gray-400 hover:text-gray-200">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar para o login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2025 AutoAfiliado. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
