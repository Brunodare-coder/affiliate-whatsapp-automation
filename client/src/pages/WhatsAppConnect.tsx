import AppLayout from "@/components/AppLayout";
import { Link } from "wouter";
import { Shield, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";

function QRCodeDisplay({ instanceId }: { instanceId: number }) {
  const utils = trpc.useUtils();
  const refreshQR = trpc.whatsapp.refreshQR.useMutation({
    onSuccess: () => {
      // Start polling immediately after refresh
      setTimeout(() => utils.whatsapp.getQRCode.invalidate({ instanceId }), 500);
    },
    onError: (e) => {
      // Even on error, try to refetch in case QR was generated
      utils.whatsapp.getQRCode.invalidate({ instanceId });
    },
  });

  const { data, isLoading, refetch } = trpc.whatsapp.getQRCode.useQuery(
    { instanceId },
    {
      // Poll every 1.5s while connecting/waiting for QR, every 3s when QR is shown
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "connecting") return 1500;
        if (status === "qr_pending") return 2000;
        return false;
      },
      // Start polling immediately even before first data arrives
      refetchIntervalInBackground: true,
      staleTime: 0,
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
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/20 flex items-center justify-center">
          <Wifi className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-green-400 font-semibold">WhatsApp conectado!</p>
      </div>
    );
  }

  if (data?.qrCode) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 rounded-2xl bg-white">
          <img src={data.qrCode} alt="QR Code WhatsApp" className="w-44 h-44 rounded-lg" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
          Abra o WhatsApp → <strong className="text-foreground">Dispositivos conectados</strong> → Conectar dispositivo
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refreshQR.mutate({ instanceId })}
          disabled={refreshQR.isPending}
          className="border-white/10 bg-white/5 hover:bg-white/10"
        >
          {refreshQR.isPending
            ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            : <RefreshCw className="w-3 h-3 mr-1.5" />
          }
          {refreshQR.isPending ? "Gerando novo QR..." : "Atualizar QR"}
        </Button>
      </div>
    );
  }

  // Status: connecting — show animated waiting state
  if (data?.status === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">Gerando QR Code...</p>
        <p className="text-xs text-muted-foreground">Aguarde alguns segundos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <QrCode className="w-12 h-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">QR Code não disponível</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => refreshQR.mutate({ instanceId })}
          disabled={refreshQR.isPending}
          className="border-white/10 bg-white/5 hover:bg-white/10"
        >
          {refreshQR.isPending
            ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            : <RefreshCw className="w-3 h-3 mr-1.5" />
          }
          {refreshQR.isPending ? "Gerando..." : "Gerar QR"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-muted-foreground">
          Verificar
        </Button>
      </div>
    </div>
  );
}

