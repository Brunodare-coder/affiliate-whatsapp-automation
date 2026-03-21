import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Download,
  Info,
  Loader2,
  Plus,
  Search,
  Smartphone,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type GroupFlag = "buscarOfertas" | "espelharConteudo" | "enviarOfertas" | "substituirImagem";

const FLAG_INFO: Record<GroupFlag, { label: string; description: string; color: string; icon: string }> = {
  buscarOfertas: {
    label: "Buscar Ofertas",
    description:
      "Quando ativada, o sistema monitora e busca links nas mensagens recebidas neste grupo. Se estiver desativada, as mensagens são ignoradas. Ative nos grupos de onde você quer capturar mensagens com links de produtos (Shopee, AliExpress, Mercado Livre, Amazon, Magazine Luiza).",
    color: "text-green-400",
    icon: "🔍",
  },
  espelharConteudo: {
    label: "Espelhar Conteúdo",
    description:
      "NÃO converte links! Quando ativado, replica todas as mensagens do grupo/canal para os grupos de disparo, sem processar ou converter links de lojas. Ideal para espelhar conteúdo de um canal para outro (ex: notícias, avisos, etc). Mensagens com links são ignoradas.",
    color: "text-blue-400",
    icon: "🔄",
  },
  enviarOfertas: {
    label: "Enviar Ofertas",
    description:
      "Quando ativada, este grupo receberá as mensagens processadas dos grupos monitorados. Converte links encontrados nas mensagens monitoradas para links de afiliados. Ative nos grupos onde você quer receber as mensagens formatadas.",
    color: "text-purple-400",
    icon: "📤",
  },
  substituirImagem: {
    label: "Substituir Imagem",
    description:
      "Quando ativada, o sistema busca imagens do site da loja e prioriza essas imagens sobre a imagem original da mensagem. Ative quando quiser garantir que a imagem do produto seja a do site oficial.",
    color: "text-orange-400",
    icon: "🖼️",
  },
};

