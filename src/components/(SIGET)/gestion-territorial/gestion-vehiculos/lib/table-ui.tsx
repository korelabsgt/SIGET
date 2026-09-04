import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GestionVehiculosTablePagination } from "./table-pagination";
import {
  GV_TABLE_DEFAULT_VISIBLE_ROWS,
  GV_TABLE_MIN_WIDTH,
  gvTableBodyMinHeightPx,
  gvTableShellMinHeightPx,
} from "./table-layout";

export {
  GV_TABLE_DEFAULT_VISIBLE_ROWS,
  GV_TABLE_MIN_WIDTH,
  gvTableShellVisibleRows,
  gvTableVisibleRowCount,
} from "./table-layout";

export type GestionVehiculosTablePaginationProps = {
  pageSafe: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hidden?: boolean;
};

export const GV_TABLE_SHELL_SURFACE_CLASS =
  "overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900";

export const GV_TABLE_SHELL_INNER_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden bg-card dark:bg-zinc-900";

export const GV_TABLE_TOOLBAR_CLASS =
  "w-full shrink-0 min-h-[5.0625rem] border-b border-border p-4 dark:border-zinc-700";

export function GestionVehiculosTableShell({
  toolbar,
  children,
  className,
  pagination,
  visibleRows = GV_TABLE_DEFAULT_VISIBLE_ROWS,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  pagination?: GestionVehiculosTablePaginationProps;
  visibleRows?: number | null;
}) {
  const hasToolbar = Boolean(toolbar);
  const hasPagination = Boolean(pagination);
  const applySizing = visibleRows !== null;
  const rows = visibleRows ?? GV_TABLE_DEFAULT_VISIBLE_ROWS;
  const shellStyle: CSSProperties | undefined = applySizing
    ? { minHeight: gvTableShellMinHeightPx({ visibleRows: rows, hasToolbar, hasPagination }) }
    : undefined;
  const bodyStyle: CSSProperties | undefined = applySizing
    ? { minHeight: gvTableBodyMinHeightPx(rows) }
    : undefined;

  const toolbarBlock = toolbar ? <div className={GV_TABLE_TOOLBAR_CLASS}>{toolbar}</div> : null;

  const bodyBlock = (
    <div className="flex min-h-0 flex-1 flex-col" style={bodyStyle}>
      {children}
    </div>
  );

  const paginationBlock = pagination ? <GestionVehiculosTablePagination {...pagination} /> : null;

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col",
        GV_TABLE_SHELL_SURFACE_CLASS,
        className,
      )}
      style={shellStyle}
    >
      {hasToolbar ? (
        <div className="flex min-h-0 flex-1 flex-col bg-celeste-trifinio pt-1">
          <div className={cn(GV_TABLE_SHELL_INNER_CLASS, "flex-1 rounded-t-2xl")}>
            {toolbarBlock}
            {bodyBlock}
            {paginationBlock}
          </div>
        </div>
      ) : (
        <div className={cn(GV_TABLE_SHELL_INNER_CLASS, "flex-1")}>
          {bodyBlock}
          {paginationBlock}
        </div>
      )}
    </div>
  );
}

export function GestionVehiculosTableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}

export function GestionVehiculosTable({
  minWidth = GV_TABLE_MIN_WIDTH,
  children,
}: {
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <GestionVehiculosTableScroll>
      <table
        className="w-full text-left text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </GestionVehiculosTableScroll>
  );
}

export type GestionVehiculosThCell = {
  key: string;
  label: string;
  className?: string;
};

export const gvTableHeaderThClass = "px-4 py-3 text-center";
export const gvTableActionThClass = "w-0 whitespace-nowrap px-4 py-3 text-center";
export const gvTableActionTdClass = "w-0 whitespace-nowrap px-4 py-3 align-middle";

export const gvTableRowClass =
  "border-b border-border last:border-0 transition-colors hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20";

export const gvTableRowMorphProps = {
  "data-morph-hover-scope": true,
} as const;

export function GestionVehiculosActionCell({ children }: { children: ReactNode }) {
  return <div className="flex justify-center">{children}</div>;
}

export function GestionVehiculosThead({ cells }: { cells: GestionVehiculosThCell[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-sky-50 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950">{cells.map((cell) => (
        <th key={cell.key} className={cn("px-4 py-3", cell.className)}>
          {cell.label}
        </th>
      ))}</tr>
    </thead>
  );
}

export type GestionVehiculosTdCell = {
  key: string;
  content: ReactNode;
  className?: string;
};

export function GestionVehiculosTr({ cells }: { cells: GestionVehiculosTdCell[] }) {
  return (
    <tr className={gvTableRowClass} {...gvTableRowMorphProps}>{cells.map((cell) => (
      <td key={cell.key} className={cn("px-4 py-3", cell.className)}>
        {cell.content}
      </td>
    ))}</tr>
  );
}

export function GestionVehiculosTableEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex size-10 items-center justify-center text-celeste-trifinio/70">
        {icon}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function GestionVehiculosTableLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-full items-center justify-center py-20">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
