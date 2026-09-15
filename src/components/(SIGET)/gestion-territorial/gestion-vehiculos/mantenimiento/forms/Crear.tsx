"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GV_DANGER_OUTLINE_BUTTON_CLASS } from "../../lib/gv-danger-ui";
import { ReportarAveriaModal } from "./ReportarAveriaModal";

export function Crear({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(GV_DANGER_OUTLINE_BUTTON_CLASS, compact && "px-3")}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="lg:hidden">Avería</span>
        <span className="hidden lg:inline">Reportar avería</span>
      </button>

      <ReportarAveriaModal open={open} onOpenChange={setOpen} />
    </>
  );
}
