import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Info,
  Loader2,
  RefreshCw,
  Search,
  Smartphone,
  Target,
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
      "Quando ativada, este grupo receberá as mensagens processadas dos grupos monitorados. Converte links encontrados nas mensagens monitoradas para links de afiliados (Shopee, AliExpress, Mercado Livre, Amazon, Magazine Luiza). Ative nos grupos onde você quer receber as mensagens formatadas.",
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
              <p className="text-sm text-muted-foreground">Nenhum grupo com <strong>Enviar Ofertas</strong> ativo ainda.</p>
              <p className="text-xs text-muted-foreground">Ative "Enviar Ofertas" em pelo menos um grupo para configurar os alvos.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-3">
                Selecione os grupos que receberão as mensagens deste grupo. Se nenhum for selecionado, as mensagens serão enviadas para todos os grupos de disparo.
              </p>
              {targets.map((g) => (
                <label key={g.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors">
                  <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggle(g.id)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">{g.groupName || g.groupJid}</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">Enviar Ofertas</Badge>
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

export default function Groups() {
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [infoFlag, setInfoFlag] = useState<GroupFlag | null>(null);
  const [targetSourceGroup, setTargetSourceGroup] = useState<{ id: number; groupName: string | null; groupJid: string } | null>(null);

  const connectedInstances = instances?.filter((i) => i.status === "connected") || [];
  const activeInstanceId = selectedInstanceId ?? connectedInstances[0]?.id ?? null;

  const { data: waGroups, isLoading: loadingGroups, refetch: refetchGroups } = trpc.whatsapp.getGroups.useQuery(
    { instanceId: activeInstanceId! },
    { enabled: !!activeInstanceId }
  );

  const { data: savedGroups, refetch: refetchSaved } = trpc.whatsapp.listMonitoredGroups.useQuery(
    { instanceId: activeInstanceId ?? undefined },
    { enabled: !!activeInstanceId }
  );

  const { data: groupTargets, refetch: refetchTargets } = trpc.whatsapp.getGroupTargets.useQuery(
    { sourceGroupId: undefined },
    { enabled: !!activeInstanceId }
  );

  const addGroup = trpc.whatsapp.addMonitoredGroup.useMutation({ onSuccess: () => refetchSaved() });
  const updateGroup = trpc.whatsapp.updateMonitoredGroup.useMutation({ onSuccess: () => refetchSaved() });
  const setTargets = trpc.whatsapp.setGroupTargets.useMutation({ onSuccess: () => refetchTargets() });

  const mergedGroups = useMemo(() => {
    if (!waGroups) return [];
    return waGroups.map((waGroup) => {
      const saved = savedGroups?.find((sg) => sg.groupJid === waGroup.id);
      return {
        jid: waGroup.id,
        name: waGroup.subject || waGroup.id,
        participantCount: waGroup.participantCount || 0,
        savedId: saved?.id ?? null,
        buscarOfertas: saved?.buscarOfertas ?? false,
        espelharConteudo: saved?.espelharConteudo ?? false,
        enviarOfertas: saved?.enviarOfertas ?? false,
        substituirImagem: saved?.substituirImagem ?? false,
      };
    });
  }, [waGroups, savedGroups]);

  const filteredGroups = useMemo(
    () => mergedGroups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
    [mergedGroups, search]
  );

  const handleToggle = async (group: (typeof mergedGroups)[0], flag: GroupFlag, value: boolean) => {
    try {
      if (!group.savedId) {
        const result = await addGroup.mutateAsync({ instanceId: activeInstanceId!, groupJid: group.jid, groupName: group.name });
        await updateGroup.mutateAsync({ id: result.id, [flag]: value });
      } else {
        await updateGroup.mutateAsync({ id: group.savedId, [flag]: value });
      }
      toast.success(`${FLAG_INFO[flag].label} ${value ? "ativado" : "desativado"}`);
    } catch {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleSaveTargets = async (targetIds: number[]) => {
    if (!targetSourceGroup) return;
    await setTargets.mutateAsync({ sourceGroupId: targetSourceGroup.id, targetGroupIds: targetIds });
    toast.success("Alvos configurados com sucesso!");
    setTargetSourceGroup(null);
  };

  const getTargetCount = (sourceId: number) =>
    groupTargets?.filter((t) => t.sourceGroupId === sourceId).length ?? 0;

  const targetModalGroups = savedGroups?.map((sg) => ({
    id: sg.id,
    groupName: sg.groupName ?? null,
    groupJid: sg.groupJid,
    enviarOfertas: sg.enviarOfertas,
  })) ?? [];

  const targetCurrentIds = targetSourceGroup
    ? groupTargets?.filter((t) => t.sourceGroupId === targetSourceGroup.id).map((t) => t.targetGroupId) ?? []
    : [];

  return (
    <AppLayout title="Grupos">
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Grupos do WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Configure como cada grupo participa da automação</p>
          </div>
          {activeInstanceId && (
            <Button variant="outline" size="sm" onClick={() => refetchGroups()} className="gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </Button>
          )}
        </div>

        {connectedInstances.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Nenhum WhatsApp conectado</p>
              <p className="text-sm text-muted-foreground">Conecte seu WhatsApp para ver e configurar seus grupos.</p>
            </div>
            <Button asChild className="bg-green-500 hover:bg-green-400 text-black font-semibold">
              <Link href="/whatsapp">Conectar WhatsApp</Link>
            </Button>
          </div>
        )}

        {connectedInstances.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {connectedInstances.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setSelectedInstanceId(inst.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  activeInstanceId === inst.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {inst.name}
              </button>
            ))}
          </div>
        )}

        {activeInstanceId && (
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
        )}

        {loadingGroups && activeInstanceId && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando grupos...</span>
          </div>
        )}

        {!loadingGroups && activeInstanceId && filteredGroups.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum grupo encontrado para esta busca." : "Nenhum grupo encontrado nesta instância."}
            </p>
          </div>
        )}

        {!loadingGroups && filteredGroups.length > 0 && (
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <div key={group.jid} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{group.name}</p>
                    {group.participantCount > 0 && (
                      <p className="text-xs text-muted-foreground">{group.participantCount} participantes</p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {group.buscarOfertas && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Buscar</Badge>
                    )}
                    {group.espelharConteudo && (
                      <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Espelhar</Badge>
                    )}
                    {group.enviarOfertas && (
                      <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">Enviar</Badge>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-border/50">
                  {(["buscarOfertas", "espelharConteudo", "enviarOfertas", "substituirImagem"] as GroupFlag[]).map((flag, idx) => {
                    const info = FLAG_INFO[flag];
                    const isActive = group[flag];
                    return (
                      <div key={flag} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-base w-6 text-center">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-medium ${isActive ? info.color : "text-foreground"}`}>{idx + 1}</span>
                            <span className={`text-sm font-medium ${isActive ? info.color : "text-foreground"}`}>{info.label}</span>
                            <button onClick={() => setInfoFlag(flag)} className="text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {flag === "buscarOfertas" && isActive && group.savedId && (
                          <button
                            onClick={() => setTargetSourceGroup({ id: group.savedId!, groupName: group.name, groupJid: group.jid })}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors mr-2"
                          >
                            <Target className="w-3 h-3" />
                            Alvos {getTargetCount(group.savedId) > 0 && `(${getTargetCount(group.savedId)})`}
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

        {filteredGroups.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Como funciona</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>🔍 <strong className="text-foreground">Buscar Ofertas</strong> — captura links de produtos neste grupo</p>
              <p>🔄 <strong className="text-foreground">Espelhar Conteúdo</strong> — replica mensagens sem converter links</p>
              <p>📤 <strong className="text-foreground">Enviar Ofertas</strong> — recebe mensagens processadas com seus links de afiliado</p>
              <p>🖼️ <strong className="text-foreground">Substituir Imagem</strong> — usa imagem oficial do produto no lugar da original</p>
            </div>
          </div>
        )}
      </div>

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
    </AppLayout>
  );
}
