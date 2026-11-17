import { useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, Lock } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { getRoleHome, getUserRole, useAuth, type AppRole } from "@/features/auth/auth-context";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { isStrongPassword, minimumPasswordLength } from "@/shared/domain/password";

export type AuthMode = "login" | "signup";

type AuthPanelProps = {
  initialMode?: AuthMode;
  redirect?: string;
  onAuthenticated?: () => void;
  onModeChange?: (mode: AuthMode) => void;
};

export function AuthPanel({
  initialMode = "login",
  redirect,
  onAuthenticated,
  onModeChange,
}: AuthPanelProps) {
  const navigate = useNavigate();
  const { initialized, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!initialized || !user) return;
    const role = getUserRole(user);
    onAuthenticated?.();
    navigate({ to: getSafeRedirect(redirect, role) || getRoleHome(role) });
  }, [initialized, navigate, onAuthenticated, redirect, user]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    onModeChange?.(nextMode);
    setError("");
    setMessage("");
  }

  function finishAuthentication(role: AppRole) {
    onAuthenticated?.();
    navigate({ to: getSafeRedirect(redirect, role) || getRoleHome(role) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("O acesso ainda não está conectado ao Supabase.");
      return;
    }

    if (mode === "signup") {
      if (fullName.trim().length < 3) {
        setError("Informe seu nome completo para criar a conta.");
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        setError("Informe um telefone válido para criar a conta.");
        return;
      }
      if (!isStrongPassword(password)) {
        setError("Use pelo menos 8 caracteres.");
        return;
      }
    }

    setLoading(true);
    const credentials = { email: email.trim().toLowerCase(), password };
    const { data, error: authError } =
      mode === "signup"
        ? await createClientAccount({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: credentials.email,
            password,
          })
        : await supabase.auth.signInWithPassword(credentials);
    setLoading(false);

    if (authError) {
      setError(getAuthMessage(authError.message));
      return;
    }

    if (mode === "signup") {
      if (!data.session) {
        setMode("login");
        onModeChange?.("login");
        setMessage("Cadastro criado. Entre com seu e-mail e senha.");
        setPassword("");
        return;
      }
      finishAuthentication("client");
      return;
    }

    finishAuthentication(getUserRole(data.user));
  }

  async function handlePasswordRecovery() {
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe seu e-mail para receber o link de redefinição.");
      return;
    }
    if (!supabase) {
      setError("O acesso ainda não está conectado ao Supabase.");
      return;
    }

    setRecoveryLoading(true);
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    setRecoveryLoading(false);

    if (recoveryError) {
      setError(getAuthMessage(recoveryError.message));
      return;
    }

    setMessage(
      "Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também o spam.",
    );
  }

  const inputClass = "kb-field mt-1.5 h-12 px-4";
  const isSignup = mode === "signup";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-2xl sm:p-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
          <Lock size={12} /> Acesso seguro
        </div>
        <h2 key={mode} className="mt-3 font-display text-[2.15rem] leading-none sm:text-[2.5rem]">
          {mode === "login" ? "Entrar na sua conta" : "Crie sua conta"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {mode === "login"
            ? "Use seu e-mail e senha cadastrados."
            : "Nome, WhatsApp, e-mail e uma senha de 8 caracteres."}
        </p>
      </div>

      <div
        role="group"
        aria-label="Tipo de acesso"
        className="relative mt-6 grid grid-cols-2 rounded-lg border border-border bg-muted/60 p-1"
      >
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md gradient-gold transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${
            isSignup ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
          }`}
        />
        <button
          type="button"
          aria-pressed={mode === "login"}
          disabled={!initialized}
          onClick={() => changeMode("login")}
          className={`relative z-10 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
            mode === "login"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          aria-pressed={isSignup}
          disabled={!initialized}
          onClick={() => changeMode("signup")}
          className={`relative z-10 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
            isSignup ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Criar conta
        </button>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-5 rounded-lg border border-[color:var(--gold)]/40 bg-accent/40 p-3 text-xs text-muted-foreground">
          O acesso está temporariamente indisponível. Tente novamente em instantes.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" key={`form-${mode}`}>
        {isSignup ? (
          <div>
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="fullName">
              Nome
            </label>
            <input
              id="fullName"
              type="text"
              required
              autoFocus
              autoComplete="name"
              placeholder="Seu nome completo"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClass}
            />
          </div>
        ) : null}

        {isSignup ? (
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">
                WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoFocus={!isSignup}
            autoComplete="email"
            required
            placeholder="voce@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
              Senha
            </label>
            {mode === "login" ? (
              <button
                type="button"
                disabled={loading || recoveryLoading || !initialized}
                onClick={handlePasswordRecovery}
                className="text-xs font-semibold text-gold transition hover:underline disabled:opacity-60"
              >
                {recoveryLoading ? "Enviando link..." : "Esqueci minha senha"}
              </button>
            ) : null}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? minimumPasswordLength : 6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pr-20`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {isSignup ? (
            <p
              className={`mt-2 text-[11px] ${
                password.length >= minimumPasswordLength
                  ? "text-emerald-400"
                  : "text-muted-foreground"
              }`}
            >
              Mínimo de 8 caracteres.
            </p>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="kb-pop rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            role="status"
            className="kb-pop rounded-lg border border-[color:var(--gold)]/40 bg-accent/50 p-3 text-xs text-foreground/80"
          >
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !initialized}
          className={buttonClasses({ size: "lg", className: "w-full" })}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Lock />}
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        type="button"
        disabled={!initialized}
        onClick={() => changeMode(mode === "login" ? "signup" : "login")}
        className="mt-5 w-full text-center text-xs text-muted-foreground transition hover:text-gold"
      >
        {mode === "login" ? (
          <>
            Ainda não tem conta? <strong className="text-gold">Criar cadastro</strong>
          </>
        ) : (
          <>
            Já tenho conta. <strong className="text-gold">Entrar</strong>
          </>
        )}
      </button>
    </div>
  );
}

function getAuthMessage(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already exists")
  ) {
    return "Este e-mail já está cadastrado. Use Entrar ou recupere a senha.";
  }
  if (normalized.includes("signups not allowed") || normalized.includes("signup is disabled")) {
    return "O cadastro por e-mail está temporariamente indisponível.";
  }
  if (normalized.includes("email rate limit") || normalized.includes("rate limit")) {
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
  }
  if (normalized.includes("invalid email") || normalized.includes("email address is invalid")) {
    return "Confira o endereço de e-mail informado.";
  }
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("password")) return "A senha deve ter pelo menos 8 caracteres.";
  if (normalized.includes("email"))
    return "Não foi possível usar este e-mail. Confira e tente novamente.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

async function createClientAccount({
  fullName,
  phone,
  email,
  password,
}: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase não configurado.") };
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });
}

function getSafeRedirect(redirect: string | undefined, role: AppRole) {
  if (!redirect) return undefined;
  if (redirect === "/agendar") return redirect;
  if (role === "client") return redirect === "/" ? redirect : undefined;
  const roleHome = getRoleHome(role);
  return redirect === roleHome || redirect.startsWith(`${roleHome}/`) ? redirect : undefined;
}
