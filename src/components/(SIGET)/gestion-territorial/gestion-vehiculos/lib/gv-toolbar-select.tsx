"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
} from "./gv-header-ui";

const contentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:border-zinc-700 dark:bg-zinc-900";

const itemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50/40 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-sky-950/20";

const triggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS,
  "h-11 min-h-11 cursor-pointer px-3 data-[size=default]:h-11",
);

export function GvToolbarSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  triggerClassName,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
}) {
  return (
    <div className={cn("min-w-0 w-full shrink-0 sm:w-[11.5rem]", className)}>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger
          className={cn(triggerClass, triggerClassName)}
          aria-label={ariaLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className={contentClass}>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} textValue={opt.label} className={itemClass}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
