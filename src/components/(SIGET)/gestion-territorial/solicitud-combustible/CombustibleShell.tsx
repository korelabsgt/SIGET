"use client";



import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ChevronLeft } from "lucide-react";



import { GvTabFilter } from "../gestion-vehiculos/lib/gv-tab-filter";

import { GV_MODULO_PAGE_CLASS, GV_TABLE_AREA_CLASS } from "../gestion-vehiculos/lib/page-shell";

import { useGvPermissionRole, useRequireFlotaYCombustible } from "../gestion-vehiculos/lib/gv-permissions-hook";

import { cn } from "@/lib/utils";



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
  const allowed = useRequireFlotaYCombustible();
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

  if (!allowed) return null;

  return (

    <div className={cn(GV_MODULO_PAGE_CLASS, "relative")}>

      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)]" />



      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">

        <div className="flex min-w-0 flex-1 items-start gap-3">

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

              Solicitudes y requisiciones oficiales; inventario de vales por fondo OT / HAME.

            </p>

          </div>

        </div>



        {seccionOptions.length > 1 ? (

          <div className="flex w-full shrink-0 justify-end lg:ml-auto lg:w-auto">

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



      <div className={GV_TABLE_AREA_CLASS}>
        {seccion === "vales" && puedeVerVales ? <Vales /> : <SolicitudesCombustible />}
      </div>

    </div>

  );

}


