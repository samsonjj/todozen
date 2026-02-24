"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Clock, Edit, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db/client";
import { softDeleteItem, updateItem } from "@/lib/db/repositories/item-repository";
import type { ReminderItem } from "@/lib/models/item";
import { formatDateTime } from "@/lib/utils/dates";
import { describeRecurrence } from "@/lib/models/recurrence";

export default function ReminderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

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

  const { data } = reminder;

  const handleDelete = async () => {
    await softDeleteItem(id);
    toast.success("Reminder deleted");
    router.push("/reminders");
  };

  const handleToggleActive = async () => {
    await updateItem(id, {
      data: { ...data, isActive: !data.isActive },
    });
    toast.success(data.isActive ? "Reminder paused" : "Reminder activated");
  };

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/reminders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{reminder.title}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/reminders/${id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reminder.description && (
            <p className="text-muted-foreground">{reminder.description}</p>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(data.datetime)}</span>
            </div>

            {data.rrule && (
              <div className="flex items-center gap-2 text-sm">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span>{describeRecurrence(data.rrule)}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Alerts:</span>
              <div className="flex gap-1">
                {data.preAlerts.map((minutes) => (
                  <Badge key={minutes} variant="outline">
                    {minutes === 0 ? "At time" : `${minutes}m before`}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
              >
                {data.isActive ? "Active" : "Paused"} — tap to{" "}
                {data.isActive ? "pause" : "activate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
