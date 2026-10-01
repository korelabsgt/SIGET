"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GV_MENU_OPTIONS } from "./menu-options";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

const wrapClass =
  "min-w-0 w-full flex-1 sm:w-[11.5rem] sm:flex-none sm:shrink-0";

const triggerValueClass =
  "max-md:!text-3xl max-md:!leading-none sm:!text-base sm:!leading-snug";

const triggerClass =
  "w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card px-3 font-semibold text-foreground shadow-none transition-colors focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 data-[size=default]:!h-10 dark:border-zinc-700 dark:bg-zinc-900 max-md:!h-10 max-md:min-h-10 max-md:py-0 max-md:[&_svg]:!size-5 sm:!h-10 sm:!text-base sm:leading-snug";

const contentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-card p-1 opacity-100 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 max-md:p-2 max-md:[&>div:nth-child(2)]:!h-auto max-md:[&>div:nth-child(2)]:max-h-[min(70dvh,28rem)]";

const itemClass =
  "cursor-pointer rounded-lg bg-card font-medium text-foreground focus:bg-sky-50/40 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-sky-950/20 max-md:!text-3xl max-md:leading-tight max-md:py-3 max-md:pl-3 max-md:pr-12 max-md:[&_svg]:!size-6 md:text-sm md:py-1.5";

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
      <span className={cn("truncate", triggerValueClass)}>{label}</span>
      <ChevronDown className="size-4 shrink-0 opacity-50 max-md:size-5" />
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
    return (
      <div className={wrapClass}>
        <GvSectionSelectPlaceholder className={className} label={currentTitle} />
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <Select
        value={current}
        onValueChange={(value) => gvSection?.selectSection(value as GvSubmoduloId)}
      >
        <SelectTrigger
          className={cn(triggerClass, className)}
          aria-label={`Área de gestión vehicular: ${currentTitle}`}
        >
          <span className={cn("min-w-0 flex-1 truncate text-left", triggerValueClass)}>
            {currentTitle}
          </span>
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
    </div>
  );
}
