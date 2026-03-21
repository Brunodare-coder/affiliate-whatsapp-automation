import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Edit2, Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const CAMPAIGN_COLORS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

export default function Campaigns() {
  const utils = trpc.useUtils();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", color: "#22c55e" });

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      setShowCreate(false);
      setForm({ name: "", description: "", category: "", color: "#22c55e" });
      toast.success("Campanha criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      setEditingId(null);
      toast.success("Campanha atualizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      toast.success("Campanha removida!");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => utils.campaigns.list.invalidate(),
  });

  function openEdit(campaign: any) {
    setEditingId(campaign.id);
    setForm({
      name: campaign.name,
      description: campaign.description || "",
      category: campaign.category || "",
      color: campaign.color || "#22c55e",
    });
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isOpen = showCreate || editingId !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout title="Campanhas">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              Organize seus links de afiliado em campanhas temáticas.
            </p>
          </div>
          <Button onClick={() => { setEditingId(null); setForm({ name: "", description: "", category: "", color: "#22c55e" }); setShowCreate(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nova Campanha
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 h-32" />
              </Card>
            ))}
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="text-center py-16">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha ainda</h3>
            <p className="text-muted-foreground text-sm mb-4">Crie sua primeira campanha para organizar seus links de afiliado.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Criar campanha
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns?.map((campaign) => (
              <Card key={campaign.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: campaign.color || "#22c55e" }}
                      />
                      <h3 className="font-semibold truncate">{campaign.name}</h3>
                    </div>
                    <Badge variant={campaign.isActive ? "default" : "secondary"} className="text-xs ml-2 flex-shrink-0">
                      {campaign.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{campaign.description}</p>
                  )}

                  {campaign.category && (
                    <Badge variant="outline" className="text-xs mb-3">{campaign.category}</Badge>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="outline" asChild className="flex-1">
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Link2 className="w-3 h-3 mr-1" /> Ver Links
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(campaign)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Remover campanha "${campaign.name}"?`)) {
                          deleteMutation.mutate({ id: campaign.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Amazon Brasil, Shopee, Hotmart..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição opcional da campanha..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                placeholder="Ex: E-commerce, Infoprodutos, Serviços..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CAMPAIGN_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      form.color === color ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  />
                ))}
              </div>
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
