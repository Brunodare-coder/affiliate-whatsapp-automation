import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Link2,
  MessageSquare,
  Send,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "wouter";

const STATUS_CONFIG = {
  sent: { label: "Enviado", icon: CheckCircle2, className: "text-green-400" },
  failed: { label: "Falhou", icon: XCircle, className: "text-destructive" },
  processed: { label: "Processado", icon: Clock, className: "text-blue-400" },
  skipped: { label: "Ignorado", icon: Clock, className: "text-muted-foreground" },
  pending: { label: "Pendente", icon: Clock, className: "text-yellow-400" },
};

export default function LogDetail() {
  const { id } = useParams<{ id: string }>();
  const logId = parseInt(id || "0");

  const { data: log, isLoading } = trpc.logs.get.useQuery({ id: logId });

  if (isLoading) {
    return (
      <AppLayout title="Carregando...">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-32 bg-secondary rounded" />
            <div className="h-32 bg-secondary rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!log) {
    return (
      <AppLayout title="Log não encontrado">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Log não encontrado.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/logs">Voltar para Logs</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <AppLayout title="Detalhe do Log">
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/logs">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Logs
          </Link>
        </Button>

        {/* Status header */}
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-6 h-6 ${status.className}`} />
          <div>
            <h2 className="font-semibold text-lg">
              Post de {log.sourceGroupName || log.sourceGroupJid}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(log.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`ml-auto text-sm ${
              log.status === "sent"
                ? "bg-green-500/20 text-green-400"
                : log.status === "failed"
                ? "bg-destructive/20 text-destructive"
                : ""
            }`}
          >
            {status.label}
          </Badge>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{log.linksReplaced}</p>
              <p className="text-xs text-muted-foreground mt-1">Links substituídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{log.sendDetails?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Destinos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {log.sendDetails?.filter((s: any) => s.status === "sent").length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Enviados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-destructive">
                {log.sendDetails?.filter((s: any) => s.status === "failed").length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Falhas</p>
            </CardContent>
          </Card>
        </div>

        {/* Content comparison */}
        {log.originalContent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Conteúdo Original
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words bg-secondary p-3 rounded-lg max-h-48 overflow-y-auto">
                  {log.originalContent}
                </pre>
              </CardContent>
            </Card>
            {log.processedContent && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    Conteúdo Modificado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-foreground whitespace-pre-wrap break-words bg-secondary p-3 rounded-lg max-h-48 overflow-y-auto">
                    {log.processedContent}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* LLM suggestion */}
        {log.llmSuggestion && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Sugestão da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{log.llmSuggestion}</p>
            </CardContent>
          </Card>
        )}

        {/* Error message */}
        {log.errorMessage && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                Erro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive/80 font-mono">{log.errorMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Send details */}
        {log.sendDetails && log.sendDetails.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                Detalhes de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {log.sendDetails.map((detail: any) => (
                <div key={detail.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm font-medium">{detail.targetName || detail.targetJid}</p>
                    {detail.sentAt && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(detail.sentAt), "HH:mm:ss", { locale: ptBR })}
                      </p>
                    )}
                    {detail.errorMessage && (
                      <p className="text-xs text-destructive">{detail.errorMessage}</p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      detail.status === "sent"
                        ? "bg-green-500/20 text-green-400"
                        : detail.status === "failed"
                        ? "bg-destructive/20 text-destructive"
                        : ""
                    }
                  >
                    {detail.status === "sent" ? "Enviado" : detail.status === "failed" ? "Falhou" : detail.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
