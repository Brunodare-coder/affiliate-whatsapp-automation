import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Link2, Link2Off, Loader2, RefreshCw, Settings, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MercadoLivreConfigModal({ open, onClose }: Props) {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.mercadoLivre.getConfig.useQuery(undefined, {
    enabled: open,
  });

  const [form, setForm] = useState({
    tag: "",
    cookieSsid: "",
    cookieCsrf: "",
    socialTag: "",
    linkMode: "long" as "long" | "social" | "tinyurl" | "meli",
  });

  useEffect(() => {
    if (config) {
      setForm({
        tag: config.tag || "",
        cookieSsid: config.cookieSsid || "",
        cookieCsrf: (config as any).cookieCsrf || "",
        socialTag: config.socialTag || "",
        linkMode: ((config as any).linkMode || "long") as "long" | "social" | "tinyurl" | "meli",
      });
    }
  }, [config]);

  const { data: oauthStatus, refetch: refetchOAuth } = trpc.mercadoLivre.getOAuthStatus.useQuery(undefined, {
    enabled: open,
  });

  const disconnectOAuth = trpc.mercadoLivre.disconnectOAuth.useMutation({
    onSuccess: () => {
      refetchOAuth();
      toast.success('Conta ML desconectada.');
    },
    onError: (e) => toast.error(e.message),
  });

  function handleConnectML() {
    // Redireciona para a rota OAuth ML no servidor
    window.location.href = '/api/oauth/ml/start';
  }

  const validateCookie = trpc.mercadoLivre.validateCookie.useMutation({
    onSuccess: (result) => {
      utils.mercadoLivre.getConfig.invalidate();
      if (result.status === 'expired') {
        toast.error('Cookie ssid expirado! Atualize o valor abaixo.');
      } else if (result.status === 'ok') {
        toast.success('Cookie ssid válido e funcionando!');
      } else {
        toast.warning(result.message || 'Não foi possível verificar o cookie.');
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const saveMutation = trpc.mercadoLivre.saveConfig.useMutation({
    onSuccess: () => {
      utils.mercadoLivre.getConfig.invalidate();
      toast.success("Configurações salvas com sucesso!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.mercadoLivre.deleteConfig.useMutation({
    onSuccess: () => {
      utils.mercadoLivre.getConfig.invalidate();
      toast.success("Configurações removidas.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave() {
    saveMutation.mutate({
      tag: form.tag.trim() || undefined,
      cookieSsid: form.cookieSsid.trim() || undefined,
      cookieCsrf: form.cookieCsrf.trim() || undefined,
      socialTag: form.socialTag.trim() || undefined,
      linkMode: form.linkMode,
      isActive: true,
    });
  }

  function handleDelete() {
    if (confirm("Remover configurações do Mercado Livre?")) {
      deleteMutation.mutate();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden bg-[#1a2035] border-[#2a3555]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3555]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-black" />
            </div>
            <DialogTitle className="text-base font-semibold text-white">
              Configurações Mercado Livre
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-muted-foreground hover:text-white rounded-lg bg-[#2a3555] hover:bg-[#3a4565]"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Instruções */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-xs text-yellow-300/90 space-y-1">
            <p className="font-semibold text-yellow-400">Como obter suas credenciais Mercado Livre:</p>
            <p>1. Acesse <strong>affiliates.mercadolivre.com.br</strong> e faça login</p>
            <p>2. Vá em <strong>Minha conta → Tag de rastreamento</strong> para copiar sua <strong>Tag</strong></p>
            <p>3. Para o Cookie: instale a extensão <strong>EditThisCookie</strong> no seu navegador → acesse o site → clique no ícone da extensão → copie o valor de <strong>ssid</strong></p>
          </div>

          {/* Tag */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-white">Tag</Label>
            <Input
              placeholder="Ex: bq20260201142328"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50"
            />
          </div>

          {/* Cookie ssid */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white">Cookie (ssid)</Label>
              {/* Status badge + botão verificar */}
              <div className="flex items-center gap-2">
                {config?.cookieSsid && (
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    config.cookieStatus === 'ok'
                      ? 'bg-green-500/15 text-green-400'
                      : config.cookieStatus === 'expired'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-white/10 text-muted-foreground'
                  }`}>
                    {config.cookieStatus === 'ok' ? <CheckCircle2 className="w-3 h-3" /> :
                     config.cookieStatus === 'expired' ? <AlertTriangle className="w-3 h-3" /> :
                     <HelpCircle className="w-3 h-3" />}
                    {config.cookieStatus === 'ok' ? 'Válido' :
                     config.cookieStatus === 'expired' ? 'Expirado' : 'Não verificado'}
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs border-[#2a3555] text-muted-foreground hover:text-white hover:bg-[#2a3555]"
                  onClick={() => validateCookie.mutate()}
                  disabled={validateCookie.isPending || !config?.cookieSsid}
                >
                  {validateCookie.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span className="ml-1">Verificar</span>
                </Button>
              </div>
            </div>
            <Textarea
              placeholder="ghy-032106-SVxCWVuF97Ohv9YBCpigenHQEoV8cp-__-..."
              value={form.cookieSsid}
              onChange={(e) => setForm({ ...form, cookieSsid: e.target.value })}
              rows={2}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 resize-none font-mono text-xs"
            />
            {config?.cookieStatus === 'expired' && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Cookie expirado. Cole um novo valor de ssid e salve.
              </p>
            )}
          </div>

          {/* Conexão OAuth ML */}
          <div className="rounded-lg bg-[#0f1628] border border-[#2a3555] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Conta ML via OAuth</p>
                <p className="text-xs text-muted-foreground mt-0.5">Conecte sua conta para gerar links de afiliado via API oficial</p>
              </div>
              {oauthStatus?.connected ? (
                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-muted-foreground">
                  <Link2Off className="w-3.5 h-3.5" />
                  Desconectado
                </span>
              )}
            </div>
            {oauthStatus?.connected && oauthStatus.nickname && (
              <p className="text-xs text-muted-foreground">
                Conta: <span className="text-white font-medium">{oauthStatus.nickname}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold gap-2"
                onClick={handleConnectML}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {oauthStatus?.connected ? 'Reconectar conta ML' : 'Conectar conta ML'}
              </Button>
              {oauthStatus?.connected && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-red-500/40 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 gap-2"
                  onClick={() => disconnectOAuth.mutate()}
                  disabled={disconnectOAuth.isPending}
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {/* Modo de Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Modo de Link</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "long", label: "Link Longo", desc: "URL completa com tag" },
                { value: "social", label: "Vitrine /social/", desc: "Link de perfil social" },
                { value: "meli", label: "meli.la (encurtado)", desc: "Requer cookie ssid+csrf" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, linkMode: opt.value })}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    form.linkMode === opt.value
                      ? "border-yellow-500 bg-yellow-500/10"
                      : "border-[#2a3555] bg-[#0f1628] hover:border-[#3a4565]"
                  }`}
                >
                  <p className={`text-xs font-semibold ${
                    form.linkMode === opt.value ? "text-yellow-400" : "text-white"
                  }`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cookie CSRF (apenas para modo meli) */}
          {form.linkMode === "meli" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-white">Cookie (_csrf)</Label>
              <p className="text-xs text-muted-foreground">Valor do cookie <code className="bg-[#2a3555] px-1 rounded">_csrf</code> — necessário para gerar links meli.la.</p>
              <Input
                placeholder="Ex: ydndjbaKNq7RaiotOBUN26Kd"
                value={form.cookieCsrf}
                onChange={(e) => setForm({ ...form, cookieCsrf: e.target.value })}
                className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 font-mono text-xs"
              />
            </div>
          )}

          {/* Tag do Perfil Social */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-white">Tag do Perfil Social</Label>
              <span className="text-xs text-muted-foreground">(opcional — para links /social/)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Slug usado no path{" "}
              <code className="bg-[#2a3555] px-1.5 py-0.5 rounded text-xs text-white">/social/SLUG</code>{" "}
              dos links de perfil. Se vazio, usa a Tag de conversão acima.
            </p>
            <Input
              placeholder="Ex: meu-perfil-afiliado"
              value={form.socialTag}
              onChange={(e) => setForm({ ...form, socialTag: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#2a3555]">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
          >
            {saveMutation.isPending ? "Salvando..." : "✓ Salvar"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="border-red-500/40 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
