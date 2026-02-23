# Todozen - Progressive Web App Implementation Plan

## Context

Build a greenfield PWA called "Todozen" for life organization. The immediate goal is a **reminder system** (one-time + recurring, with push notifications), but the architecture must be flexible enough to eventually support todos, notes, events, habits, goals, calendar integration, AI/MCP integration, and multi-device sync — without requiring major refactoring.

**Tech choices:** Next.js (App Router) + TypeScript, shadcn/ui + Tailwind, hybrid storage (IndexedDB via Dexie + Turso/SQLite via Drizzle), Web Push API.

---

## Data Model: Flexible Entity System

A single `Item` table with a `type` discriminator and a typed JSON `data` column. This avoids table-per-entity sprawl and lets new item types (todos, notes, events) be added without schema migrations.

- **`ItemBase`** — universal fields: `id` (UUIDv7, client-generated, time-sortable), `type`, `title`, `description?`, `createdAt`, `updatedAt`, `deletedAt?` (soft delete), `syncVersion` (for future sync), `tags[]`, `data` (type-specific JSON payload)
- **`ItemType`** — discriminated union: `'reminder'` (v1), plus stubs for `'todo' | 'note' | 'event' | 'habit' | 'goal'`
- **`ReminderData`** — `datetime` (ISO 8601 DTSTART), `rrule` (RFC 5545 string or null), `preAlerts` (offset minutes array, e.g. `[0, 15, 60]`), `isActive`, `lastTriggered?`, `timezone` (IANA)
- **`ScheduledNotification`** — `id`, `itemId`, `scheduledFor`, `preAlertMinutes`, `sent`, `createdAt` — tracks individual notification instances computed from RRULE + preAlerts

Recurrence uses the **rrule.js** library (RFC 5545 compliant). UI presets (daily, weekdays, weekly, etc.) map to RRULE strings, with a custom option for advanced patterns.

---

## Project Structure

```
src/
├── app/
│   ├── manifest.ts                    # Dynamic PWA manifest
│   ├── layout.tsx                     # Root layout: providers, AppShell, SW registrar
│   ├── page.tsx                       # Dashboard: upcoming reminders, quick add
│   ├── globals.css
│   ├── reminders/
│   │   ├── page.tsx                   # Reminder list (filterable)
│   │   ├── new/page.tsx               # Create reminder
│   │   └── [id]/
│   │       ├── page.tsx               # Reminder detail
│   │       └── edit/page.tsx          # Edit reminder
│   ├── settings/page.tsx              # Push toggle, preferences
│   ├── actions/push.ts                # Server Actions: subscribe, unsubscribe, send
│   └── api/cron/check-notifications/route.ts  # Cron endpoint
│
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   ├── layout/
│   │   ├── app-shell.tsx              # Main frame: header + nav + content
│   │   ├── bottom-nav.tsx             # Mobile bottom nav
│   │   └── header.tsx                 # Top bar with branding + quick-add
│   ├── reminders/
│   │   ├── reminder-list.tsx          # Live-query list with filters
│   │   ├── reminder-card.tsx          # Single reminder display
│   │   ├── reminder-form.tsx          # Shared create/edit form
│   │   ├── recurrence-picker.tsx      # RRULE preset selector + custom builder
│   │   ├── pre-alert-picker.tsx       # "Remind X before" multi-select
│   │   └── datetime-picker.tsx        # Date + time combined picker
│   └── pwa/
│       ├── sw-registrar.tsx           # SW registration + periodic notification check
│       ├── push-manager.tsx           # Push subscription toggle
│       └── install-prompt.tsx         # PWA install prompt
│
├── lib/
│   ├── db/
│   │   ├── client.ts                  # Dexie database class + schema
│   │   ├── schema.ts                  # Drizzle ORM schema for Turso
│   │   └── repositories/
│   │       └── item-repository.ts     # CRUD on IndexedDB items
│   ├── models/
│   │   ├── item.ts                    # Base Item type + discriminated unions
│   │   ├── recurrence.ts              # RRULE presets, helpers, serialization
│   │   └── notification.ts            # Push payload + scheduled notification types
│   ├── services/
│   │   ├── recurrence-engine.ts       # RRULE evaluation, next occurrences
│   │   └── notification-scheduler.ts  # Compute + persist scheduled notifications
│   ├── hooks/
│   │   ├── use-reminders.ts           # Dexie live query for reminders
│   │   └── use-push-subscription.ts   # Push subscription state
│   └── utils/
│       ├── dates.ts                   # Date formatting, timezone helpers
│       └── vapid.ts                   # urlBase64ToUint8Array
│
public/
├── sw.js                              # Service worker (plain JS, not bundled)
├── icon-192x192.png
├── icon-512x512.png
├── icon-maskable-512x512.png
└── badge.png
```

