"use client";

import { ReminderForm } from "@/components/reminders/reminder-form";

export default function NewReminderPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">New Reminder</h1>
      <ReminderForm />
    </div>
  );
}
