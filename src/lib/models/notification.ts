// --- Scheduled Notification ---

export interface ScheduledNotification {
  id: string; // UUIDv7
  itemId: string; // references Item.id
  scheduledFor: string; // ISO 8601 — when to fire
  preAlertMinutes: number; // 0 = at time, 15 = 15 min before, etc.
  sent: boolean;
  createdAt: string; // ISO 8601
}

// --- Push Notification Payload ---

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string; // group notifications by item
  data?: {
    itemId: string;
    url: string; // deep-link target
  };
  actions?: PushAction[];
}

export interface PushAction {
  action: string;
  title: string;
}

// --- Push Subscription (server-side storage) ---

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}
