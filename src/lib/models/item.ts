import { v7 as uuidv7 } from "uuid";

// --- Item Types ---

export const ITEM_TYPES = ["reminder", "todo", "note", "event", "habit", "goal"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

// --- Type-specific data payloads ---

export interface ReminderData {
  datetime: string; // ISO 8601
  rrule: string | null; // RFC 5545 RRULE string, null = one-time
  preAlerts: number[]; // offset minutes before event, e.g. [0, 15, 60]
  isActive: boolean;
  lastTriggered?: string; // ISO 8601
  timezone: string; // IANA timezone, e.g. "America/New_York"
}

// Stubs for future item types
export interface TodoData {
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
}

export interface NoteData {
  body: string;
}

export interface EventData {
  startDate: string;
  endDate: string;
  location?: string;
}

export interface HabitData {
  frequency: string;
  streak: number;
}

export interface GoalData {
  targetDate?: string;
  progress: number;
}

// --- Discriminated union map ---

export interface ItemDataMap {
  reminder: ReminderData;
  todo: TodoData;
  note: NoteData;
  event: EventData;
  habit: HabitData;
  goal: GoalData;
}

// --- Base Item ---

export interface ItemBase {
  id: string; // UUIDv7 (time-sortable)
  type: ItemType;
  title: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string; // soft delete
  syncVersion: number; // for future sync
  tags: string[];
  data: ItemDataMap[ItemType];
}

// --- Typed Item (discriminated union) ---

export type Item<T extends ItemType = ItemType> = ItemBase & {
  type: T;
  data: ItemDataMap[T];
};

export type ReminderItem = Item<"reminder">;

// --- Factory helpers ---

export function createItemId(): string {
  return uuidv7();
}

export function createReminderItem(
  fields: Pick<ItemBase, "title"> &
    Partial<Pick<ItemBase, "description" | "tags">> &
    Omit<ReminderData, "isActive" | "lastTriggered">
): ReminderItem {
  const now = new Date().toISOString();
  return {
    id: createItemId(),
    type: "reminder",
    title: fields.title,
    description: fields.description,
    createdAt: now,
    updatedAt: now,
    syncVersion: 0,
    tags: fields.tags ?? [],
    data: {
      datetime: fields.datetime,
      rrule: fields.rrule,
      preAlerts: fields.preAlerts,
      isActive: true,
      timezone: fields.timezone,
    },
  };
}
