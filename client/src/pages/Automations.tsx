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
import { Bot, Edit2, Loader2, Plus, Trash2, Users, Zap, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Automations() {
  const utils = trpc.useUtils();
  const { data: automations, isLoading } = trpc.automations.list.useQuery();
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();

  // Load ALL groups from DB (no instance filter needed)
  const { data: allGroups } = trpc.whatsapp.listMonitoredGroups.useQuery({ instanceId: undefined });

  const sourceGroups = allGroups?.filter((g) => g.buscarOfertas) || [];
  const targetGroups = allGroups?.filter((g) => g.enviarOfertas) || [];

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    instanceId: "",
    sourceGroupId: "",
    campaignId: "",
    useLlmSuggestion: false,
    sendDelay: 0,
    targetGroupIds: [] as number[],
  });

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
      targetGroupIds: [],
    });
  }

  function openEdit(automation: any) {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      instanceId: String(automation.instanceId || ""),
      sourceGroupId: String(automation.sourceGroupId),
      campaignId: automation.campaignId ? String(automation.campaignId) : "",
      useLlmSuggestion: automation.useLlmSuggestion,
      sendDelay: automation.sendDelay || 0,
      targetGroupIds: [],
    });
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    if (!form.sourceGroupId) return toast.error("Selecione um grupo de origem");

    // Use first connected instance or first instance available
    const instanceId = form.instanceId
      ? parseInt(form.instanceId)
      : instances?.[0]?.id ?? 0;

    const payload = {
      name: form.name,
      instanceId,
      sourceGroupId: parseInt(form.sourceGroupId),
      campaignId: form.campaignId ? parseInt(form.campaignId) : undefined,
      useLlmSuggestion: form.useLlmSuggestion,
      sendDelay: form.sendDelay,
      targetIds: form.targetGroupIds,
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
      targetGroupIds: prev.targetGroupIds.includes(id)
        ? prev.targetGroupIds.filter((t) => t !== id)
        : [...prev.targetGroupIds, id],
    }));
  }

  const isOpen = showCreate || editingId !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const hasNoGroups = !allGroups || allGroups.length === 0;
  const hasNoSourceGroups = sourceGroups.length === 0;
  const hasNoTargetGroups = targetGroups.length === 0;

  return (
    <AppLayout title="Automações">
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Configure automações para monitorar grupos e substituir links automaticamente.
          </p>
          <Button
            onClick={() => { setEditingId(null); resetForm(); setShowCreate(true); }}
            disabled={hasNoSourceGroups}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Automação
          </Button>
        </div>

        {/* Setup warnings */}
        {hasNoGroups && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Configure os grupos primeiro</p>
              <p className="text-xs text-muted-foreground mt-1">
                Para criar uma automação, você precisa primeiro adicionar grupos na página de Grupos e ativar "Buscar Ofertas" em pelo menos um grupo de origem.
              </p>
              <Button asChild size="sm" className="mt-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                <Link href="/groups">Ir para Grupos</Link>
              </Button>
            </div>
          </div>
        )}

        {!hasNoGroups && hasNoSourceGroups && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Nenhum grupo de origem configurado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ative "Buscar Ofertas" em pelo menos um grupo para poder criar automações.
              </p>
              <Button asChild size="sm" className="mt-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                <Link href="/groups">Configurar Grupos</Link>
              </Button>
            </div>
          </div>
        )}

        {!hasNoSourceGroups && hasNoTargetGroups && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400">Nenhum grupo de destino configurado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ative "Enviar Ofertas" em pelo menos um grupo para definir para onde as mensagens serão enviadas.
              </p>
              <Button asChild size="sm" className="mt-3 bg-blue-500 hover:bg-blue-400 text-black font-semibold">
                <Link href="/groups">Configurar Grupos</Link>
              </Button>
            </div>
          </div>
        )}

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
            {!hasNoSourceGroups && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" /> Criar automação
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {automations?.map((automation) => (
              <Card key={automation.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${automation.isActive ? "bg-green-400" : "bg-muted-foreground"}`}
                      />
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
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Origem: {allGroups?.find((g) => g.id === automation.sourceGroupId)?.groupName || `Grupo #${automation.sourceGroupId}`}
                          </span>
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
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) { setShowCreate(false); setEditingId(null); }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Automação" : "Nova Automação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Ofertas Mercado Livre → Meu Grupo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Source Group */}
            <div className="space-y-2">
              <Label>Grupo de Origem * <span className="text-muted-foreground font-normal text-xs">(com Buscar Ofertas ativo)</span></Label>
              {sourceGroups.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  Nenhum grupo com "Buscar Ofertas" ativo. <Link href="/groups" className="underline font-medium">Configure os grupos</Link>.
                </div>
              ) : (
                <Select
                  value={form.sourceGroupId}
                  onValueChange={(v) => setForm({ ...form, sourceGroupId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo de origem..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceGroups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        🔍 {g.groupName || g.groupJid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Target Groups */}
            <div className="space-y-2">
              <Label>Grupos de Destino <span className="text-muted-foreground font-normal text-xs">(com Enviar Ofertas ativo)</span></Label>
              {targetGroups.length === 0 ? (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                  Nenhum grupo com "Enviar Ofertas" ativo. <Link href="/groups" className="underline font-medium">Configure os grupos</Link>.
                  <p className="mt-1 text-muted-foreground">Sem destinos, as mensagens serão enviadas para todos os grupos de disparo.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {targetGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80"
                    >
                      <input
                        type="checkbox"
                        checked={form.targetGroupIds.includes(g.id)}
                        onChange={() => toggleTarget(g.id)}
                        className="rounded accent-primary"
                      />
                      <span className="text-sm">📤 {g.groupName || g.groupJid}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign */}
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
                  <SelectItem value="none">Nenhuma (usar IA para sugerir)</SelectItem>
                  {campaigns?.filter((c) => c.isActive).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instance (optional) */}
            {instances && instances.length > 0 && (
              <div className="space-y-2">
                <Label>Instância WhatsApp <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
                <Select
                  value={form.instanceId || "auto"}
                  onValueChange={(v) => setForm({ ...form, instanceId: v === "auto" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Automático..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (primeira instância conectada)</SelectItem>
                    {instances.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.name} — {i.status === "connected" ? "✓ Conectado" : i.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* LLM toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-medium">Usar IA para sugerir campanha</p>
                <p className="text-xs text-muted-foreground">
                  A IA analisa o conteúdo e escolhe a melhor campanha automaticamente.
                </p>
              </div>
              <Switch
                checked={form.useLlmSuggestion}
                onCheckedChange={(v) => setForm({ ...form, useLlmSuggestion: v })}
              />
            </div>

            {/* Delay */}
            <div className="space-y-2">
              <Label>Delay de envio (segundos)</Label>
              <Input
                type="number"
                min={0}
                max={300}
                value={form.sendDelay}
                onChange={(e) =>
                  setForm({ ...form, sendDelay: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Aguardar antes de enviar (0 = imediato, máx. 300s).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCreate(false); setEditingId(null); }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.sourceGroupId}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Salvar" : "Criar Automação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
