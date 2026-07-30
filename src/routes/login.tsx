import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { getRoleHome, getUserRole, useAuth } from "@/features/auth/auth-context";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";
import { ThemeToggle } from "@/features/theme/theme-toggle";

type Mode = "login" | "signup";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar - King's Barber" },
      {
        name: "description",
        content: "Acesse a suite premium de gestao de barbearia King's Barber.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { initialized, user } = useAuth();
  const { redirect } = Route.useSearch();
  const isPasswordSetup = false;
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    if (initialized && user && !isPasswordSetup) {
      const role = getUserRole(user);
      navigate({ to: getSafeRedirect(redirect, role) || getRoleHome(role) });
    }
  }, [initialized, isPasswordSetup, navigate, redirect, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para ativar o login.",
      );
      return;
    }

    if (isPasswordSetup) {
      if (!user) {
        setError("Este convite é inválido ou expirou. Solicite um novo convite ao proprietário.");
        return;
      }
      if (password.length < 8) {
        setError("Use uma senha com pelo menos 8 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não conferem.");
        return;
      }

      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (updateError) {
        setError(getAuthMessage(updateError.message));
        return;
      }

      navigate({ to: getRoleHome(getUserRole(user)) });
      return;
    }

    if (mode === "signup") {
      if (fullName.trim().length < 3) {
        setError("Informe seu nome completo para criar a conta.");
        return;
      }

      if (phone.replace(/\D/g, "").length < 10) {
        setError("Informe um telefone valido para criar a conta.");
        return;
      }

      if (!birthDate || birthDate > new Date().toISOString().slice(0, 10)) {
        setError("Informe uma data de nascimento valida para criar a conta.");
        return;
      }

      if (password.length < 8) {
        setError("Use uma senha com pelo menos 8 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não conferem.");
        return;
      }

      if (!acceptedTerms) {
        setError("Confirme que voce autoriza a criacao da conta.");
        return;
      }
    }

    setLoading(true);

    const credentials = {
      email: email.trim().toLowerCase(),
      password,
    };

    const { data, error: authError } =
      mode === "signup"
        ? await createClientAccount({
            fullName: fullName.trim(),
            phone: phone.trim(),
            birthDate,
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
        setMessage(
          "Cadastro criado com segurança. Confira seu e-mail para confirmar a conta e depois entre com sua senha.",
        );
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      navigate({ to: "/client" });
      return;
    }

    const role = getUserRole(data.user);
    navigate({ to: getSafeRedirect(redirect, role) || getRoleHome(role) });
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
      setError("O login ainda não está conectado ao Supabase.");
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

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2 luxury-bg">
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(600px 400px at 30% 20%, rgba(212,166,58,0.25), transparent 60%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <img
            src={kingsBarberLogo}
            alt="King's Barber"
            className="h-20 w-40 object-contain object-left"
          />
          <div>
            <div className="font-display text-2xl text-gradient-gold">King's Barber</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl leading-tight">
            A arte do <span className="text-gradient-gold">corte</span>, refinada em software.
          </h1>
          <p className="mt-6 text-muted-foreground">
            Agende seu horário, acompanhe seus atendimentos e viva uma experiência premium na King's
            Barber.
          </p>
          <div className="mt-10 flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span>Desde 2026</span>
            <span className="h-px w-10 bg-border" />
            <span>Feito para mestres</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">2026 King's Barber</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img
              src={kingsBarberLogo}
              alt="King's Barber"
              className="h-16 w-32 object-contain object-left"
            />
            <div className="font-display text-xl text-gradient-gold">King's Barber</div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.25em] text-gold">Acesso seguro</div>
          <h2 className="font-display text-3xl md:text-4xl mt-2">
            {isPasswordSetup
              ? "Defina sua senha"
              : mode === "login"
                ? "Entre na sua barbearia"
                : "Crie sua conta"}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {isPasswordSetup
              ? "Finalize seu convite para acessar a área do barbeiro."
              : mode === "login"
                ? "Use seu e-mail e senha cadastrados."
                : "Cadastre seus dados para acessar com segurança."}
          </p>

          {!isPasswordSetup && (
            <div className="mt-6 grid grid-cols-2 rounded-xl border border-border bg-card/70 p-1">
              <button
                type="button"
                disabled={!initialized}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  mode === "login"
                    ? "gradient-gold text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                disabled={!initialized}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  mode === "signup"
                    ? "gradient-gold text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="mt-6 rounded-xl border border-[color:var(--gold)]/40 bg-accent/40 p-3 text-xs text-muted-foreground">
              Falta configurar o Supabase. Preencha o arquivo .env com a URL do projeto e a anon
              key.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="fullName">
                  Nome
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-1 block w-full min-w-0 max-w-full appearance-none rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
                />
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="phone">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
                />
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="birthDate">
                  Data de nascimento
                </label>
                <input
                  id="birthDate"
                  type="date"
                  required
                  autoComplete="bday"
                  max={new Date().toISOString().slice(0, 10)}
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="mt-1 block w-full min-w-0 max-w-full appearance-none rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
                />
              </div>
            )}

            {!isPasswordSetup && (
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  isPasswordSetup || mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={isPasswordSetup || mode === "signup" ? 8 : 6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
              />
              {(isPasswordSetup || mode === "signup") && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Use pelo menos 8 caracteres.
                </div>
              )}
            </div>

            {mode === "login" && (
              <button
                type="button"
                disabled={loading || recoveryLoading || !initialized}
                onClick={handlePasswordRecovery}
                className="w-full text-right text-xs text-muted-foreground transition hover:text-gold disabled:opacity-70"
              >
                {recoveryLoading ? "Enviando link..." : "Esqueci minha senha"}
              </button>
            )}

            {(isPasswordSetup || mode === "signup") && (
              <div>
                <label className="text-xs text-muted-foreground" htmlFor="confirmPassword">
                  Confirmar senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 p-3 text-xs text-muted-foreground">
                O cadastro publico cria uma conta de cliente. Acessos de barbeiro e dono sao
                liberados pela administracao da barbearia.
              </div>
            )}

            {mode === "signup" && (
              <label className="flex items-start gap-3 rounded-xl border border-border bg-card/70 p-3 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[color:var(--gold)]"
                />
                <span>
                  Confirmo que desejo criar minha conta na King's Barber e proteger meu acesso com
                  esta senha.
                </span>
              </label>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-[color:var(--gold)]/40 bg-accent/40 p-3 text-xs text-muted-foreground">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !initialized}
              className="flex w-full items-center justify-center gap-2 rounded-xl gradient-gold px-5 py-3 text-sm font-semibold text-primary-foreground gold-glow disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Lock className="h-4 w-4" />
              {loading
                ? "Aguarde..."
                : isPasswordSetup
                  ? "Salvar senha e acessar"
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta segura"}
            </button>
          </form>

          {!isPasswordSetup && (
            <button
              type="button"
              disabled={!initialized}
              onClick={() => {
                setMode((current) => (current === "login" ? "signup" : "login"));
                setError("");
                setMessage("");
              }}
              className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-gold transition"
            >
              {mode === "login" ? "Ainda não tem conta? Criar cadastro" : "Já tenho conta. Entrar"}
            </button>
          )}
        </div>
      </div>
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
    return "O cadastro por e-mail esta desativado no Supabase. Ative Email signups em Authentication > Providers > Email.";
  }

  if (normalized.includes("email rate limit") || normalized.includes("rate limit")) {
    return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";
  }

  if (normalized.includes("invalid email") || normalized.includes("email address is invalid")) {
    return "Este e-mail não foi aceito pelo Supabase. Confira o endereço ou tente outro e-mail.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalized.includes("password")) {
    return "A senha não atende aos requisitos de segurança.";
  }

  if (normalized.includes("email")) {
    return `O Supabase recusou este e-mail: ${message}`;
  }

  return message || "Não foi possível concluir a operação. Tente novamente.";
}

async function createClientAccount({
  fullName,
  phone,
  birthDate,
  email,
  password,
}: {
  fullName: string;
  phone: string;
  birthDate: string;
  email: string;
  password: string;
}) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase não configurado.") };
  }

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        birth_date: birthDate,
      },
    },
  });
}

function getSafeRedirect(redirect: string | undefined, role: "owner" | "barber" | "client") {
  if (!redirect) return undefined;

  const roleHome = getRoleHome(role);
  return redirect === roleHome || redirect.startsWith(`${roleHome}/`) ? redirect : undefined;
}
