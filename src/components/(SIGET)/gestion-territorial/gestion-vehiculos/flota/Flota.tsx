"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Car, CarFront, Check, ChevronLeft, ChevronRight, Loader2, Plus, ScanSearch, Search } from "lucide";
import { GvMorphIcon } from "../lib/morph-icon";
import { showToast } from "@/lib/notifications";
import { confirmDestructivo } from "@/lib/confirm-destructivo";

import { VehiculosPanel } from "./VehiculosPanel";
import { FlotaNotificaciones } from "./FlotaNotificaciones";
import { SubmodulosNav } from "../../SubmodulosNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEliminarVehiculo, useVehiculos } from "./lib/hooks";
import { type VehiculoRow, ESTADOS_VEHICULO } from "./lib/zod";
import { cn } from "@/lib/utils";
import { GV_MODULO_PAGE_CLASS } from "../lib/page-shell";
import { GV_FILTRO_FIELD_CLASS, GV_HEADER_OUTLINE_BUTTON_CLASS } from "../lib/gv-header-ui";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { canManageFlota } from "../lib/permissions";

const Crear = dynamic(() => import("./forms/Crear").then((m) => m.Crear));
const VerEditar = dynamic(() => import("./forms/VerEditar").then((m) => m.VerEditar));

const TODOS = "__todos__";

const ESTADO_VEHICULO_LABELS: Record<(typeof ESTADOS_VEHICULO)[number], string> = {
  LIBRE: "Libre",
  RESERVADO: "Reservado",
  EN_MANTENIMIENTO: "En mantenimiento",
};

const filtroEstadoTriggerClass = cn(
  GV_FILTRO_FIELD_CLASS,
  "cursor-pointer px-3 data-[size=default]:h-11 focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25",
);

const filtroEstadoContentClass =
  "z-[200] min-w-[var(--radix-select-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900";

const filtroEstadoItemClass =
  "cursor-pointer rounded-lg bg-white font-medium capitalize text-foreground focus:bg-sky-50 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800";

export function Flota() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const canManage = canManageFlota(effectiveRole);
  const { data: vehiculos = [], isLoading: loading, error: queryError, refetch } = useVehiculos();
  const eliminar = useEliminarVehiculo();

  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState(TODOS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inDetailView, setInDetailView] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoRow | null>(null);
  const [vehiculoParaAbrir, setVehiculoParaAbrir] = useState<VehiculoRow | null>(null);

  const error = queryError instanceof Error ? queryError.message : queryError ? "Error al cargar" : null;

  const vehiculosFiltrados = useMemo(() => {
    const filtrados = vehiculos.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q);
      const matchEstado = estadoFilter === TODOS || v.estado === estadoFilter;
      return matchSearch && matchEstado;
    });

    return filtrados.sort((a, b) => {
      const ordenA = ESTADOS_VEHICULO.indexOf(a.estado);
      const ordenB = ESTADOS_VEHICULO.indexOf(b.estado);
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.placa.localeCompare(b.placa, "es");
    });
  }, [vehiculos, searchQuery, estadoFilter]);

  const handleEdit = (v: VehiculoRow) => {
    setEditingVehiculo(v);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingVehiculo(null);
    setIsModalOpen(true);
  };

  const handleAlertVehiculo = useCallback(
    (vehiculoId: string) => {
      const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
      if (!vehiculo) return;
      setSearchQuery("");
      setEstadoFilter(TODOS);
      setVehiculoParaAbrir(vehiculo);
    },
    [vehiculos],
  );

  const handleVehiculoParaAbrirHandled = useCallback(() => {
    setVehiculoParaAbrir(null);
  }, []);

  const handleDelete = async (v: VehiculoRow): Promise<boolean> => {
    const result = await confirmDestructivo({
      title: "¿Eliminar vehículo?",
      text: `¿Está seguro que desea eliminar el vehículo con placa ${v.placa}?`,
      confirmButtonText: "Sí, eliminar",
    });

    if (!result.isConfirmed) return false;

    try {
      await eliminar.mutateAsync(v.id!);
      showToast("success", "Vehículo eliminado");
      return true;
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Error al eliminar",
      );
      return false;
    }
  };

  return (
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
      {!inDetailView ? <SubmodulosNav /> : null}

      {!inDetailView ? (
      <div className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push("/siget")}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-accent"
        >
          <GvMorphIcon icon={ChevronLeft} hoverIcon={ChevronRight} size={20} className="text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
            Gestión Territorial
          </p>
          <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
            Flota Vehicular
          </h1>
        </div>
        {!loading && canManage ? (
          <FlotaNotificaciones vehiculos={vehiculos} onSelectVehiculo={handleAlertVehiculo} />
        ) : null}
      </div>
      ) : null}

      <div
        className={cn(
          inDetailView
            ? "overflow-visible rounded-none border-0 bg-transparent dark:bg-transparent"
            : "overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40",
        )}
      >
        {inDetailView ? null : <div className="h-1 w-full bg-celeste-trifinio" />}

        {!inDetailView ? (
          <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,14rem)_auto] lg:items-center dark:border-zinc-700">
            <div className="relative min-w-0 w-full sm:col-span-2 lg:col-span-1" data-morph-hover-scope>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-celeste-trifinio">
                <GvMorphIcon icon={Search} hoverIcon={ScanSearch} size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar por placa, marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
              />
            </div>

            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className={cn(filtroEstadoTriggerClass, "w-full")}>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent position="popper" className={filtroEstadoContentClass}>
                <SelectItem value={TODOS} textValue="Todos los estados" className={filtroEstadoItemClass}>
                  Todos los estados
                </SelectItem>
                {ESTADOS_VEHICULO.map((est) => (
                  <SelectItem
                    key={est}
                    value={est}
                    textValue={ESTADO_VEHICULO_LABELS[est]}
                    className={filtroEstadoItemClass}
                  >
                    {ESTADO_VEHICULO_LABELS[est]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-full sm:col-span-2 lg:col-span-1 lg:flex lg:justify-end">
              {canManage ? (
              <button
                type="button"
                onClick={handleCreate}
                className={cn(GV_HEADER_OUTLINE_BUTTON_CLASS, "w-full lg:w-auto")}
              >
                <GvMorphIcon icon={Plus} hoverIcon={Check} size={16} />
                Añadir
              </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="inline-flex animate-spin text-celeste-trifinio">
              <GvMorphIcon icon={Loader2} size={32} morphOnHover={false} />
            </span>
          </div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-4 flex w-10 justify-center text-celeste-trifinio/70">
              <GvMorphIcon icon={Car} hoverIcon={CarFront} size={40} />
            </div>
            <p className="font-semibold text-foreground">
              {searchQuery.trim() || estadoFilter !== TODOS
                ? "Sin coincidencias"
                : "Sin vehículos"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery.trim() || estadoFilter !== TODOS
                ? "Prueba con otra placa, marca o estado."
                : "Añade el primer vehículo de la flota."}
            </p>
          </div>
        ) : (
          <VehiculosPanel
            vehiculos={vehiculosFiltrados}
            vehiculoParaAbrir={vehiculoParaAbrir}
            onVehiculoParaAbrirHandled={handleVehiculoParaAbrirHandled}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDetailViewChange={setInDetailView}
            canManage={canManage}
          />
        )}
      </div>

      {isModalOpen && editingVehiculo ? (
        <VerEditar
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialData={editingVehiculo}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : null}
      {isModalOpen && !editingVehiculo ? (
        <Crear
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : null}
    </div>
  );
}
