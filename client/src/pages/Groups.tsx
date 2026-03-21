import AppLayout from "@/components/AppLayout";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2, Plus, Radio, Send, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Groups() {
  const utils = trpc.useUtils();
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const connectedInstances = instances?.filter((i) => i.status === "connected") || [];

  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const instanceId = selectedInstanceId ?? connectedInstances[0]?.id;

  const { data: monitoredGroups, isLoading: monLoading } = trpc.whatsapp.listMonitoredGroups.useQuery(
    { instanceId },
    { enabled: !!instanceId }
  );
  const { data: sendTargets, isLoading: targetsLoading } = trpc.whatsapp.listSendTargets.useQuery(
    { instanceId },
    { enabled: !!instanceId }
  );
  const { data: availableGroups, isLoading: groupsLoading } = trpc.whatsapp.getGroups.useQuery(
    { instanceId: instanceId! },
    { enabled: !!instanceId }
  );

  // Monitored group dialog
  const [showAddMonitor, setShowAddMonitor] = useState(false);
  const [monitorForm, setMonitorForm] = useState({ groupJid: "", groupName: "" });

  // Send target dialog
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [targetForm, setTargetForm] = useState({ targetJid: "", targetName: "", targetType: "group" as "group" | "contact" });

  const addMonitorMutation = trpc.whatsapp.addMonitoredGroup.useMutation({
    onSuccess: () => {
      utils.whatsapp.listMonitoredGroups.invalidate();
      setShowAddMonitor(false);
      setMonitorForm({ groupJid: "", groupName: "" });
      toast.success("Grupo adicionado para monitoramento!");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMonitorMutation = trpc.whatsapp.removeMonitoredGroup.useMutation({
    onSuccess: () => {
      utils.whatsapp.listMonitoredGroups.invalidate();
      toast.success("Grupo removido do monitoramento!");
    },
  });

  const toggleMonitorMutation = trpc.whatsapp.updateMonitoredGroup.useMutation({
    onSuccess: () => utils.whatsapp.listMonitoredGroups.invalidate(),
  });

  const addTargetMutation = trpc.whatsapp.addSendTarget.useMutation({
    onSuccess: () => {
      utils.whatsapp.listSendTargets.invalidate();
      setShowAddTarget(false);
      setTargetForm({ targetJid: "", targetName: "", targetType: "group" });
      toast.success("Destino adicionado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeTargetMutation = trpc.whatsapp.removeSendTarget.useMutation({
    onSuccess: () => {
      utils.whatsapp.listSendTargets.invalidate();
      toast.success("Destino removido!");
    },
  });

  const toggleTargetMutation = trpc.whatsapp.updateSendTarget.useMutation({
    onSuccess: () => utils.whatsapp.listSendTargets.invalidate(),
  });

  if (connectedInstances.length === 0) {
    return (
      <AppLayout title="Grupos & Destinos">
        <div className="p-6">
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum WhatsApp conectado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Conecte sua conta do WhatsApp primeiro para gerenciar grupos.
            </p>
            <Button asChild variant="outline">
              <a href="/whatsapp">Conectar WhatsApp</a>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Grupos & Destinos">
      <div className="p-6 space-y-6">
        {/* Instance selector */}
        {connectedInstances.length > 1 && (
          <div className="flex items-center gap-3">
            <Label className="text-sm">Instância:</Label>
            <Select
              value={String(instanceId)}
              onValueChange={(v) => setSelectedInstanceId(parseInt(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connectedInstances.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs defaultValue="monitor">
          <TabsList>
            <TabsTrigger value="monitor" className="gap-2">
              <Radio className="w-4 h-4" /> Grupos Monitorados
            </TabsTrigger>
            <TabsTrigger value="targets" className="gap-2">
              <Send className="w-4 h-4" /> Destinos de Envio
            </TabsTrigger>
          </TabsList>

          {/* Monitored Groups Tab */}
          <TabsContent value="monitor" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Grupos cujas mensagens serão monitoradas para substituição de links.
              </p>
              <Button size="sm" onClick={() => setShowAddMonitor(true)}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar Grupo
              </Button>
            </div>

            {monLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : monitoredGroups?.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum grupo monitorado ainda.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddMonitor(true)}>
                  Adicionar grupo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {monitoredGroups?.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${group.isActive ? "bg-green-400" : "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{group.groupName || group.groupJid}</p>
                        <p className="text-xs text-muted-foreground font-mono">{group.groupJid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={group.isActive ? "default" : "secondary"} className="text-xs">
                        {group.isActive ? "Ativo" : "Pausado"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMonitorMutation.mutate({ id: group.id, isActive: !group.isActive })}
                      >
                        {group.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeMonitorMutation.mutate({ id: group.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Send Targets Tab */}
          <TabsContent value="targets" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Grupos e contatos para onde os posts modificados serão enviados.
              </p>
              <Button size="sm" onClick={() => setShowAddTarget(true)}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar Destino
              </Button>
            </div>

            {targetsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sendTargets?.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum destino configurado.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddTarget(true)}>
                  Adicionar destino
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sendTargets?.map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${target.isActive ? "bg-blue-400" : "bg-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{target.targetName || target.targetJid}</p>
                        <p className="text-xs text-muted-foreground font-mono">{target.targetJid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {target.targetType === "group" ? "Grupo" : "Contato"}
                      </Badge>
                      <Badge variant={target.isActive ? "default" : "secondary"} className="text-xs">
                        {target.isActive ? "Ativo" : "Pausado"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleTargetMutation.mutate({ id: target.id, isActive: !target.isActive })}
                      >
                        {target.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeTargetMutation.mutate({ id: target.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Monitor Dialog */}
      <Dialog open={showAddMonitor} onOpenChange={setShowAddMonitor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Grupo para Monitorar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {availableGroups && availableGroups.length > 0 && (
              <div className="space-y-2">
                <Label>Selecionar grupo existente</Label>
                <Select onValueChange={(v) => {
                  const group = availableGroups.find((g) => g.id === v);
                  if (group) setMonitorForm({ groupJid: group.id, groupName: group.subject });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.subject} ({g.participantCount} membros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>JID do Grupo *</Label>
              <Input
                placeholder="Ex: 120363000000000000@g.us"
                value={monitorForm.groupJid}
                onChange={(e) => setMonitorForm({ ...monitorForm, groupJid: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                O JID é o identificador único do grupo no WhatsApp (termina em @g.us).
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nome do Grupo</Label>
              <Input
                placeholder="Nome para identificação"
                value={monitorForm.groupName}
                onChange={(e) => setMonitorForm({ ...monitorForm, groupName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMonitor(false)}>Cancelar</Button>
            <Button
              onClick={() => addMonitorMutation.mutate({
                instanceId: instanceId!,
                groupJid: monitorForm.groupJid,
                groupName: monitorForm.groupName || undefined,
              })}
              disabled={!monitorForm.groupJid.trim() || addMonitorMutation.isPending}
            >
              {addMonitorMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Target Dialog */}
      <Dialog open={showAddTarget} onOpenChange={setShowAddTarget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Destino de Envio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {availableGroups && availableGroups.length > 0 && (
              <div className="space-y-2">
                <Label>Selecionar grupo existente</Label>
                <Select onValueChange={(v) => {
                  const group = availableGroups.find((g) => g.id === v);
                  if (group) setTargetForm({ ...targetForm, targetJid: group.id, targetName: group.subject });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.subject} ({g.participantCount} membros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={targetForm.targetType}
                onValueChange={(v) => setTargetForm({ ...targetForm, targetType: v as "group" | "contact" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Grupo</SelectItem>
                  <SelectItem value="contact">Contato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>JID do Destino *</Label>
              <Input
                placeholder={targetForm.targetType === "group" ? "120363000000000000@g.us" : "5511999999999@s.whatsapp.net"}
                value={targetForm.targetJid}
                onChange={(e) => setTargetForm({ ...targetForm, targetJid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome para identificação"
                value={targetForm.targetName}
                onChange={(e) => setTargetForm({ ...targetForm, targetName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTarget(false)}>Cancelar</Button>
            <Button
              onClick={() => addTargetMutation.mutate({
                instanceId: instanceId!,
                targetJid: targetForm.targetJid,
                targetName: targetForm.targetName || undefined,
                targetType: targetForm.targetType,
              })}
              disabled={!targetForm.targetJid.trim() || addTargetMutation.isPending}
            >
              {addTargetMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
