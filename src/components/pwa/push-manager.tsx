"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subscribeToPush, unsubscribeFromPush } from "@/app/actions/push";
import { urlBase64ToUint8Array } from "@/lib/utils/vapid";

export function PushManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        // Push not available
      }
      setIsLoading(false);
    }
    check();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribeFromPush(sub.endpoint);
          await sub.unsubscribe();
        }
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          toast.error("Push notifications not configured");
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const json = sub.toJSON();
        const result = await subscribeToPush({
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh ?? "",
            auth: json.keys?.auth ?? "",
          },
        });

        if (result.success) {
          setIsSubscribed(true);
          toast.success("Push notifications enabled");
        } else {
          toast.error("Failed to register push subscription");
        }
      }
    } catch {
      toast.error("Failed to toggle push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">
        Push notifications: {isSubscribed ? "Enabled" : "Disabled"}
      </span>
      <Button size="sm" onClick={handleToggle} disabled={isLoading}>
        {isLoading ? "..." : isSubscribed ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
