"use client";

import { ArrowDownToLine, FileSpreadsheet } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";

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
  return (
    <SigetActionButton
      label="Excel"
      accentColor={sigetAccent.excel}
      morphFrom={FileSpreadsheet}
      morphTo={ArrowDownToLine}
      onClick={onClick}
      disabled={disabled || loading}
      ariaLabel="Exportar reporte"
      className={cn("h-11 w-auto shrink-0 rounded-xl px-4", className)}
    />
  );
}
