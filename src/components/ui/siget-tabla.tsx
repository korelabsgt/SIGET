"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SigetTablaContenedor({
  children,
  footer,
  className,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40",
        className,
      )}
    >
      <div className="h-1 w-full shrink-0 bg-celeste-trifinio" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
        {footer}
      </div>
    </div>
  );
}

export const sigetTablaClass = "w-full min-w-0 text-left text-sm";

export const sigetTablaHeadRowClass =
  "border-b border-border bg-sky-50/80 text-[11px] font-bold text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30";

export const sigetTablaRowClass =
  "border-b border-border hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20";

export function SigetTablaPaginacion({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
}) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums text-celeste-trifinio">
        {page}/{totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
        aria-label="Página siguiente"
      >
        <ChevronRight className="size-5" />
      </button>
      {pageSize !== undefined && pageSizeOptions && onPageSizeChange ? (
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 cursor-pointer rounded-lg border border-celeste-trifinio/40 bg-transparent px-2 text-sm font-bold text-celeste-trifinio outline-none focus:ring-2 focus:ring-celeste-trifinio/25"
          aria-label="Filas por página"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
