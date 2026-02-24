"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/client";
import type { ReminderItem } from "@/lib/models/item";

export function useReminders() {
  return useLiveQuery(async () => {
    const items = await db.items
      .where("type")
      .equals("reminder")
      .filter((item) => !item.deletedAt)
      .toArray();
    return items as unknown as ReminderItem[];
  }, []);
}

export function useActiveReminders() {
  return useLiveQuery(async () => {
    const items = await db.items
      .where("type")
      .equals("reminder")
      .filter(
        (item) =>
          !item.deletedAt &&
          (item.data as { isActive?: boolean }).isActive !== false
      )
      .toArray();
    return items as unknown as ReminderItem[];
  }, []);
}
