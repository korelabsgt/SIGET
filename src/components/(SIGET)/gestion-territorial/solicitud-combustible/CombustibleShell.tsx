"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { GvTabFilter } from "../gestion-vehiculos/lib/gv-tab-filter";
import { GV_MODULO_PAGE_CLASS } from "../gestion-vehiculos/lib/page-shell";
import { cn } from "@/lib/utils";

import { Requisiciones } from "./requisiciones/Requisiciones";
import { SolicitudesCombustible } from "./solicitudes/SolicitudesCombustible";

const SECCIONES = ["solicitudes", "requisiciones"] as const;
type SeccionCombustible = (typeof SECCIONES)[number];

const SECCION_OPTIONS = [
  { value: "solicitudes" as const, label: "Solicitudes" },
  { value: "requisiciones" as const, label: "Requisiciones" },
];

export function CombustibleShell() {
  const [seccion, setSeccion] = useState<SeccionCombustible>("solicitudes");

  return (
    <div className={cn(GV_MODULO_PAGE_CLASS, "relative")}>
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)]" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/siget/gestion-territorial"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            aria-label="Regresar a Gestión Territorial"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
              Solicitud de Combustible
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Solicitudes de vales, requisiciones de cupones y control por fondo OT / HAME.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto sm:min-w-[18rem]">
          <GvTabFilter
            value={seccion}
            onChange={setSeccion}
            options={SECCION_OPTIONS}
            layoutId="combustible-secciones"
            fill
          />
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900",
        )}
      >
        {seccion === "solicitudes" ? <SolicitudesCombustible /> : <Requisiciones />}
      </div>
    </div>
  );
}
