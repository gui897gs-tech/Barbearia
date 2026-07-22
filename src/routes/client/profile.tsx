import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

export const Route = createFileRoute("/client/profile")({
  head: () => ({ meta: [{ title: "Perfil — King's Barber" }] }),
  component: ClientProfilePage,
});

function ClientProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    setFullName(String(user.user_metadata?.full_name ?? ""));
    setPhone(String(user.user_metadata?.phone ?? ""));
    setBirthDate(String(user.user_metadata?.birth_date ?? ""));
    if (!supabase) {
      setLoadingProfile(false);
      return;
    }
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("name, whatsapp, birth_date")
          .eq("id", user.id)
          .maybeSingle();
        if (error) notifyError(error, "Não foi possível carregar seu perfil.");
        if (data) {
          setFullName(data.name || "");
          setPhone(data.whatsapp || "");
          setBirthDate(data.birth_date || "");
        }
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      notifyError(new Error("O Supabase precisa estar configurado para atualizar seu perfil."));
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      notifyError(new Error("Informe um telefone válido com DDD."));
      return;
    }
    setSaving(true);
    try {
      const { error: profileError } = await supabase.rpc("update_client_profile", {
        p_name: fullName.trim(),
        p_phone: phone.trim(),
        p_birth_date: birthDate || null,
      });
      if (profileError) throw profileError;
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user?.user_metadata,
          full_name: fullName.trim(),
          phone: phone.trim(),
          birth_date: birthDate || null,
        },
      });
      if (error) throw error;
      notifySuccess("Perfil atualizado.");
    } catch (error) {
      notifyError(error, "Não foi possível atualizar seu perfil.");
    } finally {
      setSaving(false);
    }
  }

  const displayName = fullName || user?.email || "Cliente";
  const initials = displayName
    .split(/[ @.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "—";

  return (
    <AppShell role="client">
      <PageHeader
        eyebrow="Sua conta"
        title="Perfil"
        subtitle="Mantenha seus dados atualizados para receber confirmações e lembretes."
      />
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="glass-card rounded-3xl p-8 text-center">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full gradient-gold font-display text-4xl text-primary-foreground">
            {initials}
          </div>
          <div className="mt-4 font-display text-2xl">{displayName}</div>
          <div className="mt-1 text-sm capitalize text-muted-foreground">
            Cliente desde {memberSince}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/35 px-3 py-1.5 text-xs text-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Conta protegida
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-6 sm:p-8"
          aria-busy={loadingProfile}
        >
          <div className="mb-6">
            <h2 className="font-display text-2xl">Dados pessoais</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O e-mail de acesso só pode ser alterado pelo fluxo de segurança da conta.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome completo">
              <input
                required
                minLength={3}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="profile-input"
              />
            </Field>
            <Field label="E-mail de acesso">
              <input readOnly value={user?.email ?? ""} className="profile-input opacity-70" />
            </Field>
            <Field label="Telefone">
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="profile-input"
                placeholder="(11) 99999-9999"
              />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="profile-input"
              />
            </Field>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={saving || loadingProfile}
              className="inline-flex items-center gap-2 rounded-xl gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
