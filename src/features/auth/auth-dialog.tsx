import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { WhatsApp, X } from "@/components/icons";
import { AuthPanel, type AuthMode } from "@/features/auth/auth-panel";
import { AuthDialogContext } from "@/features/auth/auth-dialog-context";
import { whatsappUrl } from "@/shared/brand";

type AuthDialogState = {
  mode: AuthMode;
  redirect?: string;
  instance: number;
};

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<AuthDialogState | null>(null);
  const openAuth = useCallback((mode: AuthMode = "login", redirect?: string) => {
    setDialog({ mode, redirect, instance: Date.now() });
  }, []);
  const closeAuth = useCallback(() => setDialog(null), []);
  const value = useMemo(() => ({ openAuth, closeAuth }), [closeAuth, openAuth]);

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <AuthDialog
          key={dialog.instance}
          mode={dialog.mode}
          redirect={dialog.redirect}
          onClose={closeAuth}
        />
      ) : null}
    </AuthDialogContext.Provider>
  );
}

function AuthDialog({
  mode,
  redirect,
  onClose,
}: {
  mode: AuthMode;
  redirect?: string;
  onClose: () => void;
}) {
  const [dialogMode, setDialogMode] = useState(mode);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="dark fixed inset-0 z-[100] flex items-center justify-center bg-black/78 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={dialogMode === "login" ? "Entrar na conta" : "Criar conta"}
        className="kb-auth-dialog relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[540px] overflow-y-auto rounded-2xl border border-white/12 bg-[#11100e] p-2 shadow-[0_30px_100px_-35px_rgb(0_0_0/0.95)] sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-white/8 bg-[#11100e]/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex items-center gap-3">
            <img
              src="/kings-barber-logo-light.png"
              alt="King's Barber"
              className="h-9 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-semibold text-[#f2efe9]">King's Barber</p>
              <p className="text-[11px] text-[#8f8b84]">Sua conta, sem sair desta tela</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar acesso"
            className="kb-focus grid h-9 w-9 place-items-center rounded-full border border-white/12 text-[#cfcac1] transition hover:border-[#c9a24a]/60 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-1 pt-2 sm:p-2 sm:pt-3">
          <AuthPanel
            initialMode={mode}
            redirect={redirect}
            onAuthenticated={onClose}
            onModeChange={setDialogMode}
          />
        </div>

        <a
          href={whatsappUrl("Olá! Preciso de ajuda para acessar minha conta.")}
          target="_blank"
          rel="noreferrer"
          className="mx-auto mb-3 mt-2 flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs text-[#a9a6a0] transition hover:text-[#25d366]"
        >
          <WhatsApp size={14} /> Precisa de ajuda para entrar?
        </a>
      </section>
    </div>
  );
}
