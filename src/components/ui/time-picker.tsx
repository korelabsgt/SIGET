"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TimePickerProps = {
  value: string;
  onChange: (hhmm: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string;
  stepMinutes?: number;
};

type Meridiem = "AM" | "PM";

const FIELD_CLASS =
  "h-10 min-w-0 rounded-md border border-input bg-white px-1 text-center text-sm font-semibold tabular-nums text-[#2c5f9b] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:text-[#6f9fd4]";

const TIME_SEGMENT_CLASS =
  "min-w-0 w-full flex-1 basis-0 sm:max-w-[3.25rem] sm:flex-none sm:basis-auto";

const MERIDIEM_WRAP_CLASS = "flex min-w-0 flex-1 basis-0 sm:flex-1 sm:basis-auto";

const MERIDIEM_TRIGGER_CLASS =
  "h-10 !min-h-10 w-full min-w-0 justify-center gap-1 border-input bg-white px-1.5 font-semibold text-[#2c5f9b] shadow-xs dark:bg-zinc-950 dark:text-[#6f9fd4] sm:min-w-[4.25rem] *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:justify-center *:data-[slot=select-value]:text-center [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:opacity-60";

const MERIDIEM_CONTENT_CLASS =
  "z-[300] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900 [&_[data-radix-select-viewport]]:!h-auto [&_[data-radix-select-viewport]]:p-0 [&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden";

const MERIDIEM_ITEM_CLASS =
  "justify-center px-2 py-2 font-semibold text-[#2c5f9b] focus:bg-sky-50 dark:text-[#6f9fd4] dark:focus:bg-zinc-800 [&_[data-slot=select-item-indicator]]:hidden";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseHhmm24(value: string): { hour: number; minute: number } | null {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function from24h(hhmm: string): { hour12: number; minute: number; meridiem: Meridiem } | null {
  const parsed = parseHhmm24(hhmm);
  if (!parsed) return null;
  const meridiem: Meridiem = parsed.hour >= 12 ? "PM" : "AM";
  let hour12 = parsed.hour % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: parsed.minute, meridiem };
}

function to24h(hour12: number, minute: number, meridiem: Meridiem): string {
  let hour = hour12 % 12;
  if (meridiem === "PM") hour += 12;
  return `${pad2(hour)}:${pad2(minute)}`;
}

function digitsOnly(raw: string, maxLen: number): string {
  return raw.replace(/\D/g, "").slice(0, maxLen);
}

function clampHour12(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 12) return 12;
  return n;
}

function clampMinute(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 59) return 59;
  return n;
}

export function TimePicker({
  value,
  onChange,
  disabled,
  className,
}: TimePickerProps) {
  const [hourText, setHourText] = React.useState("");
  const [minuteText, setMinuteText] = React.useState("");
  const [meridiem, setMeridiem] = React.useState<Meridiem>("AM");

  React.useEffect(() => {
    const parts = from24h(value);
    if (!parts) {
      setHourText("");
      setMinuteText("");
      setMeridiem("AM");
      return;
    }
    setHourText(String(parts.hour12));
    setMinuteText(pad2(parts.minute));
    setMeridiem(parts.meridiem);
  }, [value]);

  const emitIfComplete = React.useCallback(
    (hText: string, mText: string, md: Meridiem) => {
      const h12 = clampHour12(hText);
      const m = clampMinute(mText);
      if (h12 === null || m === null) return;
      onChange(to24h(h12, m, md));
    },
    [onChange],
  );

  const onHourBlur = () => {
    const h12 = clampHour12(hourText);
    const m = clampMinute(minuteText);
    if (h12 !== null) setHourText(String(h12));
    if (m !== null) setMinuteText(pad2(m));
    if (h12 !== null && m !== null) onChange(to24h(h12, m, meridiem));
  };

  const onMinuteBlur = () => {
    const h12 = clampHour12(hourText);
    const m = clampMinute(minuteText);
    if (h12 !== null) setHourText(String(h12));
    if (m !== null) setMinuteText(pad2(m));
    if (h12 !== null && m !== null) onChange(to24h(h12, m, meridiem));
  };

  const onMeridiemChange = (next: Meridiem) => {
    setMeridiem(next);
    emitIfComplete(hourText, minuteText, next);
  };

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[15.5rem] items-center justify-center gap-1.5 sm:max-w-none sm:gap-2",
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-label="Hora"
          placeholder="hh"
          maxLength={2}
          value={hourText}
          onChange={(e) => setHourText(digitsOnly(e.target.value, 2))}
          onBlur={onHourBlur}
          className={cn(FIELD_CLASS, TIME_SEGMENT_CLASS)}
        />
        <span className="shrink-0 text-sm font-bold text-muted-foreground">:</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-label="Minutos"
          placeholder="mm"
          maxLength={2}
          value={minuteText}
          onChange={(e) => setMinuteText(digitsOnly(e.target.value, 2))}
          onBlur={onMinuteBlur}
          className={cn(FIELD_CLASS, TIME_SEGMENT_CLASS)}
        />
        <div className={MERIDIEM_WRAP_CLASS}>
          <Select
            value={meridiem}
            onValueChange={(v) => onMeridiemChange(v as Meridiem)}
            disabled={disabled}
          >
            <SelectTrigger className={MERIDIEM_TRIGGER_CLASS} aria-label="AM o PM">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className={MERIDIEM_CONTENT_CLASS}>
              <SelectItem value="AM" className={MERIDIEM_ITEM_CLASS}>
                AM
              </SelectItem>
              <SelectItem value="PM" className={MERIDIEM_ITEM_CLASS}>
                PM
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
