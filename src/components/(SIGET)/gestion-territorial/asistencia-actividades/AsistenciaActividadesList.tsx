"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Ellipsis, EllipsisVertical, ExternalLink } from "lucide";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fechaCalendarioGt } from "@/lib/fechas-gt";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActividades, useEliminarActividad } from "./lib/hooks";
import { confirmQuitarActividad } from "./lib/swal";
import { CrearActividad } from "./forms/Crear";
import { VerEditarActividad } from "./forms/VerEditar";
import type { ActividadRecord } from "./lib/zod";
import { formatFechaActividad, normalizarFechaInput } from "./lib/zod";
import {
  canEliminarActividadAsistencia,
  esActividadPropia,
  etiquetaEncargado,
  isPrivilegedAsistenciaRole,
  sortActividadesPorFechaDesc,
  type TabAsistenciaActividades,
  rutaDetalleActividadAsistencia,
} from "./lib/helpers";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 15;

const MapaActividades = dynamic(
  () => import("./MapaActividades").then((m) => m.MapaActividades),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-0 w-full flex-1 animate-pulse rounded-2xl border border-border bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
    ),
  },
);

function formatFechaCorta(fecha: string): string {
  try {
    const [y, m, d] = normalizarFechaInput(fecha).split("-").map(Number);
    if (!y || !m || !d) return fecha;
    return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fecha;
  }
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        activo
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      )}
    >
      {activo ? "Activa" : "Inactiva"}
    </span>
  );
}

const MESES_CORTOS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

function anioDesdeFiltro(value: string, fallback: number): number {
  const y = Number(value.slice(0, 4));
  return Number.isFinite(y) && y >= 2000 ? y : fallback;
}

function etiquetaFiltroPeriodo(value: string, anioVista: number): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const mes = Number(value.slice(5, 7));
    const label = MESES_CORTOS[mes - 1];
    return label ? `${label} ${value.slice(0, 4)}` : String(anioVista);
  }
  return String(anioVista);
}

