"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Search, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import { VehiculosList } from "./VehiculosList";
import { VehiculosCards } from "./VehiculosCards";
import { VehiculoFormModal } from "./VehiculoFormModal";
import { SubmodulosNav } from "../../SubmodulosNav";
import { getVehiculos, deleteVehiculo } from "./lib/actions";
import { type VehiculoRow, ESTADOS_VEHICULO } from "./lib/zod";
import { cn } from "@/lib/utils";

const TODOS = "__todos__";

export function VehiculosPanel() {
  const router = useRouter();
  const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState(TODOS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<VehiculoRow | null>(null);

  const loadData = () => {
    setLoading(true);
    getVehiculos()
      .then((data) => {
        setVehiculos(data);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleDelete = async (v: VehiculoRow) => {
    const result = await Swal.fire({
      title: "¿Eliminar vehículo?",
      text: `¿Está seguro que desea eliminar el vehículo con placa ${v.placa}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3f3f46",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "#18181b",
      color: "#fff",
    });

    if (result.isConfirmed) {
      try {
        await deleteVehiculo(v.id!);
        toast.success("Vehículo eliminado");
        loadData();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al eliminar");
      }
    }
  };

  return (
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[90%] relative">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)] opacity-30 z-[-1]" />
      {/* HEADER */}
      <div className="mb-6 flex items-start gap-3 px-3 sm:px-0">
        <button
          type="button"
          onClick={() => router.push("/siget")}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
            Gestión Territorial
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight uppercase">
            Flota Vehicular
          </h1>
        </div>
      </div>

      <SubmodulosNav />

      {/* TOOLBAR */}
      <div className="mb-6 rounded-2xl border border-border bg-card/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-3 sm:px-4">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* SEARCH */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por placa, marca o modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm font-semibold text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-celeste-trifinio dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* FILTER */}
          <div className="w-full sm:w-48">
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-celeste-trifinio dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value={TODOS}>Todos los estados</option>
              {ESTADOS_VEHICULO.map((est) => (
                <option key={est} value={est}>
                  {est.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* VIEW TOGGLE */}
          <div className="flex items-center rounded-xl border border-border bg-card p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold uppercase transition-colors",
                viewMode === "list"
                  ? "bg-azul-trifinio text-white"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
              )}
            >
              <ListIcon className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-bold uppercase transition-colors",
                viewMode === "cards"
                  ? "bg-azul-trifinio text-white"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Tarjetas
            </button>
          </div>

          {/* ADD BUTTON */}
          <button
            onClick={handleCreate}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-azul-trifinio px-5 text-white font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-celeste-trifinio mb-4" />
          <p className="text-muted-foreground">Cargando vehículos...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </div>
      ) : (
        <div className="px-3 sm:px-0">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Total: {vehiculosFiltrados.length}
          </p>
          {viewMode === "list" ? (
            <VehiculosList
              vehiculos={vehiculosFiltrados}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <VehiculosCards
              vehiculos={vehiculosFiltrados}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      {/* MODAL */}
      <VehiculoFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingVehiculo}
        onSaved={loadData}
      />
    </div>
  );
}
