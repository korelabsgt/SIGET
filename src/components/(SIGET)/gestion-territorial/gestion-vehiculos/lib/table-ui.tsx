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

export const GV_TABLE_VIEWPORT_FILL = null;

export const GV_TABLE_RECORD_SCROLL = "record-scroll" as const;

export type GvTableVisibleRows =
  | number
  | null
  | typeof GV_TABLE_RECORD_SCROLL;

export type GestionVehiculosTablePaginationProps = {
  pageSafe: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hidden?: boolean;
};

export const GV_TABLE_SHELL_SURFACE_CLASS =
  "rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900";

export const GV_TABLE_SHELL_INNER_CLASS =
  "flex flex-col bg-card dark:bg-zinc-900";

export const GV_TABLE_TOOLBAR_CLASS =
  "w-full shrink-0 min-h-[5.0625rem] border-b border-border p-4 dark:border-zinc-700 lg:min-h-[5.0625rem] lg:h-auto";

export const GV_TABLE_KPI_SLOT_CLASS =
  "flex shrink-0 items-stretch border-b border-border px-4 py-3 dark:border-zinc-700 sm:min-h-[6.5rem]";

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
  visibleRows = GV_TABLE_RECORD_SCROLL,
}: {
  toolbar?: ReactNode;
  kpiSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  pagination?: GestionVehiculosTablePaginationProps;
  visibleRows?: GvTableVisibleRows;
}) {
  const hasToolbar = Boolean(toolbar);
  const hasPagination = Boolean(pagination);
  const hasKpiSlot = Boolean(kpiSlot);
  const recordScroll =
    visibleRows === GV_TABLE_RECORD_SCROLL || visibleRows === null;
  const viewportFill = !recordScroll && visibleRows === GV_TABLE_VIEWPORT_FILL;
  const applySizing = !recordScroll && visibleRows !== null && typeof visibleRows === "number";
  const rows =
    typeof visibleRows === "number"
      ? visibleRows
      : GV_TABLE_DEFAULT_VISIBLE_ROWS;
  const pageSizeRows = pagination?.pageSize ?? rows;
  const shellHeight = gvTableShellMinHeightPx({
    visibleRows: rows,
    hasToolbar,
    hasPagination,
  });
  const bodyMinHeight = gvTableBodyMinHeightPxForShell(pageSizeRows, hasKpiSlot);
  const shellStyle: CSSProperties | undefined = recordScroll
    ? undefined
    : applySizing
      ? ({
          minHeight: shellHeight,
          "--gv-table-shell-h": `${shellHeight}px`,
          "--gv-table-body-min-h": `${bodyMinHeight}px`,
        } as CSSProperties)
      : viewportFill
        ? ({
            "--gv-table-body-min-h": `${bodyMinHeight}px`,
          } as CSSProperties)
        : undefined;

  const toolbarBlock = toolbar ? (
    <div className={GV_TABLE_TOOLBAR_CLASS}>
      <div className="flex w-full min-w-0 items-center lg:min-h-[4.0625rem]">{toolbar}</div>
    </div>
  ) : null;

  const kpiBlock = kpiSlot ?? null;

  const bodyBlock = (
    <div
      className={cn(
        recordScroll && "w-full min-w-0 shrink-0",
        !recordScroll && "flex min-h-0 flex-1 flex-col overflow-hidden lg:basis-0",
        !recordScroll && applySizing && "min-h-[var(--gv-table-body-min-h)]",
        !recordScroll && viewportFill && "min-h-0 flex-1 lg:min-h-0",
      )}
    >
      <div
        className={cn(
          recordScroll && "w-full min-w-0",
          !recordScroll && "flex min-h-0 flex-1 flex-col lg:basis-0 lg:overflow-hidden",
          !recordScroll &&
            (viewportFill ? "h-full max-lg:overflow-y-auto lg:min-h-0" : "overflow-hidden"),
        )}
      >
        {children}
      </div>
    </div>
  );

  const paginationBlock = pagination ? <GestionVehiculosTablePagination {...pagination} /> : null;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col",
        !recordScroll && "min-h-0 flex-1 overflow-hidden",
        GV_TABLE_SHELL_SURFACE_CLASS,
        !recordScroll && applySizing && "lg:h-[var(--gv-table-shell-h)]",
        !recordScroll &&
          viewportFill &&
          "min-h-0 flex-1 self-stretch lg:h-full lg:max-h-full lg:min-h-0 lg:basis-0",
        recordScroll && "shrink-0 overflow-visible",
        className,
      )}
      style={shellStyle}
    >
      {hasToolbar ? (
        <div
          className={cn(
            "flex w-full min-w-0 flex-col bg-celeste-trifinio pt-1",
            !recordScroll && "min-h-0 flex-1 overflow-hidden lg:h-full lg:min-h-0",
          )}
        >
          <div
            className={cn(
              GV_TABLE_SHELL_INNER_CLASS,
              recordScroll
                ? "overflow-visible rounded-t-2xl"
                : "min-h-0 flex-1 overflow-hidden rounded-t-2xl lg:h-full lg:min-h-0",
            )}
          >
            {toolbarBlock}
            {kpiBlock}
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
  pageScroll = true,
}: {
  children: ReactNode;
  className?: string;
  pageScroll?: boolean;
}) {
  if (pageScroll) {
    return (
      <div className={cn("w-full min-w-0 overflow-x-auto overflow-y-visible", className)}>
        <div className="min-w-0 overflow-y-visible [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead_tr]:bg-sky-50 dark:[&_thead_tr]:bg-sky-950/95">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div className="min-h-0 flex-1 overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead_tr]:bg-sky-50 dark:[&_thead_tr]:bg-sky-950/95">
        {children}
      </div>
    </div>
  );
}

export function GestionVehiculosTable({
  minWidth = GV_TABLE_MIN_WIDTH,
  children,
}: {
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="w-full min-w-0">
      <GestionVehiculosTableScroll pageScroll>
        <table
          className={cn(
            "w-full border-collapse text-sm",
            gvTableColumnDividersClass,
            gvTableCenteredCellsClass,
          )}
          style={{ minWidth }}
        >
          {children}
        </table>
      </GestionVehiculosTableScroll>
    </div>
  );
}

export type GestionVehiculosThCell = {
  key: string;
  label: string;
  className?: string;
};

export const gvTableHeaderThClass = "px-4 py-3 text-center";
export const gvTableActionThClass = "w-0 whitespace-nowrap px-4 py-3 text-center";
export const gvTableBodyTdClass = "px-4 py-3 align-middle text-center";

export const gvTableActionTdClass = "w-0 whitespace-nowrap px-4 py-3 align-middle text-center";

export const gvTableColDividerClass = "border-r border-border dark:border-zinc-800";

const gvTableColumnDividersClass =
  "[&_thead_th:not(:last-child)]:border-r [&_thead_th:not(:last-child)]:border-border dark:[&_thead_th:not(:last-child)]:border-zinc-800 [&_tbody_td:not(:last-child)]:border-r [&_tbody_td:not(:last-child)]:border-border dark:[&_tbody_td:not(:last-child)]:border-zinc-800";

const gvTableCenteredCellsClass =
  "[&_thead_th]:align-middle [&_thead_th]:text-center [&_tbody_td]:align-middle [&_tbody_td]:text-center";

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
        <th key={cell.key} className={cn("px-4 py-3 text-center", cell.className)}>
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
      <td key={cell.key} className={cn(gvTableBodyTdClass, cell.className)}>
        {cell.content}
      </td>
    ))}</tr>
  );
}

export const GV_TABLE_BODY_CENTER_CLASS =
  "flex w-full min-h-[12rem] flex-col items-center justify-center px-4 py-8 text-center";

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
