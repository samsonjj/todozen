import { db } from "@/lib/db/client";
import type { Item, ItemBase, ItemType, ReminderItem } from "@/lib/models/item";

// --- Read ---

export async function getItem(id: string): Promise<ItemBase | undefined> {
  return db.items.get(id);
}

export async function getItemsByType<T extends ItemType>(
  type: T
): Promise<Item<T>[]> {
  const items = await db.items.where("type").equals(type).toArray();
  return items as unknown as Item<T>[];
}

export async function getActiveReminders(): Promise<ReminderItem[]> {
  const items = await db.items
    .where("type")
    .equals("reminder")
    .filter((item) => !item.deletedAt && (item.data as { isActive?: boolean }).isActive !== false)
    .toArray();
  return items as ReminderItem[];
}

export async function getAllReminders(): Promise<ReminderItem[]> {
  const items = await db.items
    .where("type")
    .equals("reminder")
    .filter((item) => !item.deletedAt)
    .toArray();
  return items as ReminderItem[];
}

// --- Write ---

export async function createItem(item: ItemBase): Promise<string> {
  await db.items.add(item);
  return item.id;
}

export async function updateItem(
  id: string,
  changes: Partial<Omit<ItemBase, "id" | "createdAt">>
): Promise<void> {
  await db.items.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function softDeleteItem(id: string): Promise<void> {
  await db.items.update(id, {
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function restoreItem(id: string): Promise<void> {
  await db.items.update(id, {
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function hardDeleteItem(id: string): Promise<void> {
  await db.items.delete(id);
}

// --- Bulk ---

export async function bulkCreateItems(items: ItemBase[]): Promise<void> {
  await db.items.bulkAdd(items);
}
