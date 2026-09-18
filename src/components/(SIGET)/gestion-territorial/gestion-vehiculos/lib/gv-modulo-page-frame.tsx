"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { GV_MODULO_PAGE_CLASS } from "./page-shell";

export function GvModuloPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(GV_MODULO_PAGE_CLASS, className)}>
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)]" />
      {children}
    </div>
  );
}