function FiltroPeriodo({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const anioActual = Number(fechaCalendarioGt().slice(0, 4));
  const [open, setOpen] = useState(false);
  const [anioVista, setAnioVista] = useState(() =>
    anioDesdeFiltro(value, anioActual),
  );

  const mesSel =
    /^\d{4}-\d{2}$/.test(value) && Number(value.slice(0, 4)) === anioVista
      ? Number(value.slice(5, 7))
      : 0;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setAnioVista(anioDesdeFiltro(value, anioActual));
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filtrar por mes o año"
          className="inline-flex h-11 w-[7.25rem] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 px-1 text-center text-sm font-bold uppercase tracking-wide text-foreground outline-none transition-colors focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
        >
          {etiquetaFiltroPeriodo(value, anioVista)}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[200] w-[15.5rem] border border-border bg-white p-3 opacity-100 dark:bg-zinc-900"
      >
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Año anterior"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-celeste-trifinio hover:bg-sky-50 dark:hover:bg-sky-950/40"
            onClick={() => setAnioVista((y) => y - 1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="h-8 min-w-[4.5rem] cursor-pointer rounded-lg text-sm font-black text-celeste-trifinio hover:bg-sky-50 dark:hover:bg-sky-950/40"
            onClick={() => {
              onChange(String(anioVista));
              setOpen(false);
            }}
          >
            {anioVista}
          </button>
          <button
            type="button"
            aria-label="Año siguiente"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-celeste-trifinio hover:bg-sky-50 dark:hover:bg-sky-950/40"
            onClick={() => setAnioVista((y) => y + 1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MESES_CORTOS.map((mes, i) => {
            const mm = String(i + 1).padStart(2, "0");
            const next = `${anioVista}-${mm}`;
            const activo = mesSel === i + 1;
            return (
              <button
                key={mes}
                type="button"
                className={cn(
                  "h-8 cursor-pointer rounded-lg text-[11px] font-bold uppercase tracking-wider",
                  activo
                    ? "bg-celeste-trifinio text-white"
                    : "text-foreground hover:bg-sky-50 dark:hover:bg-sky-950/40",
                )}
                onClick={() => {
                  onChange(next);
                  setOpen(false);
                }}
              >
                {mes}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="mt-2 h-8 w-full cursor-pointer rounded-lg text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-sky-50 dark:hover:bg-sky-950/40"
          onClick={() => {
            onChange("");
            setAnioVista(anioActual);
            setOpen(false);
          }}
        >
          Todos
        </button>
      </PopoverContent>
    </Popover>
  );
}

function NombreActividadCell({ act }: { act: ActividadRecord }) {
  const creador = etiquetaEncargado(act);

  return (
    <div className="min-w-0">
      <p className="font-semibold text-foreground">{act.nombre}</p>
      {creador !== "Sin encargado" ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-bold">Por:</span> {creador}
        </p>
      ) : null}
    </div>
  );
}

function AccionesRow({
  act,
  canDelete,
  deletingId,
  onEdit,
  onDelete,
  rowHovered = false,
}: {
  act: ActividadRecord;
  canDelete: boolean;
  deletingId: string | null;
  onEdit: (act: ActividadRecord) => void;
  onDelete: (act: ActividadRecord) => void;
  rowHovered?: boolean;
}) {
  const href = rutaDetalleActividadAsistencia(act);
  const isDeleting = deletingId === act.id;

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={href}
        className="inline-flex h-8 cursor-pointer flex-row items-center gap-1.5 rounded-lg border-0 bg-sky-100 px-3 text-[10px] font-bold uppercase tracking-wide text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
      >
        <MorphHoverIcon
          from={ExternalLink}
          to={ArrowUpRight}
          hovered={rowHovered}
          size={14}
          color="#1a95d3"
          spring="snappy"
          className="shrink-0"
        />
        <span>Entrar</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-sky-100 text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900"
            aria-label={`Más acciones de ${act.nombre}`}
          >
            <MorphHoverIcon
              from={EllipsisVertical}
              to={Ellipsis}
              hovered={rowHovered}
              size={16}
              color="#1a95d3"
              spring="snappy"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-[200] min-w-[10rem] border border-border bg-white p-1 text-foreground opacity-100 shadow-lg dark:bg-zinc-900"
        >
          <DropdownMenuItem
            className="cursor-pointer gap-2 bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800"
            onSelect={() => onEdit(act)}
          >
            <Pencil className="size-3.5" />
            Editar
          </DropdownMenuItem>
          {canDelete ? (
            <DropdownMenuItem
              className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
              disabled={isDeleting}
              onSelect={() => onDelete(act)}
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Eliminar
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AsistenciaActividadesListSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center dark:border-zinc-700">
        <Skeleton className="h-11 w-full rounded-xl sm:flex-1" />
        <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
      </div>

      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-sky-50/80 dark:border-zinc-700 dark:bg-sky-950/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-16 rounded-md" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, row) => (
              <tr
                key={row}
                className="border-b border-border last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
                  <Skeleton className="mb-1.5 h-4 w-48 max-w-full rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-8 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border md:hidden dark:divide-zinc-800">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-3/5 rounded-md" />
              <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-3">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-4 w-10 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-14 rounded-lg" />
      </div>
    </>
  );
}

export default function AsistenciaActividadesList() {
  const router = useRouter();
  const { effectiveRole, user } = useUserContext();
  const canVerOtros = isPrivilegedAsistenciaRole(effectiveRole);
  const canDelete = canEliminarActividadAsistencia(effectiveRole);
  const { data: actividades = [], isLoading, error } = useActividades();
  const eliminar = useEliminarActividad();

  const [tabActiva, setTabActiva] =
    useState<TabAsistenciaActividades>("propios");
  const [search, setSearch] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarActividad, setEditarActividad] = useState<ActividadRecord | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [actividadMapaId, setActividadMapaId] = useState<string | null>(null);
  const [actividadMapaFoco, setActividadMapaFoco] = useState(0);

  const esTabTodas = canVerOtros && tabActiva === "todas";

  const actividadesPropias = useMemo(
    () =>
      sortActividadesPorFechaDesc(
        actividades.filter((act) => esActividadPropia(act, user?.id)),
      ),
    [actividades, user?.id],
  );

  const actividadesTodas = useMemo(
    () => sortActividadesPorFechaDesc(actividades),
    [actividades],
  );

  const baseLista = canVerOtros
    ? tabActiva === "todas"
      ? actividadesTodas
      : actividadesPropias
    : actividadesTodas;

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    const lista = !q
      ? baseLista
      : baseLista.filter((act) => {
          const nombre = act.nombre.toLowerCase();
          const creador = (act.creador_nombre ?? "").toLowerCase();
          const oficina = (act.creador_oficina ?? "").toLowerCase();
          return (
            nombre.includes(q) || creador.includes(q) || oficina.includes(q)
          );
        });
    const porMes = !filtroMes
      ? lista
      : lista.filter((act) =>
          normalizarFechaInput(act.fecha_realizacion).startsWith(filtroMes),
        );
    return sortActividadesPorFechaDesc(porMes);
  }, [baseLista, search, filtroMes]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, pageSafe, pageSize]);

  const paginacionKey = `${tabActiva}|${search}|${filtroMes}|${pageSize}`;
  const [paginacionKeyPrevia, setPaginacionKeyPrevia] = useState(paginacionKey);
  if (paginacionKey !== paginacionKeyPrevia) {
    setPaginacionKeyPrevia(paginacionKey);
    setPage(1);
  }

  const mostrarEnMapa = (act: ActividadRecord) => {
    if (act.latitud == null || act.longitud == null) {
      toast.warn("Esta actividad no tiene ubicación en el mapa.");
      return;
    }
    setActividadMapaId(act.id);
    setActividadMapaFoco((n) => n + 1);
    window.requestAnimationFrame(() => {
      document.getElementById("mapa-actividades")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleDelete = async (act: ActividadRecord) => {
    const ok = await confirmQuitarActividad(
      `¿Eliminar la actividad «${act.nombre}» y todos sus registros?`,
    );
    if (!ok) return;
    setDeletingId(act.id);
    const res = await eliminar.mutateAsync(act.id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Actividad eliminada.");
    } else {
      toast.error("No se pudo eliminar la actividad.");
    }
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col px-1.5 py-3 lg:overflow-hidden">
      <div className="mb-3 shrink-0">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
          <h1 className="w-full text-center text-2xl font-black text-foreground sm:w-auto sm:text-left sm:text-3xl">
            Registro de actividades
          </h1>
          {canVerOtros &&
            (isLoading ? (
              <Skeleton className="h-8 w-full rounded-lg sm:w-56 sm:shrink-0" />
            ) : (
              <div className="flex w-full border-b border-zinc-200 dark:border-zinc-700 sm:inline-flex sm:w-auto sm:shrink-0">
                {(
                  [
                    {
                      id: "propios" as const,
                      label: "Mis actividades",
                      count: actividadesPropias.length,
                    },
                    {
                      id: "todas" as const,
                      label: "Todas",
                      count: actividadesTodas.length,
                    },
                  ] as const
                ).map((tab) => {
                  const active = tabActiva === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabActiva(tab.id)}
                      className={cn(
                        "relative inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 border-0 bg-transparent px-3 text-[10px] font-bold uppercase tracking-wider transition-colors sm:flex-none",
                        active
                          ? "text-celeste-trifinio"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab.label}
                      <span
                        className={cn(
                          "tabular-nums",
                          active
                            ? "text-celeste-trifinio/80"
                            : "text-muted-foreground/70",
                        )}
                      >
                        {tab.count}
                      </span>
                      {active ? (
                        <motion.span
                          layoutId="asistencia-tab-indicator"
                          className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-celeste-trifinio"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:overflow-hidden">
      <div className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40 lg:min-h-0 lg:flex-[3] lg:basis-0">
        <div className="h-1 w-full shrink-0 bg-celeste-trifinio" />

        {isLoading ? (
          <AsistenciaActividadesListSkeleton />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center dark:border-zinc-700">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                esTabTodas
                  ? "Buscar por nombre o encargado..."
                  : "Buscar por nombre..."
              }
              className="h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
            />
          </div>
          <div className="flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto sm:justify-start">
            <FiltroPeriodo value={filtroMes} onChange={setFiltroMes} />
            <button
              type="button"
              onClick={() => setCrearOpen(true)}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-celeste-trifinio bg-transparent px-4 text-xs font-bold uppercase tracking-widest text-celeste-trifinio transition-colors hover:bg-sky-50 sm:px-5 dark:hover:bg-sky-950/40"
            >
              <Plus className="size-4" />
              Nueva actividad
            </button>
          </div>
        </div>

        {error ? (
          <p className="flex flex-1 items-center justify-center py-12 text-center text-sm text-red-500">
            No se pudieron cargar las actividades.
          </p>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <CalendarCheck className="mx-auto mb-4 size-10 text-celeste-trifinio/70" />
            <p className="font-semibold text-foreground">
              {search.trim() || filtroMes
                ? "Sin coincidencias"
                : esTabTodas
                  ? "Sin actividades"
                  : "Sin actividades"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search.trim() || filtroMes
                ? "Prueba con otro nombre, encargado o mes."
                : esTabTodas
                  ? "Aún no hay actividades registradas."
                  : "Crea tu primera actividad para generar un QR de asistencia."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden min-h-0 flex-1 overflow-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3">Fecha</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3">Registros</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3">Estado</th>
                    <th className="w-0 whitespace-nowrap px-2 py-3 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {pageItems.map((act) => (
                      <motion.tr
                        key={act.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        onMouseEnter={() => setHoveredRowId(act.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        onClick={() => mostrarEnMapa(act)}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
                      >
                        <td className="px-4 py-3">
                          <NombreActividadCell act={act} />
                        </td>
                        <td
                          className="w-0 whitespace-nowrap px-2 py-3 text-xs capitalize text-muted-foreground"
                          title={formatFechaActividad(
                            act.fecha_realizacion,
                          )}
                        >
                          {formatFechaCorta(act.fecha_realizacion)}
                        </td>
                        <td className="w-0 whitespace-nowrap px-2 py-3 text-center tabular-nums font-semibold text-foreground">
                          {act.total_registros ?? 0}
                        </td>
                        <td className="w-0 whitespace-nowrap px-2 py-3">
                          <EstadoBadge activo={act.activo} />
                        </td>
                        <td
                          className="w-0 whitespace-nowrap px-2 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AccionesRow
                            act={act}
                            canDelete={canDelete}
                            deletingId={deletingId}
                            onEdit={setEditarActividad}
                            onDelete={handleDelete}
                            rowHovered={hoveredRowId === act.id}
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="min-h-0 flex-1 overflow-auto md:hidden">
              <div className="divide-y divide-border dark:divide-zinc-800">
                <AnimatePresence mode="popLayout" initial={false}>
                  {pageItems.map((act) => (
                    <motion.div
                      key={act.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      onMouseEnter={() => setHoveredRowId(act.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      onClick={() => mostrarEnMapa(act)}
                      className="cursor-pointer space-y-3 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <NombreActividadCell act={act} />
                        <EstadoBadge activo={act.activo} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="capitalize">
                            {formatFechaCorta(act.fecha_realizacion)}
                          </span>
                          <span className="tabular-nums font-semibold text-foreground">
                            {act.total_registros ?? 0} registros
                          </span>
                        </div>
                        <div
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AccionesRow
                            act={act}
                            canDelete={canDelete}
                            deletingId={deletingId}
                            onEdit={setEditarActividad}
                            onDelete={handleDelete}
                            rowHovered={hoveredRowId === act.id}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums text-celeste-trifinio">
            {pageSafe}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-5" />
          </button>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 cursor-pointer rounded-lg border border-celeste-trifinio/40 bg-transparent px-2 text-sm font-bold text-celeste-trifinio outline-none focus:ring-2 focus:ring-celeste-trifinio/25"
            aria-label="Filas por página"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
          </div>
        )}
      </div>

      {!isLoading ? (
        <div className="flex h-[min(22rem,60dvh)] w-full min-w-0 shrink-0 flex-col overflow-hidden lg:h-auto lg:min-h-0 lg:flex-[2] lg:basis-0 lg:shrink">
          <MapaActividades
            key="mapa-vista-general"
            actividades={filtradas}
            actividadId={actividadMapaId}
            foco={actividadMapaFoco}
            className="h-full min-h-0 flex-1"
          />
        </div>
      ) : null}
      </div>

      <CrearActividad
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreated={(slug) => {
          if (slug) {
            router.push(
              `/siget/gestion-territorial/asistencia-actividades/${slug}`,
            );
          }
        }}
      />

      <VerEditarActividad
        open={!!editarActividad}
        actividad={editarActividad}
        onClose={() => setEditarActividad(null)}
      />
    </div>
  );
}
