import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GestionVehiculosTablePagination } from "./table-pagination";
import {
  GV_TABLE_DEFAULT_VISIBLE_ROWS,
  GV_TABLE_MIN_WIDTH,
  gvTableBodyMinHeightPxForShell,
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
  "w-full shrink-0 min-h-[5.0625rem] border-b border-border p-4 dark:border-zinc-700 lg:h-[5.0625rem] lg:overflow-hidden";

export const GV_TABLE_KPI_SLOT_CLASS =
  "flex shrink-0 items-stretch border-b border-border px-4 py-3 dark:border-zinc-700 min-h-[7.875rem] sm:h-[7rem] sm:min-h-0";

export function GvTableKpiSlot({ children }: { children?: ReactNode }) {
  return (
    <div className={GV_TABLE_KPI_SLOT_CLASS}>
      {children ? <div className="w-full min-w-0">{children}</div> : null}
    </div>
  );
}

export function GestionVehiculosTableShell({
  toolbar,
  kpiSlot,
  children,
  className,
  pagination,
  visibleRows = GV_TABLE_DEFAULT_VISIBLE_ROWS,
}: {
  toolbar?: ReactNode;
  kpiSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  pagination?: GestionVehiculosTablePaginationProps;
  visibleRows?: number | null;
}) {
  const hasToolbar = Boolean(toolbar);
  const hasPagination = Boolean(pagination);
  const hasKpiSlot = Boolean(kpiSlot);
  const applySizing = visibleRows !== null;
  const rows = visibleRows ?? GV_TABLE_DEFAULT_VISIBLE_ROWS;
  const shellHeight = gvTableShellMinHeightPx({
    visibleRows: rows,
    hasToolbar,
    hasPagination,
  });
  const bodyMinHeight = gvTableBodyMinHeightPxForShell(rows, hasKpiSlot);
  const shellStyle: CSSProperties | undefined = applySizing
    ? ({
        minHeight: shellHeight,
        "--gv-table-shell-h": `${shellHeight}px`,
        "--gv-table-body-min-h": `${bodyMinHeight}px`,
      } as CSSProperties)
    : undefined;

  const toolbarBlock = toolbar ? (
    <div className={GV_TABLE_TOOLBAR_CLASS}>
      <div className="flex w-full min-w-0 items-center lg:h-full">{toolbar}</div>
    </div>
  ) : null;

  const kpiBlock = kpiSlot ?? null;

  const bodyBlock = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        applySizing && "min-h-[var(--gv-table-body-min-h)]",
      )}
    >
      {children}
    </div>
  );

  const paginationBlock = pagination ? <GestionVehiculosTablePagination {...pagination} /> : null;

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
        GV_TABLE_SHELL_SURFACE_CLASS,
        applySizing && "lg:h-[var(--gv-table-shell-h)]",
        className,
      )}
      style={shellStyle}
    >
      {hasToolbar ? (
        <div className="flex min-h-0 flex-1 flex-col bg-celeste-trifinio pt-1">
          <div className={cn(GV_TABLE_SHELL_INNER_CLASS, "h-full flex-1 rounded-t-2xl")}>
            {kpiBlock}
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

export const GV_TABLE_BODY_CENTER_CLASS =
  "flex w-full min-h-[var(--gv-table-body-min-h,14rem)] flex-1 flex-col items-center justify-center px-4 py-8 text-center";

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
    <div className={GV_TABLE_BODY_CENTER_CLASS}>
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
    <div className={GV_TABLE_BODY_CENTER_CLASS}>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
