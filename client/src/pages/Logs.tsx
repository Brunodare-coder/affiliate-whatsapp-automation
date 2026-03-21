import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, ArrowRight, ChevronLeft, ChevronRight, FileText, Image, Loader2, Video } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const STATUS_CONFIG = {
  sent: { label: "Enviado", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  failed: { label: "Falhou", className: "bg-destructive/20 text-destructive border-destructive/30" },
  processed: { label: "Processado", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  skipped: { label: "Ignorado", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
};

function MediaIcon({ type }: { type: string }) {
  if (type === "image") return <Image className="w-4 h-4 text-blue-400" />;
  if (type === "video") return <Video className="w-4 h-4 text-purple-400" />;
  return <FileText className="w-4 h-4 text-muted-foreground" />;
}

export default function Logs() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: logs, isLoading } = trpc.logs.list.useQuery({ limit, offset: page * limit });
  const { data: stats } = trpc.logs.stats.useQuery();

  const hasMore = (logs?.length ?? 0) === limit;

  return (
    <AppLayout title="Logs">
      <div className="p-6 space-y-6">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Enviados", value: stats.sent, color: "text-green-400" },
              { label: "Links Substituídos", value: stats.linksReplaced, color: "text-primary" },
              { label: "Falhas", value: stats.failed, color: "text-destructive" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Logs list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum log ainda</h3>
            <p className="text-muted-foreground text-sm">
              Os logs aparecerão aqui quando posts forem processados pelas automações.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const status = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              return (
                <Link key={log.id} href={`/logs/${log.id}`}>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/30 cursor-pointer transition-colors">
                    <MediaIcon type={log.mediaType || "text"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">
                          {log.sourceGroupName || log.sourceGroupJid}
                        </p>
                        {log.linksReplaced > 0 && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {log.linksReplaced} link{log.linksReplaced > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.originalContent?.slice(0, 80) || `[${log.mediaType || "mídia"}]`}
                        {(log.originalContent?.length ?? 0) > 80 ? "..." : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className={`text-xs ${status.className}`}>
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                        {format(new Date(log.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {(logs?.length ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Próxima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
