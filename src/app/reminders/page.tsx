"use client";

import Link from "next/link";
import { Plus, Bell } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { ReminderList } from "@/components/reminders/reminder-list";
import { db } from "@/lib/db/client";

export default function RemindersPage() {
  const count = useLiveQuery(async () => {
    return db.items
      .where("type")
      .equals("reminder")
      .filter((item) => !item.deletedAt)
      .count();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
        <Button size="sm" asChild>
          <Link href="/reminders/new">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      <ReminderList />

      {count === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="font-medium">No reminders yet</p>
            <p className="text-sm text-muted-foreground">
              Create a reminder to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
