"use client";

import { useMemo, useState } from "react";
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
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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
  agruparActividadesPorMes,
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

function AsistenciaActividadesListSkeleton({
  conEncargado,
}: {
  conEncargado: boolean;
}) {
  const colSpan = conEncargado ? 6 : 5;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center dark:border-zinc-700">
        <Skeleton className="h-11 w-full rounded-xl sm:flex-1" />
        <Skeleton className="h-11 w-full rounded-xl sm:w-44" />
      </div>

      <div className="hidden md:block">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-sky-50/80 dark:border-zinc-700 dark:bg-sky-950/30">
              {Array.from({ length: colSpan }).map((_, i) => (
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
                {conEncargado && (
                  <td className="px-4 py-3">
                    <Skeleton className="mb-1.5 h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </td>
                )}
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
            {conEncargado && (
              <>
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </>
            )}
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

function EncargadoCell({ act }: { act: ActividadRecord }) {
  const nombre = etiquetaEncargado(act);
  const oficina = act.creador_oficina?.trim();
  return (
    <div className="min-w-0">
      <p className="inline-flex items-center gap-1.5 font-semibold text-foreground">
        <UserRound className="size-3.5 shrink-0 text-celeste-trifinio" />
        <span className="truncate">{nombre}</span>
      </p>
      {oficina ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{oficina}</p>
      ) : null}
    </div>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [crearOpen, setCrearOpen] = useState(false);
  const [editarActividad, setEditarActividad] = useState<ActividadRecord | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const esTabOtros = canVerOtros && tabActiva === "otros";

  const actividadesPropias = useMemo(
    () =>
      sortActividadesPorFechaDesc(
        actividades.filter((act) => esActividadPropia(act, user?.id)),
      ),
    [actividades, user?.id],
  );

  const actividadesOtros = useMemo(
    () =>
      sortActividadesPorFechaDesc(
        actividades.filter((act) => !esActividadPropia(act, user?.id)),
      ),
    [actividades, user?.id],
  );

  const baseLista = canVerOtros
    ? tabActiva === "otros"
      ? actividadesOtros
      : actividadesPropias
    : sortActividadesPorFechaDesc(actividades);

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
    return sortActividadesPorFechaDesc(lista);
  }, [baseLista, search]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, pageSafe, pageSize]);

  const gruposMesPagina = useMemo(() => {
    if (!esTabOtros) return null;
    return agruparActividadesPorMes(pageItems);
  }, [esTabOtros, pageItems]);

  const paginacionKey = `${tabActiva}|${search}|${pageSize}`;
  const [paginacionKeyPrevia, setPaginacionKeyPrevia] = useState(paginacionKey);
  if (paginacionKey !== paginacionKeyPrevia) {
    setPaginacionKeyPrevia(paginacionKey);
    setPage(1);
  }

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

  const colSpan = esTabOtros ? 6 : 5;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            Registro de actividades
          </h1>
          {canVerOtros &&
            (isLoading ? (
              <Skeleton className="h-8 w-56 shrink-0 rounded-lg" />
            ) : (
              <div className="inline-flex shrink-0 border-b border-zinc-200 dark:border-zinc-700">
                {(
                  [
                    {
                      id: "propios" as const,
                      label: "Mis actividades",
                      count: actividadesPropias.length,
                    },
                    {
                      id: "otros" as const,
                      label: "De otros",
                      count: actividadesOtros.length,
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
                        "relative inline-flex h-8 cursor-pointer items-center gap-1 border-0 bg-transparent px-3 text-[10px] font-bold uppercase tracking-wider transition-colors",
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40">
        <div className="h-1 w-full bg-celeste-trifinio" />

        {isLoading ? (
          <AsistenciaActividadesListSkeleton conEncargado={esTabOtros} />
        ) : (
          <>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center dark:border-zinc-700">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                esTabOtros
                  ? "Buscar por nombre o encargado..."
                  : "Buscar por nombre..."
              }
              className="h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setCrearOpen(true)}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-celeste-trifinio bg-transparent px-5 text-xs font-bold uppercase tracking-widest text-celeste-trifinio transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            <Plus className="size-4" />
            Nueva actividad
          </button>
        </div>

        {error ? (
          <p className="py-12 text-center text-sm text-red-500">
            No se pudieron cargar las actividades.
          </p>
        ) : filtradas.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <CalendarCheck className="mx-auto mb-4 size-10 text-celeste-trifinio/70" />
            <p className="font-semibold text-foreground">
              {search.trim()
                ? "Sin coincidencias"
                : esTabOtros
                  ? "Sin actividades de otros"
                  : "Sin actividades"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search.trim()
                ? "Prueba con otro nombre o encargado."
                : esTabOtros
                  ? "Aún no hay actividades creadas por otros usuarios."
                  : "Crea tu primera actividad para generar un QR de asistencia."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">
                    <th className="px-4 py-3">Nombre</th>
                    {esTabOtros && <th className="px-4 py-3">Encargado</th>}
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Registros</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {gruposMesPagina
                      ? gruposMesPagina.flatMap((grupo) => [
                          <tr
                            key={`mes-${grupo.mesKey}`}
                            className="border-b border-border bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/40"
                          >
                            <td colSpan={colSpan} className="px-4 py-2.5">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
                                <CalendarCheck className="size-3.5" />
                                {grupo.etiqueta}
                                <span className="font-bold tabular-nums text-muted-foreground">
                                  {grupo.actividades.length}
                                </span>
                              </div>
                            </td>
                          </tr>,
                          ...grupo.actividades.map((act) => (
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
                              className="border-b border-border last:border-0 hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
                            >
                              <td className="px-4 py-3">
                                <NombreActividadCell act={act} />
                              </td>
                              <td className="px-4 py-3">
                                <EncargadoCell act={act} />
                              </td>
                              <td
                                className="px-4 py-3 whitespace-nowrap text-xs capitalize text-muted-foreground"
                                title={formatFechaActividad(
                                  act.fecha_realizacion,
                                )}
                              >
                                {formatFechaCorta(act.fecha_realizacion)}
                              </td>
                              <td className="px-4 py-3 tabular-nums font-semibold text-foreground">
                                {act.total_registros ?? 0}
                              </td>
                              <td className="px-4 py-3">
                                <EstadoBadge activo={act.activo} />
                              </td>
                              <td className="px-4 py-3">
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
                          )),
                        ])
                      : pageItems.map((act) => (
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
                            className="border-b border-border last:border-0 hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20"
                          >
                            <td className="px-4 py-3">
                              <NombreActividadCell act={act} />
                            </td>
                            <td
                              className="px-4 py-3 whitespace-nowrap text-xs capitalize text-muted-foreground"
                              title={formatFechaActividad(
                                act.fecha_realizacion,
                              )}
                            >
                              {formatFechaCorta(act.fecha_realizacion)}
                            </td>
                            <td className="px-4 py-3 tabular-nums font-semibold text-foreground">
                              {act.total_registros ?? 0}
                            </td>
                            <td className="px-4 py-3">
                              <EstadoBadge activo={act.activo} />
                            </td>
                            <td className="px-4 py-3">
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

            <div className="md:hidden">
              {gruposMesPagina ? (
                <div className="divide-y divide-border dark:divide-zinc-800">
                  {gruposMesPagina.map((grupo) => (
                    <div key={grupo.mesKey}>
                      <div className="flex items-center gap-2 bg-zinc-50/80 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-celeste-trifinio dark:bg-zinc-800/40">
                        <CalendarCheck className="size-3.5" />
                        {grupo.etiqueta}
                        <span className="font-bold tabular-nums text-muted-foreground">
                          {grupo.actividades.length}
                        </span>
                      </div>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {grupo.actividades.map((act) => (
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
                            className="space-y-3 border-t border-border p-4 dark:border-zinc-800"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <NombreActividadCell act={act} />
                              <EstadoBadge activo={act.activo} />
                            </div>
                            <EncargadoCell act={act} />
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="capitalize">
                                  {formatFechaCorta(act.fecha_realizacion)}
                                </span>
                                <span className="tabular-nums font-semibold text-foreground">
                                  {act.total_registros ?? 0} registros
                                </span>
                              </div>
                              <div className="shrink-0">
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
                  ))}
                </div>
              ) : (
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
                        className="space-y-3 p-4"
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
                          <div className="shrink-0">
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
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
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
          </>
        )}
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
