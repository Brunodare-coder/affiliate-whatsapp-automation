import AppLayout from "@/components/AppLayout";
import MercadoLivreConfigModal from "@/components/MercadoLivreConfigModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Link2,
  MessageSquare,
  Settings,
  ShoppingCart,
  Smartphone,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.logs.stats.useQuery();
  const { data: instances, isLoading: instancesLoading } = trpc.whatsapp.listInstances.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();
  const { data: automations } = trpc.automations.list.useQuery();
  const { data: recentLogs } = trpc.logs.list.useQuery({ limit: 5, offset: 0 });
  const { data: mlConfig } = trpc.mercadoLivre.getConfig.useQuery();
  const [showMlModal, setShowMlModal] = useState(false);

  const connectedInstances = instances?.filter((i) => i.status === "connected") || [];
  const activeAutomations = automations?.filter((a) => a.isActive) || [];

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Posts Processados</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold">{statsLoading ? "—" : (stats?.total ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Posts Enviados</span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{statsLoading ? "—" : (stats?.sent ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Com sucesso</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Links Substituídos</span>
                <Link2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{statsLoading ? "—" : (stats?.linksReplaced ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Links de afiliado</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Falhas</span>
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-3xl font-bold text-destructive">{statsLoading ? "—" : (stats?.failed ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Erros de envio</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status do WhatsApp */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Conexões WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {instancesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : instances?.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Nenhuma instância configurada</p>
                  <Button size="sm" asChild variant="outline">
                    <Link href="/whatsapp">Configurar WhatsApp</Link>
                  </Button>
                </div>
              ) : (
                instances?.map((instance) => (
                  <div key={instance.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          instance.status === "connected"
                            ? "bg-green-400"
                            : instance.status === "connecting" || instance.status === "qr_pending"
                            ? "bg-yellow-400 animate-pulse"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <span className="text-sm font-medium">{instance.name}</span>
                    </div>
                    <Badge
                      variant={instance.status === "connected" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {instance.status === "connected"
                        ? "Conectado"
                        : instance.status === "qr_pending"
                        ? "QR Pendente"
                        : instance.status === "connecting"
                        ? "Conectando"
                        : "Desconectado"}
                    </Badge>
                  </div>
                ))
              )}
              {(instances?.length ?? 0) > 0 && (
                <Button size="sm" variant="ghost" asChild className="w-full">
                  <Link href="/whatsapp">
                    Gerenciar <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Automações ativas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                Automações Ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAutomations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Nenhuma automação ativa</p>
                  <Button size="sm" asChild variant="outline">
                    <Link href="/automations">Criar automação</Link>
                  </Button>
                </div>
              ) : (
                activeAutomations.slice(0, 4).map((automation) => (
                  <div key={automation.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-sm font-medium truncate max-w-[140px]">{automation.name}</span>
                    </div>
                    <Badge variant="default" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                      Ativa
                    </Badge>
                  </div>
                ))
              )}
              {activeAutomations.length > 0 && (
                <Button size="sm" variant="ghost" asChild className="w-full">
                  <Link href="/automations">
                    Ver todas <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Campanhas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="w-4 h-4 text-purple-400" />
                Campanhas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!campaigns || campaigns.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Nenhuma campanha criada</p>
                  <Button size="sm" asChild variant="outline">
                    <Link href="/campaigns">Criar campanha</Link>
                  </Button>
                </div>
              ) : (
                campaigns.slice(0, 4).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: campaign.color || "#22c55e" }}
                      />
                      <span className="text-sm font-medium truncate max-w-[140px]">{campaign.name}</span>
                    </div>
                    <Badge variant={campaign.isActive ? "default" : "secondary"} className="text-xs">
                      {campaign.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                ))
              )}
              {(campaigns?.length ?? 0) > 0 && (
                <Button size="sm" variant="ghost" asChild className="w-full">
                  <Link href="/campaigns">
                    Ver todas <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mercado Livre Integration Card */}
        <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Mercado Livre Afiliados</p>
                  <p className="text-xs text-muted-foreground">
                    {mlConfig?.tag
                      ? `Tag: ${mlConfig.tag} — links ML substituídos automaticamente`
                      : "Configure sua tag para substituir links ML automaticamente"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mlConfig?.tag ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Configurado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Não configurado
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowMlModal(true)}
                  className="border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300"
                >
                  <Settings className="w-3 h-3 mr-1.5" />
                  {mlConfig?.tag ? "Editar" : "Configurar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Atividade Recente
            </CardTitle>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/logs">
                Ver tudo <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentLogs || recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum post processado ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">Configure uma automação para começar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <Link key={log.id} href={`/logs/${log.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            log.status === "sent"
                              ? "bg-green-400"
                              : log.status === "failed"
                              ? "bg-destructive"
                              : log.status === "processed"
                              ? "bg-blue-400"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {log.sourceGroupName || log.sourceGroupJid}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {log.originalContent?.slice(0, 60) || "Mídia"}
                            {(log.originalContent?.length ?? 0) > 60 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            log.status === "sent"
                              ? "bg-green-500/20 text-green-400"
                              : log.status === "failed"
                              ? "bg-destructive/20 text-destructive"
                              : ""
                          }`}
                        >
                          {log.status === "sent"
                            ? "Enviado"
                            : log.status === "failed"
                            ? "Falhou"
                            : log.status === "processed"
                            ? "Processado"
                            : log.status === "skipped"
                            ? "Ignorado"
                            : "Pendente"}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MercadoLivreConfigModal open={showMlModal} onClose={() => setShowMlModal(false)} />
    </AppLayout>
  );
}
