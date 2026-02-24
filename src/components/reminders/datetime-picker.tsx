"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toLocalISOString } from "@/lib/utils/dates";

interface DatetimePickerProps {
  value: string; // ISO 8601 string
  onChange: (value: string) => void;
}

export function DatetimePicker({ value, onChange }: DatetimePickerProps) {
  const localValue = value ? toLocalISOString(new Date(value)) : "";

  return (
    <div className="space-y-2">
      <Label htmlFor="datetime">Date & Time</Label>
      <Input
        id="datetime"
        type="datetime-local"
        value={localValue}
        onChange={(e) => {
          if (e.target.value) {
            onChange(new Date(e.target.value).toISOString());
          }
        }}
      />
    </div>
  );
}
