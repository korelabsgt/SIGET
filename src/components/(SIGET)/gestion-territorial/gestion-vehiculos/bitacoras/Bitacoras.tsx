"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronLeft, Search, BookOpen, Download } from "lucide-react";
import { toast } from "react-toastify";

import { SubmodulosNav } from "../../SubmodulosNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BitacorasList } from "./BitacorasList";
import { BitacoraStatsCards } from "./BitacoraStatsCards";
import { Crear } from "./forms/Crear";
import { useBitacoras } from "./lib/hooks";
import { computeMetricasBitacorasMes } from "./lib/helpers";
import { useVehiculos } from "../flota/lib/hooks";
import { formatVehiculoOpcion } from "../flota/lib/helpers";
import { GestionVehiculosTableShell } from "../lib/table-ui";
import { cn } from "@/lib/utils";

type BitacorasView = { mode: "list" } | { mode: "create" };

const TODOS_VEHICULOS = "__todos__";

const filtroTriggerClass =
  "h-11 w-full cursor-pointer rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 px-3 text-sm font-semibold text-foreground shadow-none transition-colors focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20";

const filtroContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroItemClass =
  "cursor-pointer rounded-lg bg-white font-medium text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function Bitacoras() {
  const router = useRouter();
  const { data: bitacoras = [], isLoading: loadingBitacoras } = useBitacoras();
  const { data: vehiculos = [] } = useVehiculos();
  const [view, setView] = useState<BitacorasView>({ mode: "list" });
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehiculoFilter, setVehiculoFilter] = useState(TODOS_VEHICULOS);
  const loading = loadingBitacoras;

  const vehiculoSeleccionado = vehiculoFilter !== TODOS_VEHICULOS;

  const handleExportReporte = async () => {
    if (!vehiculoSeleccionado) {
      toast.warning("Selecciona un vehículo en el filtro para exportar su bitácora.");
      return;
    }

    setIsExporting(true);
    try {
      const { exportBitacoraReporteVehiculo } = await import("./lib/bitacora-excel");
      const result = await exportBitacoraReporteVehiculo({
        vehiculos,
        vehiculoId: vehiculoFilter,
      });

      if (result.ok) {
        toast.success("Reporte exportado exitosamente");
        return;
      }

      if (result.reason === "no_data") {
        toast.warning("No hay registros del vehículo seleccionado en el mes actual.");
        return;
      }

      toast.error("Hubo un problema al exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  const bitacorasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bitacoras.filter((b) => {
      const matchVehiculo =
        vehiculoFilter === TODOS_VEHICULOS || b.vehiculo_id === vehiculoFilter;
      if (!matchVehiculo) return false;
      if (!q) return true;
      return (
        b.destino.toLowerCase().includes(q) ||
        b.ter_vehiculos?.placa.toLowerCase().includes(q) ||
        b.ter_vehiculos?.marca.toLowerCase().includes(q) ||
        b.ter_vehiculos?.modelo.toLowerCase().includes(q) ||
        (b.profiles?.nombre?.toLowerCase().includes(q) ?? false) ||
        (b.vale_combustible?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bitacoras, searchQuery, vehiculoFilter]);

  const metricas = useMemo(
    () => computeMetricasBitacorasMes(bitacoras, vehiculoFilter, TODOS_VEHICULOS),
    [bitacoras, vehiculoFilter],
  );

  const hayFiltros = searchQuery.trim().length > 0 || vehiculoFilter !== TODOS_VEHICULOS;

  if (view.mode === "create") {
    return (
      <div className="relative w-full min-h-[calc(100vh-4rem)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
        <div className="relative z-10 mx-auto w-full px-0 pb-20 pt-6 sm:px-6 md:pt-10 lg:px-8 xl:w-[80%]">
          <Crear onBack={() => setView({ mode: "list" })} onSaved={() => setView({ mode: "list" })} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />

      <SubmodulosNav />

      <div className="mb-6 flex flex-col gap-4 px-3 sm:flex-row sm:items-start sm:justify-between sm:px-0">
        <div className="flex items-start gap-3">
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
              Bitácora de Viajes
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleExportReporte}
            disabled={!vehiculoSeleccionado || isExporting || loading}
            className={cn(
              "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-transparent px-4 text-xs font-bold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40",
              (!vehiculoSeleccionado || isExporting || loading) &&
                "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent",
            )}
          >
            {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Exportar Reporte
          </button>
          <button
            type="button"
            onClick={() => setView({ mode: "create" })}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-celeste-trifinio px-5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Registrar Viaje
          </button>
        </div>
      </div>

      <BitacoraStatsCards metrics={metricas} filtroVehiculo={vehiculoFilter !== TODOS_VEHICULOS} />

      <div className="mt-2 px-3 sm:px-0">
        <GestionVehiculosTableShell
          toolbar={
            <>
              <div className="relative min-w-0 w-full lg:min-w-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
                <input
                  type="text"
                  placeholder="Buscar por destino, placa, conductor o vale..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
                />
              </div>

              <Select value={vehiculoFilter} onValueChange={setVehiculoFilter}>
                <SelectTrigger className={filtroTriggerClass}>
                  <SelectValue placeholder="Todos los vehículos" />
                </SelectTrigger>
                <SelectContent position="popper" className={filtroContentClass}>
                  <SelectItem
                    value={TODOS_VEHICULOS}
                    textValue="Todos los vehículos"
                    className={filtroItemClass}
                  >
                    Todos los vehículos
                  </SelectItem>
                  {vehiculos
                    .filter((v) => v.id)
                    .map((v) => {
                      const label = formatVehiculoOpcion(v);
                      return (
                        <SelectItem
                          key={v.id}
                          value={v.id as string}
                          textValue={label}
                          className={filtroItemClass}
                        >
                          {label}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </>
          }
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : bitacorasFiltradas.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <BookOpen className="mx-auto mb-4 size-10 text-celeste-trifinio/70" />
              <p className="font-semibold text-foreground">
                {hayFiltros ? "Sin coincidencias" : "Sin bitácoras"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hayFiltros
                  ? "Prueba con otro destino, placa o vehículo."
                  : "Aún no se ha registrado ningún viaje en la bitácora digital."}
              </p>
            </div>
          ) : (
            <BitacorasList bitacoras={bitacorasFiltradas} />
          )}
        </GestionVehiculosTableShell>
      </div>
    </div>
  );
}
