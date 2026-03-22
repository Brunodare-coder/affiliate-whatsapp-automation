import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, BarChart3, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";

const PLATFORM_CONFIG: Record<string, { label: string; color: string; textColor: string; bg: string }> = {
  mercadolivre: { label: "Mercado Livre", color: "border-yellow-500/30", textColor: "text-yellow-400", bg: "bg-yellow-500/15" },
  shopee:       { label: "Shopee",        color: "border-orange-500/30", textColor: "text-orange-400", bg: "bg-orange-500/15" },
  amazon:       { label: "Amazon",        color: "border-amber-500/30",  textColor: "text-amber-400",  bg: "bg-amber-500/15" },
  magalu:       { label: "Mag. Luiza",    color: "border-blue-500/30",   textColor: "text-blue-400",   bg: "bg-blue-500/15" },
  aliexpress:   { label: "AliExpress",    color: "border-red-500/30",    textColor: "text-red-400",    bg: "bg-red-500/15" },
};

function PlatformBadge({ platform }: { platform?: string | null }) {
  const cfg = platform ? PLATFORM_CONFIG[platform] : null;
  if (!cfg) return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/8 text-muted-foreground border border-white/10">
      Geral
    </span>
  );
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.textColor} ${cfg.color}`}>
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
  const { data: stats } = trpc.sendLogs.stats.useQuery(undefined, { refetchInterval: 30000 });

  const filterButtons: { key: FilterStatus; label: string; color?: string }[] = [
    { key: "all",     label: "Todos" },
    { key: "sent",    label: "Sucesso",  color: "text-green-400 border-green-500/30 bg-green-500/10" },
    { key: "failed",  label: "Erros",    color: "text-red-400 border-red-500/30 bg-red-500/10" },
    { key: "pending", label: "Pendente", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  ];

  return (
    <AppLayout title="Logs de Envio">
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Histórico de mensagens disparadas pelo bot</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats?.total ?? 0, icon: BarChart3, color: "text-foreground", bg: "bg-white/8", border: "border-white/8" },
            { label: "Sucesso", value: stats?.success ?? 0, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/15" },
            { label: "Erros", value: stats?.errors ?? 0, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/15" },
            { label: "Pendente", value: stats?.pending ?? 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/15" },
          ].map((s) => (
            <div key={s.label} className={`stat-card p-4 border ${s.border}`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black section-title ${s.color}`}>{(s.value ?? 0).toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 border ${
                filter === btn.key
                  ? btn.color || "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-400"
                  : "border-white/8 bg-white/3 text-muted-foreground hover:bg-white/8 hover:text-foreground"
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
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10" style={{ background: "oklch(0.12 0.018 250 / 0.5)" }}>
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold section-title mb-2">Nenhum log encontrado</h3>
            <p className="text-muted-foreground text-sm">Os logs aparecerão aqui quando mensagens forem disparadas pelo bot.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isSuccess = log.status === "sent";
              const isFailed = log.status === "failed";
              const dateStr = log.createdAt
                ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                : "";

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all duration-150 hover:border-opacity-60 ${
                    isSuccess ? "border-green-500/20 bg-green-500/5"
                    : isFailed ? "border-red-500/20 bg-red-500/5"
                    : "border-yellow-500/15 bg-yellow-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSuccess ? "bg-green-500/15" : isFailed ? "bg-red-500/15" : "bg-yellow-500/15"
                    }`}>
                      {isSuccess
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : isFailed
                        ? <XCircle className="w-4 h-4 text-red-400" />
                        : <Clock className="w-4 h-4 text-yellow-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlatformBadge platform={log.platform} />
                        <span className="text-xs text-muted-foreground font-mono">{dateStr}</span>
                      </div>
                      <p className="text-sm font-semibold mt-1.5">
                        {isSuccess ? "Link de afiliado enviado com sucesso"
                          : isFailed ? "Falha no envio"
                          : "Envio pendente"}
                      </p>
                      {log.targetName && (
                        <p className="text-xs text-muted-foreground mt-0.5">Para: <span className="text-foreground/70">{log.targetName}</span></p>
                      )}
                    </div>
                  </div>

                  {log.messageContent && (
                    <div className="rounded-xl border border-white/5 p-3 text-xs text-foreground/70 whitespace-pre-wrap max-h-36 overflow-y-auto font-mono leading-relaxed" style={{ background: "oklch(0.08 0.015 250 / 0.6)" }}>
                      {log.messageContent.length > 400 ? log.messageContent.slice(0, 400) + "..." : log.messageContent}
                    </div>
                  )}

                  {log.errorMessage && (
                    <div className="rounded-xl border border-red-500/20 p-2.5 text-xs text-red-400 bg-red-500/8">
                      <strong>Erro:</strong> {log.errorMessage}
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
