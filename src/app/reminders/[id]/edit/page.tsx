"use client";

import { use } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { db } from "@/lib/db/client";
import type { ReminderItem } from "@/lib/models/item";

export default function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const reminder = useLiveQuery(async () => {
    const item = await db.items.get(id);
    if (!item || item.deletedAt) return null;
    return item as unknown as ReminderItem;
  }, [id]);

  if (reminder === undefined) {
    return (
      <div className="p-4">
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (reminder === null) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-muted-foreground">Reminder not found.</p>
        <Button variant="outline" asChild>
          <Link href="/reminders">Back to reminders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/reminders/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">Edit Reminder</h1>
      <ReminderForm reminder={reminder} />
    </div>
  );
}
