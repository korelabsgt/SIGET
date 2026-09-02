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
import {
  GV_DANGER_SOFT_SWITCH_ACTIVE_CLASS,
  GV_DANGER_SOFT_SWITCH_INACTIVE_CLASS,
} from "./gv-danger-ui";
import { GV_FILTRO_FIELD_CLASS } from "./gv-header-ui";

export type GvSwitchTone = "default" | "danger" | "amber";
export type GvSwitchVariant = "default" | "field";

const GvSwitchLayoutContext = createContext<string | undefined>(undefined);
const GvSwitchVariantContext = createContext<GvSwitchVariant>("default");

const switchBoxBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-0 font-bold whitespace-nowrap transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

const switchSpring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.75,
};

function switchBoxClasses(active: boolean, tone: GvSwitchTone, variant: GvSwitchVariant) {
  if (variant === "field") {
    if (tone === "danger") {
      return active
        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-transparent text-muted-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60";
    }
    if (tone === "amber") {
      return active
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-transparent text-muted-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60";
    }
    return active
      ? "bg-white text-azul-trifinio shadow-sm dark:bg-zinc-800 dark:text-celeste-trifinio"
      : "bg-transparent text-muted-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60";
  }

  if (tone === "danger") {
    return active ? GV_DANGER_SOFT_SWITCH_ACTIVE_CLASS : GV_DANGER_SOFT_SWITCH_INACTIVE_CLASS;
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
  if (tone === "danger") return "bg-celeste-trifinio dark:bg-celeste-trifinio";
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
  layout = "flex",
  variant = "default",
  columns = 3,
}: {
  children: ReactNode;
  className?: string;
  layoutId?: string;
  layout?: "flex" | "grid" | "responsive-grid";
  variant?: GvSwitchVariant;
  columns?: 3 | 4;
}) {
  const layoutClass =
    variant === "field"
      ? cn(
          "grid h-full w-full gap-0.5",
          columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
        )
      : layout === "grid"
        ? "grid w-full grid-cols-3 items-end gap-1 sm:gap-1.5"
        : layout === "responsive-grid"
          ? "grid w-full grid-cols-3 items-end gap-1 md:flex md:w-auto md:flex-wrap md:gap-2"
          : "flex flex-wrap items-end gap-2";

  const inner = (
    <div className={cn(layoutClass, variant === "field" ? undefined : className)}>
      {children}
    </div>
  );

  return (
    <GvSwitchLayoutContext.Provider value={layoutId}>
      <GvSwitchVariantContext.Provider value={variant}>
        {variant === "field" ? (
          <div className={cn(GV_FILTRO_FIELD_CLASS, "flex items-center p-0.5", className)}>
            {inner}
          </div>
        ) : (
          inner
        )}
      </GvSwitchVariantContext.Provider>
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
  fill = false,
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
  fill?: boolean;
  type?: "button";
  "aria-pressed"?: boolean;
  title?: string;
}) {
  const variant = useContext(GvSwitchVariantContext);
  const sizeClass =
    variant === "field"
      ? "h-full min-h-0 px-1 py-1 text-[8px] font-bold uppercase leading-none tracking-tight sm:text-[9px] sm:tracking-wider"
      : size === "sm"
        ? fill
          ? "w-full min-w-0 gap-0 px-0.5 py-1 text-[8px] font-semibold uppercase leading-none tracking-tight md:w-auto md:gap-2 md:px-3 md:py-2 md:text-xs md:font-bold md:leading-normal md:tracking-wider"
          : "px-3 py-2 text-xs uppercase tracking-wider"
        : fill
          ? "w-full min-w-0 px-2 py-2.5 text-sm md:w-auto md:px-4"
          : "px-4 py-2.5 text-sm";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        variant === "field"
          ? "h-full w-full"
          : fill
            ? "w-full gap-0.5 md:w-auto md:gap-1"
            : "gap-1",
        className,
      )}
    >
      <button
        type={type}
        onClick={onClick}
        aria-pressed={ariaPressed ?? active}
        title={title ?? (typeof children === "string" ? children : undefined)}
        className={cn(
          switchBoxBase,
          sizeClass,
          switchBoxClasses(active, tone, variant),
          variant === "field"
            ? "rounded-lg"
            : "hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center gap-2",
            (fill || variant === "field") &&
              "w-full min-w-0 truncate md:overflow-visible md:whitespace-normal",
          )}
        >
          {children}
        </span>
      </button>
      {variant === "field" ? null : <SwitchIndicator active={active} tone={tone} />}
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
          switchBoxClasses(active, "default", "default"),
          "hover:scale-[1.02] active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        )}
      >
        {children}
      </Link>
      <SwitchIndicator active={active} tone="default" />
    </div>
  );
}
