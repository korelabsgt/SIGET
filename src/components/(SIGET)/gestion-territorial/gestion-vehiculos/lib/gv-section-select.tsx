"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { GvTabFilter } from "./gv-tab-filter";
import { getAllowedGvSections } from "./permissions";
import { GV_MENU_OPTIONS } from "./menu-options";
import { useGvPermissionRole } from "./gv-permissions-hook";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

export function GvSectionSelect({ className }: { className?: string }) {
  const gvSection = useGvSection();
  const role = useGvPermissionRole();
  const allowedSections = useMemo(() => new Set(getAllowedGvSections(role)), [role]);
  const current = gvSection?.section ?? "solicitudes";

  const options = useMemo(
    () =>
      GV_MENU_OPTIONS.filter((opt) => allowedSections.has(opt.id)).map((opt) => ({
        value: opt.id,
        label: opt.title,
      })),
    [allowedSections],
  );

  if (options.length <= 1) return null;

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
        className="min-w-0 w-full max-w-full sm:w-auto"
        options={options}
      />
    </nav>
  );
}
