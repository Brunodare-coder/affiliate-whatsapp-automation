import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  ChevronRight,
  Copy,
  Download,
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
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type GroupFlag = "buscarOfertas" | "espelharConteudo" | "enviarOfertas" | "substituirImagem";

// ─── Modal Configurar Grupos de Disparo (laranja, igual ao ProAfiliados) ──────
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
        {/* Header laranja */}
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

        {/* Body */}
        <div className="bg-[#0f172a] p-5">
          {/* Info box */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-300">
              <span className="font-semibold">Selecione</span> os grupos de disparo que receberão as mensagens
              deste grupo monitorado. Se nenhum grupo for selecionado, as mensagens serão enviadas para{" "}
              <strong>todos</strong> os grupos de disparo.
            </p>
          </div>

          {targets.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum grupo com <strong>Enviar Ofertas</strong> ativo ainda.
              </p>
              <p className="text-xs text-muted-foreground">
                Ative "Enviar Ofertas" em pelo menos um grupo para configurar os alvos.
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
                      isChecked
                        ? "bg-orange-500/10 border-orange-500/40"
                        : "bg-[#1e293b] border-[#1e293b] hover:border-border"
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
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(g.id)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0f172a] border-t border-border px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              <button onClick={selectAll} className="text-sm text-orange-400 hover:text-orange-300 font-medium">
                Todos
              </button>
              <span className="text-muted-foreground">|</span>
              <button onClick={selectNone} className="text-sm text-orange-400 hover:text-orange-300 font-medium">
                Nenhum
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(Array.from(selected))}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
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

// ─── Linha de opção do grupo (igual ao ProAfiliados) ─────────────────────────
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Groups() {
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
    () =>
      (savedGroups || []).filter((g) =>
        (g.groupName || g.groupJid).toLowerCase().includes(search.toLowerCase())
      ),
    [savedGroups, search]
  );

  const handleToggle = async (
    group: NonNullable<typeof savedGroups>[0],
    flag: GroupFlag,
    value: boolean
  ) => {
    try {
      await updateGroup.mutateAsync({ id: group.id, [flag]: value });
    } catch {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleSaveTargets = async (targetIds: number[]) => {
    if (!targetSourceGroup) return;
    await setTargets.mutateAsync({
      sourceGroupId: targetSourceGroup.id,
      targetGroupIds: targetIds,
    });
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
    <AppLayout title="Configurar Ofertas">
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold">Configurar Ofertas</h1>
            <p className="text-sm text-muted-foreground">Configure como usar as ofertas de cada grupo</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetchSaved(); refetchTargets(); }}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </Button>
            {firstConnectedId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncGroups.mutate({ instanceId: firstConnectedId })}
                disabled={syncGroups.isPending}
                className="gap-2"
              >
                {syncGroups.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Sincronizar do WA
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="w-3.5 h-3.5" /> Adicionar Grupo
            </Button>
          </div>
        </div>

        {/* Como usar */}
        <div className="rounded-xl bg-card border border-border p-4">
          <details>
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">ℹ</span>
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

        {/* No WA connected banner */}
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
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
        </div>

        {/* Loading */}
        {loadingGroups && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando grupos...</span>
          </div>
        )}

        {/* Empty state */}
        {!loadingGroups && filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">
                {search ? "Nenhum grupo encontrado" : "Nenhum grupo cadastrado ainda"}
              </p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Tente outra busca."
                  : "Adicione grupos manualmente ou conecte o WhatsApp e sincronize."}
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

        {/* Groups list — igual ao ProAfiliados */}
        {!loadingGroups && filteredGroups.length > 0 && (
          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const targetCount = getTargetCount(group.id);
              const groupType = group.groupJid.endsWith("@broadcast") ? "CANAL" : "GRUPO";
              const groupTypeColor = groupType === "CANAL" ? "text-green-400" : "text-blue-400";

              return (
                <div key={group.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#0f172a]">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {group.groupName || group.groupJid}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate opacity-60">
                        {group.groupJid}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold border-current flex-shrink-0 ${groupTypeColor}`}
                    >
                      {groupType}
                    </Badge>
                    <button
                      onClick={() => {
                        if (confirm(`Remover "${group.groupName || group.groupJid}"?`)) {
                          removeGroup.mutate({ id: group.id });
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options rows */}
                  <div className="divide-y divide-border/40 bg-[#1e293b]/50">
                    {/* Buscar Ofertas */}
                    <GroupOptionRow
                      icon={<BarChart2 className="w-4 h-4" />}
                      label="Buscar Ofertas"
                      sublabel={group.buscarOfertas ? "● Busca links" : "○ Inativo"}
                      sublabelColor={group.buscarOfertas ? "text-green-400" : "text-muted-foreground"}
                      checked={group.buscarOfertas}
                      onToggle={(v) => handleToggle(group, "buscarOfertas", v)}
                    />

                    {/* Enviar Ofertas */}
                    <GroupOptionRow
                      icon={<AlertTriangle className="w-4 h-4" />}
                      label="Enviar Ofertas"
                      sublabel={group.enviarOfertas ? "● Converte links" : "○ Inativo"}
                      sublabelColor={group.enviarOfertas ? "text-yellow-400" : "text-muted-foreground"}
                      checked={group.enviarOfertas}
                      onToggle={(v) => handleToggle(group, "enviarOfertas", v)}
                    />

                    {/* Configurar Alvos */}
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

                    {/* Espelhar */}
                    <GroupOptionRow
                      icon={<Copy className="w-4 h-4" />}
                      label="Espelhar"
                      sublabel={group.espelharConteudo ? "● Ativo" : "✕ sem links"}
                      sublabelColor={group.espelharConteudo ? "text-blue-400" : "text-red-400"}
                      checked={group.espelharConteudo}
                      onToggle={(v) => handleToggle(group, "espelharConteudo", v)}
                    />

                    {/* Substituir Imagem */}
                    <GroupOptionRow
                      icon={<Image className="w-4 h-4 text-purple-400" />}
                      label="Substituir Imagem"
                      sublabel={group.substituirImagem ? "● Busca imagens" : "○ Inativo"}
                      sublabelColor={group.substituirImagem ? "text-purple-400" : "text-muted-foreground"}
                      checked={group.substituirImagem}
                      onToggle={(v) => handleToggle(group, "substituirImagem", v)}
                    />

                    {/* Ordem do Link */}
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
      </div>

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
    </AppLayout>
  );
}
