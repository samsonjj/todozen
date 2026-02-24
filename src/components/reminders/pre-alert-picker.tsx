"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PreAlertPickerProps {
  value: number[];
  onChange: (value: number[]) => void;
}

const PRE_ALERT_OPTIONS = [
  { label: "At time", value: 0 },
  { label: "5 min before", value: 5 },
  { label: "15 min before", value: 15 },
  { label: "30 min before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
] as const;

export function PreAlertPicker({ value, onChange }: PreAlertPickerProps) {
  const toggle = (minutes: number) => {
    if (value.includes(minutes)) {
      onChange(value.filter((v) => v !== minutes));
    } else {
      onChange([...value, minutes].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-2">
      <Label>Alert times</Label>
      <div className="flex flex-wrap gap-2">
        {PRE_ALERT_OPTIONS.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Badge
              key={option.value}
              variant={selected ? "default" : "outline"}
              className={cn("cursor-pointer select-none", selected && "bg-primary")}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
