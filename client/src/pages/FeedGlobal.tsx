import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Globe, Info, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

export default function FeedGlobal() {
  const { data: botSettings, isLoading: loadingSettings, refetch: refetchSettings } =
    trpc.botSettings.get.useQuery();

  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: savedGroups, isLoading: loadingGroups, refetch: refetchGroups } =
    trpc.whatsapp.listMonitoredGroups.useQuery({ instanceId: undefined });

  const saveBotSettings = trpc.botSettings.save.useMutation({
    onSuccess: () => {
      refetchSettings();
      toast.success("Configurações do Feed Global salvas!");
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const [feedEnabled, setFeedEnabled] = useState(false);
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [clickablePreview, setClickablePreview] = useState(false);

  // Sync local state from server
  useEffect(() => {
    if (botSettings) {
      setFeedEnabled(botSettings.feedGlobalEnabled ?? false);
      setSelectedTargetIds((botSettings.feedGlobalTargets as number[]) ?? []);
      setClickablePreview(botSettings.clickablePreview ?? false);
    }
  }, [botSettings]);

  // Groups with "enviarOfertas" active — these are the dispatch targets
  const enviarGroups = (savedGroups || []).filter((g) => g.isActive && g.enviarOfertas);
  // All groups (for display)
  const allGroups = savedGroups || [];

  const toggleTarget = (id: number) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedTargetIds(enviarGroups.map((g) => g.id));
  };

  const handleSelectNone = () => {
    setSelectedTargetIds([]);
  };

  const handleSave = () => {
    saveBotSettings.mutate({
      feedGlobalEnabled: feedEnabled,
      feedGlobalTargets: selectedTargetIds,
      clickablePreview,
    });
  };

  const handleToggleFeed = (val: boolean) => {
    setFeedEnabled(val);
    saveBotSettings.mutate({ feedGlobalEnabled: val });
  };

  const getGroupType = (group: NonNullable<typeof savedGroups>[0]) => {
    if (group.groupJid.includes("@g.us")) return "GRUPO";
    return "COMUNIDADE";
  };

  const getGroupTypeColor = (group: NonNullable<typeof savedGroups>[0]) => {
    const type = getGroupType(group);
    if (type === "COMUNIDADE") return "bg-green-500/20 text-green-400 border-green-500/30";
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  };

  if (loadingSettings) {
    return (
      <AppLayout title="Feed Global">
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Feed Global">
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

        {/* Header Card */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Feed Global</h2>
                <p className="text-sm text-muted-foreground">Receba links de todos os usuários do sistema</p>
              </div>
            </div>
            <Switch
              checked={feedEnabled}
              onCheckedChange={handleToggleFeed}
              disabled={saveBotSettings.isPending}
              className="scale-125"
            />
          </div>

          {/* Info box */}
          <div className="mx-5 mb-5 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-400">O que é o Feed Global?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quando ativado, você recebe automaticamente{" "}
                  <strong className="text-foreground">links de afiliado</strong> detectados em{" "}
                  <strong className="text-foreground">todos os grupos monitorados</strong> por outros
                  usuários do sistema. Assim você não precisa configurar seus próprios grupos de
                  monitoramento — aproveite os links que outras pessoas já encontraram!
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  {["Shopee", "AliExpress", "Mercado Livre", "Amazon", "Magazine Luiza"].map((store) => (
                    <span key={store} className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                      <span className="text-green-400">✓</span> {store}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Groups + Preview Clicável */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Groups — takes 2/3 width */}
          <div className="md:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-semibold text-sm">Grupos Alvo</p>
                <p className="text-xs text-muted-foreground">(opcional)</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => refetchGroups()}
                  disabled={loadingGroups}
                >
                  {loadingGroups ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectAll}
                >
                  Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectNone}
                >
                  Nenhum
                </Button>
              </div>
            </div>

            <div className="p-3 max-h-72 overflow-y-auto space-y-1.5">
              {loadingGroups ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Carregando grupos...</span>
                </div>
              ) : allGroups.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <p>Nenhum grupo cadastrado.</p>
                  <p className="text-xs mt-1">Adicione grupos na página de Grupos.</p>
                </div>
              ) : (
                allGroups.map((group) => {
                  const isSelected = selectedTargetIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-primary/10 border-primary/30"
                          : "bg-secondary/40 border-transparent hover:bg-secondary/70"
                      }`}
                    >
                      <div className="flex-shrink-0 text-primary">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTarget(group.id)}
                        className="hidden"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {group.groupName || group.groupJid}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-0.5 font-bold ${getGroupTypeColor(group)}`}
                        >
                          {getGroupType(group)}
                        </Badge>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {selectedTargetIds.length === 0
                  ? "Deixe todos desmarcados para enviar para todos os grupos de disparo."
                  : `${selectedTargetIds.length} grupo(s) selecionado(s) como alvo.`}
              </p>
            </div>
          </div>

          {/* Preview Clicável + Save */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div>
                <p className="font-semibold text-sm">Preview Clicável</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Substitui a imagem pelo preview do produto com link clicável
                </p>
              </div>
              <Switch
                checked={clickablePreview}
                onCheckedChange={setClickablePreview}
              />
            </div>

            <Button
              className="w-full h-12 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90"
              onClick={handleSave}
              disabled={saveBotSettings.isPending}
            >
              {saveBotSettings.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>

            {/* Status indicator */}
            <div className={`rounded-xl p-3 text-center text-xs font-medium border ${
              feedEnabled
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-muted/30 border-border text-muted-foreground"
            }`}>
              {feedEnabled ? "🟢 Feed Global Ativo" : "⚫ Feed Global Inativo"}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Como funciona
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                step: "1",
                title: "Detecção",
                desc: "O sistema detecta links de produtos em grupos monitorados de qualquer usuário",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                step: "2",
                title: "Conversão",
                desc: "Os links são convertidos para seus links de afiliado configurados (ML, Shopee, Amazon...)",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                step: "3",
                title: "Disparo",
                desc: "A mensagem com seu link de afiliado é enviada para os grupos alvo selecionados",
                color: "text-green-400",
                bg: "bg-green-500/10",
              },
            ].map((item) => (
              <div key={item.step} className={`rounded-xl ${item.bg} p-4 space-y-2`}>
                <div className={`w-7 h-7 rounded-lg bg-card flex items-center justify-center text-sm font-bold ${item.color}`}>
                  {item.step}
                </div>
                <p className={`text-sm font-semibold ${item.color}`}>{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
