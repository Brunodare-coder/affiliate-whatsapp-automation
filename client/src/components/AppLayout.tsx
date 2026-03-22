import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Globe,
  Link2,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Smartphone,
  Users,
  Zap,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/whatsapp", label: "WhatsApp", icon: Smartphone },
  { path: "/groups", label: "Configurar Ofertas", icon: Users },
  { path: "/automations", label: "Automações", icon: Bot },
  { path: "/feed-global", label: "Feed Global", icon: Globe },
  { path: "/logs", label: "Logs", icon: FileText },
  { path: "/subscription", label: "Assinatura", icon: Shield },
  { path: "/settings", label: "Configurações", icon: Settings },
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
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => toast.error("Erro ao sair"),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Acesso restrito</h2>
          <p className="text-muted-foreground">Faça login para acessar a plataforma.</p>
          <Button asChild>
            <a href={getLoginUrl()}>Fazer login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-sidebar-border ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sidebar-foreground truncate">AffiliateBot</span>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.path || location.startsWith(item.path + "/");
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {!collapsed && user && (
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => logoutMutation.mutate()}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sair</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {title && (
          <header className="h-16 border-b border-border flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <h1 className="font-semibold text-lg">{title}</h1>
          </header>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
