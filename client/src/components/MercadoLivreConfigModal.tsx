import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardPaste, Link2, Settings, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Extrai o valor de um cookie específico de uma string de cookies do browser */
function extractCookie(cookieString: string, name: string): string {
  const regex = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`);
  const match = cookieString.match(regex);
  return match ? match[1].trim() : "";
}

const LINK_MODE_OPTIONS = [
  {
    value: "long",
    label: "Link longo",
    description: "Envia o link completo com sua tag. Abre o produto diretamente.",
    badge: "Recomendado",
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
    example: "mercadolivre.com.br/produto?matt_from=SUA_TAG",
  },
  {
    value: "social",
    label: "Vitrine Social",
    description: "Substitui a tag no link /social/ e preserva forceInApp+ref. Abre o produto na vitrine.",
    badge: "Requer cookies",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    example: "/social/SUA_TAG?forceInApp=true&ref=TOKEN → produto na vitrine",
  },
  {
    value: "tinyurl",
    label: "Link encurtado (TinyURL)",
    description: "Encurta via TinyURL. Mantém o produto específico, sem necessidade de cookies.",
    badge: "Sem cookies",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    example: "tinyurl.com/XXXXX → abre produto direto",
  },
] as const;

export default function MercadoLivreConfigModal({ open, onClose }: Props) {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.mercadoLivre.getConfig.useQuery(undefined, {
    enabled: open,
  });

  const [form, setForm] = useState({
    tag: "",
    cookieSsid: "",
    cookieCsrf: "",
    linkMode: "long" as "long" | "social" | "tinyurl",
  });

  const [cookiePasteValue, setCookiePasteValue] = useState("");
  const [extractedPreview, setExtractedPreview] = useState<{ ssid: string; csrf: string } | null>(null);

  useEffect(() => {
    if (config) {
      setForm({
        tag: config.tag || "",
        cookieSsid: config.cookieSsid || "",
        cookieCsrf: (config as any).cookieCsrf || "",
        linkMode: ((config as any).linkMode as "long" | "social" | "tinyurl") || "long",
      });
    }
  }, [config]);

  const saveMutation = trpc.mercadoLivre.saveConfig.useMutation({
    onSuccess: () => {
      utils.mercadoLivre.getConfig.invalidate();
      toast.success("Configurações salvas com sucesso!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave() {
    saveMutation.mutate({
      tag: form.tag.trim() || undefined,
      cookieSsid: form.cookieSsid.trim() || undefined,
      cookieCsrf: form.cookieCsrf.trim() || undefined,
      linkMode: form.linkMode,
      isActive: true,
    });
  }

  function handleCookiePaste(value: string) {
    setCookiePasteValue(value);
    if (!value.trim()) {
      setExtractedPreview(null);
      return;
    }
    const ssid = extractCookie(value, "ssid");
    const csrf = extractCookie(value, "_csrf");
    if (ssid || csrf) {
      setExtractedPreview({ ssid, csrf });
    } else {
      setExtractedPreview(null);
    }
  }

  function applyExtractedCookies() {
    if (!extractedPreview) return;
    setForm((f) => ({
      ...f,
      cookieSsid: extractedPreview.ssid || f.cookieSsid,
      cookieCsrf: extractedPreview.csrf || f.cookieCsrf,
    }));
    setCookiePasteValue("");
    setExtractedPreview(null);
    toast.success("Cookies extraídos e aplicados!");
  }

  const isConfigured = !!(config?.tag);
  const hasCookies = !!(form.cookieSsid);
  const selectedMode = LINK_MODE_OPTIONS.find((m) => m.value === form.linkMode) || LINK_MODE_OPTIONS[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden bg-[#1a2035] border-[#2a3555]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3555]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-black" />
            </div>
            <DialogTitle className="text-base font-semibold text-white">
              Configurações Mercado Livre
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isConfigured && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Configurado
                </Badge>
              )}
              {hasCookies && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Cookies ativos
                </Badge>
              )}
            </div>
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

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* ── MODO DE ENVIO DE LINKS ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-yellow-400" />
              <Label className="text-sm font-semibold text-white">Modo de envio de links</Label>
            </div>
            <div className="grid gap-2">
              {LINK_MODE_OPTIONS.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, linkMode: mode.value }))}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    form.linkMode === mode.value
                      ? "border-yellow-500/60 bg-yellow-500/10"
                      : "border-[#2a3555] bg-[#0f1628] hover:border-[#3a4565]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                        form.linkMode === mode.value
                          ? "border-yellow-400 bg-yellow-400"
                          : "border-[#3a4565]"
                      }`} />
                      <span className="text-sm font-medium text-white">{mode.label}</span>
                    </div>
                    <Badge className={`text-xs ${mode.badgeColor}`}>{mode.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">{mode.description}</p>
                  <p className="text-xs text-[#4a5575] font-mono ml-5 mt-1">{mode.example}</p>
                </button>
              ))}
            </div>
            {form.linkMode === "social" && !hasCookies && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3">
                <p className="text-xs text-orange-400">
                  ⚠️ O modo <strong>Vitrine Social</strong> requer o cookie <strong>ssid</strong>. Configure-o abaixo ou escolha outro modo.
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2a3555]" />
            <span className="text-xs text-muted-foreground">credenciais de afiliado</span>
            <div className="flex-1 h-px bg-[#2a3555]" />
          </div>

          {/* Instruções */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-yellow-400">Como obter suas credenciais Mercado Livre:</p>
            <ol className="text-xs text-yellow-300/80 space-y-1">
              <li>1. Acesse <a href="https://affiliates.mercadolivre.com.br" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-yellow-200">affiliates.mercadolivre.com.br</a> e faça login</li>
              <li>2. Vá em <strong>Minha conta → Tag de rastreamento</strong> para copiar sua <strong>Tag</strong></li>
              <li>3. Para o Cookie: instale a extensão <a href="https://chrome.google.com/webstore/detail/editthiscookie" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">EditThisCookie</a> no seu navegador → acesse o site → clique no ícone da extensão → copie o valor de <strong>ssid</strong></li>
            </ol>
          </div>

          {/* Tag field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Tag</Label>
            <Input
              placeholder="Ex: bq20260201142328"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20"
            />
          </div>

          {/* Cookies section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <Label className="text-sm font-semibold text-white">Cookie (ssid)</Label>
              <span className="text-xs text-muted-foreground">— necessário para modo Vitrine Social</span>
            </div>

            {/* ── ATALHO: Colar cookies completos ── */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-blue-400" />
                <p className="text-blue-400 font-semibold text-sm">Atalho rápido — Cole os cookies do browser</p>
              </div>
              <ol className="text-xs text-blue-300/80 space-y-1">
                <li>1. Acesse <a href="https://www.mercadolivre.com.br/afiliados/linkbuilder" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-200">mercadolivre.com.br/afiliados/linkbuilder</a> logado</li>
                <li>2. Pressione <kbd className="bg-[#1a2035] border border-blue-500/30 px-1 py-0.5 rounded text-xs">F12</kbd> → aba <strong>Network</strong> → gere um link → clique em <strong>createLink</strong></li>
                <li>3. Vá em <strong>Headers</strong> → role até <strong>Request Headers</strong> → copie o valor de <strong>Cookie:</strong></li>
                <li>4. Cole abaixo — o sistema extrai <strong>ssid</strong> e <strong>_csrf</strong> automaticamente</li>
              </ol>
              <Textarea
                placeholder="Cole aqui a string completa de cookies: ssid=ghy-...; _csrf=abc...; orgnickp=..."
                value={cookiePasteValue}
                onChange={(e) => handleCookiePaste(e.target.value)}
                rows={3}
                className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-blue-500/50 resize-none font-mono text-xs"
              />
              {extractedPreview && (
                <div className="rounded-lg bg-[#0f1628] border border-blue-500/30 p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-400">Valores extraídos:</p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-white font-mono">ssid:</span>{" "}
                      {extractedPreview.ssid
                        ? <span className="text-green-400 font-mono">{extractedPreview.ssid.substring(0, 30)}...</span>
                        : <span className="text-red-400">não encontrado</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-white font-mono">_csrf:</span>{" "}
                      {extractedPreview.csrf
                        ? <span className="text-green-400 font-mono">{extractedPreview.csrf}</span>
                        : <span className="text-red-400">não encontrado</span>}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={applyExtractedCookies}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-7 px-3"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Aplicar cookies extraídos
                  </Button>
                </div>
              )}
            </div>

            {/* Cookie ssid field */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Cookie (ssid)</Label>
              <Textarea
                placeholder="ghy-032106-SVxCWVuF97Ohv9YBCpigenHQEoV8cp-__-..."
                value={form.cookieSsid}
                onChange={(e) => setForm({ ...form, cookieSsid: e.target.value })}
                rows={2}
                className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20 resize-none font-mono text-xs"
              />
            </div>
          </div>

          {/* Preview */}
          {form.tag && (
            <div className="rounded-lg bg-[#0f1628] border border-[#2a3555] p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resumo da configuração</p>
              <p className="text-xs text-white">
                <span className="text-muted-foreground">Tag:</span>{" "}
                <span className="font-mono text-green-400">{form.tag}</span>
              </p>
              <p className="text-xs text-white">
                <span className="text-muted-foreground">Modo:</span>{" "}
                <Badge className={`text-xs ${selectedMode.badgeColor}`}>{selectedMode.label}</Badge>
              </p>
              {form.linkMode === "social" && !hasCookies && (
                <p className="text-xs text-orange-400">⚠ Modo social requer cookie ssid</p>
              )}
              {form.linkMode === "social" && hasCookies && (
                <p className="text-xs text-blue-400">✓ Cookie configurado — modo vitrine social ativo</p>
              )}
              {form.linkMode === "tinyurl" && (
                <p className="text-xs text-purple-400">✓ Links serão encurtados via TinyURL (produto direto)</p>
              )}
              {form.linkMode === "long" && (
                <p className="text-xs text-green-400">✓ Link longo com tag — produto abre diretamente</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#2a3555]">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2a3555] bg-transparent hover:bg-[#2a3555] text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
          >
            {saveMutation.isPending ? "Salvando..." : "✓ Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
