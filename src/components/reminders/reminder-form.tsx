"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatetimePicker } from "@/components/reminders/datetime-picker";
import { RecurrencePicker } from "@/components/reminders/recurrence-picker";
import { PreAlertPicker } from "@/components/reminders/pre-alert-picker";
import { createReminderItem, type ReminderItem } from "@/lib/models/item";
import { createItem, updateItem, getItem } from "@/lib/db/repositories/item-repository";
import { scheduleNotificationsForReminder } from "@/lib/services/notification-scheduler";
import { getUserTimezone } from "@/lib/utils/dates";

interface ReminderFormProps {
  reminder?: ReminderItem;
}

export function ReminderForm({ reminder }: ReminderFormProps) {
  const router = useRouter();
  const isEditing = !!reminder;

  const [title, setTitle] = useState(reminder?.title ?? "");
  const [description, setDescription] = useState(reminder?.description ?? "");
  const [datetime, setDatetime] = useState(
    reminder?.data.datetime ?? new Date().toISOString()
  );
  const [rrule, setRrule] = useState<string | null>(
    reminder?.data.rrule ?? null
  );
  const [preAlerts, setPreAlerts] = useState<number[]>(
    reminder?.data.preAlerts ?? [0]
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (isEditing && reminder) {
        await updateItem(reminder.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          data: {
            ...reminder.data,
            datetime,
            rrule,
            preAlerts,
          },
        });
        const updated = await getItem(reminder.id);
        if (updated) {
          await scheduleNotificationsForReminder(updated as unknown as ReminderItem);
        }
        toast.success("Reminder updated");
        router.push(`/reminders/${reminder.id}`);
      } else {
        const item = createReminderItem({
          title: title.trim(),
          description: description.trim() || undefined,
          datetime,
          rrule,
          preAlerts,
          timezone: getUserTimezone(),
        });
        await createItem(item);
        await scheduleNotificationsForReminder(item);
        toast.success("Reminder created");
        router.push("/reminders");
      }
    } catch {
      toast.error("Failed to save reminder");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Take medication"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Additional details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <DatetimePicker value={datetime} onChange={setDatetime} />
      <RecurrencePicker value={rrule} onChange={setRrule} />
      <PreAlertPicker value={preAlerts} onChange={setPreAlerts} />

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving ? "Saving..." : isEditing ? "Update" : "Create"} Reminder
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
