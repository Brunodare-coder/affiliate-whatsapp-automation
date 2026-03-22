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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Ban,
  CheckCircle2,
  Clock,
  Crown,
  KeyRound,
  Loader2,
  Mail,
  Megaphone,
  RefreshCw,
  Save,
  Search,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    hasAds: boolean;
    isActive: boolean;
  } | null;
};

function StatusBadge({ sub }: { sub: UserRow["subscription"] }) {
  if (!sub) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/8 text-muted-foreground border border-white/10">Sem plano</span>;
  if (sub.isActive && sub.status === "trial") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/20"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Trial</span>;
  if (sub.isActive && sub.status === "active") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/15 text-green-300 border border-green-500/20"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Ativa</span>;
  if (sub.status === "expired" || sub.status === "cancelled") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/20">Expirada</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/8 text-muted-foreground border border-white/10">{sub.status}</span>;
}

function PlanBadge({ sub }: { sub: UserRow["subscription"] }) {
  if (!sub || sub.status === "trial") return null;
  if (sub.plan === "premium") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">Premium</span>;
  if (sub.plan === "basic") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/20">Basic</span>;
  return null;
}

export default function Admin() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();

  // ── Grant subscription modal state ──────────────────────────────────────────
  const [grantModal, setGrantModal] = useState<{ open: boolean; userId: number; userName: string }>({
    open: false, userId: 0, userName: "",
  });
  const [grantPlan, setGrantPlan] = useState<"basic" | "premium">("premium");
  const [grantMonths, setGrantMonths] = useState("1");

  // ── Search / filter state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "trial" | "expired">("all");

  // ── Password modal state ─────────────────────────────────────────────────────
  const [pwModal, setPwModal] = useState<{ open: boolean; userId: number; userName: string; userEmail: string }>({
    open: false, userId: 0, userName: "", userEmail: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Mutations ────────────────────────────────────────────────────────────────
  const grantMutation = trpc.admin.grantSubscription.useMutation({
    onSuccess: () => {
      toast.success("Assinatura ativada com sucesso!");
      setGrantModal({ open: false, userId: 0, userName: "" });
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeMutation = trpc.admin.revokeSubscription.useMutation({
    onSuccess: () => {
      toast.success("Assinatura cancelada.");
      utils.admin.listUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const setPasswordMutation = trpc.admin.setUserPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setPwModal({ open: false, userId: 0, userName: "", userEmail: "" });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Ad text state ─────────────────────────────────────────────────────────────────────
  const { data: adTextData } = trpc.admin.getAdText.useQuery();
  const [adText, setAdText] = useState<string | null>(null);
  const adTextValue = adText ?? adTextData?.adText ?? "";

  const saveAdTextMutation = trpc.admin.saveAdText.useMutation({
    onSuccess: () => {
      toast.success("Texto do anúncio salvo com sucesso!");
      utils.admin.getAdText.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const sendResetLinkMutation = trpc.admin.sendPasswordResetLink.useMutation({
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success("Link de recuperação enviado por e-mail!");
      } else if (data.fallback) {
        toast.success("Link enviado como notificação (Resend não configurado).");
      } else {
        toast.success("Link de recuperação gerado.");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Access control ───────────────────────────────────────────────────────────
  if (user && user.role !== "admin") {
    return (
      <AppLayout title="Admin">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalUsers = users?.length ?? 0;
  const activeUsers = users?.filter((u) => u.subscription?.isActive).length ?? 0;
  const premiumUsers = users?.filter((u) => u.subscription?.plan === "premium" && u.subscription.isActive).length ?? 0;
  const basicUsers = users?.filter((u) => u.subscription?.plan === "basic" && u.subscription.isActive).length ?? 0;

  // Filtered users based on search query and status filter
  const filteredUsers = (users ?? []).filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q);
    const matchesStatus =
      filterStatus === "all" ? true :
      filterStatus === "active" ? (u.subscription?.isActive && u.subscription.status === "active") :
      filterStatus === "trial" ? (u.subscription?.isActive && u.subscription.status === "trial") :
      filterStatus === "expired" ? (!u.subscription?.isActive) : true;
    return matchesSearch && matchesStatus;
  });

  const handleSetPassword = () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setPasswordMutation.mutate({ userId: pwModal.userId, newPassword });
  };

  return (
    <AppLayout title="Painel Admin">
      <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Gerencie assinaturas e senhas de usuários</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 bg-white/5 hover:bg-white/10 gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total de usuários", value: totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/15" },
            { label: "Com acesso ativo", value: activeUsers, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/15" },
            { label: "Premium R$100", value: premiumUsers, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/15" },
            { label: "Basic R$50", value: basicUsers, icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/15" },
          ].map((s) => (
            <div key={s.label} className={`stat-card p-4 border ${s.border}`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black section-title ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Configuração do Texto do Anúncio */}
        <div className="rounded-2xl border border-orange-500/20 p-5" style={{ background: "linear-gradient(135deg, oklch(0.65 0.20 50 / 0.07) 0%, oklch(0.12 0.018 250 / 0.6) 100%)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-bold section-title">Texto do Anúncio (Plano Basic)</p>
              <p className="text-xs text-muted-foreground">Rodapé adicionado em cada mensagem enviada por usuários do plano R$50</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Texto do anúncio (máx. 500 caracteres)</Label>
              <Textarea
                value={adTextValue}
                onChange={(e) => setAdText(e.target.value)}
                placeholder="Ex: ⚠️ _Mensagem enviada pelo AutoAfiliado_ | autoafiliado.manus.space"
                className="bg-white/5 border-white/10 focus:border-orange-500/40 resize-none text-sm min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{adTextValue.length}/500 caracteres</p>
            </div>

            <div className="rounded-xl border border-orange-500/15 p-3" style={{ background: "oklch(0.65 0.20 50 / 0.06)" }}>
              <p className="text-xs font-semibold text-orange-300 mb-1">Pré-visualização da mensagem</p>
              <p className="text-xs text-muted-foreground italic">
                “Produto incrível! https://www.amazon.com.br/dp/B08XYZ?tag=meutag-20”
              </p>
              {adTextValue && (
                <p className="text-xs text-orange-300/80 mt-1 italic whitespace-pre-wrap">{adTextValue}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => saveAdTextMutation.mutate({ adText: adTextValue })}
                disabled={saveAdTextMutation.isPending}
                className="bg-orange-500/15 text-orange-300 border border-orange-500/25 hover:bg-orange-500/25 gap-2"
                variant="outline"
              >
                {saveAdTextMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Texto
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: "oklch(0.12 0.018 250 / 0.8)" }}>
          {/* Table header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-sm section-title">Usuários ({filteredUsers.length}{filteredUsers.length !== totalUsers ? `/${totalUsers}` : ""})</span>
            </div>
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500/40"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <SelectTrigger className="w-36 h-8 text-xs border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{searchQuery || filterStatus !== "all" ? "Nenhum usuário encontrado para este filtro" : "Nenhum usuário cadastrado"}</p>
              {(searchQuery || filterStatus !== "all") && (
                <button className="mt-2 text-xs text-green-400 hover:underline" onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}>Limpar filtros</button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-green-300">
                      {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm section-title truncate">{u.name ?? "Sem nome"}</p>
                      {u.role === "admin" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">Admin</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email ?? "Sem email"}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado: {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {/* Status e Plano */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <StatusBadge sub={u.subscription} />
                    <PlanBadge sub={u.subscription} />
                    {u.subscription?.currentPeriodEnd && u.subscription.isActive && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Vence: {new Date(u.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>

                  {/* Ações de Assinatura */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold border-0 shadow-sm shadow-green-500/20"
                      onClick={() => setGrantModal({ open: true, userId: u.id, userName: u.name ?? u.email ?? `#${u.id}` })}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Ativar
                    </Button>
                    {u.subscription?.isActive && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25"
                        onClick={() => {
                          if (confirm(`Cancelar assinatura de ${u.name ?? u.email}?`)) {
                            revokeMutation.mutate({ userId: u.id });
                          }
                        }}
                        disabled={revokeMutation.isPending}
                      >
                        <Ban className="w-3 h-3 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>

                  {/* Ações de Senha */}
                  <div className="flex items-center gap-2 flex-shrink-0 border-l border-white/8 pl-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-400 border-blue-500/25 hover:bg-blue-500/10"
                      onClick={() => {
                        setPwModal({ open: true, userId: u.id, userName: u.name ?? u.email ?? `#${u.id}`, userEmail: u.email ?? "" });
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      <KeyRound className="w-3 h-3 mr-1" /> Redefinir Senha
                    </Button>
                    {u.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-400 border-purple-500/25 hover:bg-purple-500/10"
                        onClick={() => {
                          if (confirm(`Enviar link de recuperação para ${u.email}?`)) {
                            sendResetLinkMutation.mutate({ userId: u.id });
                          }
                        }}
                        disabled={sendResetLinkMutation.isPending}
                      >
                        <Mail className="w-3 h-3 mr-1" /> Enviar Link
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ativar Assinatura */}
      <Dialog open={grantModal.open} onOpenChange={(open) => setGrantModal((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Ativar Assinatura
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Ativando plano para: <span className="font-semibold text-foreground">{grantModal.userName}</span>
            </p>

            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={grantPlan} onValueChange={(v) => setGrantPlan(v as "basic" | "premium")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                      Basic — R$50/mês (com anúncios)
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                      Premium — R$100/mês (sem anúncios)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de meses</Label>
              <Select value={grantMonths} onValueChange={setGrantMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6, 12, 24].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} {m === 1 ? "mês" : "meses"}
                      {m === 12 ? " (1 ano)" : ""}
                      {m === 24 ? " (2 anos)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se o usuário já tem assinatura ativa, os meses serão adicionados ao vencimento atual.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-sm font-medium">Resumo</p>
              <p className="text-xs text-muted-foreground">
                Plano: <span className="text-foreground">{grantPlan === "premium" ? "Premium R$100/mês" : "Basic R$50/mês"}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Duração: <span className="text-foreground">{grantMonths} {Number(grantMonths) === 1 ? "mês" : "meses"}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Anúncios: <span className="text-foreground">{grantPlan === "basic" ? "Sim (plano com anúncios)" : "Não (plano sem anúncios)"}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantModal((s) => ({ ...s, open: false }))}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                grantMutation.mutate({
                  userId: grantModal.userId,
                  plan: grantPlan,
                  months: Number(grantMonths),
                })
              }
              disabled={grantMutation.isPending}
            >
              {grantMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Ativar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Redefinir Senha */}
      <Dialog open={pwModal.open} onOpenChange={(open) => setPwModal((s) => ({ ...s, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-400" />
              Redefinir Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-sm text-blue-300">
                Redefinindo senha de: <span className="font-semibold text-white">{pwModal.userName}</span>
              </p>
              {pwModal.userEmail && (
                <p className="text-xs text-blue-400 mt-1">{pwModal.userEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Alternativamente, use o botão <strong>"Enviar Link"</strong> na tabela para enviar um link de recuperação diretamente para o e-mail do usuário.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwModal((s) => ({ ...s, open: false }))}>
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSetPassword}
              disabled={setPasswordMutation.isPending || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {setPasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Redefinir Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
