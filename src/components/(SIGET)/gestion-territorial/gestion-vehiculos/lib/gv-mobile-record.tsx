"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GvTableMorphRow } from "./gv-table-morph-row";

export const GV_MOBILE_RECORD_TITLE_CLASS =
  "truncate text-lg font-bold tracking-tight text-foreground";

export const GV_MOBILE_RECORD_SUBTITLE_CLASS = "text-sm text-muted-foreground";

export const GV_MOBILE_RECORD_META_ICON_CLASS = "size-4 shrink-0 text-celeste-trifinio";

export function GvMobileRecordList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border dark:divide-zinc-800", className)}>
      {children}
    </div>
  );
}

export function GvMobileRecordRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <GvTableMorphRow as="div" className={cn("space-y-3 p-4", className)}>
      {children}
    </GvTableMorphRow>
  );
}

export function GvMobileRecordHeader({
  title,
  badge,
  className,
}: {
  title: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground">{title}</div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

export function GvMobileRecordMeta({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

export function GvMobileRecordMetaRow({
  icon,
  children,
  subtext,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  subtext?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2.5 text-base text-muted-foreground", className)}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        <div className="text-foreground">{children}</div>
        {subtext ? <div className="text-sm text-muted-foreground">{subtext}</div> : null}
      </div>
    </div>
  );
}

export function GvMobileRecordFooter({
  left,
  right,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {left}
      </div>
      {right ? (
        <div className="flex max-w-[65%] shrink-0 flex-wrap items-center justify-end gap-1.5">
          {right}
        </div>
      ) : null}
    </div>
  );
}

export function GvMobileRecordBadge({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
