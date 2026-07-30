import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";
import { getRoleHome, getUserRole, useAuth } from "@/features/auth/auth-context";
import {
  clearAuthCallbackContext,
  getAuthCallbackContext,
  supabase,
} from "@/integrations/supabase/client";

export const Route = createFileRoute("/set-password")({
  head: () => ({ meta: [{ title: "Definir senha — King's Barber" }] }),
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const { initialized, user } = useAuth();
  const [callback] = useState(() => getAuthCallbackContext());
  const [validationTimedOut, setValidationTimedOut] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const role = getUserRole(user);
  const expectedSession =
    Boolean(callback && user) &&
    (!callback?.userId || callback.userId === user?.id) &&
    (callback?.type !== "invite" || role === "barber");
  const isRecovery = callback?.type === "recovery";

  useEffect(() => {
    if (expectedSession) return;
    const timeout = window.setTimeout(() => setValidationTimedOut(true), 8_000);
    return () => window.clearTimeout(timeout);
  }, [expectedSession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase || !user || !expectedSession) {
      setError(
        "Não foi possível validar este link. Solicite um novo link e abra-o no mesmo navegador.",
      );
      return;
    }
    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Não foi possível salvar a senha.");
      return;
    }

    clearAuthCallbackContext();
    navigate({ to: getRoleHome(getUserRole(user)) });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 luxury-bg">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card/90 p-6 shadow-2xl sm:p-8">
        <img
          src={kingsBarberLogo}
          alt="King's Barber"
          className="mx-auto h-20 w-40 object-contain"
        />

        <div className="mt-6 text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-gold">
            {isRecovery ? "Recuperação de acesso" : "Primeiro acesso"}
          </div>
          <h1 className="mt-2 font-display text-3xl">Defina sua senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRecovery
              ? "Escolha uma nova senha para acessar sua conta."
              : "Escolha a senha que será usada para acessar a área do barbeiro."}
          </p>
        </div>

        {!initialized || (!expectedSession && !validationTimedOut) ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validando link...
          </div>
        ) : expectedSession ? (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="new-password">
                Nova senha
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground" htmlFor="confirm-new-password">
                Confirmar senha
              </label>
              <input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:border-[color:var(--gold)] focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {loading ? "Salvando..." : "Salvar senha e acessar"}
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Este link não corresponde à conta conectada ou expirou. Solicite um novo link e abra-o
            no mesmo navegador.
          </div>
        )}
      </section>
    </main>
  );
}
