import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your upcoming reminders</p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <Bell className="h-12 w-12 text-muted-foreground/50" />
        <div className="space-y-1">
          <p className="font-medium">No upcoming reminders</p>
          <p className="text-sm text-muted-foreground">
            Create your first reminder to get started
          </p>
        </div>
        <Button asChild>
          <Link href="/reminders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Reminder
          </Link>
        </Button>
      </div>
    </div>
  );
}
