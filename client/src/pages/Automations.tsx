import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Bot, Edit2, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Automations() {
  const utils = trpc.useUtils();
  const { data: automations, isLoading } = trpc.automations.list.useQuery();
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    instanceId: "",
    sourceGroupId: "",
    campaignId: "",
    useLlmSuggestion: false,
    sendDelay: 0,
    targetIds: [] as number[],
  });

  // Get monitored groups and send targets based on selected instance
  const instanceIdNum = form.instanceId ? parseInt(form.instanceId) : undefined;
  const { data: monitoredGroups } = trpc.whatsapp.listMonitoredGroups.useQuery(
    { instanceId: instanceIdNum },
    { enabled: !!instanceIdNum }
  );
  const { data: sendTargets } = trpc.whatsapp.listSendTargets.useQuery(
    { instanceId: instanceIdNum },
    { enabled: !!instanceIdNum }
  );

  const createMutation = trpc.automations.create.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      setShowCreate(false);
      resetForm();
      toast.success("Automação criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.automations.update.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      setEditingId(null);
      toast.success("Automação atualizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.automations.delete.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      toast.success("Automação removida!");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.automations.update.useMutation({
    onSuccess: () => utils.automations.list.invalidate(),
  });

  function resetForm() {
    setForm({
      name: "",
      instanceId: "",
      sourceGroupId: "",
      campaignId: "",
      useLlmSuggestion: false,
      sendDelay: 0,
      targetIds: [],
    });
  }

  function openEdit(automation: any) {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      instanceId: String(automation.instanceId),
      sourceGroupId: String(automation.sourceGroupId),
      campaignId: automation.campaignId ? String(automation.campaignId) : "",
      useLlmSuggestion: automation.useLlmSuggestion,
      sendDelay: automation.sendDelay || 0,
      targetIds: [],
    });
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    if (!form.instanceId) return toast.error("Selecione uma instância");
    if (!form.sourceGroupId) return toast.error("Selecione um grupo de origem");

    const payload = {
      name: form.name,
      instanceId: parseInt(form.instanceId),
      sourceGroupId: parseInt(form.sourceGroupId),
      campaignId: form.campaignId ? parseInt(form.campaignId) : undefined,
      useLlmSuggestion: form.useLlmSuggestion,
      sendDelay: form.sendDelay,
      targetIds: form.targetIds,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function toggleTarget(id: number) {
    setForm((prev) => ({
      ...prev,
      targetIds: prev.targetIds.includes(id)
        ? prev.targetIds.filter((t) => t !== id)
        : [...prev.targetIds, id],
    }));
  }

  const isOpen = showCreate || editingId !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout title="Automações">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Configure automações para monitorar grupos e substituir links automaticamente.
          </p>
          <Button onClick={() => { setEditingId(null); resetForm(); setShowCreate(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Automação
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : automations?.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie uma automação para começar a substituir links automaticamente.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Criar automação
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {automations?.map((automation) => (
              <Card key={automation.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${automation.isActive ? "bg-green-400" : "bg-muted-foreground"}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{automation.name}</h3>
                          {automation.useLlmSuggestion && (
                            <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                              <Zap className="w-2.5 h-2.5" /> IA
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Instância: {instances?.find((i) => i.id === automation.instanceId)?.name || automation.instanceId}</span>
                          {automation.sendDelay > 0 && (
                            <span>Delay: {automation.sendDelay}s</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        checked={automation.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: automation.id, isActive: checked })
                        }
                      />
                      <Button size="sm" variant="ghost" onClick={() => openEdit(automation)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remover automação "${automation.name}"?`)) {
                            deleteMutation.mutate({ id: automation.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingId(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Automação" : "Nova Automação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Substituir links Amazon"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Instância WhatsApp *</Label>
              <Select value={form.instanceId} onValueChange={(v) => setForm({ ...form, instanceId: v, sourceGroupId: "", targetIds: [] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instância..." />
                </SelectTrigger>
                <SelectContent>
                  {instances?.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name} — {i.status === "connected" ? "✓ Conectado" : i.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grupo de Origem *</Label>
              <Select
                value={form.sourceGroupId}
                onValueChange={(v) => setForm({ ...form, sourceGroupId: v })}
                disabled={!form.instanceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.instanceId ? "Selecione o grupo..." : "Selecione uma instância primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {monitoredGroups?.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.groupName || g.groupJid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Campanha de Afiliado</Label>
              <Select
                value={form.campaignId || "none"}
                onValueChange={(v) => setForm({ ...form, campaignId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (usar IA)</SelectItem>
                  {campaigns?.filter((c) => c.isActive).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destinos de Envio</Label>
              {!form.instanceId ? (
                <p className="text-xs text-muted-foreground">Selecione uma instância primeiro.</p>
              ) : !sendTargets || sendTargets.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum destino configurado para esta instância.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sendTargets.map((target) => (
                    <label key={target.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80">
                      <input
                        type="checkbox"
                        checked={form.targetIds.includes(target.id)}
                        onChange={() => toggleTarget(target.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{target.targetName || target.targetJid}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {target.targetType === "group" ? "Grupo" : "Contato"}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-medium">Usar IA para sugerir campanha</p>
                <p className="text-xs text-muted-foreground">A IA analisa o conteúdo e escolhe a melhor campanha.</p>
              </div>
              <Switch
                checked={form.useLlmSuggestion}
                onCheckedChange={(v) => setForm({ ...form, useLlmSuggestion: v })}
              />
            </div>

            <div className="space-y-2">
              <Label>Delay de envio (segundos)</Label>
              <Input
                type="number"
                min={0}
                max={300}
                value={form.sendDelay}
                onChange={(e) => setForm({ ...form, sendDelay: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Aguardar antes de enviar (0 = imediato).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
