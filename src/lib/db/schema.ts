import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Items table (mirrors IndexedDB) ---

export const items = sqliteTable("items", {
  id: text("id").primaryKey(), // UUIDv7
  type: text("type").notNull(), // ItemType discriminator
  title: text("title").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
  syncVersion: integer("sync_version").notNull().default(0),
  tags: text("tags").notNull().default("[]"), // JSON array
  data: text("data").notNull().default("{}"), // JSON payload
});

// --- Scheduled Notifications ---

export const scheduledNotifications = sqliteTable("scheduled_notifications", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  scheduledFor: text("scheduled_for").notNull(),
  preAlertMinutes: integer("pre_alert_minutes").notNull(),
  sent: integer("sent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

// --- Push Subscriptions (server-only) ---

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  keysP256dh: text("keys_p256dh").notNull(),
  keysAuth: text("keys_auth").notNull(),
  createdAt: text("created_at").notNull(),
});
