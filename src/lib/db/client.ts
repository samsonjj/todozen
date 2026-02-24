import Dexie, { type EntityTable } from "dexie";
import type { ItemBase } from "@/lib/models/item";
import type { ScheduledNotification } from "@/lib/models/notification";

class TodozenDB extends Dexie {
  items!: EntityTable<ItemBase, "id">;
  scheduledNotifications!: EntityTable<ScheduledNotification, "id">;

  constructor() {
    super("todozen");

    this.version(1).stores({
      items: "id, type, createdAt, updatedAt, deletedAt, syncVersion, *tags",
      scheduledNotifications: "id, itemId, scheduledFor, sent, createdAt",
    });
  }
}

export const db = new TodozenDB();