function FlagInfoModal({ flag, onClose }: { flag: GroupFlag | null; onClose: () => void }) {
  if (!flag) return null;
  const info = FLAG_INFO[flag];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{info.icon}</span>
            <h3 className={`font-bold text-lg ${info.color}`}>{info.label}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
        <Button onClick={onClose} className="w-full mt-4">Entendi</Button>
      </div>
    </div>
  );
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-bold text-base">Configurar Alvos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Origem: <strong>{sourceGroup.groupName || sourceGroup.groupJid}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-3">
                Selecione os grupos que receberão as mensagens deste grupo. Se nenhum for selecionado, as mensagens serão enviadas para todos os grupos de disparo.
              </p>
              {targets.map((g) => (
                <label
                  key={g.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium">{g.groupName || g.groupJid}</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Enviar Ofertas
                  </Badge>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={() => onSave(Array.from(selected))} className="flex-1">
            Salvar Alvos {selected.size > 0 && `(${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
            <p className="text-xs text-muted-foreground">
              Deixe em branco para gerar automaticamente.
            </p>
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

export default function Groups() {
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const [search, setSearch] = useState("");
  const [infoFlag, setInfoFlag] = useState<GroupFlag | null>(null);
  const [targetSourceGroup, setTargetSourceGroup] = useState<{
    id: number;
    groupName: string | null;
    groupJid: string;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const connectedInstances = instances?.filter((i) => i.status === "connected") || [];
  const firstConnectedId = connectedInstances[0]?.id ?? null;

  // Load ALL saved groups from DB (no instanceId filter)
  const { data: savedGroups, refetch: refetchSaved, isLoading: loadingGroups } =
    trpc.whatsapp.listMonitoredGroups.useQuery({ instanceId: undefined });

  const { data: groupTargets, refetch: refetchTargets } =
    trpc.whatsapp.getGroupTargets.useQuery({ sourceGroupId: undefined });

  const addGroup = trpc.whatsapp.addMonitoredGroup.useMutation({
    onSuccess: () => {
      refetchSaved();
      setShowAddModal(false);
      toast.success("Grupo adicionado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateGroup = trpc.whatsapp.updateMonitoredGroup.useMutation({
    onSuccess: () => refetchSaved(),
  });

  const removeGroup = trpc.whatsapp.removeMonitoredGroup.useMutation({
    onSuccess: () => {
      refetchSaved();
      toast.success("Grupo removido!");
    },
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
      toast.success(`${FLAG_INFO[flag].label} ${value ? "ativado" : "desativado"}`);
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
    ? groupTargets
        ?.filter((t) => t.sourceGroupId === targetSourceGroup.id)
        .map((t) => t.targetGroupId) ?? []
    : [];

  return (
    <AppLayout title="Grupos">
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold">Grupos do WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Configure como cada grupo participa da automação</p>
          </div>
          <div className="flex gap-2">
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
            <Button
              asChild
              size="sm"
              className="bg-green-500 hover:bg-green-400 text-black font-semibold flex-shrink-0"
            >
              <Link href="/whatsapp">Conectar</Link>
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar grupo..."
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Manualmente
                </Button>
                {firstConnectedId && (
                  <Button
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
              </div>
            )}
          </div>
        )}

        {/* Groups list */}
        {!loadingGroups && filteredGroups.length > 0 && (
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <div key={group.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-3 p-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{group.groupName || group.groupJid}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate opacity-60">
                      {group.groupJid}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end items-center">
                    {group.buscarOfertas && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        Buscar
                      </Badge>
                    )}
                    {group.espelharConteudo && (
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Espelhar
                      </Badge>
                    )}
                    {group.enviarOfertas && (
                      <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                        Enviar
                      </Badge>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Remover "${group.groupName || group.groupJid}"?`)) {
                          removeGroup.mutate({ id: group.id });
                        }
                      }}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Flags */}
                <div className="divide-y divide-border/50">
                  {(
                    ["buscarOfertas", "espelharConteudo", "enviarOfertas", "substituirImagem"] as GroupFlag[]
                  ).map((flag, idx) => {
                    const info = FLAG_INFO[flag];
                    const isActive = group[flag];
                    return (
                      <div key={flag} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-base w-6 text-center">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-sm font-medium ${isActive ? info.color : "text-foreground"}`}
                            >
                              {idx + 1}
                            </span>
                            <span
                              className={`text-sm font-medium ${isActive ? info.color : "text-foreground"}`}
                            >
                              {info.label}
                            </span>
                            <button
                              onClick={() => setInfoFlag(flag)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {flag === "buscarOfertas" && isActive && (
                          <button
                            onClick={() =>
                              setTargetSourceGroup({
                                id: group.id,
                                groupName: group.groupName ?? null,
                                groupJid: group.groupJid,
                              })
                            }
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors mr-2"
                          >
                            <Target className="w-3 h-3" />
                            Alvos{" "}
                            {getTargetCount(group.id) > 0 && `(${getTargetCount(group.id)})`}
                          </button>
                        )}
                        <Switch
                          checked={isActive}
                          onCheckedChange={(v) => handleToggle(group, flag, v)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {filteredGroups.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Como funciona
            </p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>
                🔍 <strong className="text-foreground">Buscar Ofertas</strong> — captura links de
                produtos neste grupo
              </p>
              <p>
                🔄 <strong className="text-foreground">Espelhar Conteúdo</strong> — replica
                mensagens sem converter links
              </p>
              <p>
                📤 <strong className="text-foreground">Enviar Ofertas</strong> — recebe mensagens
                processadas com seus links de afiliado
              </p>
              <p>
                🖼️ <strong className="text-foreground">Substituir Imagem</strong> — usa imagem
                oficial do produto no lugar da original
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FlagInfoModal flag={infoFlag} onClose={() => setInfoFlag(null)} />
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
