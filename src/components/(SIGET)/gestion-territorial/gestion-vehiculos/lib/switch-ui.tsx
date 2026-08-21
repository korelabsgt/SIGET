"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  type MouseEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type GvSwitchTone = "default" | "danger" | "amber";

const GvSwitchLayoutContext = createContext<string | undefined>(undefined);

const switchBoxBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-0 font-bold whitespace-nowrap transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

const switchSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.75,
};

function switchBoxClasses(active: boolean, tone: GvSwitchTone) {
  if (tone === "danger") {
    return active
      ? "bg-red-50/90 text-red-700 dark:bg-red-950/35 dark:text-red-400"
      : "bg-red-50/50 text-red-600 hover:bg-red-50/75 dark:bg-red-950/20 dark:hover:bg-red-950/30";
  }

  if (tone === "amber") {
    return active
      ? "bg-amber-50/90 text-amber-800 dark:bg-amber-950/35 dark:text-amber-300"
      : "bg-sky-50/50 text-muted-foreground hover:bg-sky-50/75 hover:text-azul-trifinio dark:bg-sky-950/20 dark:hover:bg-sky-950/30 dark:hover:text-celeste-trifinio";
  }

  return active
    ? "bg-sky-50/90 text-azul-trifinio dark:bg-sky-950/35 dark:text-celeste-trifinio"
    : "bg-sky-50/50 text-muted-foreground hover:bg-sky-50/75 hover:text-azul-trifinio dark:bg-sky-950/20 dark:hover:bg-sky-950/30 dark:hover:text-celeste-trifinio";
}

function switchLineBg(active: boolean, tone: GvSwitchTone) {
  if (!active) return "bg-transparent";
  if (tone === "danger") return "bg-red-600 dark:bg-red-500";
  if (tone === "amber") return "bg-amber-500 dark:bg-amber-400";
  return "bg-azul-trifinio dark:bg-celeste-trifinio";
}

function SwitchIndicator({ active, tone }: { active: boolean; tone: GvSwitchTone }) {
  const layoutId = useContext(GvSwitchLayoutContext);
  const prefersReducedMotion = useReducedMotion();
  const lineBg = switchLineBg(active, tone);

  if (layoutId && !prefersReducedMotion) {
    return (
      <span aria-hidden className="relative block h-0.5 w-full shrink-0">
        {active ? (
          <motion.span
            layoutId={layoutId}
            className={cn(
              "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-colors duration-300 ease-out motion-reduce:transition-none",
              lineBg,
            )}
            transition={switchSpring}
          />
        ) : null}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "block h-0.5 w-full shrink-0 origin-center rounded-full transition-[transform,opacity,background-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
        active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
        lineBg,
      )}
    />
  );
}

export function GvSwitchGroup({
  children,
  className,
  layoutId,
}: {
  children: ReactNode;
  className?: string;
  layoutId?: string;
}) {
  return (
    <GvSwitchLayoutContext.Provider value={layoutId}>
      <div className={cn("flex flex-wrap items-end gap-2", className)}>{children}</div>
    </GvSwitchLayoutContext.Provider>
  );
}

export function GvSwitchItem({
  active,
  onClick,
  children,
  className,
  tone = "default",
  size = "md",
  type = "button",
  "aria-pressed": ariaPressed,
  title,
}: {
  active: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  tone?: GvSwitchTone;
  size?: "md" | "sm";
  type?: "button";
  "aria-pressed"?: boolean;
  title?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "px-3 py-2 text-xs uppercase tracking-wider"
      : "px-4 py-2.5 text-sm";

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <button
        type={type}
        onClick={onClick}
        aria-pressed={ariaPressed ?? active}
        title={title}
        className={cn(
          switchBoxBase,
          sizeClass,
          switchBoxClasses(active, tone),
          "hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
      >
        {children}
      </button>
      <SwitchIndicator active={active} tone={tone} />
    </div>
  );
}

export function GvSwitchLink({
  active,
  href,
  children,
  className,
  onHoverIntent,
  onClick,
  prefetch = true,
}: {
  active: boolean;
  href: string;
  children: ReactNode;
  className?: string;
  onHoverIntent?: () => void;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  prefetch?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Link
        href={href}
        prefetch={prefetch}
        aria-current={active ? "page" : undefined}
        onMouseEnter={onHoverIntent}
        onFocus={onHoverIntent}
        onClick={onClick}
        className={cn(
          switchBoxBase,
          "px-4 py-2.5 text-sm",
          switchBoxClasses(active, "default"),
          "hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
      >
        {children}
      </Link>
      <SwitchIndicator active={active} tone="default" />
    </div>
  );
}
