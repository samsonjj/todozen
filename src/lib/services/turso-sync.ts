"use server";

import { eq } from "drizzle-orm";
import { getTursoDB } from "@/lib/db/turso";
import { items, scheduledNotifications } from "@/lib/db/schema";
import type { ItemBase } from "@/lib/models/item";
import type { ScheduledNotification } from "@/lib/models/notification";

export async function syncItemToTurso(item: ItemBase): Promise<void> {
  try {
    const db = getTursoDB();
    await db
      .insert(items)
      .values({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description ?? null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt ?? null,
        syncVersion: item.syncVersion,
        tags: JSON.stringify(item.tags),
        data: JSON.stringify(item.data),
      })
      .onConflictDoUpdate({
        target: items.id,
        set: {
          title: item.title,
          description: item.description ?? null,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt ?? null,
          syncVersion: item.syncVersion,
          tags: JSON.stringify(item.tags),
          data: JSON.stringify(item.data),
        },
      });
  } catch (error) {
    console.error("Failed to sync item to Turso:", error);
  }
}

export async function syncNotificationToTurso(
  notification: ScheduledNotification
): Promise<void> {
  try {
    const db = getTursoDB();
    await db
      .insert(scheduledNotifications)
      .values({
        id: notification.id,
        itemId: notification.itemId,
        scheduledFor: notification.scheduledFor,
        preAlertMinutes: notification.preAlertMinutes,
        sent: notification.sent,
        createdAt: notification.createdAt,
      })
      .onConflictDoUpdate({
        target: scheduledNotifications.id,
        set: {
          scheduledFor: notification.scheduledFor,
          sent: notification.sent,
        },
      });
  } catch (error) {
    console.error("Failed to sync notification to Turso:", error);
  }
}

export async function deleteItemFromTurso(id: string): Promise<void> {
  try {
    const db = getTursoDB();
    await db.delete(items).where(eq(items.id, id));
  } catch (error) {
    console.error("Failed to delete item from Turso:", error);
  }
}