---

## Service Worker Strategy (`public/sw.js`)

Plain JS file (not bundled — Next.js 15/Turbopack has compatibility issues with SW plugins).

1. **Offline caching** — App shell (HTML routes) uses network-first with cache fallback. Static assets (`_next/static`) use cache-first. API routes are network-only.
2. **Push reception** — `push` event listener parses payload JSON, calls `showNotification()` with title, body, icon, actions (View/Dismiss).
3. **Notification click** — `notificationclick` handler deep-links into the app (`/reminders/{id}`), focusing existing window or opening new.
4. **Local notification check** — Responds to `message` events from main thread to check IndexedDB for due notifications. Also handles `periodicsync` (Chromium-only progressive enhancement).

---

## Push Notification Flow

```
User creates reminder → stored in IndexedDB (Dexie)
                       → synced to Turso (Server Action, fire-and-forget)
                       → notification-scheduler computes next N occurrences × preAlerts
                       → ScheduledNotification records created in IndexedDB + Turso

[App open]  → main thread setInterval (60s) checks IndexedDB for due notifications
            → fires via Notification API directly

[App closed] → server cron (every 60s) queries Turso for due notifications
             → sends Web Push via web-push library
             → SW receives push event → showNotification()
```

**VAPID keys** generated once via `npx web-push generate-vapid-keys`, stored in `.env.local`.

**Server Actions** (`src/app/actions/push.ts`): `subscribeToPush()` stores subscription in Turso, `sendPushNotification()` sends to all subscriptions via `web-push`, auto-cleans expired (410) subscriptions.

**Cron endpoint** (`src/app/api/cron/check-notifications/route.ts`): Protected by bearer token, queries Turso for unsent due notifications, sends push, marks as sent.

---

## Dependencies

```bash
# Core
npm install dexie dexie-react-hooks rrule uuid web-push lucide-react
npm install -D @types/web-push @types/uuid

# Database (server-side)
npm install @libsql/client drizzle-orm
npm install -D drizzle-kit
```

shadcn/ui components: `button card dialog input select switch calendar popover badge toast dropdown-menu sheet separator label textarea tabs`

---

## Implementation Steps

### Step 1: Project Scaffolding
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src dir
- `npx shadcn@latest init` (New York style, Zinc, CSS variables)
- Install all dependencies
- Generate VAPID keys, create `.env.local` and `.env.example`
- Set up `next.config.ts` with security headers + SW cache headers

### Step 2: Data Model + Database Layer
- Create `src/lib/models/item.ts` — full Item type system with discriminated unions
- Create `src/lib/models/recurrence.ts` — RRULE presets and helpers
- Create `src/lib/models/notification.ts` — notification types
- Create `src/lib/db/client.ts` — Dexie database class with indexed schema
- Create `src/lib/db/repositories/item-repository.ts` — CRUD operations
- Create `src/lib/db/schema.ts` — Drizzle schema for Turso (server mirror)

### Step 3: PWA Foundation
- Create `src/app/manifest.ts` — dynamic web app manifest
- Create placeholder icons in `public/`
- Create `public/sw.js` — offline caching + push + notification click handlers
- Create `src/components/pwa/sw-registrar.tsx` — registration + periodic check
- Wire into root layout
- Verify: Lighthouse PWA installability passes

