"use client";

import { useState } from "react";
import { MantenimientoPanel } from "./MantenimientoPanel";
import { Crear } from "./forms/Crear";
import { Activity, Car, Clock, ChevronLeft, Loader2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import { SubmodulosNav } from "../../SubmodulosNav";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useFallasMantenimiento, useMecanicos } from "./lib/hooks";
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { GV_MODULO_PAGE_CLASS } from "../lib/page-shell";
import { GvSwitchGroup, GvSwitchItem } from "../lib/switch-ui";

const TABS = ["ACTIVAS", "CRITICAS", "SOLVENTADAS"] as const;
type TabMantenimiento = (typeof TABS)[number];

const TAB_LABELS: Record<TabMantenimiento, string> = {
  ACTIVAS: "Pendientes & Reparación",
  CRITICAS: "Críticas (Alta)",
  SOLVENTADAS: "Solventadas",
};

export function Mantenimiento() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const isAuthorized = ["super", "admin", "taller", "mecanico"].includes(
    effectiveRole,
  );
  const { data: fallas = [], isLoading } = useFallasMantenimiento();
  const { data: mecanicos = [] } = useMecanicos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");
  const [enDetalle, setEnDetalle] = useState(false);

  const fallasActivas = fallas.filter((f) => f.estado !== "SOLVENTADA").length;

  const unidadesFueraDeServicio = new Set(
    fallas
      .filter((f) => f.estado !== "SOLVENTADA" && (f.severidad === "ALTA" || f.estado === "EN_REPARACION"))
      .map((f) => f.vehiculo_id)
  ).size;

  const fallasSolventadas = fallas.filter((f) => f.estado === "SOLVENTADA" && f.solventado_at);
  const totalDays = fallasSolventadas.reduce((acc, f) => {
    return acc + differenceInDays(new Date(f.solventado_at!), new Date(f.created_at));
  }, 0);
  const promedioDias = fallasSolventadas.length > 0
    ? Math.round((totalDays / fallasSolventadas.length) * 10) / 10
    : 0;

  return (
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />

      {!enDetalle ? <SubmodulosNav /> : null}

      {!enDetalle ? (
      <div className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push("/siget")}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
            Gestión Territorial
          </p>
          <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
            Mantenimiento y Averías
          </h1>
        </div>
      </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-celeste-trifinio" />
          <p className="text-muted-foreground">Cargando mantenimiento...</p>
        </div>
      ) : (
        <>
          {!enDetalle ? (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Administración del mantenimiento vehicular y reportes de fallas.
                </p>
                <Crear />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  <Activity className="size-3.5 shrink-0 text-orange-500" />
                  <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fallas activas
                  </p>
                  <p className="text-base font-bold tabular-nums text-foreground">{fallasActivas}</p>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  <Car className="size-3.5 shrink-0 text-red-500" />
                  <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fuera de servicio
                  </p>
                  <p className="text-base font-bold tabular-nums text-foreground">{unidadesFueraDeServicio}</p>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  <Clock className="size-3.5 shrink-0 text-celeste-trifinio" />
                  <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Promedio reparación
                  </p>
                  <p className="text-base font-bold tabular-nums text-foreground">
                    {promedioDias}
                    <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">días</span>
                  </p>
                </div>
              </div>
            </>
          ) : null}

          <div>
            <GestionVehiculosTableShell
              className={
                enDetalle
                  ? "overflow-visible rounded-none border-0 bg-transparent dark:bg-transparent"
                  : undefined
              }
              toolbar={
                !enDetalle ? (
                  <GvSwitchGroup layoutId="gv-mantenimiento-tabs">
                    {TABS.map((tab) => (
                      <GvSwitchItem
                        key={tab}
                        active={tabActiva === tab}
                        onClick={() => setTabActiva(tab)}
                        size="sm"
                        tone={tab === "CRITICAS" ? "danger" : "default"}
                      >
                        {TAB_LABELS[tab]}
                      </GvSwitchItem>
                    ))}
                  </GvSwitchGroup>
                ) : undefined
              }
            >
              <MantenimientoPanel
                fallas={fallas}
                mecanicos={mecanicos}
                isAuthorized={isAuthorized}
                filtro={tabActiva}
                onDetailViewChange={setEnDetalle}
              />
            </GestionVehiculosTableShell>
          </div>
        </>
      )}
    </div>
  );
}
