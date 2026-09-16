"use client";

import { Minus, Plus } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";

export function PubMarco({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900",
        className,
      )}
    >
      <div className="bg-[#C59B27] pt-1">
        <div className="bg-white dark:bg-zinc-900">{children}</div>
      </div>
    </div>
  );
}

export function PubContador({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
      <p className="min-w-0 text-sm font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">{label}</p>
      <div className="flex shrink-0 items-center gap-1.5">
        <SigetActionButton
          label="Menos"
          iconOnly
          accentColor={sigetAccent.neutro}
          morphFrom={Minus}
          morphTo={Minus}
          morphOnHover={false}
          onClick={() => onChange(Math.max(0, value - 1))}
          ariaLabel={`Restar ${label}`}
        />
        <span className="w-9 text-center font-mono text-xl font-black tabular-nums text-zinc-900 dark:text-white">
          {value}
        </span>
        <SigetActionButton
          label="Más"
          iconOnly
          accentColor={sigetAccent.crear}
          morphFrom={Plus}
          morphTo={Plus}
          morphOnHover={false}
          onClick={() => onChange(value + 1)}
          ariaLabel={`Sumar ${label}`}
        />
      </div>
    </div>
  );
}
