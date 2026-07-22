# Funcao segura para cadastrar barbeiros

Esta funcao permite que somente o dono da barbearia crie contas de barbeiro.
O cadastro publico do site continua criando apenas contas de cliente.

## Publicar no Supabase

1. Instale e faça login no Supabase CLI.
2. Vincule o projeto:

```bash
supabase link --project-ref codpqtkvrmgbhfgzkqqr
```

3. Publique a funcao:

```bash
supabase functions deploy create-barber
```

4. No painel do Supabase, confirme que a Edge Function `create-barber` ficou ativa.

## Variaveis

A funcao usa as variaveis padrao do Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca coloque a service role key no `.env.local` do Vite. Ela deve ficar somente no ambiente seguro da Edge Function.

## Primeiro dono

Para o primeiro acesso do dono, crie um usuario no Supabase Auth e defina no `user_metadata`:

```json
{
  "role": "owner",
  "full_name": "Dono King's Barber"
}
```

Depois disso, o dono entra no site e cadastra os barbeiros pela aba `Equipe`.
