# Plano mestre — King's Barber

Status: implementação local concluída; homologação Supabase externa pendente
Início: 22 de julho de 2026
Objetivo: corrigir o produto existente, concluir todos os fluxos dos três perfis e transformar a interface em uma experiência autoral, responsiva, acessível e pronta para produção.

## 1. Requisitos consolidados

- Corrigir os erros TypeScript mostrados na referência e qualquer regressão atual.
- Implementar todas as melhorias técnicas, funcionais e de segurança identificadas na auditoria.
- Concluir os fluxos de proprietário, barbeiro e cliente com dados reais.
- Remover comportamentos falsos, botões sem ação e dados demonstrativos indevidos.
- Implementar temas claro, escuro e preferência do sistema.
- Corrigir responsividade para celular, tablet e desktop.
- Substituir a estética genérica por uma linguagem visual própria da King's Barber.
- Adicionar animações e microinterações com GSAP quando agregarem contexto, preservando `prefers-reduced-motion`.
- Usar Vendure e Saleor apenas como referências de densidade, navegação e acabamento de produto; não introduzir dependências de e-commerce sem requisito de negócio.
- Validar acessibilidade, performance, segurança, persistência, build e fluxos críticos.

## 2. Direção visual

Conceito: **Barbearia editorial contemporânea**.

- Marca: precisa, acolhedora e masculina sem recorrer a clichês vintage excessivos.
- Elemento memorável: uma linha de agenda contínua, inspirada na régua e nas marcações de uma navalha, conectando navegação, estados e animações.
- Tipografia: display editorial com personalidade para títulos e sans humanista para leitura; remover Inter.
- Cor: carvão, osso, tabaco e latão; temas claro e escuro com contraste AA.
- Superfície: textura sutil de papel/couro, bordas precisas e profundidade contida.
- Composição: dashboards assimétricos, hierarquia forte e densidade comparável a produtos maduros como Saleor/Vendure.
- Movimento: revelação orquestrada de página, transições de números, navegação móvel fluida e feedback imediato de ações.

## 3. Fases de implementação

### Fase 0 — Baseline e controle de regressão

- [x] Revalidar `typecheck`, lint, build e auditoria de dependências.
- [x] Confirmar que o arquivo antigo da imagem não participa mais da compilação.
- [x] Inventariar rotas, botões sem ação, dados demonstrativos e chamadas Supabase.
- [x] Adicionar testes unitários e E2E mínimos para as regras e o shell público.
- [x] Registrar screenshots autenticados das telas principais em desktop/mobile e claro/escuro com contratos Supabase interceptados; repetir contra o projeto real antes da publicação.

Gate: baseline reproduzível, erros conhecidos documentados e nenhuma falha TypeScript.

### Fase 1 — Correções funcionais e persistência

- [x] Parar de converter silenciosamente erros do Supabase em gravações locais.
- [x] Criar resultado de repositório consistente, feedback de erro e estados de carregamento.
- [x] Implementar agendamento real do cliente.
- [x] Calcular disponibilidade real por barbeiro, serviço, duração e fuso horário.
- [x] Impedir conflitos e dupla reserva no banco.
- [x] Implementar alteração/cancelamento de agendamento e transições válidas de status.
- [x] Ligar perfil e histórico do cliente à conta autenticada.
- [x] Ligar agenda, histórico, receita e perfil do barbeiro ao usuário autenticado.
- [x] Tornar configurações, exportações e ações rápidas funcionais.
- [x] Remover ou desabilitar explicitamente ações que dependam de produto futuro.

Gate: nenhum botão simula sucesso; os fluxos críticos persistem e são verificados no banco.

### Fase 2 — Segurança e operação

- [x] Adicionar guardas de rota no loader do cliente por papel; SSR por cookies permanece como evolução documentada.
- [x] Completar políticas RLS para cada perfil e tabela.
- [x] Migrar clientes para vínculo explícito com `auth.users`.
- [x] Trocar senha temporária do barbeiro por convite/redefinição obrigatória.
- [x] Restringir CORS e adicionar limitação de tentativas nas Edge Functions.
- [x] Validar entradas privilegiadas também no servidor com Zod.
- [x] Resolver ou mitigar avisos restantes do `npm audit`.
- [x] Adicionar logs estruturados e captura de erros sem dados pessoais.

Gate: matriz de autorização testada e nenhuma operação privilegiada confiando apenas no cliente.

### Fase 3 — Design system e temas

