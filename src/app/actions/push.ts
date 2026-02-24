"use server";

import { v7 as uuidv7 } from "uuid";
import webPush from "web-push";
import { eq } from "drizzle-orm";
import { getTursoDB } from "@/lib/db/turso";
import { pushSubscriptions } from "@/lib/db/schema";
import type { PushPayload } from "@/lib/models/notification";

// Configure VAPID
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:todozen@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function subscribeToPush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ success: boolean }> {
  try {
    const db = getTursoDB();

    // Upsert: delete existing subscription with same endpoint, then insert
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

    await db.insert(pushSubscriptions).values({
      id: uuidv7(),
      endpoint: subscription.endpoint,
      keysP256dh: subscription.keys.p256dh,
      keysAuth: subscription.keys.auth,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to store push subscription:", error);
    return { success: false };
  }
}

export async function unsubscribeFromPush(
  endpoint: string
): Promise<{ success: boolean }> {
  try {
    const db = getTursoDB();
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    return { success: true };
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    return { success: false };
  }
}

export async function sendPushToAll(
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const db = getTursoDB();
  const subs = await db.select().from(pushSubscriptions);

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keysP256dh,
            auth: sub.keysAuth,
          },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      // Clean up expired/invalid subscriptions (410 Gone)
      if (error && typeof error === "object" && "statusCode" in error) {
        const webPushError = error as { statusCode: number };
        if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }
  }

  // Clean up expired subscriptions
  for (const endpoint of expiredEndpoints) {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  return { sent, failed };
}
