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
import { Settings, Trash2, X } from "lucide-react";
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
    socialTag: "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        tag: config.tag || "",
        cookieSsid: config.cookieSsid || "",
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
      socialTag: form.socialTag.trim() || undefined,
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
            <Label className="text-sm font-medium text-white">Cookie (ssid)</Label>
            <Textarea
              placeholder="ghy-032106-SVxCWVuF97Ohv9YBCpigenHQEoV8cp-__-..."
              value={form.cookieSsid}
              onChange={(e) => setForm({ ...form, cookieSsid: e.target.value })}
              rows={2}
              className="bg-[#0f1628] border-[#2a3555] text-white placeholder:text-muted-foreground focus:border-yellow-500/50 resize-none font-mono text-xs"
            />
          </div>

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
