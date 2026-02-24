import { v7 as uuidv7 } from "uuid";
import { db } from "@/lib/db/client";
import type { ReminderItem } from "@/lib/models/item";
import type { ScheduledNotification } from "@/lib/models/notification";
import { computeNotificationTimes } from "@/lib/services/recurrence-engine";

/**
 * Recompute and persist scheduled notifications for a reminder.
 * Deletes existing unsent notifications for the item, then creates new ones.
 */
export async function scheduleNotificationsForReminder(
  reminder: ReminderItem
): Promise<void> {
  // Remove existing unsent notifications for this item
  await db.scheduledNotifications
    .where("itemId")
    .equals(reminder.id)
    .filter((n) => !n.sent)
    .delete();

  if (!reminder.data.isActive) return;

  const times = computeNotificationTimes(reminder, 10);
  const now = new Date().toISOString();

  const notifications: ScheduledNotification[] = times.map((t) => ({
    id: uuidv7(),
    itemId: reminder.id,
    scheduledFor: t.scheduledFor.toISOString(),
    preAlertMinutes: t.preAlertMinutes,
    sent: false,
    createdAt: now,
  }));

  if (notifications.length > 0) {
    await db.scheduledNotifications.bulkAdd(notifications);
  }
}

/**
 * Recompute notifications for all active reminders.
 */
export async function scheduleAllNotifications(): Promise<void> {
  const reminders = (await db.items
    .where("type")
    .equals("reminder")
    .filter((item) => !item.deletedAt)
    .toArray()) as unknown as ReminderItem[];

  for (const reminder of reminders) {
    await scheduleNotificationsForReminder(reminder);
  }
}

/**
 * Check for due notifications and fire them locally.
 * Returns the number of notifications fired.
 */
export async function checkAndFireLocalNotifications(): Promise<number> {
  const now = new Date().toISOString();

  const dueNotifications = await db.scheduledNotifications
    .where("scheduledFor")
    .belowOrEqual(now)
    .filter((n) => !n.sent)
    .toArray();

  let fired = 0;

  for (const notification of dueNotifications) {
    const item = await db.items.get(notification.itemId);
    if (!item || item.deletedAt) {
      // Clean up orphaned notification
      await db.scheduledNotifications.update(notification.id, { sent: true });
      continue;
    }

    try {
      await fireLocalNotification(item.title, {
        body: item.description || formatPreAlertBody(notification.preAlertMinutes),
        tag: `reminder-${item.id}`,
        data: { itemId: item.id, url: `/reminders/${item.id}` },
      });
      fired++;
    } catch {
      // Notification permission may have been revoked
    }

    await db.scheduledNotifications.update(notification.id, { sent: true });
  }

  return fired;
}

async function fireLocalNotification(
  title: string,
  options: NotificationOptions & { data?: Record<string, string> }
): Promise<void> {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  // Use service worker registration if available for better UX
  const reg = await navigator.serviceWorker?.ready;
  if (reg) {
    await reg.showNotification(title, {
      icon: "/icon-192x192.png",
      badge: "/badge.png",
      ...options,
    });
  } else {
    new Notification(title, options);
  }
}

function formatPreAlertBody(minutes: number): string {
  if (minutes === 0) return "Reminder is due now";
  if (minutes < 60) return `Reminder in ${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Reminder in ${hours} hour${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `Reminder in ${days} day${days > 1 ? "s" : ""}`;
}
