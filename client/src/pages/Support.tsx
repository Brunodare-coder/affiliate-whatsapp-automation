import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ArrowLeft, Mail, MessageSquare, CheckCircle, Zap, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sendSupport = trpc.support.sendRequest.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Tente novamente em alguns instantes.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    sendSupport.mutate({ name: name.trim(), email: email.trim(), message: message.trim() });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AutoAfiliado</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg">
          {!submitted ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 mb-4">
                  <Mail className="w-7 h-7 text-blue-400" />
                </div>
                <h1 className="text-3xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Precisa de ajuda?
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Perdeu o acesso à sua conta ou tem alguma dúvida? Preencha o formulário abaixo e entraremos em contato em até 24 horas.
                </p>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 mb-6">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Sobre recuperação de acesso:</strong> O login é feito via conta Manus. Se você esqueceu sua senha do Manus, acesse{" "}
                  <a href="https://manus.im" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">manus.im</a>{" "}
                  para recuperar. Para outros problemas, use este formulário.
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-6 rounded-2xl border border-white/8 bg-card space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Seu nome</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="João Silva"
                      className="bg-background/50 border-white/10 focus:border-green-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">E-mail da conta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="joao@exemplo.com"
                      className="bg-background/50 border-white/10 focus:border-green-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Descreva o problema</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ex: Não consigo acessar minha conta, perdi acesso ao e-mail cadastrado..."
                      rows={4}
                      className="bg-background/50 border-white/10 focus:border-green-500/50 resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold h-11 shadow-lg shadow-green-500/20 border-0"
                  disabled={sendSupport.isPending}
                >
                  {sendSupport.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Enviar solicitação
                    </span>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Solicitação enviada!
              </h2>
              <p className="text-muted-foreground mb-2">
                Recebemos sua mensagem e entraremos em contato em até <strong className="text-foreground">24 horas</strong>.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Verifique sua caixa de entrada (e spam) para nossa resposta.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline" className="border-white/10 hover:bg-white/5">
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao início
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0">
                  <a href="https://manus.im" target="_blank" rel="noopener noreferrer">
                    <Zap className="w-4 h-4 mr-2" />
                    Acessar Manus
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
