"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RECURRENCE_PRESETS } from "@/lib/models/recurrence";
import { useState } from "react";

interface RecurrencePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const NONE_VALUE = "__none__";
const CUSTOM_VALUE = "__custom__";

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const [isCustom, setIsCustom] = useState(
    () => value !== null && !RECURRENCE_PRESETS.some((p) => p.value === value)
  );

  const selectValue = isCustom
    ? CUSTOM_VALUE
    : value === null
      ? NONE_VALUE
      : value;

  return (
    <div className="space-y-2">
      <Label>Recurrence</Label>
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === CUSTOM_VALUE) {
            setIsCustom(true);
            onChange(value || "FREQ=DAILY;INTERVAL=1");
          } else if (v === NONE_VALUE) {
            setIsCustom(false);
            onChange(null);
          } else {
            setIsCustom(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select recurrence" />
        </SelectTrigger>
        <SelectContent>
          {RECURRENCE_PRESETS.map((preset) => (
            <SelectItem
              key={preset.value ?? NONE_VALUE}
              value={preset.value ?? NONE_VALUE}
            >
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_VALUE}>Custom RRULE...</SelectItem>
        </SelectContent>
      </Select>
      {isCustom && (
        <Input
          placeholder="e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      )}
    </div>
  );
}
