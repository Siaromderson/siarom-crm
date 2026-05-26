# SIAROM CRM

CRM em Next.js 14 + Supabase com calculadora de aquisição, projetos, kanban arrastável, tarefas estilo ClickUp e dashboard. Visual glassmorphism azul.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind 3
- Supabase (Auth + Postgres + RLS) via `@supabase/ssr`
- Recharts (gráficos), `@dnd-kit` (drag & drop)

## Setup

### 1) Supabase
1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor** e cole o conteúdo de [SETUP.sql](./SETUP.sql). Execute.
3. Em **Authentication → Providers**, mantenha **Email** ativo e desative **Enable sign-ups** se quiser bloquear cadastro externo (já bloqueamos na UI).

> **Observação sobre o nome das tabelas:** todas usam prefixo `siarom_crm_` (com underscore). Hífen (`-`) em nomes de tabela Postgres exige aspas duplas em toda query, então o padrão SQL é underscore. As tabelas são: `siarom_crm_profiles`, `siarom_crm_projects`, `siarom_crm_tasks`, `siarom_crm_app_settings`.

### 2) .env.local
Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # NUNCA exponha no client
```

A `service_role` é usada **só** em `lib/supabase/admin.ts` (criar/editar usuários).

### 3) Primeiro admin
1. Supabase Studio → **Authentication → Users → Add user** (email + senha).
2. Copie o UUID e rode no SQL Editor:
   ```sql
   insert into public.siarom_crm_profiles (id, nome, email, role, ativo)
   values ('<UUID>', 'Seu Nome', 'voce@empresa.com', 'admin', true);
   ```
3. Daqui pra frente, novos usuários são criados em **/admin/usuarios**.

### 4) Rodar
```bash
npm install     # ou clique INSTALAR.bat
npm run dev     # ou clique INICIAR.bat (porta 3002)
```

Abra http://localhost:3002 → faça login.

## Rotas
- `/login` — email/senha (sign up bloqueado)
- `/calculadora` — playground de cálculo (todos)
- `/projetos` + `/projetos/[id]` — CRUD com preview de cálculo
- `/kanban` — board drag-and-drop com 6 etapas
- `/tarefas` — board/lista, filtro automático por usuário quando `role=user`
- `/dashboard` — KPIs e gráficos (somente admin)
- `/admin/usuarios` e `/admin/configuracoes` — somente admin

## Permissões (RLS)
- **Admin:** vê e edita tudo.
- **User:** vê projetos onde é `owner` ou é `assignee` de alguma tarefa; vê só as suas tarefas.

## Estrutura
```
app/                # rotas
components/         # UI + features
lib/
  supabase/         # client.ts, server.ts, admin.ts (service_role)
  actions/          # Server Actions
  calc.ts           # calcularDivisao(total, %com, %imp)
  auth.ts           # requireSession / requireAdmin
types/database.ts
middleware.ts
SETUP.sql           # schema + RLS
```

## Cálculo
```ts
import { calcularDivisao } from "@/lib/calc";
calcularDivisao(10000, 20, 15.5);
// { total: 10000, comissao: 2000, imposto: 1550, lucro: 6450, pctLucro: 64.5 }
```

## Notas
- Colunas `valor_comissao`, `valor_imposto`, `valor_lucro` em `siarom_crm_projects` são `generated stored` — soma direta no dashboard sem recalcular no app.
- Kanban: quando o projeto cai em `implementacao`, o `closed_at` é preenchido automaticamente.
- Para resetar senha de outro usuário, use o botão na linha em `/admin/usuarios`.
