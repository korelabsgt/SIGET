"use client";

import { useState } from "react";
import { AlertTriangle, OctagonAlert } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import { ReportarAveriaModal } from "./ReportarAveriaModal";

export function Crear({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SigetActionButton
        type="button"
        label={
          <>
            <span className="lg:hidden">Avería</span>
            <span className="hidden lg:inline">Reportar</span>
          </>
        }
        ariaLabel="Reportar avería"
        accentColor={sigetAccent.quitar}
        morphFrom={AlertTriangle}
        morphTo={OctagonAlert}
        onClick={() => setOpen(true)}
        className={cn(
          "h-11 shrink-0 max-lg:w-full lg:h-9 lg:w-auto",
          compact && "lg:px-3",
        )}
      />

      <ReportarAveriaModal open={open} onOpenChange={setOpen} />
    </>
  );
}
