# Backend Supabase e acessos da equipe

Esta funcao permite que somente o dono da barbearia crie contas de barbeiro.
O cadastro publico do site continua criando apenas contas de cliente.

## Publicar no Supabase

1. Instale e faça login no Supabase CLI.
2. Vincule o projeto:

```bash
supabase link --project-ref kxpolmoscayjztpyhbmh
```

3. Aplique todas as migrações, na ordem numérica:

```bash
supabase db push
```

4. Publique as funções:

```bash
supabase functions deploy create-barber
supabase functions deploy delete-barber
```

5. No painel do Supabase, confirme que ambas ficaram ativas.

## Variaveis

A funcao usa as variaveis padrao do Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN`: uma ou mais origens exatas, separadas por vírgula.
- `APP_URL`: URL pública usada no retorno do convite por e-mail.

Configure os dois segredos específicos:

```bash
supabase secrets set ALLOWED_ORIGIN=http://localhost:4199 APP_URL=http://localhost:4199
```

Nunca coloque a service role key no `.env.local` do Vite. Ela deve ficar somente no ambiente seguro da Edge Function.

Para aceitar o ambiente local e o site publicado ao mesmo tempo:

```bash
supabase secrets set "ALLOWED_ORIGIN=http://localhost:4199,https://seu-site.com" APP_URL=https://seu-site.com
```

As migrações `202607230010`, `202607230011` e `202607230012` adicionam,
respectivamente, data de nascimento no cadastro, catálogo para clientes e o valor
fixo mensal dos barbeiros. Elas precisam estar aplicadas antes de testar os
convites atualizados.

As migrações `202607310013` e `202608060014` acrescentam o registro transacional
de vendas de produtos e os índices usados pelas consultas de produção.

A migração `202608200019` é obrigatória antes de publicar as Edge Functions
atualizadas. Ela revoga o acesso às funções internas de trigger e cria o limite
atômico de cinco convites por proprietário a cada cinco minutos. A função de
convite falha de forma fechada quando `ALLOWED_ORIGIN` ou `APP_URL` não estão
configurados com origens exatas correspondentes.

A migração `202608060015` adiciona preços opcionais por combinação de barbeiro
e serviço. Quando não houver valor personalizado, o preço padrão do serviço é
usado. O RPC de agendamento resolve o valor no PostgreSQL para impedir alterações
de preço pelo navegador.

## Primeiro dono

Para o primeiro acesso do dono, crie um usuario no Supabase Auth e defina no `app_metadata` (não em `user_metadata`):

```json
{
  "role": "owner",
  "full_name": "Dono King's Barber"
}
```

Depois disso, o dono entra no site e cadastra os barbeiros pela aba `Equipe`. O profissional recebe um convite e define a própria senha; nenhuma senha temporária é compartilhada pelo proprietário.

## Verificação mínima após deploy

1. Crie uma conta pública e confirme que ela recebe `app_metadata.role = client`.
2. Entre como proprietário e envie um convite de barbeiro.
3. Confirme que o barbeiro enxerga apenas os próprios atendimentos.
4. Faça duas tentativas de reserva simultâneas no mesmo horário; apenas uma deve persistir.
5. Conclua um atendimento e valide a atualização de visitas, gasto e ticket no cadastro do cliente.
6. Teste um cancelamento dentro e fora da antecedência configurada.
7. Confirme que a sexta tentativa de convite em cinco minutos recebe HTTP 429.
8. Envie `OPTIONS` com uma origem não autorizada e confirme HTTP 403 sem header CORS permissivo.

O roteiro automatizado equivalente pode ser executado com:

```bash
REAL_SUPABASE_URL=... \
REAL_SUPABASE_ANON_KEY=... \
REAL_SUPABASE_SERVICE_ROLE_KEY=... \
REAL_APP_URL=https://seu-site.com \
npm run test:supabase
```

Use somente um projeto controlado pela equipe. O teste cria usuários, perfil de
barbeiro, serviço e agendamentos temporários, valida RLS, concorrência, preços,
métricas, cancelamento e quota de convites, e remove os dados no bloco de limpeza.

## Configuração de autenticação para produção

- Exija confirmação de e-mail e senha com no mínimo 12 caracteres, incluindo
  maiúscula, minúscula, número e símbolo.
- Mantenha rotação de refresh token ativa e habilite a exigência de autenticação
  recente para troca de senha.
- Restrinja as Redirect URLs às origens realmente publicadas; remova previews e
  endereços locais quando não forem necessários.
- Ative CAPTCHA no cadastro público antes de campanhas ou divulgação em larga escala.
- Mantenha TOTP disponível para contas de proprietário e exija seu uso por política operacional.

O arquivo `supabase/config.toml` registra esses padrões para ambientes gerenciados
pela CLI. Confira também as opções no painel do projeto hospedado, pois um `db push`
não sincroniza todas as configurações do Auth.
