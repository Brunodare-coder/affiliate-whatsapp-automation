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
  Play,
  Sparkles,
  Globe,
  Lock,
  BarChart3,
  Clock,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";

/* ── Animated counter ─────────────────────────────── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

/* ── Typing animation ─────────────────────────────── */
const typingWords = ["Mercado Livre", "Shopee", "Amazon", "Magazine Luiza", "AliExpress"];
function TypingText() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = typingWords[idx];
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % typingWords.length);
    }
  }, [displayed, deleting, idx]);
  return (
    <span className="text-gradient-green">
      {displayed}
      <span className="animate-typing inline-block w-0.5 h-[0.9em] bg-green-400 ml-0.5 align-middle" />
    </span>
  );
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % 4), 2500);
    return () => clearInterval(t);
  }, []);

  const platforms = [
    { name: "Mercado Livre", emoji: "🛒", color: "from-yellow-400/20 to-yellow-500/10 border-yellow-500/30 text-yellow-300" },
    { name: "Shopee", emoji: "🧡", color: "from-orange-400/20 to-orange-500/10 border-orange-500/30 text-orange-300" },
    { name: "Amazon", emoji: "📦", color: "from-amber-400/20 to-amber-500/10 border-amber-500/30 text-amber-300" },
    { name: "Mag. Luiza", emoji: "💙", color: "from-blue-400/20 to-blue-500/10 border-blue-500/30 text-blue-300" },
    { name: "AliExpress", emoji: "🔴", color: "from-red-400/20 to-red-500/10 border-red-500/30 text-red-300" },
  ];

  const stats = [
    { value: 12500, suffix: "+", label: "Links substituídos" },
    { value: 850, suffix: "+", label: "Usuários ativos" },
    { value: 99, suffix: "%", label: "Uptime garantido" },
    { value: 5, suffix: "x", label: "Mais comissões" },
  ];

  const features = [
    { icon: Search, title: "Monitoramento 24/7", desc: "O bot vigia seus grupos o tempo todo, sem pausas. Nenhuma oferta passa despercebida.", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { icon: RefreshCw, title: "Substituição Instantânea", desc: "Cada link detectado é convertido para o seu link de afiliado em milissegundos.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: Send, title: "Disparo Automático", desc: "Posts modificados são enviados para todos os seus grupos de destino com delay humanizado.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { icon: Globe, title: "Feed Global", desc: "Receba links de afiliado de outros usuários da plataforma e multiplique seus ganhos.", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { icon: BarChart3, title: "Relatórios Detalhados", desc: "Acompanhe em tempo real quantos links foram substituídos e enviados por plataforma.", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { icon: Shield, title: "Anti-ban Inteligente", desc: "Delay humanizado entre envios para proteger seu número de bloqueios do WhatsApp.", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  ];

  const steps = [
    { icon: Smartphone, title: "Conecte o WhatsApp", desc: "Escaneie o QR Code para vincular seu número. Menos de 1 minuto." },
    { icon: Settings, title: "Configure os afiliados", desc: "Insira suas credenciais de cada plataforma (tag, AppID, cookies)." },
    { icon: Users, title: "Selecione os grupos", desc: "Escolha quais grupos monitorar e para onde enviar as ofertas." },
    { icon: Zap, title: "Bot no ar!", desc: "Pronto. O bot trabalha 24h por dia, 7 dias por semana." },
  ];

  const testimonials = [
    { name: "Carlos M.", role: "Afiliado há 2 anos", text: "Antes eu perdia horas copiando e colando links. Agora o bot faz tudo. Minha renda triplicou em 3 meses.", stars: 5, avatar: "CM" },
    { name: "Ana P.", role: "Criadora de grupos de ofertas", text: "Tenho 12 grupos com 50 mil membros. Sem o AutoAfiliado seria impossível gerenciar tudo. Indispensável!", stars: 5, avatar: "AP" },
    { name: "Roberto S.", role: "Influencer de e-commerce", text: "O Feed Global é incrível. Recebo ofertas de outros usuários e ainda ganho comissão. Isso não existe em outra ferramenta.", stars: 5, avatar: "RS" },
  ];

  const faqs = [
    { q: "Preciso deixar o computador ligado?", a: "Não. O bot roda em nossos servidores na nuvem. Basta conectar seu WhatsApp uma vez e ele funciona 24/7, mesmo com seu celular desligado." },
    { q: "Minha conta do WhatsApp pode ser banida?", a: "O bot usa delay humanizado entre envios e respeita os limites do WhatsApp. Recomendamos usar um número dedicado para o bot." },
    { q: "Quais plataformas são suportadas?", a: "Mercado Livre, Shopee, Amazon, Magazine Luiza e AliExpress. Novas plataformas são adicionadas regularmente." },
    { q: "Como funciona o período de teste?", a: "Ao criar sua conta, você recebe 60 minutos gratuitos para testar todas as funcionalidades sem precisar inserir cartão de crédito." },
    { q: "Qual a diferença entre Basic e Premium?", a: "O plano Basic (R$50/mês) inclui todas as funcionalidades, mas adiciona uma mensagem de divulgação ao final dos posts. O Premium (R$100/mês) remove completamente esses anúncios." },
    { q: "Como é feito o pagamento?", a: "Aceitamos pagamento via PIX. Após confirmar o pagamento, sua assinatura é ativada imediatamente." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/40">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AutoAfiliado</span>
              <div className="text-[9px] text-green-400/70 font-medium tracking-widest uppercase -mt-0.5">Bot de Afiliados</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Planos", "#planos"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={href} href={href} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-all">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground">
              <a href={getLoginUrl()}>Entrar</a>
            </Button>
            <Button size="sm" asChild className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/30 border-0">
              <a href={getLoginUrl()}>
                Começar grátis
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(oklch(0.8 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.8 0 0) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          {/* Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-500/8 rounded-full blur-[150px] animate-glow-pulse" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] animate-float" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold mb-6 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />
                Automação de Afiliados para WhatsApp
                <span className="bg-green-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black">NOVO</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Automatize seus<br />
                links de<br />
                <TypingText />
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
                O bot monitora seus grupos, detecta links de produtos, substitui pelos seus links de afiliado e reenvia automaticamente — <strong className="text-foreground">sem você tocar no celular.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button size="lg" asChild className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-black text-base px-8 h-12 shadow-2xl shadow-green-500/30 border-0">
                  <a href={getLoginUrl()}>
                    <Zap className="w-4 h-4 mr-2" />
                    Testar 60 minutos grátis
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/10 bg-white/5 hover:bg-white/10 text-foreground font-semibold text-base px-8 h-12 backdrop-blur-sm">
                  <a href="#como-funciona">
                    <Play className="w-4 h-4 mr-2 text-green-400" />
                    Ver como funciona
                  </a>
                </Button>
              </div>

              {/* Platform pills */}
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <span key={p.name} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r ${p.color}`}>
                    {p.emoji} {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Terminal mockup */}
            <div className="relative animate-float">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/10 rounded-3xl blur-3xl scale-95" />

              <div className="relative glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    AutoAfiliado Bot — 3 grupos ativos
                  </div>
                </div>

                {/* Terminal body */}
                <div className="p-5 space-y-3 font-mono text-sm bg-[oklch(0.09_0.015_250)]">
                  {[
                    { time: "10:42:01", icon: "🔍", color: "text-yellow-400", text: "Link detectado", sub: " em \"Grupo Ofertas BR\"" },
                    { time: "10:42:01", icon: "🔄", color: "text-blue-400", text: "Substituindo", sub: " ML → link afiliado ✓" },
                    { time: "10:42:03", icon: "✅", color: "text-green-400", text: "Enviado", sub: " para 4 grupos de destino" },
                    { time: "10:43:17", icon: "🧡", color: "text-orange-400", text: "Shopee detectado", sub: " → substituído → enviado" },
                    { time: "10:44:02", icon: "📦", color: "text-amber-400", text: "Amazon detectado", sub: " → tag aplicada → enviado" },
                  ].map((log, i) => (
                    <div key={i} className={`flex items-start gap-3 ${i === 4 ? "opacity-50" : ""}`}>
                      <span className="text-muted-foreground text-[11px] mt-0.5 w-16 flex-shrink-0 tabular-nums">{log.time}</span>
                      <div className="flex-1">
                        <span className={log.color}>{log.icon} {log.text}</span>
                        <span className="text-muted-foreground">{log.sub}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 opacity-40">
                    <span className="text-muted-foreground text-[11px] w-16 tabular-nums">10:44:08</span>
                    <span className="text-muted-foreground">Aguardando próxima mensagem</span>
                    <span className="w-1.5 h-4 bg-green-400/60 rounded-sm animate-typing" />
                  </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5">
                  {[["47", "Links hoje"], ["12", "Grupos"], ["R$380", "Estimado"]].map(([val, label]) => (
                    <div key={label} className="p-3 text-center">
                      <div className="text-base font-black text-green-400">{val}</div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-blue-500/5" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-gradient-green mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-3 py-1">Como funciona</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Configure em <span className="text-gradient-green">4 passos</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Em menos de 10 minutos seu bot já estará funcionando e gerando comissões.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                  activeStep === i
                    ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/10"
                    : "border-white/5 bg-card hover:border-white/10"
                }`}
                onClick={() => setActiveStep(i)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${activeStep === i ? "bg-green-500 shadow-lg shadow-green-500/40" : "bg-white/5"}`}>
                  <step.icon className={`w-6 h-6 ${activeStep === i ? "text-black" : "text-muted-foreground"}`} />
                </div>
                <div className={`text-5xl font-black mb-2 transition-all ${activeStep === i ? "text-green-500/30" : "text-white/5"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  0{i + 1}
                </div>
                <h3 className="font-bold text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                {activeStep === i && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-b-2xl" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-3 py-1">Funcionalidades</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Tudo que você precisa para <span className="text-gradient-green">escalar</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Uma plataforma completa para quem leva afiliados a sério.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className={`group p-6 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-xl ${f.bg}`}>
                <div className={`w-11 h-11 rounded-xl bg-current/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Highlight banner */}
          <div className="mt-6 relative overflow-hidden p-6 rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/5">
            <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-green-500/10 to-transparent" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                <Lock className="w-7 h-7 text-green-400" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Delay humanizado anti-ban</h3>
                <p className="text-sm text-muted-foreground">
                  O bot simula comportamento humano com delays configuráveis entre envios, reduzindo drasticamente o risco de bloqueio do seu número.
                </p>
              </div>
              <Button asChild className="bg-green-500 hover:bg-green-400 text-black font-bold flex-shrink-0 shadow-lg shadow-green-500/20">
                <a href={getLoginUrl()}>Testar grátis <ArrowRight className="w-4 h-4 ml-1" /></a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ─────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-3 py-1">Planos e Preços</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Simples e <span className="text-gradient-green">transparente</span>
            </h2>
            <p className="text-muted-foreground">Comece com 60 minutos grátis. Sem cartão de crédito.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Trial */}
            <div className="p-6 rounded-2xl border border-white/8 bg-card flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Trial</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Grátis</span>
                </div>
                <p className="text-sm text-muted-foreground">60 minutos para testar</p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Todas as funcionalidades", "5 plataformas de afiliado", "Grupos ilimitados", "Sem cartão de crédito"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5">
                <a href={getLoginUrl()}>Começar agora</a>
              </Button>
            </div>

            {/* Basic */}
            <div className="p-6 rounded-2xl border border-white/8 bg-card flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Basic</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$50</span>
                  <span className="text-muted-foreground text-sm mb-1.5">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">Com anúncios da plataforma</p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  { text: "Todas as funcionalidades", ok: true },
                  { text: "5 plataformas de afiliado", ok: true },
                  { text: "Feed Global de Ofertas", ok: true },
                  { text: "Logs e relatórios", ok: true },
                  { text: "Anúncio da plataforma nos posts", ok: false },
                ].map((item) => (
                  <li key={item.text} className={`flex items-center gap-2 text-sm ${!item.ok ? "text-muted-foreground" : ""}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? "bg-green-500/20" : "bg-white/5"}`}>
                      <Check className={`w-2.5 h-2.5 ${item.ok ? "text-green-400" : "text-muted-foreground"}`} />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full border-white/10 hover:bg-white/5">
                <a href={getLoginUrl()}>Assinar Basic</a>
              </Button>
            </div>

            {/* Premium */}
            <div className="relative p-6 rounded-2xl border-2 border-green-500/40 bg-gradient-to-b from-green-500/10 via-card to-card flex flex-col shadow-2xl shadow-green-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-black text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/30">
                  <Crown className="w-3 h-3" /> MAIS POPULAR
                </span>
              </div>
              <div className="mb-6 mt-2">
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Premium</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-gradient-green" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$100</span>
                  <span className="text-muted-foreground text-sm mb-1.5">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">Sem anúncios, 100% profissional</p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["Tudo do plano Basic", "Sem anúncios da plataforma", "Posts 100% seus", "Suporte prioritário", "Acesso antecipado a novidades"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-black shadow-lg shadow-green-500/20 border-0">
                <a href={getLoginUrl()}>
                  Assinar Premium
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            Pagamento via PIX · Ativação imediata · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-3 py-1">Depoimentos</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Quem usa, <span className="text-gradient-green">aprova</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/8 bg-card hover:border-white/15 transition-all hover:shadow-lg group">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-green-400">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-3 py-1">FAQ</Badge>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Perguntas <span className="text-gradient-green">frequentes</span>
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-xl border transition-all ${openFaq === i ? "border-green-500/30 bg-green-500/5" : "border-white/5 bg-card hover:border-white/10"}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-green-400" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-blue-500/10" />
            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(oklch(0.8 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.8 0 0) 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.03 }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-green-500/15 rounded-full blur-[80px]" />

            <div className="relative z-10 p-10 md:p-16 text-center border border-green-500/20 rounded-3xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/40 mb-6">
                <Zap className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Comece a ganhar mais <span className="text-gradient-green">hoje</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                60 minutos grátis para testar. Sem cartão de crédito. Configure em menos de 10 minutos.
              </p>
              <Button size="lg" asChild className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-black text-base px-10 h-12 shadow-2xl shadow-green-500/30 border-0">
                <a href={getLoginUrl()}>
                  <Zap className="w-5 h-5 mr-2" />
                  Criar conta grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-3">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Sem compromisso</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Cancele quando quiser</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-400" /> Pagamento via PIX</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AutoAfiliado</span>
                <div className="text-[9px] text-green-400/60 font-medium tracking-widest uppercase">Bot de Afiliados</div>
              </div>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[["Como funciona", "#como-funciona"], ["Funcionalidades", "#funcionalidades"], ["Planos", "#planos"], ["FAQ", "#faq"], ["Suporte", "/support"], ["Entrar", getLoginUrl()]].map(([label, href]) => (
                <a key={label} href={href} className="hover:text-foreground transition-colors">{label}</a>
              ))}
            </nav>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 AutoAfiliado. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Todos os sistemas operacionais
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
