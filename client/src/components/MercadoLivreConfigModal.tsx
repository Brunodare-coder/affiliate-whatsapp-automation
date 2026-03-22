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
import { CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Settings, X } from "lucide-react";
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
    mattToolId: "",
    socialTag: "",
  });

  const [showMattHelp, setShowMattHelp] = useState(false);

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

  const isConfigured = !!(config?.tag);

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
            {isConfigured && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Configurado
              </Badge>
            )}
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

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Instructions box */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 space-y-2">
            <p className="text-yellow-400 font-semibold text-sm">Como obter suas credenciais Mercado Livre:</p>
            <ol className="space-y-1.5 text-sm text-yellow-300/90">
              <li>
                1. Acesse{" "}
                <a
                  href="https://affiliates.mercadolivre.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2 hover:text-yellow-200"
                >
                  affiliates.mercadolivre.com.br
                </a>{" "}
                e faça login
              </li>
              <li>
                2. Vá em <span className="font-semibold">Minha conta → Tag de rastreamento</span> para copiar sua{" "}
                <span className="font-semibold">Tag</span>
              </li>
              <li>
                3. Para o Cookie: instale a extensão{" "}
                <a
                  href="https://chrome.google.com/webstore/detail/editthiscookie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2 hover:text-yellow-200"
                >
                  EditThisCookie
                </a>{" "}
                no seu navegador → acesse o site → clique no ícone da extensão → copie o valor de{" "}
                <span className="font-semibold">ssid</span>
              </li>
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

          {/* Cookie ssid field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Cookie (ssid)</Label>
            <Textarea
              placeholder="ghy-032106-SVxCWVuF97Ohv9YBCpigenHQEoV8cp-__-..."
              value={form.cookieSsid}
              onChange={(e) => setForm({ ...form, cookieSsid: e.target.value })}
              rows={3}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 focus:ring-yellow-500/20 resize-none font-mono text-xs"
            />
          </div>

          {/* Cookie _csrf field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-white">Cookie (_csrf)</Label>
              <span className="text-xs text-muted-foreground">(para encurtar links via meli.la)</span>
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
              <span className="text-xs text-muted-foreground">(opcional — para links de listas/ofertas)</span>
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
              dos links de perfil. Se vazio, usa a Tag de conversão acima.
            </p>
            <Input
              placeholder="Ex: meu-perfil-afiliado"
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
                https://www.mercadolivre.com.br/produto/MLB123?matt_from={form.tag}
                {form.mattToolId ? `&matt_tool=${form.mattToolId}` : ""}
              </p>
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
