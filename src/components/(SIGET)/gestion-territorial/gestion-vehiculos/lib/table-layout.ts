export const GV_TABLE_DEFAULT_VISIBLE_ROWS = 10;

export const GV_TABLE_MIN_WIDTH = 980;

const GV_TABLE_ROW_HEIGHT_PX = 57;
const GV_TABLE_HEAD_HEIGHT_PX = 45;
const GV_TABLE_TOOLBAR_HEIGHT_PX = 81;
const GV_TABLE_ACCENT_BAR_PX = 4;
const GV_TABLE_PAGINATION_HEIGHT_PX = 57;
const GV_TABLE_KPI_SLOT_BLOCK_PX = 112;

export function gvTableShellVisibleRows(pageSize: number): number {
  return pageSize;
}

export function gvTableVisibleRowCount(itemsOnPage: number, isEmptyState: boolean): number {
  const minRows = 3;
  if (isEmptyState) return minRows;
  return Math.max(minRows, itemsOnPage);
}

export function gvTableBodyMinHeightPx(visibleRows: number): number {
  return GV_TABLE_HEAD_HEIGHT_PX + visibleRows * GV_TABLE_ROW_HEIGHT_PX;
}

export function gvTableBodyMinHeightPxForShell(visibleRows: number, hasKpiSlot: boolean): number {
  const base = gvTableBodyMinHeightPx(visibleRows);
  return hasKpiSlot ? base : base + GV_TABLE_KPI_SLOT_BLOCK_PX;
}

export function gvTableShellMinHeightPx(options: {
  visibleRows: number;
  hasToolbar: boolean;
  hasPagination: boolean;
}) {
  let height = gvTableBodyMinHeightPx(options.visibleRows) + GV_TABLE_KPI_SLOT_BLOCK_PX;
  if (options.hasToolbar) {
    height += GV_TABLE_ACCENT_BAR_PX + GV_TABLE_TOOLBAR_HEIGHT_PX;
  }
  if (options.hasPagination) {
    height += GV_TABLE_PAGINATION_HEIGHT_PX;
  }
  return height;
}
