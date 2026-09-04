"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GvTableMorphRow } from "./gv-table-morph-row";

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
      <div className="min-w-0 flex-1 text-sm font-semibold text-foreground">{title}</div>
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
    <div className={cn("flex items-start gap-2 text-sm text-muted-foreground", className)}>
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        <div className="text-foreground">{children}</div>
        {subtext ? <div className="text-xs text-muted-foreground">{subtext}</div> : null}
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
      <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {left}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-1.5">{right}</div> : null}
    </div>
  );
}

export function GvMobileRecordBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </span>
  );
}
