"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GV_MENU_OPTIONS } from "./menu-options";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

const triggerClass =
  "h-10 w-[10.5rem] cursor-pointer rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-none transition-colors focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 data-[size=default]:h-10 dark:border-zinc-700 dark:bg-zinc-900 sm:w-[11.5rem]";

const contentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-card p-1 opacity-100 shadow-lg dark:border-zinc-700 dark:bg-zinc-900";

const itemClass =
  "cursor-pointer rounded-lg bg-card font-medium text-foreground focus:bg-sky-50/40 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-sky-950/20";

function GvSectionSelectPlaceholder({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <div
      className={cn(triggerClass, className, "flex items-center justify-between gap-2")}
      aria-hidden
    >
      <span className="truncate">{label}</span>
      <ChevronDown className="size-4 shrink-0 opacity-50" />
    </div>
  );
}

export function GvSectionSelect({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const gvSection = useGvSection();
  const current = gvSection?.section ?? "flota";
  const currentTitle =
    GV_MENU_OPTIONS.find((opt) => opt.id === current)?.title ?? "Área";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <GvSectionSelectPlaceholder className={className} label={currentTitle} />;
  }

  return (
    <Select
      value={current}
      onValueChange={(value) => gvSection?.selectSection(value as GvSubmoduloId)}
    >
      <SelectTrigger className={cn(triggerClass, className)} aria-label="Área de gestión vehicular">
        <SelectValue placeholder="Área" />
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
        className={contentClass}
      >
        {GV_MENU_OPTIONS.map((opt) => (
          <SelectItem key={opt.id} value={opt.id} className={itemClass}>
            {opt.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
