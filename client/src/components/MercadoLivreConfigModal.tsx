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
import { CheckCircle2, ChevronDown, ChevronRight, ClipboardPaste, ExternalLink, Settings, X, Zap } from "lucide-react";
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

export default function MercadoLivreConfigModal({ open, onClose }: Props) {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.mercadoLivre.getConfig.useQuery(undefined, {
    enabled: open,
  });

  const [form, setForm] = useState({
    tag: "",
    cookieSsid: "",
    cookieCsrf: "",
    mattToolId: "",
    socialTag: "",
  });

  const [showMattHelp, setShowMattHelp] = useState(false);
  const [cookiePasteValue, setCookiePasteValue] = useState("");
  const [extractedPreview, setExtractedPreview] = useState<{ ssid: string; csrf: string } | null>(null);

  useEffect(() => {
    if (config) {
      setForm({
        tag: config.tag || "",
        cookieSsid: config.cookieSsid || "",
        cookieCsrf: (config as any).cookieCsrf || "",
        mattToolId: config.mattToolId || "",
        socialTag: config.socialTag || "",
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
      mattToolId: form.mattToolId.trim() || undefined,
      socialTag: form.socialTag.trim() || undefined,
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
  const hasCookies = !!(form.cookieSsid && form.cookieCsrf);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[620px] p-0 gap-0 overflow-hidden bg-[#1a2035] border-[#2a3555]">
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
                  <Zap className="w-3 h-3 mr-1" /> Encurtamento ativo
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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2a3555]" />
            <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
            <div className="flex-1 h-px bg-[#2a3555]" />
          </div>

          {/* Tag field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Tag de afiliado</Label>
            <Input
              placeholder="Ex: bq20260201142328"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20"
            />
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

          {/* Cookie _csrf field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-white">Cookie (_csrf)</Label>
              <span className="text-xs text-muted-foreground">(para encurtar via meli.la)</span>
            </div>
            <Input
              placeholder="Ex: vrR725i1gpfZ84j1PmeMZRF4"
              value={form.cookieCsrf}
              onChange={(e) => setForm({ ...form, cookieCsrf: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20 font-mono text-xs"
            />
          </div>

          {/* Matt Tool ID field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-white">Matt Tool ID</Label>
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              onClick={() => setShowMattHelp(!showMattHelp)}
            >
              {showMattHelp ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Como obter o Matt Tool ID?
            </button>
            {showMattHelp && (
              <div className="rounded-lg bg-[#0f1628] border border-[#2a3555] p-3 text-xs text-muted-foreground space-y-1">
                <p>1. Acesse o painel de afiliados do Mercado Livre</p>
                <p>2. Vá em <strong className="text-white">Ferramentas → Matt Tool</strong></p>
                <p>3. Copie o ID numérico da sua ferramenta (ex: 78912023)</p>
                <a
                  href="https://affiliates.mercadolivre.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 mt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Acessar painel de afiliados
                </a>
              </div>
            )}
            <Input
              placeholder="Ex: 78912023"
              value={form.mattToolId}
              onChange={(e) => setForm({ ...form, mattToolId: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20"
            />
          </div>

          {/* Social Tag field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-white">Tag do Perfil Social</Label>
              <span className="text-xs text-muted-foreground">(opcional — para links /social/)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Slug usado no path{" "}
              <code className="bg-[#2a3555] px-1.5 py-0.5 rounded text-xs text-white">/social/SLUG</code>{" "}
              dos links de perfil. Se vazio, usa a Tag de afiliado acima.
            </p>
            <Input
              placeholder="Ex: bq20260201142328"
              value={form.socialTag}
              onChange={(e) => setForm({ ...form, socialTag: e.target.value })}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20"
            />
          </div>

          {/* Preview */}
          {form.tag && (
            <div className="rounded-lg bg-[#0f1628] border border-[#2a3555] p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prévia do link gerado</p>
              <p className="text-xs text-green-400 font-mono break-all">
                https://meli.la/XXXXX → com tag: {form.tag}
                {form.mattToolId ? ` | tool: ${form.mattToolId}` : ""}
              </p>
              {hasCookies && (
                <p className="text-xs text-blue-400">✓ Encurtamento via meli.la ativo</p>
              )}
              {!hasCookies && (
                <p className="text-xs text-yellow-400">⚠ Sem cookies: link longo será usado como fallback</p>
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
            {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
