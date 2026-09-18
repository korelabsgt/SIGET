"use client";

import { useEffect, useMemo, useState } from "react";

import { GvBackToTerritorial } from "../gestion-vehiculos/lib/gv-back-to-territorial";
import { GvModuloPageFrame } from "../gestion-vehiculos/lib/gv-modulo-page-frame";
import { GvTabFilter } from "../gestion-vehiculos/lib/gv-tab-filter";
import {
  GV_MODULO_SCROLL_INNER_CLASS,
  GV_MODULO_SCROLL_OUTER_CLASS,
  GV_TABLE_AREA_CLASS,
} from "../gestion-vehiculos/lib/page-shell";
import { useGvPermissionRole } from "../gestion-vehiculos/lib/gv-permissions-hook";

import { canViewValesCombustible } from "./lib/permissions";
import { SolicitudesCombustible } from "./solicitudes/SolicitudesCombustible";
import { Vales } from "./vales/Vales";

const SECCIONES = ["solicitudes", "vales"] as const;
type SeccionCombustible = (typeof SECCIONES)[number];

const SECCION_LABELS: Record<SeccionCombustible, string> = {
  solicitudes: "Solicitudes",
  vales: "Vales",
};

export function CombustibleShell() {
  const gvRole = useGvPermissionRole();
  const puedeVerVales = canViewValesCombustible(gvRole);

  const seccionOptions = useMemo(() => {
    const values = puedeVerVales
      ? SECCIONES
      : (["solicitudes"] as const satisfies readonly SeccionCombustible[]);
    return values.map((value) => ({ value, label: SECCION_LABELS[value] }));
  }, [puedeVerVales]);

  const [seccion, setSeccion] = useState<SeccionCombustible>("solicitudes");

  useEffect(() => {
    if (!puedeVerVales && seccion === "vales") {
      setSeccion("solicitudes");
    }
  }, [puedeVerVales, seccion]);

  return (
    <GvModuloPageFrame>
      <div className="mb-6 flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <GvBackToTerritorial morph className="self-auto" />
          <div className="min-w-0">
            <h1 className="min-w-0 text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
              Solicitud de Combustible
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Solicitudes y requisiciones oficiales; inventario de vales por fondo OT / HAME.
            </p>
          </div>
        </div>

        {seccionOptions.length > 1 ? (
          <div className="flex shrink-0 flex-col items-end gap-2 lg:flex-row lg:items-center lg:gap-2">
            <GvTabFilter
              value={seccion}
              onChange={setSeccion}
              options={seccionOptions}
              layoutId="combustible-secciones"
              className="w-full lg:!w-auto"
            />
          </div>
        ) : null}
      </div>

      <div className={GV_MODULO_SCROLL_OUTER_CLASS}>
        <div className={GV_MODULO_SCROLL_INNER_CLASS}>
          <div className={GV_TABLE_AREA_CLASS}>
            {seccion === "vales" && puedeVerVales ? <Vales /> : <SolicitudesCombustible />}
          </div>
        </div>
      </div>
    </GvModuloPageFrame>
  );
}
