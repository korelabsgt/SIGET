"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { GV_DANGER_OUTLINE_BUTTON_CLASS } from "../../lib/gv-danger-ui";
import { ReportarAveriaModal } from "./ReportarAveriaModal";

export function Crear() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={GV_DANGER_OUTLINE_BUTTON_CLASS}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="lg:hidden">Avería</span>
        <span className="hidden lg:inline">Reportar avería</span>
      </button>

      <ReportarAveriaModal open={open} onOpenChange={setOpen} />
    </>
  );
}