export default function WhatsAppConnect() {
  const utils = trpc.useUtils();
  const { data: sub, isLoading: subLoading } = trpc.subscription.get.useQuery();
  // Use full query (includes qrCode) only on this page; sidebar uses light query
  const [qrPollInterval, setQrPollInterval] = useState(2000);
  const { data: instances, isLoading } = trpc.whatsapp.listInstancesFull.useQuery(undefined, {
    refetchInterval: qrPollInterval,
  });
  // Adjust poll interval based on connection state
  useEffect(() => {
    if (!instances) return;
    const hasActive = (instances as Array<{status: string}>).some(
      (i) => i.status === "qr_pending" || i.status === "connecting"
    );
    setQrPollInterval(hasActive ? 2000 : 5000);
  }, [instances]);
  const [showCreate, setShowCreate] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<number | null>(null);

  const createMutation = trpc.whatsapp.createInstance.useMutation({
    onSuccess: (data) => {
      utils.whatsapp.listInstancesFull.invalidate();
      utils.whatsapp.listInstances.invalidate();
      setShowCreate(false);
      setInstanceName("");
      toast.success("Instância criada! Conectando...");
      connectMutation.mutate({ instanceId: data.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => { utils.whatsapp.listInstancesFull.invalidate(); utils.whatsapp.listInstances.invalidate(); toast.success("Iniciando conexão..."); },
    onError: (e) => toast.error(e.message),
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => { utils.whatsapp.listInstancesFull.invalidate(); utils.whatsapp.listInstances.invalidate(); toast.success("Desconectado!"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.whatsapp.deleteInstance.useMutation({
    onSuccess: () => { utils.whatsapp.listInstancesFull.invalidate(); utils.whatsapp.listInstances.invalidate(); setSelectedInstance(null); toast.success("Instância removida!"); },
    onError: (e) => toast.error(e.message),
  });

  function getStatusColor(status: string) {
    switch (status) {
      case "connected": return "bg-green-400 shadow-sm shadow-green-400/50";
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

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "connected": return "bg-green-500/15 text-green-400";
      case "connecting": case "qr_pending": return "bg-yellow-500/15 text-yellow-400";
      default: return "bg-white/8 text-muted-foreground";
    }
  }

  if (!subLoading && sub && !sub.isActive) {
    return (
      <AppLayout title="WhatsApp">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold section-title">Acesso Bloqueado</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                {sub.status === "trial" ? "Seu período de teste de 60 minutos expirou." : "Sua assinatura expirou."}
                {" "}Para continuar usando o bot, assine um dos planos disponíveis.
              </p>
            </div>
            <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/30 border-0 h-11">
              <Link href="/subscription">
                <Zap className="w-4 h-4 mr-2" />
                Ver Planos e Assinar
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="WhatsApp">
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Conecte sua conta do WhatsApp para monitorar grupos e enviar mensagens.</p>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/25 border-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Instância
          </Button>
        </div>

        {/* Instances */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-2xl border border-white/8 animate-pulse" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }} />
            ))}
          </div>
        ) : instances?.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10" style={{ background: "oklch(0.12 0.018 250 / 0.5)" }}>
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto mb-5">
              <Smartphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold section-title mb-2">Nenhuma instância configurada</h3>
            <p className="text-muted-foreground text-sm mb-6">Crie uma instância e conecte sua conta do WhatsApp.</p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-green-500/25 border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Criar instância
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances?.map((instance) => (
              <div key={instance.id} className="rounded-2xl border border-white/8 overflow-hidden transition-all duration-200 hover:border-white/15"
                style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
                {/* Card header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-400" />
                      <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[oklch(0.12_0.018_250)] ${getStatusColor(instance.status)}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm section-title">{instance.name}</p>
                      {instance.phoneNumber && (
                        <p className="text-xs text-muted-foreground">+{instance.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClass(instance.status)}`}>
                    {getStatusLabel(instance.status)}
                  </span>
                </div>

                {/* QR Code section */}
                {(instance.status === "qr_pending" || selectedInstance === instance.id) && (
                  <div className="p-5 border-b border-white/5">
                    <QRCodeDisplay instanceId={instance.id} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 p-4">
                  {instance.status === "disconnected" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedInstance(instance.id);
                        connectMutation.mutate({ instanceId: instance.id });
                      }}
                      disabled={connectMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0 shadow-sm shadow-green-500/25"
                    >
                      {connectMutation.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Wifi className="w-3 h-3 mr-1.5" />}
                      Conectar
                    </Button>
                  )}
                  {instance.status === "connected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disconnectMutation.mutate({ instanceId: instance.id })}
                      disabled={disconnectMutation.isPending}
                      className="border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      <WifiOff className="w-3 h-3 mr-1.5" />
                      Desconectar
                    </Button>
                  )}
                  {instance.status === "qr_pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInstance(selectedInstance === instance.id ? null : instance.id)}
                      className="border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <QrCode className="w-3 h-3 mr-1.5" />
                      {selectedInstance === instance.id ? "Ocultar QR" : "Ver QR Code"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 ml-auto"
                    onClick={() => {
                      if (confirm(`Remover instância "${instance.name}"?`)) {
                        deleteMutation.mutate({ id: instance.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How to connect */}
        <div className="rounded-2xl border border-green-500/15 p-5" style={{ background: "linear-gradient(135deg, oklch(0.68 0.22 145 / 0.06) 0%, oklch(0.58 0.20 220 / 0.04) 100%)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-green-400" />
            </div>
            <h4 className="font-bold text-sm section-title text-green-300">Como conectar</h4>
          </div>
          <ol className="space-y-2.5">
            {[
              "Clique em \"Nova Instância\" e dê um nome para identificar",
              "Clique em \"Conectar\" para gerar o QR Code",
              "Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo",
              "Escaneie o QR Code com o celular",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="border-white/10" style={{ background: "oklch(0.12 0.018 250)" }}>
          <DialogHeader>
            <DialogTitle className="section-title">Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome da instância</Label>
              <Input
                placeholder="Ex: Minha conta principal"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createMutation.mutate({ name: instanceName })}
                className="border-white/10 bg-white/5 focus:border-green-500/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 bg-white/5 hover:bg-white/10">Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate({ name: instanceName })}
              disabled={!instanceName.trim() || createMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0"
            >
              {createMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Criando...</> : "Criar e Conectar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
