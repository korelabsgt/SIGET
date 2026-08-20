"use client";

import { useState } from "react";
import { MantenimientoList } from "./MantenimientoList";
import { Crear } from "./forms/Crear";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Car, Clock, ChevronLeft, Loader2 } from "lucide-react";
import { differenceInDays } from "date-fns";
import { SubmodulosNav } from "../../SubmodulosNav";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  useFallasMantenimiento,
  useMecanicos,
  useVehiculosParaFallas,
} from "./lib/hooks";
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { cn } from "@/lib/utils";

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
  const { data: vehiculos = [] } = useVehiculosParaFallas();
  const { data: mecanicos = [] } = useMecanicos();
  const [tabActiva, setTabActiva] = useState<TabMantenimiento>("ACTIVAS");

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
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />

      <SubmodulosNav />

      <div className="mb-6 flex items-start gap-3 px-3 sm:px-0">
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-celeste-trifinio" />
          <p className="text-muted-foreground">Cargando mantenimiento...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-0">
            <p className="text-sm text-muted-foreground">
              Administración del mantenimiento vehicular y reportes de fallas.
            </p>
            <Crear vehiculos={vehiculos} />
          </div>

          <div className="mb-6 grid gap-4 px-3 sm:px-0 md:grid-cols-3">
            <Card className="border-border bg-card shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fallas Activas</CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{fallasActivas}</div>
                <p className="mt-1 text-xs text-muted-foreground">Pendientes o en reparación</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fuera de Servicio</CardTitle>
                <Car className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{unidadesFueraDeServicio}</div>
                <p className="mt-1 text-xs text-muted-foreground">Inmovilizadas por severidad</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Reparación</CardTitle>
                <Clock className="h-4 w-4 text-celeste-trifinio" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {promedioDias}{" "}
                  <span className="text-base font-normal text-muted-foreground">días</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Tiempo medio de solución</p>
              </CardContent>
            </Card>
          </div>

          <div className="px-3 sm:px-0">
            <GestionVehiculosTableShell
              toolbar={
                <div className="flex flex-wrap items-center gap-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTabActiva(tab)}
                      className={cn(
                        "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border-0 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        tabActiva === tab
                          ? tab === "CRITICAS"
                            ? "bg-red-600 text-white hover:opacity-90"
                            : "bg-celeste-trifinio text-white hover:opacity-90"
                          : tab === "CRITICAS"
                            ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            : "text-zinc-700 hover:bg-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-600",
                      )}
                    >
                      {TAB_LABELS[tab]}
                    </button>
                  ))}
                </div>
              }
            >
              <MantenimientoList
                fallas={fallas}
                mecanicos={mecanicos}
                isAuthorized={isAuthorized}
                filtro={tabActiva}
              />
            </GestionVehiculosTableShell>
          </div>
        </>
      )}
    </div>
  );
}
