"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/client";
import { ReminderCard } from "@/components/reminders/reminder-card";
import type { ReminderItem } from "@/lib/models/item";

export function ReminderList() {
  const reminders = useLiveQuery(async () => {
    const items = await db.items
      .where("type")
      .equals("reminder")
      .toArray();
    return items.filter((item) => !item.deletedAt) as unknown as ReminderItem[];
  }, []);

  if (reminders === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (reminders.length === 0) {
    return null;
  }

  // Sort: active first, then by datetime
  const sorted = [...reminders].sort((a, b) => {
    if (a.data.isActive !== b.data.isActive) {
      return a.data.isActive ? -1 : 1;
    }
    return new Date(a.data.datetime).getTime() - new Date(b.data.datetime).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((reminder) => (
        <ReminderCard key={reminder.id} reminder={reminder} />
      ))}
    </div>
  );
}
