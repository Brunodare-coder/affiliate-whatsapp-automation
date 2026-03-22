import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  mercadolivre: { label: "mercadolivre", color: "#f97316", bg: "bg-orange-500" },
  shopee:        { label: "shopee",       color: "#f97316", bg: "bg-orange-600" },
  amazon:        { label: "amazon",       color: "#f59e0b", bg: "bg-yellow-600" },
  magalu:        { label: "magalu",       color: "#3b82f6", bg: "bg-blue-600" },
  aliexpress:    { label: "aliexpress",   color: "#ef4444", bg: "bg-red-600" },
};

function PlatformBadge({ platform }: { platform?: string | null }) {
  const cfg = platform ? PLATFORM_CONFIG[platform] : null;
  if (!cfg) return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-600 text-white">
      geral
    </span>
  );
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${cfg.bg} text-white`}>
      {cfg.label}
    </span>
  );
}

type FilterStatus = "all" | "sent" | "failed" | "pending";

export default function Logs() {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const { data: logs, isLoading, refetch, isFetching } = trpc.sendLogs.list.useQuery(
    { status: filter, limit: 100 },
    { refetchInterval: 30000 }
  );
  const { data: stats } = trpc.sendLogs.stats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );

  const filterButtons: { key: FilterStatus; label: string }[] = [
    { key: "all",     label: "Todos" },
    { key: "sent",    label: "Sucesso" },
    { key: "failed",  label: "Erros" },
    { key: "pending", label: "Pendente" },
  ];

  return (
    <AppLayout title="Logs de Envio">
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Logs de Envio</h1>
            <p className="text-sm text-muted-foreground">Histórico de mensagens disparadas pelo bot</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {/* Total */}
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          {/* Sucesso */}
          <div className="rounded-xl bg-green-950/40 border border-green-800/40 p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{stats?.success ?? 0}</p>
            <p className="text-xs text-green-500/70 mt-1">Sucesso</p>
          </div>
          {/* Erros */}
          <div className="rounded-xl bg-red-950/40 border border-red-800/40 p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats?.errors ?? 0}</p>
            <p className="text-xs text-red-500/70 mt-1">Erros</p>
          </div>
          {/* Pendente */}
          <div className="rounded-xl bg-yellow-950/30 border border-yellow-800/30 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{stats?.pending ?? 0}</p>
            <p className="text-xs text-yellow-500/70 mt-1">Pendente</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === btn.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
            <p className="text-muted-foreground text-sm">
              Os logs aparecerão aqui quando mensagens forem disparadas pelo bot.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isSuccess = log.status === "sent";
              const isFailed = log.status === "failed";
              const isPending = log.status === "pending";

              const cardBorder = isSuccess
                ? "border-green-800/40 bg-green-950/20"
                : isFailed
                ? "border-red-800/40 bg-red-950/20"
                : "border-yellow-800/30 bg-yellow-950/10";

              const StatusIcon = isSuccess
                ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                : isFailed
                ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                : <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />;

              const dateStr = log.createdAt
                ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                : "";

              return (
                <div
                  key={log.id}
                  className={`rounded-xl border p-4 space-y-2 ${cardBorder}`}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-2">
                    {StatusIcon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlatformBadge platform={log.platform} />
                        <span className="text-xs text-muted-foreground">{dateStr}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-1">
                        {isSuccess ? "Link de afiliado enviado" : isFailed ? "Falha no envio" : "Envio pendente"}
                      </p>
                      {log.targetName && (
                        <p className="text-xs text-muted-foreground">Para: {log.targetName}</p>
                      )}
                    </div>
                  </div>

                  {/* Message content preview */}
                  {log.messageContent && (
                    <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-xs text-foreground/80 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono leading-relaxed">
                      {log.messageContent.length > 400
                        ? log.messageContent.slice(0, 400) + "..."
                        : log.messageContent}
                    </div>
                  )}

                  {/* Error message */}
                  {log.errorMessage && (
                    <div className="rounded-lg bg-red-950/40 border border-red-800/30 p-2 text-xs text-red-400">
                      Erro: {log.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
