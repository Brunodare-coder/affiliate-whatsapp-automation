import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Crown,
  Link2,
  MessageSquare,
  Play,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  ShoppingBag,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const platforms = [
    { name: "Mercado Livre", color: "bg-yellow-400", textColor: "text-yellow-900", emoji: "🛒" },
    { name: "Shopee", color: "bg-orange-500", textColor: "text-white", emoji: "🧡" },
    { name: "Amazon", color: "bg-amber-500", textColor: "text-white", emoji: "📦" },
    { name: "Magazine Luiza", color: "bg-blue-600", textColor: "text-white", emoji: "💙" },
    { name: "AliExpress", color: "bg-red-500", textColor: "text-white", emoji: "🔴" },
  ];

  const features = [
    {
      icon: Search,
      title: "Monitoramento Automático",
      description: "O bot monitora seus grupos do WhatsApp 24/7 e detecta qualquer link de produto postado, sem perder nenhuma oferta.",
      color: "bg-green-500/20 text-green-400",
    },
    {
      icon: RefreshCw,
      title: "Substituição Instantânea",
      description: "Cada link detectado é substituído automaticamente pelo seu link de afiliado com sua tag de rastreamento personalizada.",
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      icon: Send,
      title: "Disparo Automático",
      description: "O post modificado é reenviado para todos os seus grupos de destino configurados, com delay humanizado para evitar bloqueios.",
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      icon: ShoppingBag,
      title: "5 Plataformas Suportadas",
      description: "Mercado Livre, Shopee, Amazon, Magazine Luiza e AliExpress — todas as principais lojas do Brasil em um só lugar.",
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      icon: Bot,
      title: "Feed Global de Ofertas",
      description: "Receba links de afiliado detectados em grupos de outros usuários da plataforma e multiplique suas oportunidades de ganho.",
      color: "bg-cyan-500/20 text-cyan-400",
    },
    {
      icon: TrendingUp,
      title: "Logs e Relatórios",
      description: "Acompanhe em tempo real quantos links foram substituídos, enviados e quais grupos geraram mais atividade.",
      color: "bg-pink-500/20 text-pink-400",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: Smartphone,
      title: "Conecte seu WhatsApp",
      description: "Escaneie o QR Code para vincular seu número ao bot. Leva menos de 1 minuto.",
    },
    {
      number: "02",
      icon: Settings,
      title: "Configure seus afiliados",
      description: "Insira suas credenciais de afiliado de cada plataforma (tag, AppID, cookies).",
    },
    {
      number: "03",
      icon: Users,
      title: "Selecione os grupos",
      description: "Escolha quais grupos monitorar (Buscar Ofertas) e para onde enviar (Enviar Ofertas).",
    },
    {
      number: "04",
      icon: Zap,
      title: "Bot no ar!",
      description: "Pronto. O bot trabalha por você 24 horas por dia, 7 dias por semana.",
    },
  ];

  const testimonials = [
    {
      name: "Carlos M.",
      role: "Afiliado há 2 anos",
      text: "Antes eu perdia horas copiando e colando links. Agora o bot faz tudo automaticamente. Minha renda de afiliado triplicou em 3 meses.",
      stars: 5,
    },
    {
      name: "Ana P.",
      role: "Criadora de grupos de ofertas",
      text: "Tenho 12 grupos de WhatsApp com mais de 50 mil membros. Sem o AutoAfiliado seria impossível gerenciar tudo isso. Ferramenta indispensável!",
      stars: 5,
    },
    {
      name: "Roberto S.",
      role: "Influencer de e-commerce",
      text: "O Feed Global é incrível. Recebo ofertas de outros usuários e ainda ganho comissão em cima. Isso não existe em nenhuma outra ferramenta.",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "Preciso deixar o computador ligado para o bot funcionar?",
      a: "Não. O bot roda em nossos servidores na nuvem. Basta conectar seu WhatsApp uma vez e ele funciona 24/7, mesmo com seu celular desligado.",
    },
    {
      q: "Minha conta do WhatsApp pode ser banida?",
      a: "O bot usa delay humanizado entre envios e respeita os limites do WhatsApp. Recomendamos usar um número dedicado para o bot, não seu número pessoal principal.",
    },
    {
      q: "Quais plataformas de afiliado são suportadas?",
      a: "Atualmente suportamos Mercado Livre, Shopee, Amazon, Magazine Luiza e AliExpress. Novas plataformas são adicionadas regularmente.",
    },
    {
      q: "Como funciona o período de teste?",
      a: "Ao criar sua conta, você recebe 60 minutos gratuitos para testar todas as funcionalidades sem precisar inserir cartão de crédito.",
    },
    {
      q: "Qual a diferença entre o plano Basic e Premium?",
      a: "O plano Basic (R$50/mês) inclui todas as funcionalidades, mas adiciona uma mensagem de divulgação da plataforma ao final dos posts. O plano Premium (R$100/mês) remove completamente esses anúncios.",
    },
    {
      q: "Como é feito o pagamento?",
      a: "Aceitamos pagamento via PIX. Após confirmar o pagamento, sua assinatura é ativada imediatamente pelo administrador.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/90">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AutoAfiliado</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <a href={getLoginUrl()}>Entrar</a>
            </Button>
            <Button size="sm" asChild className="bg-green-500 hover:bg-green-400 text-black font-semibold shadow-lg shadow-green-500/20">
              <a href={getLoginUrl()}>
                Começar grátis
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-medium mb-8">
            <Zap className="w-3 h-3" />
            Automação de Afiliados para WhatsApp
            <span className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">NOVO</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            Transforme grupos de WhatsApp em{" "}
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              máquinas de afiliado
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            O bot monitora seus grupos, detecta links de produtos, substitui pelos seus links de afiliado e reenvia automaticamente — tudo sem você tocar no celular.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-green-500 hover:bg-green-400 text-black font-bold text-base px-8 shadow-xl shadow-green-500/25">
              <a href={getLoginUrl()}>
                Testar 60 minutos grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border text-foreground font-semibold text-base px-8">
              <a href="#como-funciona">
                <Play className="w-4 h-4 mr-2 text-green-400" />
                Ver como funciona
              </a>
            </Button>
          </div>

          {/* Plataformas suportadas */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Suporta:</span>
            {platforms.map((p) => (
              <span
                key={p.name}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${p.color} ${p.textColor}`}
              >
                {p.emoji} {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Hero mockup card */}
        <div className="max-w-2xl mx-auto mt-16 relative">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Bot Online — 3 grupos monitorados
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3 text-sm font-mono">
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground text-xs mt-0.5 w-16 flex-shrink-0">10:42:01</span>
                <div className="flex-1">
                  <span className="text-yellow-400">🔍 Link detectado</span>
                  <span className="text-muted-foreground"> em "Grupo Ofertas BR"</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground text-xs mt-0.5 w-16 flex-shrink-0">10:42:01</span>
                <div className="flex-1">
                  <span className="text-blue-400">🔄 Substituindo</span>
                  <span className="text-muted-foreground"> mercadolivre.com.br/produto → </span>
                  <span className="text-green-400">link afiliado ✓</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground text-xs mt-0.5 w-16 flex-shrink-0">10:42:03</span>
                <div className="flex-1">
                  <span className="text-green-400">✅ Enviado</span>
                  <span className="text-muted-foreground"> para 4 grupos de destino</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground text-xs mt-0.5 w-16 flex-shrink-0">10:43:17</span>
                <div className="flex-1">
                  <span className="text-orange-400">🧡 Link Shopee</span>
                  <span className="text-muted-foreground"> detectado → substituído → enviado</span>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <span className="text-muted-foreground text-xs mt-0.5 w-16 flex-shrink-0">10:44:02</span>
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-muted-foreground">Aguardando próxima mensagem</span>
                  <span className="inline-block w-1.5 h-3.5 bg-muted-foreground/60 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          </div>
          {/* Glow under card */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-green-500/20 blur-xl rounded-full" />
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary mb-4">Como funciona</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Configure em 4 passos simples</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Em menos de 10 minutos seu bot já estará funcionando e gerando comissões para você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+12px)] w-[calc(100%-24px)] h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-3xl font-black text-muted-foreground/20">{step.number}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa para escalar</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa para quem leva afiliados a sério.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Extra feature highlight */}
          <div className="mt-5 p-6 rounded-2xl border border-green-500/20 bg-green-500/5 flex flex-col md:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-green-400" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-bold text-lg mb-1">Delay humanizado anti-ban</h3>
              <p className="text-sm text-muted-foreground">
                O bot simula comportamento humano com delays configuráveis entre envios, reduzindo drasticamente o risco de bloqueio do seu número pelo WhatsApp.
              </p>
            </div>
            <Button asChild variant="outline" className="border-green-500/30 text-green-400 hover:bg-green-500/10 flex-shrink-0">
              <a href={getLoginUrl()}>Testar grátis</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── PLANOS ─────────────────────────────────────────────── */}
      <section id="planos" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary mb-4">Planos e Preços</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simples e transparente</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece com 60 minutos grátis. Sem cartão de crédito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trial */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Trial</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black">Grátis</span>
                </div>
                <p className="text-sm text-muted-foreground">60 minutos para testar</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Todas as funcionalidades", "5 plataformas de afiliado", "Grupos ilimitados", "Sem cartão de crédito"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full border-border">
                <a href={getLoginUrl()}>Começar agora</a>
              </Button>
            </div>

            {/* Basic */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Basic</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black">R$50</span>
                  <span className="text-muted-foreground text-sm mb-1">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">Com anúncios da plataforma</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Todas as funcionalidades",
                  "5 plataformas de afiliado",
                  "Grupos ilimitados",
                  "Feed Global de Ofertas",
                  "Logs e relatórios",
                  "Anúncio da plataforma nos posts",
                ].map((item, i) => (
                  <li key={item} className={`flex items-center gap-2 text-sm ${i === 5 ? "text-muted-foreground" : ""}`}>
                    <Check className={`w-4 h-4 flex-shrink-0 ${i === 5 ? "text-muted-foreground" : "text-green-400"}`} />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full border-border">
                <a href={getLoginUrl()}>Assinar Basic</a>
              </Button>
            </div>

            {/* Premium */}
            <div className="relative p-6 rounded-2xl border-2 border-green-500/50 bg-gradient-to-b from-green-500/10 to-card shadow-xl shadow-green-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> RECOMENDADO
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-2">Premium</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black">R$100</span>
                  <span className="text-muted-foreground text-sm mb-1">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">Sem anúncios, profissional</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Tudo do plano Basic",
                  "Sem anúncios da plataforma",
                  "Posts 100% seus",
                  "Suporte prioritário",
                  "Acesso antecipado a novidades",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-green-500 hover:bg-green-400 text-black font-bold shadow-lg shadow-green-500/20">
                <a href={getLoginUrl()}>
                  Assinar Premium
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Pagamento via PIX. Ativação imediata após confirmação.
          </p>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary mb-4">Depoimentos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quem usa, aprova</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="outline" className="border-primary/30 text-primary mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/10 via-card to-card p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-green-500/10 rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Comece a ganhar mais hoje
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                60 minutos grátis para testar. Sem cartão de crédito. Configure em menos de 10 minutos e veja o bot trabalhando por você.
              </p>
              <Button size="lg" asChild className="bg-green-500 hover:bg-green-400 text-black font-bold text-base px-10 shadow-xl shadow-green-500/25">
                <a href={getLoginUrl()}>
                  Criar conta grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Sem compromisso · Cancele quando quiser · Pagamento via PIX
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">AutoAfiliado</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
              <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <a href={getLoginUrl()} className="hover:text-foreground transition-colors">Entrar</a>
            </nav>
            <p className="text-xs text-muted-foreground">
              © 2026 AutoAfiliado. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
