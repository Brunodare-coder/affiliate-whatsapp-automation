import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Crown,
  Globe,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Smartphone,
  Users,
  FileText,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3, color: "text-green-400" },
  { path: "/whatsapp", label: "WhatsApp", icon: Smartphone, color: "text-emerald-400" },
  { path: "/groups", label: "Configurar Ofertas", icon: Users, color: "text-blue-400" },
  { path: "/feed-global", label: "Feed Global", icon: Globe, color: "text-cyan-400" },
  { path: "/logs", label: "Logs", icon: FileText, color: "text-purple-400" },
  { path: "/subscription", label: "Assinatura", icon: Shield, color: "text-yellow-400" },
  { path: "/settings", label: "Configurações", icon: Settings, color: "text-orange-400" },
];

const adminNavItems = [
  { path: "/admin", label: "Painel Admin", icon: Crown, color: "text-yellow-400" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
    onError: () => toast.error("Erro ao sair"),
  });

  // Poll WhatsApp connection status every 5s for real-time indicator
  const { data: waInstances } = trpc.whatsapp.listInstances.useQuery(undefined, {
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    enabled: isAuthenticated,
  });
  const connectedInstance = waInstances?.find((i) => i.status === "connected");
  const waConnected = !!connectedInstance;
  const waConnecting = !waConnected && waInstances?.some((i) => i.status === "connecting" || i.status === "qr_pending");
  // Show last 4 digits of phone number when connected
  const waPhoneShort = connectedInstance?.phoneNumber
    ? connectedInstance.phoneNumber.slice(-4)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold section-title">Acesso restrito</h2>
            <p className="text-muted-foreground mt-1">Faça login para acessar a plataforma.</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/30 border-0">
            <Link href={getLoginUrl()}>Fazer login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Background glows */}
      <div className="page-glow-green" />
      <div className="page-glow-blue" />

      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-white/5 bg-sidebar/90 backdrop-blur-xl transition-all duration-300 z-20 ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{ background: "oklch(0.09 0.018 250 / 0.95)" }}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/40">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[oklch(0.09_0.018_250)] animate-pulse" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-base tracking-tight section-title text-foreground">AutoAfiliado</span>
              <div className="text-[9px] text-green-400/70 font-semibold tracking-widest uppercase -mt-0.5">Bot de Afiliados</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const isActive = location === item.path || location.startsWith(item.path + "/");
              const isWhatsApp = item.path === "/whatsapp";
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
                      isActive
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/20 text-green-400"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="relative flex-shrink-0">
                      <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? "text-green-400" : `group-hover:${item.color}`}`} style={{ width: "18px", height: "18px" }} />
                      {isWhatsApp && waInstances !== undefined && (
                        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[oklch(0.09_0.018_250)] ${
                          waConnected ? "bg-green-400" : waConnecting ? "bg-yellow-400 animate-pulse" : "bg-red-400"
                        }`} />
                      )}
                    </div>
                    {!collapsed && (
                      <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                    )}
                    {!collapsed && isWhatsApp && waInstances !== undefined && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        waConnected ? "bg-green-500/20 text-green-400" : waConnecting ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/15 text-red-400"
                      }`}>
                        {waConnected
                          ? (waPhoneShort ? `●${waPhoneShort}` : "ON")
                          : waConnecting ? "..." : "OFF"}
                      </span>
                    )}
                    {isActive && !collapsed && !isWhatsApp && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Admin section */}
            {user?.role === "admin" && (
              <>
                {!collapsed && (
                  <div className="px-3 pt-4 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-yellow-500/20" />
                      <p className="text-[10px] font-bold text-yellow-400/60 uppercase tracking-widest">Admin</p>
                      <div className="flex-1 h-px bg-yellow-500/20" />
                    </div>
                  </div>
                )}
                {adminNavItems.map((item) => {
                  const isActive = location === item.path;
                  return (
                    <Link key={item.path} href={item.path}>
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                          isActive
                            ? "bg-yellow-500/15 border-yellow-500/25 text-yellow-400"
                            : "text-yellow-400/60 hover:bg-yellow-500/8 hover:text-yellow-400 border-transparent"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: "18px", height: "18px" }} />
                        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        {isActive && !collapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/5 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400/30 to-blue-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                  <span className="text-xs font-bold text-green-400">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => logoutMutation.mutate()}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 border border-transparent hover:border-red-500/20 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sair</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-muted-foreground hover:bg-white/5 transition-all duration-150 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {title && (
          <header className="h-16 border-b border-white/5 flex items-center px-6 sticky top-0 z-10 backdrop-blur-xl" style={{ background: "oklch(0.08 0.015 250 / 0.85)" }}>
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-green-400 to-emerald-600" />
              <h1 className="font-bold text-lg section-title">{title}</h1>
            </div>
          </header>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
