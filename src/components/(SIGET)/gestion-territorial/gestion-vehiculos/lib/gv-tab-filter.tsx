"use client";

import { cn } from "@/lib/utils";
import { GvSwitchGroup, GvSwitchItem, type GvSwitchTone } from "./switch-ui";

export const GV_TAB_FILTER_SCROLL_CLASS =
  "overflow-x-auto overscroll-x-contain [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export type GvTabOption<T extends string> = {
  value: T;
  label: string;
  tone?: GvSwitchTone;
};

export function GvTabFilter<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  fill = true,
  compact = false,
  className,
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
  const scrollable = !fill;

  return (
    <div
      className={cn(
        "min-w-0 w-full max-w-full",
        scrollable && GV_TAB_FILTER_SCROLL_CLASS,
        className,
      )}
    >
      <GvSwitchGroup
        layoutId={layoutId}
        variant="tabs"
        className={scrollable ? "inline-flex w-max min-w-0" : "w-full"}
      >
        {options.map((option) => (
          <GvSwitchItem
            key={option.value}
            active={value === option.value}
            onClick={() => onChange(option.value)}
            size={compact ? "sm" : "md"}
            fill={fill}
            tone={option.tone ?? "default"}
          >
            {option.label}
          </GvSwitchItem>
        ))}
      </GvSwitchGroup>
    </div>
  );
}
