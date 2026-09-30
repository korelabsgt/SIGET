export const GV_MODULO_PAGE_MOBILE_INSET_CLASS =
  "mx-auto my-3 w-full max-md:max-w-[calc(100%-2rem)] md:my-4";

export const GV_MODULO_PAGE_CLASS =
  `relative flex min-h-0 max-w-6xl flex-1 flex-col !p-0 xl:max-w-none xl:w-[90%] ${GV_MODULO_PAGE_MOBILE_INSET_CLASS}`;

export const GV_MODULO_SCROLL_OUTER_CLASS =
  "relative flex min-h-[calc(100vh-4rem)] w-full flex-1 flex-col overflow-hidden lg:h-full lg:min-h-0";

export const GV_MODULO_SCROLL_INNER_CLASS =
  "min-h-[calc(100vh-4rem)] flex flex-1 flex-col overflow-y-auto lg:h-full lg:min-h-0 lg:overflow-hidden";

export const GV_TABLE_AREA_CLASS = "flex min-h-0 w-full min-w-0 flex-1 flex-col";

export const GV_PANEL_STACK_CLASS = "flex min-h-0 w-full flex-1 flex-col";

export const GV_PANEL_KPI_STACK_CLASS =
  "flex min-h-0 w-full flex-1 flex-col gap-1.5 lg:gap-3";

export const GV_MODAL_INSET_X_CLASS = "mx-4 md:mx-6";

export const GV_MODAL_INSET_Y_CLASS =
  "max-md:mt-[max(1rem,env(safe-area-inset-top))] max-md:mb-[max(1rem,env(safe-area-inset-bottom))] md:mt-6 md:mb-6";

export const GV_MODAL_INSET_MARGIN_CLASS = `${GV_MODAL_INSET_X_CLASS} ${GV_MODAL_INSET_Y_CLASS}`;

export const GV_TABLE_DETAIL_SHELL_CLASS =
  "min-h-0 flex-none overflow-visible rounded-none border-0 bg-transparent dark:bg-transparent";
