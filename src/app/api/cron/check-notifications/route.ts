import { NextRequest, NextResponse } from "next/server";
import { lte, eq, and } from "drizzle-orm";
import { getTursoDB } from "@/lib/db/turso";
import { scheduledNotifications, items } from "@/lib/db/schema";
import { sendPushToAll } from "@/app/actions/push";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getTursoDB();
    const now = new Date().toISOString();

    // Find due, unsent notifications
    const dueNotifications = await db
      .select({
        notificationId: scheduledNotifications.id,
        itemId: scheduledNotifications.itemId,
        preAlertMinutes: scheduledNotifications.preAlertMinutes,
        title: items.title,
        description: items.description,
      })
      .from(scheduledNotifications)
      .innerJoin(items, eq(scheduledNotifications.itemId, items.id))
      .where(
        and(
          lte(scheduledNotifications.scheduledFor, now),
          eq(scheduledNotifications.sent, false)
        )
      );

    let totalSent = 0;

    for (const notif of dueNotifications) {
      const body =
        notif.description ||
        (notif.preAlertMinutes === 0
          ? "Reminder is due now"
          : `Reminder in ${notif.preAlertMinutes} minutes`);

      const result = await sendPushToAll({
        title: notif.title,
        body,
        tag: `reminder-${notif.itemId}`,
        data: {
          itemId: notif.itemId,
          url: `/reminders/${notif.itemId}`,
        },
      });

      totalSent += result.sent;

      // Mark as sent
      await db
        .update(scheduledNotifications)
        .set({ sent: true })
        .where(eq(scheduledNotifications.id, notif.notificationId));
    }

    return NextResponse.json({
      checked: dueNotifications.length,
      sent: totalSent,
      timestamp: now,
    });
  } catch (error) {
    console.error("Cron check-notifications failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
