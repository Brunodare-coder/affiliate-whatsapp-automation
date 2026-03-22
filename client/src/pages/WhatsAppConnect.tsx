import AppLayout from "@/components/AppLayout";
import { Link } from "wouter";
import { Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, QrCode, RefreshCw, Smartphone, Trash2, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function QRCodeDisplay({ instanceId }: { instanceId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch } = trpc.whatsapp.getQRCode.useQuery(
    { instanceId },
    { refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "qr_pending" || status === "connecting" ? 3000 : false;
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data?.status === "connected") {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Wifi className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-green-400 font-medium">WhatsApp conectado!</p>
      </div>
    );
  }

  if (data?.qrCode) {
    return (
      <div className="flex flex-col items-center gap-3">
        <img src={data.qrCode} alt="QR Code WhatsApp" className="w-48 h-48 rounded-lg" />
        <p className="text-sm text-muted-foreground text-center">
          Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3 mr-1" /> Atualizar QR
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <QrCode className="w-12 h-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">QR Code não disponível</p>
      <Button size="sm" variant="outline" onClick={() => refetch()}>
        <RefreshCw className="w-3 h-3 mr-1" /> Verificar
      </Button>
    </div>
  );
}

export default function WhatsAppConnect() {
  const utils = trpc.useUtils();
  const { data: sub, isLoading: subLoading } = trpc.subscription.get.useQuery();
  const { data: instances, isLoading } = trpc.whatsapp.listInstances.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null);

  const createMutation = trpc.whatsapp.createInstance.useMutation({
    onSuccess: (data) => {
      utils.whatsapp.listInstances.invalidate();
      setShowCreate(false);
      setInstanceName("");
      toast.success("Instância criada! Conectando...");
      connectMutation.mutate({ instanceId: data.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => {
      utils.whatsapp.listInstances.invalidate();
      toast.success("Iniciando conexão...");
    },
    onError: (e) => toast.error(e.message),
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      utils.whatsapp.listInstances.invalidate();
      toast.success("Desconectado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.whatsapp.deleteInstance.useMutation({
    onSuccess: () => {
      utils.whatsapp.listInstances.invalidate();
      setSelectedInstance(null);
      toast.success("Instância removida!");
    },
    onError: (e) => toast.error(e.message),
  });

  function getStatusColor(status: string) {
    switch (status) {
      case "connected": return "bg-green-400";
      case "connecting": case "qr_pending": return "bg-yellow-400 animate-pulse";
      default: return "bg-muted-foreground";
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "connected": return "Conectado";
      case "connecting": return "Conectando";
      case "qr_pending": return "Aguardando QR";
      default: return "Desconectado";
    }
  }

  // Bloqueio de acesso sem assinatura ativa
  if (!subLoading && sub && !sub.isActive) {
    return (
      <AppLayout title="WhatsApp">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md space-y-5">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Acesso Bloqueado</h2>
            <p className="text-muted-foreground">
              {sub.status === "trial"
                ? "Seu período de teste de 60 minutos expirou."
                : "Sua assinatura expirou."}
              {" "}Para continuar usando o bot, assine um dos planos disponíveis.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/subscription">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Shield className="w-4 h-4 mr-2" />
                  R$ 50/mês
                </Button>
              </Link>
              <Link href="/subscription">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Shield className="w-4 h-4 mr-2" />
                  R$ 100/mês
                </Button>
              </Link>
            </div>
            <Link href="/subscription">
              <p className="text-sm text-primary hover:underline cursor-pointer">Ver planos e assinar →</p>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="WhatsApp">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Conecte sua conta do WhatsApp para monitorar grupos e enviar mensagens.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Instância
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 h-40" />
              </Card>
            ))}
          </div>
        ) : instances?.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma instância configurada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie uma instância e conecte sua conta do WhatsApp.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Criar instância
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances?.map((instance) => (
              <Card key={instance.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(instance.status)}`} />
                      <CardTitle className="text-base">{instance.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {getStatusLabel(instance.status)}
                    </Badge>
                  </div>
                  {instance.phoneNumber && (
                    <p className="text-sm text-muted-foreground">+{instance.phoneNumber}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* QR Code section */}
                  {(instance.status === "qr_pending" || selectedInstance === instance.id) && (
                    <div className="border border-border rounded-lg p-4">
                      <QRCodeDisplay instanceId={instance.id} />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {instance.status === "disconnected" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInstance(instance.id);
                          connectMutation.mutate({ instanceId: instance.id });
                        }}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wifi className="w-3 h-3 mr-1" />
                        )}
                        Conectar
                      </Button>
                    )}
                    {instance.status === "connected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disconnectMutation.mutate({ instanceId: instance.id })}
                        disabled={disconnectMutation.isPending}
                      >
                        <WifiOff className="w-3 h-3 mr-1" />
                        Desconectar
                      </Button>
                    )}
                    {instance.status === "qr_pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInstance(
                          selectedInstance === instance.id ? null : instance.id
                        )}
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        {selectedInstance === instance.id ? "Ocultar QR" : "Ver QR Code"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={() => {
                        if (confirm(`Remover instância "${instance.name}"?`)) {
                          deleteMutation.mutate({ id: instance.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2 text-primary">Como conectar</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Clique em "Criar instância" e dê um nome</li>
              <li>Clique em "Conectar" para gerar o QR Code</li>
              <li>Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo</li>
              <li>Escaneie o QR Code com o celular</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da instância *</Label>
              <Input
                placeholder="Ex: Minha conta principal"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createMutation.mutate({ name: instanceName })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate({ name: instanceName })}
              disabled={!instanceName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar e Conectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
