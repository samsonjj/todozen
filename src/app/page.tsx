"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { useActiveReminders } from "@/lib/hooks/use-reminders";
import { getNextReminderDate } from "@/lib/services/recurrence-engine";

export default function HomePage() {
  const reminders = useActiveReminders();

  const upcoming = useMemo(() => {
    if (!reminders) return undefined;
    return reminders
      .map((r) => ({ reminder: r, next: getNextReminderDate(r) }))
      .filter((r) => r.next !== null)
      .sort((a, b) => a.next!.getTime() - b.next!.getTime())
      .slice(0, 5)
      .map((r) => r.reminder);
  }, [reminders]);

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your upcoming reminders</p>
      </div>

      <InstallPrompt />

      {upcoming === undefined && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {upcoming && upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Up Next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </CardContent>
        </Card>
      )}

      {upcoming && upcoming.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="font-medium">No upcoming reminders</p>
            <p className="text-sm text-muted-foreground">
              Create your first reminder to get started
            </p>
          </div>
          <Button asChild>
            <Link href="/reminders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Reminder
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
