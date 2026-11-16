import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Instagram, Loader2, Lock, WhatsApp } from "@/components/icons";
import { buttonClasses } from "@/components/ui/button";
import { brand, whatsappUrl } from "@/shared/brand";
import { FormEvent, useEffect, useState } from "react";
import { getRoleHome, getUserRole, useAuth } from "@/features/auth/auth-context";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { isStrongPassword, minimumPasswordLength } from "@/shared/domain/password";

type Mode = "login" | "signup";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    const mode: Mode | undefined =
      search.mode === "signup" || search.mode === "login" ? search.mode : undefined;
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
      mode,
    };
  },
  head: () => ({
    meta: [
      { title: "Entrar - King's Barber" },
      {
        name: "description",
        content:
          "Entre ou crie sua conta na King's Barber para agendar e acompanhar seus horários.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { initialized, user } = useAuth();
  const { redirect, mode: requestedMode } = Route.useSearch();
  const isPasswordSetup = false;
  const [mode, setMode] = useState<Mode>(requestedMode ?? "login");
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
  const [showPassword, setShowPassword] = useState(false);

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
      if (!isStrongPassword(password)) {
        setError("Use 12 caracteres com maiuscula, minuscula, numero e simbolo.");
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

      if (!isStrongPassword(password)) {
        setError("Use 12 caracteres com maiuscula, minuscula, numero e simbolo.");
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

      navigate({ to: getSafeRedirect(redirect, "client") || getRoleHome("client") });
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

  const inputClass = "kb-field mt-1.5 h-12 px-4";
  const isSignup = mode === "signup";

  return (
    <div className="relative grid min-h-screen luxury-bg lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <aside className="kb-site relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/kings-barber/12-low-fade.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />

        <Link to="/" className="relative w-fit" aria-label="Voltar ao site">
          <img
            src="/kings-barber-logo-light.png"
            alt="King's Barber"
            className="h-16 w-auto object-contain"
          />
        </Link>

        <div className="relative max-w-md">
          <p className="text-2xl font-semibold text-[#f2efe9]">King's Barber</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[#cfcac1]">
            Com a sua conta você agenda pelo site, acompanha seus horários e cancela quando
            precisar.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/15 pt-6 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a09a]">
                Endereço
              </dt>
              <dd className="mt-1 text-[#f2efe9]">{brand.address.full}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a09a]">
                Horário
              </dt>
              <dd className="mt-1 text-[#f2efe9]">Seg. a sáb., 09h às 19h</dd>
            </div>
          </dl>
          <div className="mt-6 flex items-center gap-5 text-sm text-[#cfcac1]">
            <a
              href={brand.instagram.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Instagram size={15} /> {brand.instagram.handle}
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <WhatsApp size={15} /> {brand.whatsapp.display}
            </a>
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-center px-5 py-20 sm:px-8 md:py-16">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Link to="/" aria-label="Voltar ao site">
              <img
                src={kingsBarberLogo}
                alt="King's Barber"
                className="h-20 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gold">
                <Lock size={12} /> Acesso seguro
              </div>
              <h2
                key={mode}
                className="mt-3 font-display text-[2.4rem] leading-none md:text-[2.7rem]"
              >
                {isPasswordSetup
                  ? "Defina sua senha"
                  : mode === "login"
                    ? "Entrar na sua conta"
                    : "Crie sua conta"}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {isPasswordSetup
                  ? "Finalize seu convite para acessar a área do barbeiro."
                  : mode === "login"
                    ? "Use seu e-mail e senha cadastrados."
                    : "Preencha seus dados para agendar pelo site."}
              </p>
            </div>

            {!isPasswordSetup && (
              <div
                role="group"
                aria-label="Tipo de acesso"
                className="relative mt-7 grid grid-cols-2 rounded-md border border-border bg-muted/60 p-1"
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-1 w-[calc(50%-4px)] rounded gradient-gold transition-transform duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${
                    isSignup ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                  } left-1`}
                />
                <button
                  type="button"
                  aria-pressed={mode === "login"}
                  disabled={!initialized}
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setMessage("");
                  }}
                  className={`relative z-10 rounded px-4 py-2.5 text-sm font-semibold transition-colors ${
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
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                  className={`relative z-10 rounded px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isSignup
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Criar conta
                </button>
              </div>
            )}

            {!isSupabaseConfigured && (
              <div className="mt-6 rounded-md border border-[color:var(--gold)]/40 bg-accent/40 p-3 text-xs text-muted-foreground">
                Falta configurar o Supabase. Preencha o arquivo .env com a URL do projeto e a anon
                key.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" key={`form-${mode}`}>
              {isSignup && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="fullName">
                    Nome
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              {isSignup && (
                <div className="grid gap-4">
                  <div className="">
                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">
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
                      className={inputClass}
                    />
                  </div>
                  <div className="">
                    <label
                      className="text-xs font-semibold text-muted-foreground"
                      htmlFor="birthDate"
                    >
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
                      className={`${inputClass} appearance-none`}
                    />
                  </div>
                </div>
              )}

              {!isPasswordSetup && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
                    Senha
                  </label>
                  {mode === "login" && !isPasswordSetup ? (
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
                    autoComplete={isPasswordSetup || isSignup ? "new-password" : "current-password"}
                    required
                    minLength={isPasswordSetup || isSignup ? minimumPasswordLength : 6}
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
                {(isPasswordSetup || isSignup) && <PasswordMeter password={password} />}
              </div>

              {(isPasswordSetup || isSignup) && (
                <div>
                  <label
                    className="text-xs font-semibold text-muted-foreground"
                    htmlFor="confirmPassword"
                  >
                    Confirmar senha
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={minimumPasswordLength}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                  />
                  {confirmPassword && confirmPassword !== password ? (
                    <p className="mt-1.5 text-[11px] text-destructive">
                      As senhas ainda não conferem.
                    </p>
                  ) : null}
                </div>
              )}

              {isSignup && (
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground transition hover:border-[color:var(--gold)]/50">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--gold)]"
                  />
                  <span>
                    Confirmo que desejo criar minha conta de cliente na King's Barber. Acessos de
                    barbeiro e proprietário são liberados pela administração.
                  </span>
                </label>
              )}

              {error && (
                <div
                  role="alert"
                  className="kb-pop rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  {error}
                </div>
              )}
              {message && (
                <div
                  role="status"
                  className="kb-pop rounded-md border border-[color:var(--gold)]/40 bg-accent/50 p-3 text-xs text-foreground/80"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !initialized}
                className={buttonClasses({ size: "lg", className: "w-full" })}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Lock />}
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
                className="mt-6 w-full text-center text-xs text-muted-foreground transition hover:text-gold"
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
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 transition hover:text-foreground"
            >
              <ArrowLeft size={13} /> Voltar ao site
            </Link>
            <span className="h-3 w-px bg-border" />
            <a
              href={whatsappUrl("Olá! Preciso de ajuda para acessar minha conta.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-[#25d366]"
            >
              <WhatsApp size={13} /> Precisa de ajuda?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordMeter({ password }: { password: string }) {
  const checks = [
    { label: "12+ caracteres", ok: password.length >= minimumPasswordLength },
    { label: "Maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Minúscula", ok: /[a-z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
    { label: "Símbolo", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((check) => check.ok).length;
  return (
    <div className="mt-2.5">
      <div className="flex gap-1">
        {checks.map((check, index) => (
          <span
            key={check.label}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              index < score
                ? score === checks.length
                  ? "bg-emerald-500"
                  : "bg-[color:var(--gold)]"
                : "bg-border"
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`inline-flex items-center gap-1 transition-colors ${
              check.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            }`}
          >
            {check.ok ? (
              <Check size={11} strokeWidth={2.6} />
            ) : (
              <span className="h-1 w-1 rounded-full bg-current" />
            )}
            {check.label}
          </span>
        ))}
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
    return "O Supabase recusou este e-mail. Confira o endereço e tente novamente.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
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

  if (redirect === "/agendar") return redirect;

  if (role === "client") {
    return redirect === "/" || redirect.startsWith("/client/") ? redirect : undefined;
  }

  const roleHome = getRoleHome(role);
  return redirect === roleHome || redirect.startsWith(`${roleHome}/`) ? redirect : undefined;
}
