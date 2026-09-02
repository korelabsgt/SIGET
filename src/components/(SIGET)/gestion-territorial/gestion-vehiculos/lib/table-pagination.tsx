"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const GV_PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
export const GV_DEFAULT_PAGE_SIZE = 10;

export function useGvTablePagination<T>(items: T[], resetKey?: string) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(GV_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSafe, pageSize]);

  const rowOffset = (pageSafe - 1) * pageSize;

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    pageSafe,
    pageItems,
    rowOffset,
    totalItems: items.length,
  };
}

export function GestionVehiculosTablePagination({
  pageSafe,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hidden = false,
}: {
  pageSafe: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, pageSafe - 1))}
        disabled={pageSafe <= 1}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums text-celeste-trifinio">
        {pageSafe}/{totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, pageSafe + 1))}
        disabled={pageSafe >= totalPages}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
        aria-label="Página siguiente"
      >
        <ChevronRight className="size-5" />
      </button>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-9 cursor-pointer rounded-lg border border-celeste-trifinio/40 bg-transparent px-2 text-sm font-bold text-celeste-trifinio outline-none focus:ring-2 focus:ring-celeste-trifinio/25"
        aria-label="Filas por página"
      >
        {GV_PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
