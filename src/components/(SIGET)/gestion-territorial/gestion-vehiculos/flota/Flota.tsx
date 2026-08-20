"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Search, LayoutGrid, List as ListIcon, Loader2, Car } from "lucide-react";
import { showToast } from "@/lib/notifications";
import { confirmDestructivo } from "@/lib/confirm-destructivo";

import { VehiculosPanel } from "./VehiculosPanel";
import { FlotaNotificaciones } from "./FlotaNotificaciones";
import { Crear } from "./forms/Crear";
import { VerEditar } from "./forms/VerEditar";
import { SubmodulosNav } from "../../SubmodulosNav";
import { useEliminarVehiculo, useVehiculos } from "./lib/hooks";
import { type VehiculoRow, ESTADOS_VEHICULO } from "./lib/zod";
import { cn } from "@/lib/utils";

const TODOS = "__todos__";

export function Flota() {
  const router = useRouter();
  const { data: vehiculos = [], isLoading: loading, error: queryError, refetch } = useVehiculos();
  const eliminar = useEliminarVehiculo();

  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState(TODOS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inDetailView, setInDetailView] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoRow | null>(null);

  const error = queryError instanceof Error ? queryError.message : queryError ? "Error al cargar" : null;

  const vehiculosFiltrados = useMemo(() => {
    return vehiculos.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        v.placa.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q);
      const matchEstado = estadoFilter === TODOS || v.estado === estadoFilter;
      return matchSearch && matchEstado;
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
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
      {!inDetailView ? <SubmodulosNav /> : null}

      {!inDetailView ? (
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
            Flota Vehicular
          </h1>
        </div>
        {!loading ? <FlotaNotificaciones vehiculos={vehiculos} /> : null}
      </div>
      ) : null}

      {inDetailView && !loading ? (
        <div className="mb-3 flex justify-end px-3 sm:px-0">
          <FlotaNotificaciones vehiculos={vehiculos} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card px-3 sm:px-0 dark:border-zinc-700 dark:bg-zinc-900/40">
        <div className="h-1 w-full bg-celeste-trifinio" />

        {!inDetailView ? (
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center dark:border-zinc-700">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
              <input
                type="text"
                placeholder="Buscar por placa, marca o modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
              />
            </div>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20 sm:w-48"
            >
              <option value={TODOS}>Todos los estados</option>
              {ESTADOS_VEHICULO.map((est) => (
                <option key={est} value={est}>
                  {est.replace("_", " ")}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 sm:ml-auto">
              <div className="flex items-center rounded-xl bg-zinc-200 p-1 dark:bg-zinc-700">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border-0 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    viewMode === "list"
                      ? "bg-celeste-trifinio text-white hover:opacity-90"
                      : "text-zinc-700 hover:bg-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-600",
                  )}
                >
                  <ListIcon className="size-4" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border-0 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors",
                    viewMode === "cards"
                      ? "bg-celeste-trifinio text-white hover:opacity-90"
                      : "text-zinc-700 hover:bg-zinc-300 dark:text-zinc-200 dark:hover:bg-zinc-600",
                  )}
                >
                  <LayoutGrid className="size-4" />
                  Tarjetas
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-celeste-trifinio bg-transparent px-5 text-xs font-bold uppercase tracking-widest text-celeste-trifinio transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/40"
              >
                <Plus className="size-4" />
                Añadir
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
          </div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <Car className="mx-auto mb-4 size-10 text-celeste-trifinio/70" />
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
            viewMode={viewMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDetailViewChange={setInDetailView}
          />
        )}
      </div>

      {editingVehiculo ? (
        <VerEditar
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          initialData={editingVehiculo}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : (
        <Crear
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSaved={() => {
            void refetch();
          }}
        />
      )}
    </div>
  );
}
