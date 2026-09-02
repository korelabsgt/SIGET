"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GV_FILTRO_FIELD_CLASS } from "./gv-header-ui";
import { GvSwitchGroup, GvSwitchItem, type GvSwitchTone } from "./switch-ui";

export type GvTabOption<T extends string> = {
  value: T;
  label: string;
  tone?: GvSwitchTone;
};

const selectTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  "cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

const selectContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const selectItemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function GvTabFilter<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  layout = "flex",
  fill = false,
  compact = false,
  className,
  selectClassName,
}: {
  value: T;
  onChange: (value: T) => void;
  options: GvTabOption<T>[];
  layoutId?: string;
  layout?: "flex" | "grid" | "responsive-grid";
  fill?: boolean;
  compact?: boolean;
  className?: string;
  selectClassName?: string;
}) {
  const active = options.find((option) => option.value === value);

  const triggerClass = cn(
    selectTriggerClass,
    compact && "h-9 px-2 text-xs data-[size=default]:h-9",
    selectClassName,
  );

  return (
    <>
      <div className={cn(compact ? "min-w-0 flex-1 basis-0 lg:hidden" : "w-full lg:hidden", className)}>
        <Select value={value} onValueChange={(next) => onChange(next as T)}>
          <SelectTrigger className={triggerClass}>
            <SelectValue>{active?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" className={selectContentClass}>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                textValue={option.label}
                className={selectItemClass}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn("hidden lg:block lg:w-auto", className)}>
        <GvSwitchGroup layoutId={layoutId} layout={layout}>
          {options.map((option) => (
            <GvSwitchItem
              key={option.value}
              active={value === option.value}
              onClick={() => onChange(option.value)}
              size="sm"
              fill={fill}
              tone={option.tone ?? "default"}
            >
              {option.label}
            </GvSwitchItem>
          ))}
        </GvSwitchGroup>
      </div>
    </>
  );
}
