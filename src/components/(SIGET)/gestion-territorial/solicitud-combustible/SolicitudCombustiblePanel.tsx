"use client";

import Link from "next/link";
import { ChevronLeft, Fuel } from "lucide-react";

export function SolicitudCombustiblePanel() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-2 pb-10 pt-5 md:px-6 md:pt-8 lg:px-12">
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)]" />
      <div className="mb-6 flex items-start gap-3">
        <Link
          href="/siget/gestion-territorial"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent"
          aria-label="Regresar a Gestión Territorial"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
            Solicitud de Combustible
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de vales y solicitudes de combustible institucional.
          </p>
        </div>
      </div>
      <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <Fuel className="mb-4 size-12 text-emerald-400" strokeWidth={1.75} />
        <p className="text-lg font-semibold text-foreground">Módulo en preparación</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Pronto podrás registrar solicitudes, dar seguimiento a vales y consultar reportes de
          consumo desde este apartado.
        </p>
      </div>
    </div>
  );
}
