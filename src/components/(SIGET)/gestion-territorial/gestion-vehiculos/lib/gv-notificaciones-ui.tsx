"use client";

import { type ReactNode } from "react";
import { Bell, BellRing } from "lucide";
import { GvMorphIcon } from "./morph-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function GvNotificacionesCampana({
  open,
  onOpenChange,
  showBadge,
  badgeCount = 0,
  badgeTone = "warn",
  ariaLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showBadge: boolean;
  badgeCount?: number;
  badgeTone?: "warn" | "critical";
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          aria-label={ariaLabel}
        >
          <GvMorphIcon icon={Bell} hoverIcon={BellRing} size={20} />
          {showBadge && badgeCount > 0 ? (
            <span
              className={cn(
                "absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1 py-0.5 text-[9px] font-black text-white",
                badgeTone === "critical" ? "bg-red-600" : "bg-amber-500",
              )}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-[200] w-[min(100vw-2rem,24rem)] border border-border bg-white p-0 opacity-100 shadow-lg dark:bg-zinc-900"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GvNotificacionItem({
  children,
  tone = "warn",
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  tone?: "warn" | "critical";
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const surfaceClass = cn(
    "flex w-full items-start gap-3 px-4 py-3 text-left",
    tone === "critical" ? "bg-red-50/30 dark:bg-red-950/10" : undefined,
    onClick &&
      "cursor-pointer transition-colors hover:bg-zinc-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/40 dark:hover:bg-zinc-800/80",
  );

  return (
    <li className="border-b border-border last:border-0 dark:border-zinc-800">
      {onClick ? (
        <button type="button" className={surfaceClass} onClick={onClick} aria-label={ariaLabel}>
          {children}
        </button>
      ) : (
        <div className={surfaceClass}>{children}</div>
      )}
    </li>
  );
}
