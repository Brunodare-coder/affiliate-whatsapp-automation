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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="w-4 h-4 mr-1" /> Campanhas
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: campaign.color || "#22c55e" }}
            />
            <h2 className="font-semibold">{campaign.name}</h2>
            {campaign.category && (
              <Badge variant="outline" className="text-xs">{campaign.category}</Badge>
            )}
            <Badge variant={campaign.isActive ? "default" : "secondary"} className="text-xs">
              {campaign.isActive ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>

        {campaign.description && (
          <p className="text-muted-foreground text-sm">{campaign.description}</p>
        )}

        {/* Links section */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Links de Afiliado ({links?.length || 0})</h3>
          <Button onClick={() => { setEditingId(null); setForm({ name: "", originalPattern: "", affiliateUrl: "", keywords: "" }); setShowCreate(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar Link
          </Button>
        </div>

        {linksLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : links?.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Link2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium mb-1">Nenhum link ainda</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione links de afiliado para esta campanha.
            </p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar primeiro link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {links?.map((link) => (
              <Card key={link.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{link.name}</h4>
                        <Badge variant={link.isActive ? "default" : "secondary"} className="text-xs">
                          {link.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Padrão:</span>{" "}
                          <code className="bg-secondary px-1 rounded">{link.originalPattern}</code>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          <span className="font-medium text-foreground">Afiliado:</span>{" "}
                          <a
                            href={link.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {link.affiliateUrl.slice(0, 60)}{link.affiliateUrl.length > 60 ? "..." : ""}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                        {link.keywords && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Palavras-chave:</span>{" "}
                            {link.keywords}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => toggleMutation.mutate({ id: link.id, isActive: !link.isActive })}
                      >
                        {link.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(link)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remover link "${link.name}"?`)) {
                            deleteMutation.mutate({ id: link.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