- [x] Criar tokens semânticos para cor, tipografia, espaço, raio, sombra e movimento.
- [x] Implementar `ThemeProvider` com claro/escuro/sistema e persistência.
- [x] Substituir Google Fonts remotas por fontes locais ou estratégia com privacidade adequada.
- [x] Criar primitives próprias para página, painel, estatística, tabela, vazio, erro e skeleton.
- [x] Redesenhar shell, sidebar, cabeçalho, navegação móvel e páginas de autenticação.
- [x] Padronizar formulários, dialogs, tabelas, filtros e feedbacks.
- [x] Remover componentes de UI não usados e dependências desnecessárias.

Gate: temas equivalentes, contraste AA e consistência visual em todas as rotas.

### Fase 4 — Responsividade, UX e acessibilidade

- [x] Definir breakpoints e comportamento para 360, 768, 1024 e 1440 px.
- [x] Transformar tabelas densas em cartões/listas úteis no mobile ou rolagem contida.
- [x] Garantir alvos de toque, navegação por teclado, foco visível e labels.
- [x] Adicionar estados vazio, erro, carregamento e confirmação.
- [x] Revisar conteúdo, datas, moeda, horários e mensagens em pt-BR.
- [x] Evitar deslocamento de layout e rolagem horizontal acidental.

Gate: fluxos críticos completos por teclado e utilizáveis a partir de 360 px.

### Fase 5 — Movimento e microinterações

- [x] Adicionar GSAP e integração React em chunk separado.
- [x] Criar entrada orquestrada do dashboard e transições de navegação discretas.
- [x] Animar cartões e mudanças de estado sem atrasar tarefas.
- [x] Criar microinterações para salvar, agendar, filtrar, abrir menu e confirmar.
- [x] Respeitar `prefers-reduced-motion` e evitar animações em operações repetitivas.

Gate: movimento a 60 fps em dispositivos médios, sem bloquear interação e com modo reduzido.

### Fase 6 — Qualidade e entrega

- [x] Testes unitários de regras de agenda, exportação e formatação.
- [x] Testes E2E autenticados de owner, barber e client com contratos Supabase interceptados, incluindo mutações; a matriz RLS real permanece na homologação externa.
- [x] Testes de responsividade e captura visual do shell público.
- [x] Análise de bundle e divisão de gráficos, Supabase, React e movimento.
- [x] CI com typecheck, lint, testes e build.
- [x] Documentar setup, migrações, deploy, papéis e recuperação de falhas.
- [x] Executar auditoria requisito a requisito antes de concluir o GOAL; resultado em `docs/final-audit.md`.

Gate: pipeline verde, build validado e evidência visual/funcional de cada requisito.

### Fase 7 — Publicação

- [x] Migrar o adaptador de Cloudflare para Nitro/Vercel.
- [x] Revalidar build SSR, audit e E2E depois da migração de runtime.
- [ ] Publicar a branch no GitHub e abrir o PR de entrega.
- [ ] Vincular e publicar o projeto na Vercel.
- [ ] Executar smoke test no domínio de produção e registrar a URL.

Gate: código rastreável no GitHub, deployment acessível por HTTPS e pendências externas explicitadas.

## 4. Bibliotecas previstas

- GSAP + `@gsap/react`: animações coordenadas e context-safe.
- `next-themes` não será usado automaticamente; será avaliado contra SSR do TanStack Start antes de decidir entre dependência e provider próprio.
- Formulários React nativos: mantidos por serem curtos; Zod valida as entradas privilegiadas nas Edge Functions. React Hook Form não foi adicionado sem necessidade concreta.
- TanStack Query: cache, mutações, invalidação e estados assíncronos.
- Radix UI: acessibilidade de primitives complexas já existentes.
- Playwright e Vitest: E2E e testes unitários.

Toda nova dependência deve justificar manutenção, tamanho e ganho de acessibilidade/UX.

## 5. Riscos conhecidos

- Não há credenciais Supabase no repositório; testes reais exigem ambiente local ou projeto remoto configurado.
- Migrações de autorização podem exigir atualização de usuários existentes para `app_metadata`.
- O adaptador Nitro/Vercel está em desenvolvimento ativo e exige regressão de build/SSR ao atualizar.
- O volume de telas exige implementação incremental com regressão visual contínua.

## 6. Evidência necessária para conclusão

- [x] `npm run check` e suíte de testes locais sem falhas.
- [x] `npm audit` e `npm audit --omit=dev` sem vulnerabilidades após a migração para Nitro/Vercel.
- [ ] Migrações aplicadas e políticas RLS testadas por papel em um projeto Supabase.
- [x] Screenshots desktop/mobile dos três ambientes nos temas claro e escuro com dados interceptados determinísticos.
- [ ] Jornada de agendamento real concluída e verificada no banco remoto, inclusive concorrência.
- [x] Todos os controles interativos revisados com ação, estado desabilitado explicativo ou remoção.
- [x] Auditoria final comparando cada requisito deste plano ao estado do produto.
