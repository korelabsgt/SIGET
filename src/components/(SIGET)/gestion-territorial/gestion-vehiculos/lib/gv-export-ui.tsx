"use client";

import { Download, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { GV_TOOLBAR_BUTTON_BASE_CLASS } from "./gv-header-ui";

export const GV_EXPORT_REPORTE_BUTTON_CLASS =
  `${GV_TOOLBAR_BUTTON_BASE_CLASS} border border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-950/40`;

export function GvExportReporteButton({
  onClick,
  disabled = false,
  loading = false,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        GV_EXPORT_REPORTE_BUTTON_CLASS,
        isDisabled &&
          "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent",
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4 shrink-0" />}
      Exportar Reporte
    </button>
  );
}
