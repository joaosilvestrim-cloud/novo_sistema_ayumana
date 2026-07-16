# Ayumana

Vitrine de psicólogos brasileiros — terapia em português, no Brasil ou no exterior.
Next.js (App Router) + Supabase + Tailwind v4. Fase 1 (fundação): auth, onboarding
do psicólogo com verificação de CRP e painel admin.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Supabase** (Postgres + Auth + Storage)
- **Tailwind v4** com design tokens da marca (paleta oficial + Outfit/Archivo)

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000 (usa --use-system-ca por causa do TLS local)
```

As variáveis já estão em `.env.local` (não versionado). Modelo em `.env.example`.

## ⚠️ Passo obrigatório: aplicar o banco

O app precisa do schema no Supabase. A migration está em
`supabase/migrations/0001_init.sql`. Duas formas:

**A) SQL Editor (mais simples)**
Abra o projeto no Supabase → **SQL Editor** → cole o conteúdo de
`supabase/migrations/0001_init.sql` → **Run**.

**B) Via script**
Pegue a connection string em Supabase → **Project Settings → Database →
Connection string (URI)**, adicione ao `.env.local` como `DATABASE_URL=...` e:

```bash
npm run db:push
```

Isso cria as tabelas, os 4 planos, as abordagens/especialidades, as políticas de
RLS e o bucket privado `crp-documentos`.

## Tornar-se admin

Depois de criar sua conta pelo `/cadastro`, promova seu usuário a admin no
SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
```

Aí a área **/admin/verificacao** fica acessível.

## Fluxo da Fase 1

1. Psicólogo cria conta (`/cadastro`) → vai para o onboarding.
2. Preenche o perfil, envia o documento de CRP e clica **Enviar para verificação**
   (`/painel/onboarding`). Status vira `pendente`.
3. Admin revisa a fila (`/admin/verificacao`), abre o documento e **aprova** ou
   **reprova**. Só admin/`service_role` pode aprovar (garantido por trigger no banco).
4. Ao aprovar um perfil completo, ele é publicado (`is_published = true`) e passa a
   poder aparecer na busca (catálogo entra na Fase 2).

## Estrutura

```
src/
  app/
    (auth)/            login, cadastro, actions de auth
    painel/            área logada do psicólogo (dashboard, onboarding, assinatura)
    admin/             verificação de CRP (guardado por role=admin)
    para-psicologos/   página de venda com os 4 planos
    psicologos|blog|perguntas/  stubs das próximas fases
  components/          ui/ (design system) e site/ (header, footer, banner CVV)
  lib/
    supabase/          clients browser/server/admin + proxy de sessão
    auth.ts types.ts   helpers de sessão e tipos do domínio
supabase/migrations/   0001_init.sql (schema + RLS + storage + seed)
scripts/db-push.mjs    aplica migrations via DATABASE_URL
```

## Design tokens

Paleta oficial (manual de identidade): Petróleo `#05474A`, Verde `#73A533`,
Turquesa `#53C4CC`, Amarelo `#F5C84B`. Fontes Outfit (títulos) + Archivo (texto).
Definidos em `src/app/globals.css` e expostos como utilitários Tailwind
(`bg-brand`, `text-brand-dark`, `bg-accent`, etc.).

## Segurança

- `.env.local` nunca é versionado. As chaves `SUPABASE_SERVICE_ROLE_KEY` /
  `SUPABASE_SECRET_KEY` só são usadas no servidor (client admin).
- RLS ativo em todas as tabelas. Documentos de CRP ficam em bucket **privado**,
  acessíveis só ao dono e à equipe (URLs assinadas de curta duração no admin).
