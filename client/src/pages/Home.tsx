import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, Bot, Link2, MessageSquare, TrendingUp, Zap } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const features = [
    {
      icon: MessageSquare,
      title: "Monitoramento de Grupos",
      description: "Detecta automaticamente novos posts em grupos do WhatsApp que você configura.",
      color: "text-green-400",
    },
    {
      icon: Link2,
      title: "Substituição de Links",
      description: "Identifica links nos posts e substitui pelos seus links de afiliado automaticamente.",
      color: "text-blue-400",
    },
    {
      icon: Bot,
      title: "IA para Campanhas",
      description: "LLM analisa o conteúdo do post e sugere a melhor campanha de afiliado.",
      color: "text-purple-400",
    },
    {
      icon: Zap,
      title: "Envio Automático",
      description: "Envia os posts modificados para seus grupos e contatos sem intervenção manual.",
      color: "text-yellow-400",
    },
    {
      icon: TrendingUp,
      title: "Dashboard Completo",
      description: "Acompanhe métricas, histórico de posts processados e performance das campanhas.",
      color: "text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">AffiliateBot</span>
          </div>
          <Button asChild>
              <a href={getLoginUrl()}>
              Entrar <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-6">
            <Zap className="w-3 h-3" />
            Automação de Links de Afiliado
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Automatize seus{" "}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              links de afiliado
            </span>{" "}
            no WhatsApp
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Monitore grupos, substitua links automaticamente e compartilhe posts com seus links de afiliado — tudo sem esforço manual.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <a href={getLoginUrl()}>
                Começar agora <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Como funciona</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Uma plataforma completa para gerenciar e automatizar seus links de afiliado no WhatsApp.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <feature.icon className={`w-8 h-8 mb-4 ${feature.color}`} />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-8">
            Faça login e configure suas campanhas em minutos.
          </p>
          <Button size="lg" asChild>
            <a href={getLoginUrl()}>
              Acessar plataforma <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container text-center text-muted-foreground text-sm">
          AffiliateBot — Automação de links de afiliado para WhatsApp
        </div>
      </footer>
    </div>
  );
}
