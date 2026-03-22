import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Edit2, ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0");
  const utils = trpc.useUtils();

  const { data: campaign, isLoading: campaignLoading } = trpc.campaigns.get.useQuery({ id: campaignId });
  const { data: links, isLoading: linksLoading } = trpc.affiliateLinks.list.useQuery({ campaignId });

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    originalPattern: "",
    affiliateUrl: "",
    keywords: "",
  });

  const createMutation = trpc.affiliateLinks.create.useMutation({
    onSuccess: () => {
      utils.affiliateLinks.list.invalidate();
      setShowCreate(false);
      setForm({ name: "", originalPattern: "", affiliateUrl: "", keywords: "" });
      toast.success("Link criado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.affiliateLinks.update.useMutation({
    onSuccess: () => {
      utils.affiliateLinks.list.invalidate();
      setEditingId(null);
      toast.success("Link atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.affiliateLinks.delete.useMutation({
    onSuccess: () => {
      utils.affiliateLinks.list.invalidate();
      toast.success("Link removido!");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.affiliateLinks.update.useMutation({
    onSuccess: () => utils.affiliateLinks.list.invalidate(),
  });

  function openEdit(link: any) {
    setEditingId(link.id);
    setForm({
      name: link.name,
      originalPattern: link.originalPattern,
      affiliateUrl: link.affiliateUrl,
      keywords: link.keywords || "",
    });
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    if (!form.originalPattern.trim()) return toast.error("Padrão original é obrigatório");
    if (!form.affiliateUrl.trim()) return toast.error("URL de afiliado é obrigatória");

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate({ campaignId, ...form });
    }
  }

  const isOpen = showCreate || editingId !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (campaignLoading) {
    return (
      <AppLayout title="Carregando...">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-32 bg-secondary rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout title="Campanha não encontrada">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Campanha não encontrada.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/campaigns">Voltar</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={campaign.name}>
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground gap-1 -ml-2">
            <Link href="/campaigns">
              <ArrowLeft className="w-4 h-4" /> Campanhas
            </Link>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: campaign.color || "#22c55e", boxShadow: `0 0 8px ${campaign.color || "#22c55e"}60` }}
            />
            <h2 className="font-bold section-title truncate">{campaign.name}</h2>
            {campaign.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-muted-foreground border border-white/10">{campaign.category}</span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border flex-shrink-0 ${ campaign.isActive ? "bg-green-500/15 text-green-300 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10" }`}>
              {campaign.isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              {campaign.isActive ? "Ativa" : "Inativa"}
            </span>
          </div>
        </div>

        {campaign.description && (
          <p className="text-sm text-muted-foreground">{campaign.description}</p>
        )}

        {/* Links section header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold section-title">Links de Afiliado <span className="text-muted-foreground font-normal">({links?.length || 0})</span></p>
          <Button
            onClick={() => { setEditingId(null); setForm({ name: "", originalPattern: "", affiliateUrl: "", keywords: "" }); setShowCreate(true); }}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0 shadow-sm shadow-green-500/20"
          >
            <Plus className="w-4 h-4" /> Adicionar Link
          </Button>
        </div>

        {linksLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/8 h-24" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }} />
            ))}
          </div>
        ) : links?.length === 0 ? (
          <div className="text-center py-14 rounded-2xl border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="font-bold section-title mb-1">Nenhum link ainda</h4>
            <p className="text-sm text-muted-foreground mb-5">Adicione links de afiliado para esta campanha.</p>
            <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0">
              <Plus className="w-3.5 h-3.5" /> Adicionar primeiro link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {links?.map((link) => (
              <div key={link.id} className="rounded-2xl border border-white/8 hover:border-white/15 transition-all p-4" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ link.isActive ? "bg-green-400" : "bg-muted-foreground" }`} />
                      <h4 className="font-bold text-sm section-title">{link.name}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border flex-shrink-0 ${ link.isActive ? "bg-green-500/15 text-green-300 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10" }`}>
                        {link.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/70">Padrão:</span>{" "}
                        <code className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md font-mono">{link.originalPattern}</code>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="font-semibold text-foreground/70">Afiliado:</span>{" "}
                        <a
                          href={link.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 hover:underline inline-flex items-center gap-1"
                        >
                          {link.affiliateUrl.slice(0, 60)}{link.affiliateUrl.length > 60 ? "..." : ""}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </p>
                      {link.keywords && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground/70">Palavras-chave:</span>{" "}
                          {link.keywords}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${ link.isActive ? "bg-white/5 text-muted-foreground hover:bg-white/10" : "bg-green-500/15 text-green-300 border border-green-500/20 hover:bg-green-500/25" }`}
                      onClick={() => toggleMutation.mutate({ id: link.id, isActive: !link.isActive })}
                    >
                      {link.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all" onClick={() => openEdit(link)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                      onClick={() => {
                        if (confirm(`Remover link "${link.name}"?`)) {
                          deleteMutation.mutate({ id: link.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Link" : "Novo Link de Afiliado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Amazon - Eletrônicos"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Padrão a detectar *</Label>
              <Input
                placeholder="Ex: amazon.com.br, shopee.com.br"
                value={form.originalPattern}
                onChange={(e) => setForm({ ...form, originalPattern: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Domínio ou padrão de URL que será substituído nos posts detectados.
              </p>
            </div>
            <div className="space-y-2">
              <Label>URL de Afiliado *</Label>
              <Input
                placeholder="https://seu-link-de-afiliado.com/..."
                value={form.affiliateUrl}
                onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Palavras-chave (para IA)</Label>
              <Textarea
                placeholder="Ex: eletrônicos, celular, notebook, tecnologia..."
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Palavras que ajudam a IA a identificar quando usar esta campanha.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
