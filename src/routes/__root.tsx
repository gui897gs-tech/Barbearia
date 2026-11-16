import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/features/auth/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, RefreshCw } from "@/components/icons";
import { ThemeProvider, themeInitScript } from "@/features/theme/theme-provider";
import kingsBarberLogo from "@/assets/kings-barber-logo.png";

import appCss from "../styles/globals.css?url";

function NotFoundComponent() {
  return (
    <div className="kb-site grid min-h-screen place-items-center px-5">
      <div className="flex max-w-md flex-col items-center text-center">
        <img src="/kings-barber-logo-light.png" alt="King's Barber" className="h-16 w-auto" />
        <p className="kb-editorial mt-8 text-7xl text-[#c9a24a]">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#f2efe9]">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#a9a6a0]">
          A página que você procurou não existe ou mudou de lugar.
        </p>
        <Link to="/" className="kb-btn kb-btn-gold kb-focus mt-8">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error: _error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="kb-site grid min-h-screen place-items-center px-5">
      <div className="flex max-w-md flex-col items-center text-center">
        <img src="/kings-barber-logo-light.png" alt="King's Barber" className="h-16 w-auto" />
        <h1 className="mt-8 text-2xl font-semibold text-[#f2efe9]">
          Não foi possível abrir esta página
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#a9a6a0]">
          Tivemos um problema ao abrir esta tela. Tente novamente em instantes.
        </p>
        <button
          type="button"
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="kb-btn kb-btn-gold kb-focus mt-8"
        >
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "King's Barber — Gestão e agendamentos" },
      {
        name: "description",
        content: "Gestão de agenda, equipe e relacionamento para a King's Barber.",
      },
      { name: "theme-color", content: "#f5f0e6", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#11100e", media: "(prefers-color-scheme: dark)" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: kingsBarberLogo, type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="luxury-bg min-h-screen">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
