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
  RefreshCw,
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
  if (!sub) return <Badge variant="outline" className="text-muted-foreground">Sem assinatura</Badge>;
  if (sub.isActive && sub.status === "trial") return <Badge className="bg-blue-600">Trial</Badge>;
  if (sub.isActive && sub.status === "active") return <Badge className="bg-green-600">Ativa</Badge>;
  if (sub.status === "expired" || sub.status === "cancelled") return <Badge variant="destructive">Expirada</Badge>;
  return <Badge variant="outline">{sub.status}</Badge>;
}

function PlanBadge({ sub }: { sub: UserRow["subscription"] }) {
  if (!sub || sub.status === "trial") return null;
  if (sub.plan === "premium") return <Badge className="bg-purple-600 text-white">Premium R$100</Badge>;
  if (sub.plan === "basic") return <Badge className="bg-orange-500 text-white">Basic R$50</Badge>;
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Painel Administrativo</h2>
              <p className="text-sm text-muted-foreground">Gerencie assinaturas e senhas de usuários</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total de usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Com acesso ativo</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{premiumUsers}</p>
                <p className="text-xs text-muted-foreground">Premium R$100</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">{basicUsers}</p>
                <p className="text-xs text-muted-foreground">Basic R$50</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de usuários */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Usuários ({totalUsers})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{u.name ?? "Sem nome"}</p>
                        {u.role === "admin" && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Admin</Badge>
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
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setGrantModal({ open: true, userId: u.id, userName: u.name ?? u.email ?? `#${u.id}` })}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Ativar
                      </Button>
                      {u.subscription?.isActive && (
                        <Button
                          size="sm"
                          variant="destructive"
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
                    <div className="flex items-center gap-2 flex-shrink-0 border-l border-border pl-3 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
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
                          className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
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
          </CardContent>
        </Card>
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
