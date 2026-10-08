"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { GvTabFilter } from "./gv-tab-filter";
import { GV_MENU_OPTIONS } from "./menu-options";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

export function GvSectionSelect({ className }: { className?: string }) {
  const gvSection = useGvSection();
  const current = gvSection?.section ?? "solicitudes";

  const options = useMemo(
    () => GV_MENU_OPTIONS.map((opt) => ({ value: opt.id, label: opt.title })),
    [],
  );

  return (
    <nav
      className={cn("min-w-0 w-full max-w-full sm:w-auto", className)}
      aria-label="Área de gestión vehicular"
    >
      <GvTabFilter
        value={current}
        onChange={(value) => gvSection?.selectSection(value as GvSubmoduloId)}
        layoutId="gv-modulo-secciones"
        layout="responsive-grid"
        fill
        className="min-w-0 w-full max-w-full max-md:px-2.5 sm:w-auto"
        options={options}
      />
    </nav>
  );
}