### Step 4: Layout + Navigation
- Install shadcn/ui components
- Build `app-shell.tsx`, `header.tsx`, `bottom-nav.tsx`
- Create placeholder pages for all routes
- Wire layout into `layout.tsx`
- Verify: responsive navigation works across all routes

### Step 5: Reminder CRUD
- Build `datetime-picker.tsx`, `recurrence-picker.tsx`, `pre-alert-picker.tsx`
- Build `reminder-form.tsx` (shared create/edit)
- Build `reminder-card.tsx` and `reminder-list.tsx` with Dexie live queries
- Wire up `/reminders`, `/reminders/new`, `/reminders/[id]`, `/reminders/[id]/edit`
- Verify: full CRUD persists in IndexedDB across refreshes

### Step 6: Recurrence Engine
- Build `recurrence-engine.ts` — rrule.js integration for computing next occurrences
- Build `rrule-helpers.ts` — human-readable recurrence descriptions
- Update reminder cards to show computed "Next: [date]"
- Verify: daily/weekly/custom recurring reminders show correct next dates

### Step 7: Local Notification Scheduling
- Build `notification-scheduler.ts` — compute + persist ScheduledNotification records
- Update `sw-registrar.tsx` to run periodic check + fire local notifications
- Add notification permission request in settings
- Verify: create a reminder 2 min from now, notification appears

### Step 8: Push Notifications (Server-Side)
- Create Turso database, add credentials to `.env.local`
- Run Drizzle migrations
- Build `src/app/actions/push.ts` — subscribe/unsubscribe/send
- Build `src/components/pwa/push-manager.tsx` — subscription toggle
- Add push event + notificationclick handlers to `sw.js`
- Build `src/app/api/cron/check-notifications/route.ts`
- Verify: subscribe, create reminder, trigger cron manually, receive push

### Step 9: Polish + Dashboard
- Build install prompt component
- Build dashboard page with upcoming reminders widget
- Add empty states, loading skeletons, toast notifications
- Dark mode support (shadcn dark class strategy)
- Final Lighthouse audit (target 90+)

### Step 10: Production Readiness
- Set up Vercel Cron for notification check (every minute)
- Add fire-and-forget Turso sync on item create/update
- Create `.env.example` with documentation
- Deploy to Vercel

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Single `Item` table with JSON `data` | Avoids table-per-entity; new types need only TypeScript additions, no schema migration |
| UUIDv7 for IDs | Time-sortable, globally unique, client-generated (no server round-trip), conflict-free for future sync |
| Plain `public/sw.js` (no Serwist/next-pwa) | Next.js 15 Turbopack incompatibility with webpack SW plugins; manual SW is small and transparent |
| Dual notification path (local + push) | Local works when app is open; push works when closed. Both converge on `showNotification()` |
| RRULE (RFC 5545) for recurrence | Industry standard, Google Calendar compatible, powerful expression of patterns, rrule.js handles computation |
| Dexie.js for IndexedDB | Reactive live queries via `useLiveQuery`, excellent TypeScript support, simple API |
| Drizzle ORM for Turso | Type-safe SQL, lightweight, first-class Turso support, mirrors Dexie schema for future sync |

## Verification

After each step, verify the increment works:
- **Steps 1-2**: App runs, IndexedDB tables visible in DevTools
- **Step 3**: Lighthouse PWA audit passes installability
- **Step 4**: Navigation works, responsive layout renders
- **Step 5**: Create/read/update/delete reminders, data persists
- **Step 6**: Recurring reminders show correct next occurrence dates
- **Step 7**: Local notification fires for a near-future reminder
- **Step 8**: Push notification received when app is closed
- **Step 9**: Dashboard renders, dark mode toggles, install prompt shows
- **Step 10**: Deployed, cron triggers notifications reliably
