import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Bot,
  ChevronRight,
  Copy,
  Download,
  Edit2,
  Image,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Target,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type GroupFlag = "buscarOfertas" | "espelharConteudo" | "enviarOfertas" | "substituirImagem";

// ─── Modal Configurar Grupos de Disparo ──────────────────────────────────────
function ConfigureTargetsModal({
  sourceGroup,
  allGroups,
  currentTargetIds,
  onSave,
  onClose,
}: {
  sourceGroup: { id: number; groupName: string | null; groupJid: string };
  allGroups: Array<{ id: number; groupName: string | null; groupJid: string; enviarOfertas: boolean }>;
  currentTargetIds: number[];
  onSave: (ids: number[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set(currentTargetIds));
  const targets = allGroups.filter((g) => g.enviarOfertas && g.id !== sourceGroup.id);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(targets.map((g) => g.id)));
  const selectNone = () => setSelected(new Set());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-orange-500/30">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Configurar Grupos de Disparo</h3>
              <p className="text-orange-100 text-sm mt-0.5 font-mono">
                {sourceGroup.groupName || sourceGroup.groupJid}
              </p>
            </div>
            <button onClick={onClose} className="text-orange-100 hover:text-white mt-0.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-[#0f172a] p-5">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-300">
              <span className="font-semibold">Selecione</span> os grupos de disparo que receberão as mensagens
              deste grupo monitorado. Se nenhum for selecionado, as mensagens serão enviadas para{" "}
              <strong>todos</strong> os grupos de disparo.
            </p>
          </div>
          {targets.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum grupo com <strong>Enviar Ofertas</strong> ativo ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {targets.map((g) => {
                const isChecked = selected.has(g.id);
                return (
                  <label
                    key={g.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
                      isChecked ? "bg-orange-500/10 border-orange-500/40" : "bg-[#1e293b] border-[#1e293b] hover:border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                        isChecked ? "bg-orange-500 border-orange-500" : "border-muted-foreground"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {g.groupName || g.groupJid}
                      </p>
                      <p className="text-xs text-muted-foreground">Grupo</p>
                    </div>
                    <input type="checkbox" checked={isChecked} onChange={() => toggle(g.id)} className="sr-only" />
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-[#0f172a] border-t border-border px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-sm text-orange-400 hover:text-orange-300 font-medium">Todos</button>
              <span className="text-muted-foreground">|</span>
              <button onClick={selectNone} className="text-sm text-orange-400 hover:text-orange-300 font-medium">Nenhum</button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={() => onSave(Array.from(selected))} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              ✓ Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Adicionar Grupo ────────────────────────────────────────────────────
function AddGroupModal({
  instances,
  onAdd,
  onClose,
}: {
  instances: Array<{ id: number; name: string; status: string }>;
  onAdd: (data: { instanceId: number; groupJid: string; groupName: string }) => void;
  onClose: () => void;
}) {
  const [instanceId, setInstanceId] = useState(instances[0]?.id ?? 0);
  const [groupName, setGroupName] = useState("");
  const [groupJid, setGroupJid] = useState("");

  const handleSubmit = () => {
    if (!groupName.trim()) return toast.error("Nome do grupo é obrigatório");
    const jid = groupJid.trim() || `${groupName.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}@g.us`;
    onAdd({ instanceId, groupJid: jid, groupName: groupName.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-base">Adicionar Grupo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-400">
              💡 Dica: Conecte seu WhatsApp e use <strong>"Sincronizar do WA"</strong> para importar todos os grupos automaticamente.
            </p>
          </div>
          {instances.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Instância WhatsApp</label>
              <select
                value={instanceId}
                onChange={(e) => setInstanceId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.status === "connected" ? "✓ Conectado" : ""}
                  </option>
                ))}
                <option value={0}>Sem instância (manual)</option>
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome do Grupo *</label>
            <input
              type="text"
              placeholder="Ex: Grupo Ofertas Amazon"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              JID do Grupo <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 5511999999999-1234567890@g.us"
              value={groupJid}
              onChange={(e) => setGroupJid(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground font-mono"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} className="flex-1">Adicionar Grupo</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Linha de opção do grupo ──────────────────────────────────────────────────
function GroupOptionRow({
  icon,
  label,
  sublabel,
  sublabelColor,
  checked,
  onToggle,
  rightContent,
  onClick,
  highlight,
  targetCount,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  sublabelColor?: string;
  checked?: boolean;
  onToggle?: (v: boolean) => void;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
  targetCount?: number;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 ${
        onClick ? "cursor-pointer hover:bg-white/5 transition-colors" : ""
      } ${highlight ? "bg-orange-500/5" : ""}`}
      onClick={onClick}
    >
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${highlight ? "text-orange-400" : "text-foreground"}`}>{label}</p>
        {sublabel && (
          <p className={`text-xs mt-0.5 ${sublabelColor || "text-muted-foreground"}`}>{sublabel}</p>
        )}
      </div>
      {targetCount !== undefined && targetCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
          {targetCount}
        </span>
      )}
      {rightContent}
      {onToggle !== undefined && (
        <Switch
          checked={checked ?? false}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {onClick && !onToggle && (
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  );
}

// ─── Aba: Grupos ──────────────────────────────────────────────────────────────
function GroupsTab() {
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const [search, setSearch] = useState("");
  const [targetSourceGroup, setTargetSourceGroup] = useState<{
    id: number;
    groupName: string | null;
    groupJid: string;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const connectedInstances = instances?.filter((i) => i.status === "connected") || [];
  const firstConnectedId = connectedInstances[0]?.id ?? null;

  const { data: savedGroups, refetch: refetchSaved, isLoading: loadingGroups } =
    trpc.whatsapp.listMonitoredGroups.useQuery({ instanceId: undefined });

  const { data: groupTargets, refetch: refetchTargets } =
    trpc.whatsapp.getGroupTargets.useQuery({ sourceGroupId: undefined });

  const { data: botSettings, refetch: refetchBotSettings } = trpc.botSettings.get.useQuery();
  const saveBotSettings = trpc.botSettings.save.useMutation({
    onSuccess: () => { refetchBotSettings(); toast.success("Configuração salva!"); },
  });

  const addGroup = trpc.whatsapp.addMonitoredGroup.useMutation({
    onSuccess: () => { refetchSaved(); setShowAddModal(false); toast.success("Grupo adicionado!"); },
    onError: (e) => toast.error(e.message),
  });

  const updateGroup = trpc.whatsapp.updateMonitoredGroup.useMutation({
    onSuccess: () => refetchSaved(),
  });

  const removeGroup = trpc.whatsapp.removeMonitoredGroup.useMutation({
    onSuccess: () => { refetchSaved(); toast.success("Grupo removido!"); },
  });

  const syncGroups = trpc.whatsapp.syncGroupsFromWA.useMutation({
    onSuccess: (data) => {
      refetchSaved();
      toast.success(`Sincronizado! ${data.added} novos grupos importados de ${data.total} grupos no WA.`);
    },
    onError: (e) => toast.error("Erro ao sincronizar: " + e.message),
  });

  const setTargets = trpc.whatsapp.setGroupTargets.useMutation({
    onSuccess: () => {
      refetchTargets();
      toast.success("Alvos configurados!");
      setTargetSourceGroup(null);
    },
  });

  const filteredGroups = useMemo(
    () => (savedGroups || []).filter((g) =>
      (g.groupName || g.groupJid).toLowerCase().includes(search.toLowerCase())
    ),
    [savedGroups, search]
  );

  const handleToggle = async (group: NonNullable<typeof savedGroups>[0], flag: GroupFlag, value: boolean) => {
    try {
      await updateGroup.mutateAsync({ id: group.id, [flag]: value });
    } catch {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleSaveTargets = async (targetIds: number[]) => {
    if (!targetSourceGroup) return;
    await setTargets.mutateAsync({ sourceGroupId: targetSourceGroup.id, targetGroupIds: targetIds });
  };

  const getTargetCount = (sourceId: number) =>
    groupTargets?.filter((t) => t.sourceGroupId === sourceId).length ?? 0;

  const targetModalGroups = (savedGroups || []).map((sg) => ({
    id: sg.id,
    groupName: sg.groupName ?? null,
    groupJid: sg.groupJid,
    enviarOfertas: sg.enviarOfertas,
  }));

  const targetCurrentIds = targetSourceGroup
    ? groupTargets?.filter((t) => t.sourceGroupId === targetSourceGroup.id).map((t) => t.targetGroupId) ?? []
    : [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Configure como usar as ofertas de cada grupo</p>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { refetchSaved(); refetchTargets(); }} className="gap-2 border-white/10 bg-white/5 hover:bg-white/10">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
          {firstConnectedId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncGroups.mutate({ instanceId: firstConnectedId })}
              disabled={syncGroups.isPending}
              className="gap-2 border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/15 text-blue-300"
            >
              {syncGroups.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Sincronizar do WA
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0 shadow-sm shadow-green-500/20">
            <Plus className="w-3.5 h-3.5" /> Adicionar Grupo
          </Button>
        </div>
      </div>

      {/* Como usar */}
      <div className="rounded-2xl border border-white/8 p-4" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
        <details>
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-green-400">
            <span className="w-5 h-5 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center text-xs">ℹ</span>
            Como usar as configurações
          </summary>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground pl-7">
            <p>🔍 <strong className="text-foreground">Buscar Ofertas</strong> — monitora e captura links de produtos neste grupo</p>
            <p>📤 <strong className="text-foreground">Enviar Ofertas</strong> — este grupo receberá as mensagens processadas com seus links de afiliado</p>
            <p>🔗 <strong className="text-foreground">Configurar Alvos</strong> — define quais grupos de disparo receberão as mensagens deste grupo</p>
            <p>🔄 <strong className="text-foreground">Espelhar</strong> — replica mensagens sem converter links (para canais de notícias)</p>
            <p>🖼️ <strong className="text-foreground">Substituir Imagem</strong> — busca a imagem oficial do produto no site da loja</p>
          </div>
        </details>
      </div>

      {/* No WA connected */}
      {connectedInstances.length === 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Smartphone className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-400">WhatsApp não conectado</p>
            <p className="text-xs text-muted-foreground">
              Você pode adicionar grupos manualmente agora e sincronizar depois que conectar.
            </p>
          </div>
          <Button asChild size="sm" className="bg-green-500 hover:bg-green-400 text-black font-semibold flex-shrink-0">
            <Link href="/whatsapp">Conectar</Link>
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar grupos ou canais..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500/40 placeholder:text-muted-foreground"
        />
      </div>

      {loadingGroups && (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando grupos...</span>
        </div>
      )}

      {!loadingGroups && filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{search ? "Nenhum grupo encontrado" : "Nenhum grupo cadastrado ainda"}</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Tente outra busca." : "Adicione grupos manualmente ou conecte o WhatsApp e sincronize."}
            </p>
          </div>
          {!search && (
            <div className="flex gap-2 flex-wrap justify-center">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="w-3.5 h-3.5" /> Adicionar Manualmente
              </Button>
              {firstConnectedId && (
                <Button
                  size="sm"
                  onClick={() => syncGroups.mutate({ instanceId: firstConnectedId })}
                  disabled={syncGroups.isPending}
                  className="gap-2"
                >
                  {syncGroups.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Sincronizar do WA
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {!loadingGroups && filteredGroups.length > 0 && (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const targetCount = getTargetCount(group.id);
            const groupType = group.groupJid.endsWith("@broadcast") ? "CANAL" : "GRUPO";
            const isCanal = groupType === "CANAL";

            return (
              <div key={group.id} className="rounded-2xl overflow-hidden border border-white/8 hover:border-white/12 transition-all" style={{ background: "oklch(0.12 0.018 250 / 0.9)" }}>
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: "oklch(0.10 0.015 250 / 0.8)" }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ isCanal ? "bg-green-500/15 border border-green-500/20" : "bg-blue-500/15 border border-blue-500/20" }`}>
                    {isCanal
                      ? <Zap className="w-4 h-4 text-green-400" />
                      : <Users className="w-4 h-4 text-blue-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm section-title truncate">
                      {group.groupName || group.groupJid}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate opacity-50">
                      {group.groupJid}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border flex-shrink-0 ${ isCanal ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20" }`}>
                    {groupType}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${group.groupName || group.groupJid}"?`)) {
                        removeGroup.mutate({ id: group.id });
                      }
                    }}
                    className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  <GroupOptionRow
                    icon={<BarChart2 className="w-4 h-4" />}
                    label="Buscar Ofertas"
                    sublabel={group.buscarOfertas ? "● Busca links" : "○ Inativo"}
                    sublabelColor={group.buscarOfertas ? "text-green-400" : "text-muted-foreground"}
                    checked={group.buscarOfertas}
                    onToggle={(v) => handleToggle(group, "buscarOfertas", v)}
                  />
                  <GroupOptionRow
                    icon={<AlertTriangle className="w-4 h-4" />}
                    label="Enviar Ofertas"
                    sublabel={group.enviarOfertas ? "● Converte links" : "○ Inativo"}
                    sublabelColor={group.enviarOfertas ? "text-yellow-400" : "text-muted-foreground"}
                    checked={group.enviarOfertas}
                    onToggle={(v) => handleToggle(group, "enviarOfertas", v)}
                  />
                  <GroupOptionRow
                    icon={<Link2 className="w-4 h-4 text-orange-400" />}
                    label="Configurar Alvos"
                    sublabel={targetCount > 0 ? `${targetCount} grupo(s) selecionado(s)` : undefined}
                    sublabelColor="text-orange-300"
                    highlight
                    targetCount={targetCount > 0 ? targetCount : undefined}
                    onClick={() =>
                      setTargetSourceGroup({
                        id: group.id,
                        groupName: group.groupName ?? null,
                        groupJid: group.groupJid,
                      })
                    }
                  />
                  <GroupOptionRow
                    icon={<Copy className="w-4 h-4" />}
                    label="Espelhar"
                    sublabel={group.espelharConteudo ? "● Ativo" : "✕ sem links"}
                    sublabelColor={group.espelharConteudo ? "text-blue-400" : "text-red-400"}
                    checked={group.espelharConteudo}
                    onToggle={(v) => handleToggle(group, "espelharConteudo", v)}
                  />
                  <GroupOptionRow
                    icon={<Image className="w-4 h-4 text-purple-400" />}
                    label="Substituir Imagem"
                    sublabel={group.substituirImagem ? "● Busca imagens" : "○ Inativo"}
                    sublabelColor={group.substituirImagem ? "text-purple-400" : "text-muted-foreground"}
                    checked={group.substituirImagem}
                    onToggle={(v) => handleToggle(group, "substituirImagem", v)}
                  />
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Target className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-medium flex-1">Ordem do link</p>
                    <Select
                      value={botSettings?.linkOrder ?? "first"}
                      onValueChange={(v) => saveBotSettings.mutate({ linkOrder: v as "first" | "last" })}
                    >
                      <SelectTrigger className="w-28 h-7 text-xs bg-[#0f172a] border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first">Primeiro</SelectItem>
                        <SelectItem value="last">Último</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {targetSourceGroup && (
        <ConfigureTargetsModal
          sourceGroup={targetSourceGroup}
          allGroups={targetModalGroups}
          currentTargetIds={targetCurrentIds}
          onSave={handleSaveTargets}
          onClose={() => setTargetSourceGroup(null)}
        />
      )}
      {showAddModal && (
        <AddGroupModal
          instances={instances || []}
          onAdd={(data) => addGroup.mutate(data)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ─── Aba: Automações ──────────────────────────────────────────────────────────
function AutomationsTab() {
  const utils = trpc.useUtils();
  const { data: automations, isLoading } = trpc.automations.list.useQuery();
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: campaigns } = trpc.campaigns.list.useQuery();
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
    setForm({ name: "", instanceId: "", sourceGroupId: "", campaignId: "", useLlmSuggestion: false, sendDelay: 0, targetGroupIds: [] });
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

    const instanceId = form.instanceId ? parseInt(form.instanceId) : instances?.[0]?.id ?? 0;
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

  const isOpen = showCreate || editingId !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const hasNoGroups = !allGroups || allGroups.length === 0;
  const hasNoSourceGroups = sourceGroups.length === 0;
  const hasNoTargetGroups = targetGroups.length === 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure automações para monitorar grupos e substituir links automaticamente.
        </p>
        <Button
          onClick={() => { setEditingId(null); resetForm(); setShowCreate(true); }}
          disabled={hasNoSourceGroups}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Automação
        </Button>
      </div>

      {/* Warnings */}
      {hasNoGroups && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">Configure os grupos primeiro</p>
            <p className="text-xs text-muted-foreground mt-1">
              Para criar uma automação, você precisa primeiro adicionar grupos na aba de Grupos e ativar "Buscar Ofertas" em pelo menos um grupo de origem.
            </p>
            <Button
              size="sm"
              className="mt-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              onClick={() => {
                const tab = document.querySelector('[data-tab="grupos"]') as HTMLButtonElement;
                tab?.click();
              }}
            >
              Ir para Grupos
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
            <div key={automation.id} className="rounded-2xl border border-white/8 hover:border-white/15 transition-all p-4" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ automation.isActive ? "bg-green-500/15 border border-green-500/20" : "bg-white/5 border border-white/8" }`}>
                    <Bot className={`w-4 h-4 ${ automation.isActive ? "text-green-400" : "text-muted-foreground" }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-sm section-title truncate">{automation.name}</h3>
                      {automation.useLlmSuggestion && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/20 flex-shrink-0">
                          <Zap className="w-2.5 h-2.5" /> IA
                        </span>
                      )}
                      {automation.isActive
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500/15 text-green-300 border border-green-500/20 flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Ativa</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-muted-foreground border border-white/10 flex-shrink-0">Inativa</span>
                      }
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Origem: {allGroups?.find((g) => g.id === automation.sourceGroupId)?.groupName || `Grupo #${automation.sourceGroupId}`}
                      </span>
                      {automation.sendDelay > 0 && <span className="flex items-center gap-1"><span>Delay: {automation.sendDelay}s</span></span>}
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
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all" onClick={() => openEdit(automation)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    onClick={() => {
                      if (confirm(`Remover automação "${automation.name}"?`)) {
                        deleteMutation.mutate({ id: automation.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                placeholder="Ex: Ofertas Mercado Livre → Meu Grupo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Grupo de Origem * <span className="text-muted-foreground font-normal text-xs">(com Buscar Ofertas ativo)</span></Label>
              {sourceGroups.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                  Nenhum grupo com "Buscar Ofertas" ativo. Ative na aba <strong>Grupos</strong>.
                </div>
              ) : (
                <Select value={form.sourceGroupId} onValueChange={(v) => setForm({ ...form, sourceGroupId: v })}>
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
            <div className="space-y-2">
              <Label>Grupos de Destino</Label>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 space-y-1">
                <p className="font-medium">📤 Destinos configurados na aba Grupos</p>
                {targetGroups.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum grupo com "Enviar Ofertas" ativo. Ative na aba <strong>Grupos</strong>.</p>
                ) : (
                  <p className="text-muted-foreground">
                    {targetGroups.length} grupo(s) com "Enviar Ofertas" ativo: {targetGroups.map(g => g.groupName || g.groupJid).join(", ")}.
                  </p>
                )}
              </div>
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
                  <SelectItem value="none">Nenhuma (usar IA para sugerir)</SelectItem>
                  {campaigns?.filter((c) => c.isActive).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
              <div>
                <p className="text-sm font-medium">Usar IA para sugerir campanha</p>
                <p className="text-xs text-muted-foreground">A IA analisa o conteúdo e escolhe a melhor campanha automaticamente.</p>
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
              <p className="text-xs text-muted-foreground">Aguardar antes de enviar (0 = imediato, máx. 300s).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Salvar" : "Criar Automação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Página principal (com abas) ──────────────────────────────────────────────
export default function Groups() {
  const [activeTab, setActiveTab] = useState<"grupos" | "automacoes">("grupos");

  return (
    <AppLayout title="Configurar Ofertas">
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "oklch(0.10 0.015 250 / 0.8)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
          {([
            { id: "grupos", label: "Grupos", icon: Users },
            { id: "automacoes", label: "Automações", icon: Bot },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "grupos" ? <GroupsTab /> : <AutomationsTab />}
      </div>
    </AppLayout>
  );
}
