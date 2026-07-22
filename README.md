# King's Barber Management

Aplicação web para gestão de barbearia, com áreas separadas para proprietário, barbeiros e clientes. O projeto usa TanStack Start, React, TypeScript, Tailwind CSS, Supabase e Nitro, com deploy preparado para Vercel.

## Requisitos

- Node.js 22 ou superior
- npm 10 ou superior
- Projeto Supabase para autenticação e persistência real

## Configuração local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Execute as migrações de `supabase/migrations` na ordem dos arquivos.
5. Publique as Edge Functions e configure os segredos conforme `docs/supabase/setup.md`.
6. Inicie o projeto com `npm run dev`.

Sem as variáveis do Supabase, a tela pública informa a configuração ausente e as áreas protegidas permanecem bloqueadas. Alguns repositórios conservam fixtures locais para testes isolados, mas não existe um “login demo” que possa ser ativado acidentalmente em produção.

## Comandos

- `npm run dev`: servidor de desenvolvimento.
- `npm run typecheck`: validação TypeScript.
- `npm run lint`: análise estática.
- `npm run test`: testes unitários de regras de negócio.
- `npm run test:e2e`: testes E2E em desktop e mobile com Playwright; usa um Supabase interceptado e determinístico, sem tocar no projeto real.
- `npm run build`: build SSR de produção com Nitro para Vercel.
- `npm run check`: executa typecheck, lint, testes unitários e build.
- `npm run format`: formata o código.

## Estrutura

```text
src/
  assets/          imagens da aplicação
  components/      componentes visuais compartilhados e layout
  data/            dados demonstrativos e repositórios de persistência
  features/        módulos de negócio, como autenticação e agendamentos
  integrations/    clientes de serviços externos, como Supabase
  routes/          rotas baseadas em arquivos do TanStack Router
  server/          tratamento de erros do SSR
  shared/          utilitários compartilhados
  styles/          estilos globais
supabase/
  functions/       Edge Functions protegidas
  migrations/      fonte única do esquema e das políticas RLS
docs/
  supabase/        instruções operacionais do backend
plans/             plano mestre e acompanhamento da implementação
tests/e2e/         verificações de runtime e responsividade
```

Os E2E autenticados validam os contratos esperados do Supabase, as mutações e a regressão visual nos dois temas. Eles não validam RLS ou migrações no PostgreSQL; siga a homologação real descrita em [docs/supabase/setup.md](docs/supabase/setup.md).

## Autorização

Papéis privilegiados ficam em `app_metadata`, que não pode ser alterado pelo próprio usuário. As políticas RLS do Supabase são a barreira de autorização real; a navegação por papel no frontend é apenas uma camada de experiência.

Consulte [docs/supabase/setup.md](docs/supabase/setup.md) para criar o primeiro proprietário e publicar a função segura de cadastro de barbeiros.

## Interface e movimento

A interface usa temas claro/escuro/sistema, fontes variáveis auto-hospedadas e GSAP com `prefers-reduced-motion`. Vendure e Saleor serviram como referências de densidade e acabamento, sem introduzir dependências de e-commerce.

## Deploy

O adaptador Nitro gera o SSR e as funções compatíveis com Vercel. O arquivo `vercel.json` fixa a detecção do framework como TanStack Start; a publicação pode ser feita com `vercel --prod` depois de configurar as variáveis públicas do Supabase no projeto.

- Produção: [kings-barber-management.vercel.app](https://kings-barber-management.vercel.app)
- Entrega no GitHub: [PR #1](https://github.com/gui897gs-tech/Barbearia/pull/1)

O deployment atual foi publicado pela CLI. Para disparar novos deploys automaticamente por `push`, ainda é necessário conceder ao GitHub App da Vercel acesso ao repositório `gui897gs-tech/Barbearia` e conectá-lo ao projeto `kings-barber-management`.

## Segurança de dependências

`npm audit` e `npm audit --omit=dev` não apontam vulnerabilidades. A migração do adaptador Cloudflare para Nitro removeu a cadeia Miniflare → Sharp anteriormente afetada por quatro alertas altos.
