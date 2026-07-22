# Backend Supabase e acessos da equipe

Esta funcao permite que somente o dono da barbearia crie contas de barbeiro.
O cadastro publico do site continua criando apenas contas de cliente.

## Publicar no Supabase

1. Instale e faça login no Supabase CLI.
2. Vincule o projeto:

```bash
supabase link --project-ref codpqtkvrmgbhfgzkqqr
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
- `ALLOWED_ORIGIN`: origem exata do site, por exemplo `https://agenda.exemplo.com`.
- `APP_URL`: URL pública usada no retorno do convite por e-mail.

Configure os dois segredos específicos:

```bash
supabase secrets set ALLOWED_ORIGIN=https://agenda.exemplo.com APP_URL=https://agenda.exemplo.com
```

Nunca coloque a service role key no `.env.local` do Vite. Ela deve ficar somente no ambiente seguro da Edge Function.

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
