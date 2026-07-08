# Super Admin Dashboard + Agent Management

The reference image is a Next.js/Java/Python/Rust multi-service architecture. Lovable runs on **TanStack Start + Lovable Cloud (Postgres + Edge Functions)** — one repo, one runtime. We'll deliver the same product surface here: same dashboard, same agent management, same AI Command Center, backed by Cloud instead of Java/Python/Rust microservices.

Delivered in phases so you get a working product fast, then depth.

## Phase 1 — Dashboard shell (RTL, Arabic, dark neo theme)

Layout matching the mockup:
- Right sidebar (RTL) with sections: لوحة التحكم، إدارة المواقع، قواعد البيانات، التخزين، الأمان، الذكاء الاصطناعي، الوكلاء، الإعدادات
- Top 6 stat cards (المواقع النشطة، المستخدمون، قواعد البيانات، التخزين، الطلبات، الأرباح)
- Center "SUPER CORE" network graph of sites (react-flow)
- Right column: DB monitoring, resource usage line chart (recharts), system health donut, security center
- Bottom: Storage Explorer, AI Command Center, Backup Center, Activity feed, Alerts, Quick Access

Design tokens: deep navy `#0a0e1a` bg, cyan/violet neon accents, glow shadows, Cairo/Tajawal Arabic font, all via `src/styles.css` tokens.

## Phase 2 — Lovable Cloud backend

Enable Cloud. Tables (all with GRANTs + RLS + `has_role` admin gate):
`sites, databases_registry, servers, storage_files, backups, security_events, system_metrics, notifications, activity_log, agents, agent_sessions, agent_tasks, agent_messages, user_roles`

Seed realistic demo data so the dashboard is populated on first load.

Routes (TanStack file-based): `/`, `/sites`, `/sites/$id`, `/databases`, `/storage`, `/backups`, `/security`, `/ai-command`, `/agents`, `/agents/create`, `/agents/$sessionId`, `/settings`. Auth-gated under `_authenticated/`, admin role required.

Data via `createServerFn` + TanStack Query (`ensureQueryData` + `useSuspenseQuery`).

## Phase 3 — Agent system (Lovable AI, not Python/Rust)

Hierarchical agents implemented as orchestrated Lovable AI calls:
- **Orchestrator** server function: accepts a goal, creates `agent_session`, spawns 10 General Managers → each spawns Managers → each spawns Employee agents (configurable fan-out; default smaller than 10/500/1000 for cost, with a "full scale" toggle)
- Each agent = one Lovable AI call (`google/gemini-3-flash-preview`) with a role prompt, writes result to `agent_tasks`
- 6-cycle loop: Research → Analyze → Plan → Execute → Verify → Report
- Streaming progress via polling (`useQuery` refetchInterval) on `agent_sessions`

Specialized site-management agents (schedulable):
Site Monitor, Security, Backup, Performance, AI Developer, SEO, DB Optimizer, User Behavior — each is a server function invocable on-demand or via a cron edge function.

UI:
- `/agents` — list of sessions + specialized agent catalog with run buttons
- `/agents/create` — goal textarea → launches session
- `/agents/$sessionId` — live hierarchy tree (`AgentTree`), 6-cycle results panel, per-agent output drawer

## Phase 4 — AI Command Center

Chat route `src/routes/api/chat.ts` using AI SDK `streamText` + tools:
`listSites, getSiteStats, runBackup, launchAgentSession, queryMetrics`. Natural-language commands execute against Cloud.

## Explicit scope decisions

- **Single TanStack Start app on Lovable Cloud.** No Java Spring Boot, no Python FastAPI, no Rust engine, no Docker Compose, no Next.js — Lovable doesn't host those. The functional equivalent is server functions + edge functions + Postgres.
- **Agent scale defaults to 10 / 50 / 100** (not 10/500/1000) to keep sessions affordable; a "full scale" flag raises it. Every agent call costs credits.
- **RTL Arabic** primary; layout mirrors the mockup exactly.
- No mock AI — real Lovable AI calls from day one.

## What ships in the first build turn

Phase 1 shell + Phase 2 schema/seed + Phase 2 sites/databases/storage list pages wired to Cloud. Phase 3 agents scaffold (create + list + session view with a small 3-cycle run) so the flow is end-to-end demonstrable. Phase 4 AI Command Center wired to `listSites` + `launchAgentSession` tools.

Subsequent turns: full 6-cycle orchestrator, specialized agent catalog with cron scheduling, per-site detail pages, security/backup deep dives, ZIP report export.

## Technical notes

- Cloud enable → migrations with `GRANT` + RLS + `has_role('admin')` policies + `user_roles` table
- `src/routes/_authenticated/` gate; first signup auto-granted admin via trigger
- Agents orchestrator: `createServerFn` kicks background work via `waitUntil` in an edge route (`/api/agents/run`) so the HTTP call returns immediately
- Charts: recharts; graph: @xyflow/react; icons: lucide-react; animation: framer-motion
- Arabic font loaded via `<link>` in `__root.tsx` head (Tajawal + Cairo)

Confirm and I'll build Phase 1+2+ agent scaffold in the first pass.
