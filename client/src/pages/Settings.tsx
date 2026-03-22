import AppLayout from "@/components/AppLayout";
import MercadoLivreConfigModal from "@/components/MercadoLivreConfigModal";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShoppingBag, ShoppingCart, Store, Package, Link2,
  Calendar, Clock, Terminal, Sticker, UserPlus, Youtube,
  ChevronRight, CheckCircle2, Settings as SettingsIcon,
  Zap, Wrench, X, Plus, Trash2, Globe, Eye
} from "lucide-react";

// ─── Modal Shopee ────────────────────────────────────────────────────────────
function ShopeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: config } = trpc.shopee.getConfig.useQuery();
  const save = trpc.shopee.saveConfig.useMutation({ onSuccess: () => { toast.success("Shopee salvo!"); onClose(); } });
  const del = trpc.shopee.deleteConfig.useMutation({ onSuccess: () => { toast.success("Shopee removido!"); onClose(); } });
  const [appId, setAppId] = useState("");
  const [secret, setSecret] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            Configurações Shopee
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 text-sm text-amber-300 space-y-1">
            <p className="font-semibold text-amber-400">Como obter suas credenciais Shopee:</p>
            <p>1. Acesse <span className="font-semibold">affiliate.shopee.com.br</span> e faça login</p>
            <p>2. Vá em <span className="font-semibold">Ferramentas → API de Afiliados</span></p>
            <p>3. Clique em <span className="font-semibold">Gerar credenciais</span></p>
            <p>4. O <span className="font-semibold">AppID</span> é o ID numérico e a <span className="font-semibold">Senha</span> é a chave secreta gerada</p>
          </div>
          <div>
            <Label className="text-sm font-medium">AppID</Label>
            <Input
              className="mt-1 bg-muted/30 border-border"
              placeholder={config?.appId || "Digite sua AppID da Shopee"}
              defaultValue={config?.appId || ""}
              onChange={(e) => setAppId(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Senha</Label>
            <Input
              type="password"
              className="mt-1 bg-muted/30 border-border"
              placeholder="Digite sua senha"
              onChange={(e) => setSecret(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => save.mutate({ appId, secret })}
              disabled={save.isPending}
            >
              {save.isPending ? "Salvando..." : "✓ Salvar"}
            </Button>
            {config && (
              <Button variant="destructive" onClick={() => del.mutate()} disabled={del.isPending}>
                <Trash2 className="w-4 h-4 mr-1" /> Deletar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Amazon ────────────────────────────────────────────────────────────
function AmazonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: config } = trpc.amazon.getConfig.useQuery();
  const save = trpc.amazon.saveConfig.useMutation({ onSuccess: () => { toast.success("Amazon salvo!"); onClose(); } });
  const del = trpc.amazon.deleteConfig.useMutation({ onSuccess: () => { toast.success("Amazon removido!"); onClose(); } });
  const [tag, setTag] = useState("");
  const [ubidAcbbr, setUbidAcbbr] = useState("");
  const [atAcbbr, setAtAcbbr] = useState("");
  const [xAcbb, setXAcbb] = useState("");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            Configurações Amazon
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 text-sm text-amber-300 space-y-1">
            <p className="font-semibold text-amber-400">Como obter suas credenciais Amazon:</p>
            <p>1. Acesse <span className="font-semibold">associados.amazon.com.br</span> e faça login</p>
            <p>2. Sua <span className="font-semibold">Tag</span> está em: conta → ID de rastreamento (ex: seusite-20)</p>
            <p>3. Para os cookies: instale a extensão <span className="font-semibold underline">EditThisCookie</span> no seu navegador → acesse o site → clique no ícone da extensão → copie os valores de <span className="font-semibold">ubid-acbbr</span>, <span className="font-semibold">at-acbbr</span> e <span className="font-semibold">x-acbb</span></p>
          </div>
          <div>
            <Label className="text-sm font-medium">Tag</Label>
            <Input
              className="mt-1 bg-muted/30 border-border"
              placeholder={config?.tag || "Ex: seusite-20"}
              defaultValue={config?.tag || ""}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Cookie ubid_acbbr</Label>
            <Input
              className="mt-1 bg-muted/30 border-border"
              placeholder={config?.ubidAcbbr || "Ex: 132-1170792-6134451"}
              defaultValue={config?.ubidAcbbr || ""}
              onChange={(e) => setUbidAcbbr(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Cookie at_acbbr</Label>
            <Input
              type="password"
              className="mt-1 bg-muted/30 border-border"
              placeholder="Cole o valor do cookie at-acbbr"
              defaultValue={config?.atAcbbr || ""}
              onChange={(e) => setAtAcbbr(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Cookie x_acbb</Label>
            <Input
              type="password"
              className="mt-1 bg-muted/30 border-border"
              placeholder="Cole o valor do cookie x-acbb"
              defaultValue={config?.xAcbb || ""}
              onChange={(e) => setXAcbb(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => save.mutate({ tag, ubidAcbbr, atAcbbr, xAcbb })}
              disabled={save.isPending}
            >
              {save.isPending ? "Salvando..." : "✓ Salvar"}
            </Button>
            {config && (
              <Button variant="destructive" onClick={() => del.mutate()} disabled={del.isPending}>
                <Trash2 className="w-4 h-4 mr-1" /> Deletar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Magazine Luiza ────────────────────────────────────────────────────
function MagazineLuizaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: config } = trpc.magazineLuiza.getConfig.useQuery();
  const save = trpc.magazineLuiza.saveConfig.useMutation({ onSuccess: () => { toast.success("Magazine Luiza salvo!"); onClose(); } });
  const del = trpc.magazineLuiza.deleteConfig.useMutation({ onSuccess: () => { toast.success("Magazine Luiza removido!"); onClose(); } });
  const [tag, setTag] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-pink-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            Configurações Magazine Luiza
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            O link do Magazine Voce tem o formato:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">magazinevoce.com.br/SUA_TAG/produto/...</code>. Configure sua tag (ex: magazineproafiliados).
          </p>
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 text-sm text-amber-300 space-y-1">
            <p className="font-semibold text-amber-400">Como obter sua Tag Magazine Luiza:</p>
            <p>1. Acesse <span className="font-semibold">magazinevoce.com.br</span> e faça login</p>
            <p>2. Vá em <span className="font-semibold">Minha Conta → Dados de Afiliado</span></p>
            <p>3. Copie seu <span className="font-semibold">código de afiliado</span> (Tag)</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Tag (primeiro segmento do link)</Label>
            <Input
              className="mt-1 bg-muted/30 border-border"
              placeholder={config?.tag || "Ex: magazineproafiliados"}
              defaultValue={config?.tag || ""}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => save.mutate({ tag })}
              disabled={save.isPending}
            >
              {save.isPending ? "Salvando..." : "✓ Salvar"}
            </Button>
            {config && (
              <Button variant="destructive" onClick={() => del.mutate()} disabled={del.isPending}>
                <Trash2 className="w-4 h-4 mr-1" /> Deletar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal AliExpress ────────────────────────────────────────────────────────
function AliExpressModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: config } = trpc.aliexpress.getConfig.useQuery();
  const save = trpc.aliexpress.saveConfig.useMutation({ onSuccess: () => { toast.success("AliExpress salvo!"); onClose(); } });
  const del = trpc.aliexpress.deleteConfig.useMutation({ onSuccess: () => { toast.success("AliExpress removido!"); onClose(); } });
  const [trackId, setTrackId] = useState("");
  const [cookie, setCookie] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            Configurações AliExpress
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 text-sm text-amber-300 space-y-1">
            <p className="font-semibold text-amber-400">Como obter suas credenciais AliExpress:</p>
            <p>1. Acesse <span className="font-semibold">portals.aliexpress.com</span> e faça login</p>
            <p>2. Vá em <span className="font-semibold">Tools → Tracking ID</span></p>
            <p>3. Para o Cookie: instale <span className="font-semibold">EditThisCookie</span> → copie o valor de <span className="font-semibold">aep_usuc_f</span></p>
          </div>
          <div>
            <Label className="text-sm font-medium">Track ID</Label>
            <Input
              className="mt-1 bg-muted/30 border-border"
              placeholder={config?.trackId || "Ex: default"}
              defaultValue={config?.trackId || ""}
              onChange={(e) => setTrackId(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Cookie</Label>
            <Input
              type="password"
              className="mt-1 bg-muted/30 border-border"
              placeholder="Cole seu cookie"
              onChange={(e) => setCookie(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => save.mutate({ trackId, cookie })}
              disabled={save.isPending}
            >
              {save.isPending ? "Salvando..." : "✓ Salvar"}
            </Button>
            {config && (
              <Button variant="destructive" onClick={() => del.mutate()} disabled={del.isPending}>
                <Trash2 className="w-4 h-4 mr-1" /> Deletar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Agendamento ───────────────────────────────────────────────────────
function ScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: settings, refetch } = trpc.botSettings.get.useQuery();
  const save = trpc.botSettings.save.useMutation({ onSuccess: () => { toast.success("Agendamento salvo!"); refetch(); onClose(); } });
  const [enabled, setEnabled] = useState(settings?.scheduleEnabled ?? false);
  const [windows, setWindows] = useState<{ start: string; end: string }[]>(
    (settings?.scheduleWindows as any) ?? [{ start: "08:00", end: "22:00" }]
  );

  const addWindow = () => setWindows([...windows, { start: "08:00", end: "22:00" }]);
  const removeWindow = (i: number) => setWindows(windows.filter((_, idx) => idx !== i));
  const updateWindow = (i: number, field: "start" | "end", val: string) => {
    const updated = [...windows];
    updated[i] = { ...updated[i], [field]: val };
    setWindows(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Agendamento Automático
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label className="text-sm font-medium">Ativar agendamento automático</Label>
          </div>
          {windows.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Ligar</Label>
                  <Input type="time" value={w.start} onChange={(e) => updateWindow(i, "start", e.target.value)} className="bg-muted/30 border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Desligar</Label>
                  <Input type="time" value={w.end} onChange={(e) => updateWindow(i, "end", e.target.value)} className="bg-muted/30 border-border" />
                </div>
              </div>
              {windows.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeWindow(i)} className="text-destructive mt-4">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <button onClick={addWindow} className="w-full border border-dashed border-border rounded-lg py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
            + Adicionar janela de horário
          </button>
          <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3 text-xs text-blue-300">
            <strong>Como funciona:</strong> Adicione uma ou mais janelas de horário. O bot liga automaticamente ao entrar em qualquer janela e desliga ao sair de todas. Suporta horários que cruzam a meia-noite (ex: 22:00–06:00).
          </div>
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => save.mutate({ scheduleEnabled: enabled, scheduleWindows: windows })}
            disabled={save.isPending}
          >
            {save.isPending ? "Salvando..." : "✓ Salvar Configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Delay ─────────────────────────────────────────────────────────────
function DelayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: settings, refetch } = trpc.botSettings.get.useQuery();
  const save = trpc.botSettings.save.useMutation({ onSuccess: () => { toast.success("Delay salvo!"); refetch(); onClose(); } });
  const [delayMinutes, setDelayMinutes] = useState(settings?.delayMinutes ?? 0);
  const [delayPerGroup, setDelayPerGroup] = useState(settings?.delayPerGroup ?? false);
  const [delayGlobal, setDelayGlobal] = useState(settings?.delayGlobal ?? false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Delay entre Postagens
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3 text-sm text-blue-300 space-y-1">
            <p>Após cada envio, o bot <span className="text-blue-400 font-semibold">aguarda X minutos</span> antes de poder enviar novamente.</p>
            <p className="text-xs text-muted-foreground">Exemplo com 5 min: detectou link → enviou → espera 5 min → só então envia o próximo link que aparecer.</p>
            <p className="text-xs font-semibold text-blue-300">Use 0 para não ter espera entre postagens.</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Delay em Minutos (0 = desativado)</Label>
            <Input
              type="number"
              min={0}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="mt-1 bg-muted/30 border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Switch checked={delayPerGroup} onCheckedChange={setDelayPerGroup} />
                <Label className="text-sm font-medium">Aplicar delay entre cada grupo de destino</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Ativado:</strong> envia para o Grupo 1 → espera o delay → envia para o Grupo 2 → espera → Grupo 3... Mais lento, porém mais natural.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Desativado:</strong> envia para todos os grupos de uma vez → depois espera o delay antes do próximo link.
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Switch checked={delayGlobal} onCheckedChange={setDelayGlobal} />
                <Label className="text-sm font-medium">Delay global entre grupos monitorados</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Ativado:</strong> timer único compartilhado — se o Monitorado A disparou, B e C precisam esperar o delay antes de enviar. Os destinos recebem no máximo uma mensagem a cada X minutos.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Desativado:</strong> cada grupo monitorado tem seu próprio timer — se A, B e C postam ao mesmo tempo, os destinos recebem os três envios juntos.
              </p>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            onClick={() => save.mutate({ delayMinutes, delayPerGroup, delayGlobal })}
            disabled={save.isPending}
          >
            {save.isPending ? "Salvando..." : "✓ Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Comandos do Bot ───────────────────────────────────────────────────
function CommandsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: settings, refetch } = trpc.botSettings.get.useQuery();
  const save = trpc.botSettings.save.useMutation({ onSuccess: () => { toast.success("Comandos salvos!"); refetch(); onClose(); } });
  const [cmdSticker, setCmdSticker] = useState(settings?.cmdStickerEnabled ?? false);
  const [cmdDeleteLinks, setCmdDeleteLinks] = useState(settings?.cmdDeleteLinksEnabled ?? false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            Comandos do Bot
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* Converter em Figurinha */}
          <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-purple-700 text-white text-xs font-mono px-2 py-1 rounded">!s</span>
                <span className="font-semibold">Converter em Figurinha</span>
              </div>
              <Switch checked={cmdSticker} onCheckedChange={setCmdSticker} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Converte imagens, vídeos ou GIFs em figurinhas. Envie a mídia com <code className="bg-muted px-1 rounded">!s</code> na legenda, ou responda a uma mídia com <code className="bg-muted px-1 rounded">!s</code>.</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Qualquer membro</Badge>
              <Badge variant="outline" className="text-xs">Grupos e privado</Badge>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center uppercase tracking-widest">CONFIGURAÇÕES</div>

          {/* Excluir Links de Não-Admins */}
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-red-800 flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Excluir Links de Não-Admins</span>
              </div>
              <Switch checked={cmdDeleteLinks} onCheckedChange={setCmdDeleteLinks} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Mensagens com links enviadas por membros comuns nos grupos de disparo são apagadas automaticamente. Admins do grupo não são afetados.</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-orange-400 border-orange-800">Somente grupos de disparo</Badge>
              <Badge variant="outline" className="text-xs text-red-400 border-red-800">Bot precisa ser admin</Badge>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center uppercase tracking-widest">SEMPRE ATIVO</div>

          {/* Salvar Mídia no Privado */}
          <div className="bg-muted/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="bg-blue-700 text-white text-xs font-mono px-2 py-1 rounded">!r</span>
              <span className="font-semibold">Salvar Mídia no Privado</span>
              <Badge className="bg-green-800 text-green-200 text-xs">Sempre ativo</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Envia a mídia de uma mensagem para o chat privado do próprio bot (salva sem compressão). Envie uma mídia com <code className="bg-muted px-1 rounded">!r</code> na legenda, ou responda uma mensagem com mídia usando <code className="bg-muted px-1 rounded">!r</code>.</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Qualquer membro</Badge>
              <Badge variant="outline" className="text-xs">Imagem · Vídeo · Sticker · Áudio · Doc</Badge>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center uppercase tracking-widest">COMANDOS DE ADMINISTRADOR</div>

          {/* !ban */}
          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-red-700 text-white text-xs font-mono px-2 py-1 rounded">!ban</span>
              <span className="font-semibold">Banir Membro</span>
              <Badge className="bg-green-800 text-green-200 text-xs">Sempre ativo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Apaga a mensagem marcada e remove o autor do grupo. Para usar: <strong>responda a mensagem</strong> da pessoa que deseja banir com <code className="bg-muted px-1 rounded">!ban</code>.</p>
            <div className="bg-amber-950/30 border border-amber-800/30 rounded p-2 mt-2 text-xs text-amber-300">
              <strong>Exemplo:</strong> Admin responde a mensagem de um usuário com <code className="bg-muted px-1 rounded">!ban</code> → mensagem apagada + usuário removido.
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-orange-400 border-orange-800">Somente admins</Badge>
              <Badge variant="outline" className="text-xs text-red-400 border-red-800">Bot precisa ser admin</Badge>
              <Badge variant="outline" className="text-xs">Somente grupos</Badge>
            </div>
          </div>

          {/* !add */}
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-green-700 text-white text-xs font-mono px-2 py-1 rounded">!add &lt;número&gt;</span>
              <span className="font-semibold">Adicionar Membro</span>
              <Badge className="bg-green-800 text-green-200 text-xs">Sempre ativo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Adiciona um número de telefone diretamente ao grupo. O número pode estar em qualquer formato — o bot extrai apenas os dígitos automaticamente.</p>
            <div className="bg-green-950/40 border border-green-800/30 rounded p-2 mt-2 text-xs text-green-300">
              <strong>Exemplos válidos:</strong><br />
              <code>!add +55 11 99999-9999</code><br />
              <code>!add 5511999999999</code><br />
              <code>!add (11) 9 9999-9999</code>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-orange-400 border-orange-800">Somente admins</Badge>
              <Badge variant="outline" className="text-xs text-red-400 border-red-800">Bot precisa ser admin</Badge>
              <Badge variant="outline" className="text-xs">Somente grupos</Badge>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => save.mutate({ cmdStickerEnabled: cmdSticker, cmdDeleteLinksEnabled: cmdDeleteLinks })}
            disabled={save.isPending}
          >
            {save.isPending ? "Salvando..." : "✓ Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Link do Grupo ─────────────────────────────────────────────────────
function GroupLinkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: settings, refetch } = trpc.botSettings.get.useQuery();
  const save = trpc.botSettings.save.useMutation({ onSuccess: () => { toast.success("Configuração salva!"); refetch(); onClose(); } });
  const [includeGroupLink, setIncludeGroupLink] = useState(settings?.includeGroupLink ?? false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            Link do Grupo nas Mensagens
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-muted/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Incluir Link do Grupo</p>
                <p className="text-xs text-muted-foreground mt-1">Quando ativado, o link de convite do grupo será adicionado automaticamente no final das mensagens enviadas</p>
              </div>
              <Switch checked={includeGroupLink} onCheckedChange={setIncludeGroupLink} />
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            onClick={() => save.mutate({ includeGroupLink })}
            disabled={save.isPending}
          >
            {save.isPending ? "Salvando..." : "✓ Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Envio Manual ──────────────────────────────────────────────────────
function ManualSendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: instances } = trpc.whatsapp.listInstances.useQuery();
  const { data: groups } = trpc.whatsapp.listMonitoredGroups.useQuery({ instanceId: undefined });
  const send = trpc.manualSend.send.useMutation({
    onSuccess: (data) => { toast.success(`Enviado para ${data.sentCount} grupos!`); onClose(); },
    onError: (err) => toast.error(err.message),
  });
  const [message, setMessage] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const connectedInstance = instances?.find(i => i.status === "connected");
  const sendGroups = groups?.filter(g => g.enviarOfertas) ?? [];

  const toggleGroup = (id: number) => {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            Envio Manual
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!connectedInstance ? (
            <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 text-sm text-red-300">
              WhatsApp não está conectado. Conecte primeiro para usar o envio manual.
            </div>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium">Mensagem</Label>
                <textarea
                  className="mt-1 w-full bg-muted/30 border border-border rounded-lg p-3 text-sm resize-none h-32 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Cole um link ou escreva sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Grupos de Destino</Label>
                {sendGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum grupo com "Enviar Ofertas" ativo.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {sendGroups.map(g => (
                      <label key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/30">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                          className="rounded"
                        />
                        <span className="text-sm">{g.groupName || g.groupJid}</span>
                        <Badge variant="outline" className="text-xs ml-auto">Grupo</Badge>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                onClick={() => send.mutate({
                  instanceId: connectedInstance.id,
                  targetGroupIds: selectedGroups.length > 0 ? selectedGroups : sendGroups.map(g => g.id),
                  message,
                  replaceLinks: true,
                })}
                disabled={send.isPending || !message.trim()}
              >
                {send.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Credential Card ─────────────────────────────────────────────────────────
function CredCard({
  icon, label, desc, configured, onClick, color
}: {
  icon: React.ReactNode; label: string; desc: string; configured: boolean; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left w-full group"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2">
        {configured && <div className="w-2 h-2 rounded-full bg-green-400" />}
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

// ─── Tool Card ───────────────────────────────────────────────────────────────
function ToolCard({
  icon, label, desc, onClick, color
}: {
  icon: React.ReactNode; label: string; desc: string; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all text-left w-full group"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────
export default function Settings() {
  const { data: mlConfig } = trpc.mercadoLivre.getConfig.useQuery();
  const { data: shopeeConfig } = trpc.shopee.getConfig.useQuery();
  const { data: amazonConfig } = trpc.amazon.getConfig.useQuery();
  const { data: magConfig } = trpc.magazineLuiza.getConfig.useQuery();
  const { data: aliConfig } = trpc.aliexpress.getConfig.useQuery();
  const { data: botSettings, refetch: refetchSettings } = trpc.botSettings.get.useQuery();
  const { data: groups } = trpc.whatsapp.listMonitoredGroups.useQuery({ instanceId: undefined });
  const saveBotSettings = trpc.botSettings.save.useMutation({ onSuccess: () => refetchSettings() });

  const [modal, setModal] = useState<string | null>(null);

  const sendGroups = groups?.filter(g => g.enviarOfertas) ?? [];

  return (
    <AppLayout title="Configurações">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">

        {/* Feed Global */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Feed Global</p>
                <p className="text-xs text-muted-foreground">Receba links de todos os usuários do sistema</p>
              </div>
            </div>
            <Switch
              checked={botSettings?.feedGlobalEnabled ?? false}
              onCheckedChange={(v) => saveBotSettings.mutate({ feedGlobalEnabled: v })}
            />
          </div>
          {botSettings?.feedGlobalEnabled && (
            <div className="mt-3 bg-blue-950/30 border border-blue-800/30 rounded-lg p-3 text-sm text-blue-300">
              <p className="font-semibold mb-1">O que é o Feed Global?</p>
              <p>Quando ativado, você recebe automaticamente <strong>links de afiliado</strong> detectados em <strong>todos os grupos monitorados</strong> por outros usuários do sistema. Assim você não precisa configurar seus próprios grupos de monitoramento — aproveite os links que outras pessoas já encontraram!</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["Shopee", "AliExpress", "Mercado Livre", "Amazon", "Magazine Luiza"].map(s => (
                  <span key={s} className="text-xs text-blue-300">✓ {s}</span>
                ))}
              </div>
              {sendGroups.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2">Grupos Alvo (opcional)</p>
                  <div className="space-y-1">
                    {sendGroups.map(g => (
                      <label key={g.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span>{g.groupName || g.groupJid}</span>
                        <Badge variant="outline" className="text-xs">GRUPO</Badge>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Deixe todos desmarcados para enviar para todos os grupos de disparo.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CREDENCIAIS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
              <SettingsIcon className="w-3 h-3 text-yellow-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Credenciais</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <CredCard
              icon={<ShoppingBag className="w-5 h-5 text-white" />}
              label="Shopee"
              desc={shopeeConfig?.appId ? `AppID: ${shopeeConfig.appId}` : "AppID + Chave Secreta"}
              configured={!!shopeeConfig?.appId}
              onClick={() => setModal("shopee")}
              color="bg-orange-500"
            />
            <CredCard
              icon={<span className="text-white font-bold text-xs">ML</span>}
              label="Mercado Livre"
              desc={mlConfig?.tag ? `Tag: ${mlConfig.tag}` : "Tag de afiliado + Cookie"}
              configured={!!mlConfig?.tag}
              onClick={() => setModal("ml")}
              color="bg-yellow-500"
            />
            <CredCard
              icon={<ShoppingCart className="w-5 h-5 text-white" />}
              label="Amazon"
              desc={amazonConfig?.tag ? `Tag: ${amazonConfig.tag}` : "Tag + Cookies de sessão"}
              configured={!!amazonConfig?.tag}
              onClick={() => setModal("amazon")}
              color="bg-blue-600"
            />
            <CredCard
              icon={<Store className="w-5 h-5 text-white" />}
              label="Magazine Luiza"
              desc={magConfig?.tag ? `Tag: ${magConfig.tag}` : "Tag"}
              configured={!!magConfig?.tag}
              onClick={() => setModal("magalu")}
              color="bg-pink-600"
            />
            <CredCard
              icon={<Package className="w-5 h-5 text-white" />}
              label="AliExpress"
              desc={aliConfig?.trackId ? `Track ID: ${aliConfig.trackId}` : "Track ID + Cookie"}
              configured={!!aliConfig?.trackId}
              onClick={() => setModal("aliexpress")}
              color="bg-orange-600"
            />
          </div>
        </div>

        {/* AUTOMAÇÃO */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <Zap className="w-3 h-3 text-green-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-green-400">Automação</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <ToolCard
              icon={<Calendar className="w-5 h-5 text-white" />}
              label="Agendamento"
              desc={botSettings?.scheduleEnabled ? "Ativo — horários configurados" : "Horários automáticos"}
              onClick={() => setModal("schedule")}
              color="bg-orange-500"
            />
            <ToolCard
              icon={<Clock className="w-5 h-5 text-white" />}
              label="Delay entre Postagens"
              desc={botSettings?.delayMinutes ? `${botSettings.delayMinutes} minuto(s) entre envios` : "Intervalo entre envios"}
              onClick={() => setModal("delay")}
              color="bg-teal-500"
            />
            <ToolCard
              icon={<Terminal className="w-5 h-5 text-white" />}
              label="Comandos"
              desc="Ativar/desativar comandos do bot"
              onClick={() => setModal("commands")}
              color="bg-purple-600"
            />
            <ToolCard
              icon={<Sticker className="w-5 h-5 text-white" />}
              label="Figurinhas"
              desc="Disparo automático de stickers"
              onClick={() => toast.info("Em breve!")}
              color="bg-pink-500"
            />
          </div>
        </div>

        {/* FERRAMENTAS */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Wrench className="w-3 h-3 text-purple-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Ferramentas</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <ToolCard
              icon={<Link2 className="w-5 h-5 text-white" />}
              label="Link do Grupo"
              desc={botSettings?.includeGroupLink ? "Ativo — link incluído nas mensagens" : "Incluir nas mensagens"}
              onClick={() => setModal("grouplink")}
              color="bg-green-600"
            />
            <ToolCard
              icon={<UserPlus className="w-5 h-5 text-white" />}
              label="Add Membros"
              desc="Grupos de disparo"
              onClick={() => toast.info("Em breve!")}
              color="bg-blue-600"
            />
            <ToolCard
              icon={<Eye className="w-5 h-5 text-white" />}
              label="Preview Clicável"
              desc={botSettings?.clickablePreview ? "Ativo" : "Substitui a imagem pelo preview do produto"}
              onClick={() => saveBotSettings.mutate({ clickablePreview: !botSettings?.clickablePreview })}
              color="bg-indigo-600"
            />
            <ToolCard
              icon={<Youtube className="w-5 h-5 text-white" />}
              label="Tutoriais"
              desc="Aprenda a usar"
              onClick={() => toast.info("Em breve!")}
              color="bg-red-600"
            />
          </div>
        </div>

        {/* Envio Manual */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
              <Zap className="w-3 h-3 text-yellow-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Disparo</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setModal("manualsend")}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-yellow-500/40 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="font-semibold text-sm">Envio Manual</p>
                <p className="text-xs text-muted-foreground">Cole um link e envie já com su...</p>
              </div>
            </button>
            <button
              onClick={() => toast.info("Em breve!")}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-green-500/40 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Envio em Massa</p>
                <p className="text-xs text-muted-foreground">Texto e/ou foto para grupos</p>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <ShopeeModal open={modal === "shopee"} onClose={() => setModal(null)} />
      <AmazonModal open={modal === "amazon"} onClose={() => setModal(null)} />
      <MagazineLuizaModal open={modal === "magalu"} onClose={() => setModal(null)} />
      <AliExpressModal open={modal === "aliexpress"} onClose={() => setModal(null)} />
      <ScheduleModal open={modal === "schedule"} onClose={() => setModal(null)} />
      <DelayModal open={modal === "delay"} onClose={() => setModal(null)} />
      <CommandsModal open={modal === "commands"} onClose={() => setModal(null)} />
      <GroupLinkModal open={modal === "grouplink"} onClose={() => setModal(null)} />
      <ManualSendModal open={modal === "manualsend"} onClose={() => setModal(null)} />
      {modal === "ml" && (
        <MercadoLivreConfigModal open={true} onClose={() => setModal(null)} />
      )}
    </AppLayout>
  );
}
