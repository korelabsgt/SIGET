export const GV_HEADER_ACTIONS_CLASS =
  "flex flex-row flex-nowrap items-center gap-2";

export const GV_TOOLBAR_BUTTON_BASE_CLASS =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-bold shadow-none transition-colors";

export const GV_HEADER_PRIMARY_BUTTON_CLASS =
  `${GV_TOOLBAR_BUTTON_BASE_CLASS} border-0 bg-celeste-trifinio text-white hover:opacity-90`;

export const GV_HEADER_OUTLINE_BUTTON_CLASS =
  `${GV_TOOLBAR_BUTTON_BASE_CLASS} border border-celeste-trifinio bg-transparent text-celeste-trifinio hover:bg-sky-50 dark:hover:bg-sky-950/40`;

export const GV_DETAIL_ROUND_ACTION_CLASS =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-celeste-trifinio px-4 text-[10px] font-bold text-white transition-colors hover:opacity-90";

export const GV_FILTRO_FIELD_CLASS =
  "h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 text-sm font-semibold text-foreground shadow-none transition-colors focus-within:border-celeste-trifinio focus-within:ring-2 focus-within:ring-celeste-trifinio/25 data-[size=default]:h-11 dark:bg-sky-950/20";

export const GV_TABLE_SEARCH_WRAPPER_CLASS = "relative min-w-0 flex-1";

export const GV_TABLE_SEARCH_INPUT_CLASS =
  "h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20";

export const GV_TABLE_TOOLBAR_ROW_CLASS =
  "flex w-full min-w-0 flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-3";

export const GV_TABLE_TOOLBAR_PRIMARY_CLASS =
  "flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:items-center";

export const GV_TABLE_TOOLBAR_ACTIONS_CLASS =
  "flex w-full min-w-0 flex-row flex-wrap items-center justify-end gap-2 [&_button]:w-auto";

export const GV_TABLE_TOOLBAR_SELECT_WRAP_CLASS =
  "hidden min-w-[12rem] w-max max-w-[min(26rem,42vw)] shrink-0 lg:block";

export const GV_TABLE_TOOLBAR_SELECT_TRIGGER_CLASS =
  "min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate";
