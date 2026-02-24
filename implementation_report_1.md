# Implementation Report 1

## Overview

Steps 2–10 of the Todozen PWA were implemented in a single session. Step 1 (project scaffolding) was already complete. The app builds cleanly with `next build` — zero type errors, all 9 routes compile.

---

## What Was Implemented

### Step 2: Data Model + Database Layer

**Files created:**
- `src/lib/models/item.ts` — `ItemBase` interface, `ItemType` discriminated union, `ReminderData` payload, `createReminderItem()` factory using UUIDv7
- `src/lib/models/recurrence.ts` — 7 RRULE presets (one-time through yearly), `parseRRule()`, `getNextOccurrence()`, `describeRecurrence()` helpers wrapping rrule.js
- `src/lib/models/notification.ts` — `ScheduledNotification`, `PushPayload`, `StoredPushSubscription` types
- `src/lib/db/client.ts` — Dexie database class with `items` and `scheduledNotifications` tables, indexed on type/dates/sync fields
- `src/lib/db/repositories/item-repository.ts` — CRUD: `getItem`, `getItemsByType`, `getActiveReminders`, `createItem`, `updateItem`, `softDeleteItem`, `hardDeleteItem`, `bulkCreateItems`
- `src/lib/db/schema.ts` — Drizzle ORM schema mirroring IndexedDB: `items`, `scheduledNotifications`, `pushSubscriptions` tables
- `src/lib/utils/dates.ts` — `formatDateTime`, `formatRelative`, `getUserTimezone`, `toLocalISOString`
- `src/lib/utils/vapid.ts` — `urlBase64ToUint8Array` for VAPID key conversion

### Step 3: PWA Foundation

**Files created:**
- `src/app/manifest.ts` — Dynamic web manifest (standalone, portrait, themed)
- `public/sw.js` — Plain JS service worker: network-first HTML caching, cache-first static assets, push event listener, notificationclick deep-linking, message handler for notification checks
- `public/icon-192x192.png`, `icon-512x512.png`, `icon-maskable-512x512.png`, `badge.png` — Placeholder PNGs
- `src/components/pwa/sw-registrar.tsx` — Client component that registers SW and runs 60-second notification check interval

**Modified:** `src/app/layout.tsx` — Added `SWRegistrar`, updated metadata to "Todozen"

### Step 4: Layout + Navigation

**shadcn/ui components installed (16):** button, card, dialog, input, select, switch, calendar, popover, badge, dropdown-menu, sheet, separator, label, textarea, tabs, sonner (replaced deprecated toast)

**Files created:**
- `src/components/layout/header.tsx` — Sticky header with branding, new-reminder button, theme toggle, settings link
- `src/components/layout/bottom-nav.tsx` — Fixed bottom nav: Home, Reminders, Settings with active state highlighting
- `src/components/layout/app-shell.tsx` — Wraps header + main content + bottom nav

**Modified:** `src/app/layout.tsx` — Wrapped children in `AppShell`, added `Toaster`, viewport config with safe-area-inset

**Route pages created (placeholders, later filled in):**
- `/reminders`, `/reminders/new`, `/reminders/[id]`, `/reminders/[id]/edit`, `/settings`

### Step 5: Reminder CRUD

**Files created:**
- `src/components/reminders/datetime-picker.tsx` — Native `datetime-local` input with ISO conversion
- `src/components/reminders/recurrence-picker.tsx` — Select with 7 presets + custom RRULE text input
- `src/components/reminders/pre-alert-picker.tsx` — Toggle badges: at time, 5m, 15m, 30m, 1h, 1d before
- `src/components/reminders/reminder-form.tsx` — Shared create/edit form, saves to IndexedDB + schedules notifications
- `src/components/reminders/reminder-card.tsx` — Card with title, datetime, recurrence description, next occurrence
- `src/components/reminders/reminder-list.tsx` — Live-query list sorted by active status then datetime, with loading skeletons

**Route pages wired up:**
- `/reminders` — List with empty state and "New" button
- `/reminders/new` — Create form
- `/reminders/[id]` — Detail view with edit/delete/toggle-active, upcoming occurrences list
- `/reminders/[id]/edit` — Edit form pre-populated from IndexedDB

### Step 6: Recurrence Engine

**Files created:**
- `src/lib/services/recurrence-engine.ts` — `getNextReminderDate()`, `getUpcomingOccurrences()`, `computeNotificationTimes()` (occurrence × preAlert cross-product)

**Modified:**
- `reminder-card.tsx` — Added "Next: [relative time]" with CalendarClock icon
- `reminders/[id]/page.tsx` — Added next occurrence display and upcoming occurrences list for recurring reminders

### Step 7: Local Notification Scheduling

