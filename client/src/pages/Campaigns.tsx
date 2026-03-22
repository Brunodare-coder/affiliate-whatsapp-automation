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
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Organize seus links de afiliado em campanhas temáticas.</p>
          <Button
            onClick={() => { setEditingId(null); setForm({ name: "", description: "", category: "", color: "#22c55e" }); setShowCreate(true); }}
            className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0 shadow-sm shadow-green-500/20"
          >
            <Plus className="w-4 h-4" /> Nova Campanha
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/8 h-40" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }} />
            ))}
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold section-title mb-2">Nenhuma campanha ainda</h3>
            <p className="text-muted-foreground text-sm mb-5">Crie sua primeira campanha para organizar seus links de afiliado.</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0">
              <Plus className="w-4 h-4" /> Criar campanha
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns?.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-white/8 hover:border-white/15 transition-all duration-150 p-5 flex flex-col gap-3 hover:-translate-y-0.5" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: campaign.color || "#22c55e", boxShadow: `0 0 8px ${campaign.color || "#22c55e"}60` }}
                    />
                    <h3 className="font-bold text-sm section-title truncate">{campaign.name}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border flex-shrink-0 ml-2 ${ campaign.isActive ? "bg-green-500/15 text-green-300 border-green-500/20" : "bg-white/5 text-muted-foreground border-white/10" }`}>
                    {campaign.isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                    {campaign.isActive ? "Ativa" : "Inativa"}
                  </span>
                </div>

                {campaign.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
                )}

                {campaign.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-muted-foreground border border-white/10 w-fit">{campaign.category}</span>
                )}

                <div className="flex items-center gap-2 mt-auto pt-1">
                  <Button size="sm" variant="outline" asChild className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-xs">
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Link2 className="w-3 h-3 mr-1" /> Ver Links
                    </Link>
                  </Button>
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all" onClick={() => openEdit(campaign)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                    onClick={() => {
                      if (confirm(`Remover campanha "${campaign.name}"?`)) {
                        deleteMutation.mutate({ id: campaign.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
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
