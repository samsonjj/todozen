"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bell, CalendarClock, Clock, Repeat } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReminderItem } from "@/lib/models/item";
import { formatDateTime, formatRelative } from "@/lib/utils/dates";
import { describeRecurrence } from "@/lib/models/recurrence";
import { getNextReminderDate } from "@/lib/services/recurrence-engine";

interface ReminderCardProps {
  reminder: ReminderItem;
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const { data } = reminder;
  const isPast = new Date(data.datetime) < new Date();

  const nextDate = useMemo(() => getNextReminderDate(reminder), [reminder]);

  return (
    <Link href={`/reminders/${reminder.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium truncate">{reminder.title}</span>
            </div>
            {!data.isActive && (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>

          {reminder.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {reminder.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(data.datetime)}
            </span>
            {isPast && !data.rrule && (
              <Badge variant="outline" className="text-xs">
                {formatRelative(data.datetime)}
              </Badge>
            )}
            {data.rrule && (
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                {describeRecurrence(data.rrule)}
              </span>
            )}
            {nextDate && (
              <span className="flex items-center gap-1 text-foreground">
                <CalendarClock className="h-3 w-3" />
                Next: {formatRelative(nextDate.toISOString())}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