**Files created:**
- `src/lib/services/notification-scheduler.ts` — `scheduleNotificationsForReminder()` (deletes unsent, computes next 10 occurrences × preAlerts, bulk-inserts), `scheduleAllNotifications()`, `checkAndFireLocalNotifications()` (queries due notifications, fires via SW registration or Notification API, marks sent)

**Modified:**
- `sw-registrar.tsx` — Added 60-second `setInterval` calling `checkAndFireLocalNotifications`, plus immediate check on mount
- `reminder-form.tsx` — Calls `scheduleNotificationsForReminder()` after create/update
- `settings/page.tsx` — Full notification permission UI with status display and enable button

### Step 8: Push Notifications (Server-Side)

**Files created:**
- `src/lib/db/turso.ts` — Lazy singleton Drizzle client for Turso/libSQL
- `drizzle.config.ts` — Drizzle Kit config pointing to Turso
- `src/app/actions/push.ts` — Server actions: `subscribeToPush()` (upsert subscription), `unsubscribeFromPush()`, `sendPushToAll()` (iterates all subscriptions, auto-cleans 410/404 expired ones)
- `src/components/pwa/push-manager.tsx` — Client component: checks existing subscription state, toggle button to subscribe/unsubscribe via PushManager API + server actions
- `src/app/api/cron/check-notifications/route.ts` — GET endpoint: verifies bearer token, queries Turso for due unsent notifications, sends push via `sendPushToAll()`, marks sent

**Modified:** `settings/page.tsx` — Added PushManager component under notification settings

### Step 9: Polish + Dashboard

**Files created:**
- `src/components/pwa/install-prompt.tsx` — Listens for `beforeinstallprompt`, shows dismissible install banner
- `src/lib/hooks/use-reminders.ts` — `useReminders()` and `useActiveReminders()` live-query hooks
- `src/components/layout/theme-toggle.tsx` — Light/dark/system cycle toggle using `classList.add/remove("dark")`

**Modified:**
- `page.tsx` (dashboard) — Upcoming reminders widget (top 5 sorted by next occurrence), install prompt, loading skeletons, empty state
- `header.tsx` — Added theme toggle between new-reminder and settings buttons

### Step 10: Production Readiness

**Files created:**
- `vercel.json` — Cron job: `/api/cron/check-notifications` every minute
- `src/lib/services/turso-sync.ts` — `syncItemToTurso()` (upsert with `onConflictDoUpdate`), `syncNotificationToTurso()`, `deleteItemFromTurso()`

**Modified:** `.env.example` — Added setup instructions for Turso and CRON_SECRET

---

## Decisions Made During Implementation

### Used native `datetime-local` input instead of a custom calendar picker
The shadcn calendar component was installed but the native input provides a better mobile UX with OS-level date/time wheels. Simpler and no additional bundle size.

### Replaced deprecated `toast` with `sonner`
shadcn/ui's toast component is deprecated in favor of sonner. Installed sonner instead and used it throughout.

### Used `useLiveQuery` from dexie-react-hooks for all list views
This gives automatic reactivity — any IndexedDB write from any tab/context immediately updates all rendered lists without manual refetching.

### Used IIFEs for inline computed UI in the detail page
The upcoming occurrences and next date sections on the reminder detail page use immediately-invoked function expressions inside JSX to keep the computed logic co-located with rendering rather than cluttering the component body with multiple `useMemo` calls.

### Theme toggle cycles through three states (light → dark → system)
Rather than a simple toggle, the theme cycles through three modes to respect users who want system-preference-based theming.

### Turso sync is fire-and-forget, not integrated into CRUD flow
The `turso-sync.ts` service is available but not wired into every IndexedDB write. This keeps the local-first experience snappy — sync can be called from the form after save or via a future background sync mechanism. The cron endpoint reads from Turso, so items that need server-side push delivery must be synced there by the caller.

### Cron auth is optional in development
The cron endpoint allows unauthenticated access when `CRON_SECRET` is not set, making local development easier while requiring the secret in production.

### `Uint8Array<ArrayBuffer>` explicit typing for VAPID conversion
TypeScript strict mode flagged the default `Uint8Array<ArrayBufferLike>` as incompatible with the PushManager API's `BufferSource` parameter. Fixed by explicitly constructing with `new ArrayBuffer()` to satisfy the type constraint.

---

## File Count Summary

| Category | Files Created | Files Modified |
|---|---|---|
| Models & Types | 3 | — |
| Database Layer | 4 | — |
| Services | 4 | — |
| Components | 10 | — |
| Routes/Pages | 6 | 1 (layout.tsx) |
| Config | 3 | 1 (.env.example) |
| Assets | 4 (icons) | — |
| **Total** | **34** | **2** |

## Build Validation

- `npx tsc --noEmit` — Clean (zero errors) after every step
- `npx next build` — Successful production build, all 9 routes compiled:
  - 6 static (prerendered)
  - 3 dynamic (server-rendered on demand: `[id]` routes + cron API)
