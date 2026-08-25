"use client";

import { MorphIcon } from "morphicons/react";
import { CircleCheck, CircleOff } from "lucide";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type MorphSwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "plain";
};

export function MorphSwitch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  className,
  disabled = false,
  variant = "default",
}: MorphSwitchProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        variant === "default" &&
          "rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl transition-colors",
            variant === "default" ? "size-10" : "size-8",
            checked
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
              : "bg-zinc-200/80 text-muted-foreground dark:bg-zinc-700",
          )}
        >
          <MorphIcon
            icon={checked ? CircleCheck : CircleOff}
            size={variant === "default" ? 22 : 18}
            strokeWidth={1.75}
            spring="snappy"
          />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
      />
    </div>
  );
}
