"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PushManager } from "@/components/pwa/push-manager";

export default function SettingsPage() {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled");
    } else if (result === "denied") {
      toast.error("Notifications blocked. Please enable them in browser settings.");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notifPermission === "granted" ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
            Notifications
          </CardTitle>
          <CardDescription>
            Allow Todozen to send you reminder notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Status:{" "}
              {notifPermission === "granted" && "Enabled"}
              {notifPermission === "denied" && "Blocked"}
              {notifPermission === "default" && "Not yet requested"}
              {notifPermission === "unsupported" && "Not supported"}
            </span>
            {notifPermission !== "granted" && notifPermission !== "unsupported" && (
              <Button size="sm" onClick={requestPermission}>
                Enable
              </Button>
            )}
          </div>
          {notifPermission === "denied" && (
            <p className="text-xs text-muted-foreground">
              To re-enable, update notification permissions in your browser settings.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Receive reminders even when Todozen is closed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushManager />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todozen — Life organization with smart reminders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
