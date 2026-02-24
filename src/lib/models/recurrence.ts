import { RRule } from "rrule";

// --- Recurrence Presets ---

export interface RecurrencePreset {
  label: string;
  value: string | null; // RRULE string or null for one-time
  description: string;
}

export const RECURRENCE_PRESETS: RecurrencePreset[] = [
  { label: "One-time", value: null, description: "Does not repeat" },
  {
    label: "Daily",
    value: "FREQ=DAILY;INTERVAL=1",
    description: "Every day",
  },
  {
    label: "Weekdays",
    value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    description: "Monday through Friday",
  },
  {
    label: "Weekly",
    value: "FREQ=WEEKLY;INTERVAL=1",
    description: "Once a week",
  },
  {
    label: "Biweekly",
    value: "FREQ=WEEKLY;INTERVAL=2",
    description: "Every two weeks",
  },
  {
    label: "Monthly",
    value: "FREQ=MONTHLY;INTERVAL=1",
    description: "Once a month",
  },
  {
    label: "Yearly",
    value: "FREQ=YEARLY;INTERVAL=1",
    description: "Once a year",
  },
];

// --- Helpers ---

export function parseRRule(rruleStr: string, dtstart: Date): RRule {
  return RRule.fromString(`DTSTART:${formatDTSTART(dtstart)}\nRRULE:${rruleStr}`);
}

export function getNextOccurrences(
  rruleStr: string,
  dtstart: Date,
  count: number = 5,
  after?: Date
): Date[] {
  const rule = parseRRule(rruleStr, dtstart);
  const start = after ?? new Date();
  return rule.after(start, true) ? rule.between(start, addYears(start, 2), true).slice(0, count) : [];
}

export function getNextOccurrence(
  rruleStr: string,
  dtstart: Date,
  after?: Date
): Date | null {
  const rule = parseRRule(rruleStr, dtstart);
  return rule.after(after ?? new Date(), true);
}

export function describeRecurrence(rruleStr: string | null): string {
  if (!rruleStr) return "One-time";
  const preset = RECURRENCE_PRESETS.find((p) => p.value === rruleStr);
  if (preset) return preset.description;
  try {
    const rule = RRule.fromString(`RRULE:${rruleStr}`);
    return rule.toText();
  } catch {
    return "Custom recurrence";
  }
}

function formatDTSTART(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}
