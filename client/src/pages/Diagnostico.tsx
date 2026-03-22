import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, RefreshCw, Activity, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface DiagLog {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  category: string;
  message: string;
}

const LEVEL_CONFIG = {
  info: {
    icon: <Info className="h-3.5 w-3.5" />,
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    row: "border-l-2 border-blue-500/40",
  },
  warn: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    row: "border-l-2 border-yellow-500/40",
  },
  error: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    row: "border-l-2 border-red-500/40",
  },
  success: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    row: "border-l-2 border-green-500/40",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  MSG: "text-purple-400",
  GRUPOS: "text-cyan-400",
  AUTOMAÇÃO: "text-orange-400",
  CONFIG: "text-slate-400",
  LINKS: "text-emerald-400",
  ENVIO: "text-pink-400",
};

export default function Diagnostico() {
  const [logs, setLogs] = useState<DiagLog[]>([]);
  const [sinceId, setSinceId] = useState<number | undefined>(undefined);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data, refetch } = trpc.diag.getLogs.useQuery(
    { since: sinceId },
    {
      refetchInterval: isLive ? 2000 : false,
      staleTime: 0,
    }
  );

  const clearMutation = trpc.diag.clearLogs.useMutation({
    onSuccess: () => {
      setLogs([]);
      setSinceId(undefined);
    },
  });

  useEffect(() => {
    if (data?.logs && data.logs.length > 0) {
      setLogs((prev) => {
        const newLogs = [...prev, ...data.logs];
        // Keep last 500 entries
        const trimmed = newLogs.slice(-500);
        return trimmed;
      });
      const lastId = data.logs[data.logs.length - 1].id;
      setSinceId(lastId);
    }
  }, [data]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const categoryFilter = ["Todos", "MSG", "GRUPOS", "AUTOMAÇÃO", "CONFIG", "LINKS", "ENVIO"];
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filteredLogs = activeCategory === "Todos"
    ? logs
    : logs.filter((l) => l.category === activeCategory);

  return (
    <div className="flex flex-col h-full gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${isLive ? "text-green-400 animate-pulse" : "text-slate-500"}`} />
            <h1 className="text-xl font-semibold">Diagnóstico em Tempo Real</h1>
          </div>
          {isLive && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              AO VIVO
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive((v) => !v)}
            className={isLive ? "border-green-500/50 text-green-400" : ""}
          >
            {isLive ? "Pausar" : "Retomar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Explicação */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-300">
        <strong>Como usar:</strong> Envie uma mensagem com link de oferta em um grupo monitorado e acompanhe aqui cada etapa do processamento em tempo real. Os logs mostram se a mensagem foi recebida, se o grupo está configurado, se os links foram substituídos e se o envio foi bem-sucedido.
      </div>

      {/* Filtros por categoria */}
      <div className="flex items-center gap-2 flex-wrap">
        {categoryFilter.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
            {cat !== "Todos" && (
              <span className="ml-1 opacity-60">
                ({logs.filter((l) => l.category === cat).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredLogs.length} entradas
        </span>
      </div>

      {/* Log terminal */}
      <div
        ref={scrollRef}
        className="flex-1 bg-black/40 rounded-lg border border-border overflow-y-auto font-mono text-xs"
        style={{ minHeight: 0, maxHeight: "calc(100vh - 320px)" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setAutoScroll(atBottom);
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
            <Activity className="h-8 w-8 opacity-30" />
            <p className="text-sm">Aguardando mensagens...</p>
            <p className="text-xs opacity-60">Envie uma mensagem com link em um grupo monitorado</p>
          </div>
        ) : (
          <div className="p-3 space-y-0.5">
            {filteredLogs.map((log) => {
              const cfg = LEVEL_CONFIG[log.level];
              const catColor = CATEGORY_COLORS[log.category] || "text-slate-400";
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded hover:bg-white/5 ${cfg.row}`}
                >
                  <span className="text-slate-500 shrink-0 w-20 text-right">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`shrink-0 ${catColor} w-20 truncate`}>
                    [{log.category}]
                  </span>
                  <span className={`shrink-0 ${cfg.badge.split(" ")[1]}`}>
                    {cfg.icon}
                  </span>
                  <span className="text-slate-200 break-all">{log.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs shadow-lg hover:bg-primary/90 transition-colors"
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
        >
          ↓ Ir para o final
        </button>
      )}
    </div>
  );
}
