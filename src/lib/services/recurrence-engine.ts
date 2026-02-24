import type { ReminderItem } from "@/lib/models/item";
import { getNextOccurrence, getNextOccurrences } from "@/lib/models/recurrence";

/**
 * Get the next occurrence date for a reminder.
 * For one-time reminders, returns the datetime if it's in the future.
 * For recurring reminders, computes the next occurrence after now.
 */
export function getNextReminderDate(reminder: ReminderItem): Date | null {
  const { data } = reminder;
  const dtstart = new Date(data.datetime);

  if (!data.rrule) {
    // One-time: return datetime if in the future
    return dtstart > new Date() ? dtstart : null;
  }

  return getNextOccurrence(data.rrule, dtstart);
}

/**
 * Get the next N occurrence dates for a reminder.
 */
export function getUpcomingOccurrences(
  reminder: ReminderItem,
  count: number = 5
): Date[] {
  const { data } = reminder;
  const dtstart = new Date(data.datetime);

  if (!data.rrule) {
    return dtstart > new Date() ? [dtstart] : [];
  }

  return getNextOccurrences(data.rrule, dtstart, count);
}

/**
 * Compute all scheduled notification times for a reminder's upcoming occurrences.
 * Each occurrence generates one notification per preAlert offset.
 */
export function computeNotificationTimes(
  reminder: ReminderItem,
  occurrenceCount: number = 10
): { scheduledFor: Date; preAlertMinutes: number; occurrenceDate: Date }[] {
  const occurrences = getUpcomingOccurrences(reminder, occurrenceCount);
  const now = new Date();
  const results: {
    scheduledFor: Date;
    preAlertMinutes: number;
    occurrenceDate: Date;
  }[] = [];

  for (const occurrence of occurrences) {
    for (const preAlert of reminder.data.preAlerts) {
      const scheduledFor = new Date(
        occurrence.getTime() - preAlert * 60_000
      );
      if (scheduledFor > now) {
        results.push({ scheduledFor, preAlertMinutes: preAlert, occurrenceDate: occurrence });
      }
    }
  }

  return results.sort(
    (a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime()
  );
}
