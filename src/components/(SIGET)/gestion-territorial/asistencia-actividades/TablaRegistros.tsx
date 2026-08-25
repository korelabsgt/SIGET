"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Ellipsis,
  EllipsisVertical,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  ArrowDownToLine,
  ClipboardList,
  Users,
  UserCheck,
  CalendarCheck,
  Search,
  SearchCheck,
} from "lucide";
import {
  ChevronLeft as ChevronLeftNav,
  ChevronRight as ChevronRightNav,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { MorphCycleIcon } from "@/components/ui/morph-cycle-icon";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { RegistroAsistenciaRecord } from "./lib/zod";
import {
  formatoDpiVisible,
  formatoTelefonoVisible,
  telefonoWhatsAppUrl,
} from "./lib/zod";
import { formatFechaTablaGt, formatHoraTablaGt } from "@/lib/fechas-gt";
import { useEliminarRegistro } from "./lib/hooks";
import { confirmQuitarActividad } from "./lib/swal";
import { downloadAsistenciaExcel } from "./lib/asistencia-excel";
import { EditarRegistro } from "./forms/EditarRegistro";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

const REGISTROS_ICON_CYCLE = [
  ClipboardList,
  Users,
  UserCheck,
  CalendarCheck,
] as const;

const thClass =
  "px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio";
const tdClass = "px-3 py-3 align-middle";

function celdaOpcional(value: string | null) {
  return value?.trim() ? value : "—";
}

function etiquetaGenero(genero: RegistroAsistenciaRecord["genero"]) {
  return genero === "masculino" ? "Masculino" : "Femenino";
}

function CeldaTelefono({ telefono }: { telefono: string | null }) {
  const url = telefonoWhatsAppUrl(telefono);
  if (!url) return <>—</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="whitespace-nowrap font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
    >
      {formatoTelefonoVisible(telefono)}
    </a>
  );
}

function CeldaRegistro({
  createdAt,
  registro,
  rowHovered,
  onEdit,
  onDelete,
  deleting,
}: {
  createdAt: string;
  registro: RegistroAsistenciaRecord;
  rowHovered: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="inline-flex items-center justify-end gap-1">
      <div className="text-right leading-tight">
        <p className="text-[10px] font-semibold text-foreground">
          {formatFechaTablaGt(createdAt)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {formatHoraTablaGt(createdAt)}
        </p>
      </div>
      <span className="inline-flex size-6 shrink-0 items-center justify-center">
        <MenuAccionesRegistro
          registro={registro}
          rowHovered={rowHovered}
          onEdit={onEdit}
          onDelete={onDelete}
          deleting={deleting}
        />
      </span>
    </div>
  );
}

const REGISTRO_COL_MIN = "min-w-[9rem]";

const tablaSurface = "bg-card dark:bg-zinc-900";
const tablaHeadSurface = "bg-sky-50 dark:bg-sky-950";
const tablaRowHover =
  "hover:bg-sky-50 dark:hover:bg-sky-950 group-hover:bg-sky-50 dark:group-hover:bg-sky-950";

const COL_CORREO_ANCHO = "w-[14rem] min-w-[14rem] max-w-[14rem]";
const COL_CORREO_PX = 224;
const COL_INST_ANCHO = "w-[10rem] min-w-[10rem] max-w-[10rem]";
const COL_INST_PX = 160;
const COL_PUESTO_ANCHO = "w-[10rem] min-w-[10rem] max-w-[10rem]";
const COL_PUESTO_PX = 160;

const thCompact = cn(thClass, "whitespace-nowrap");
const tdCompact = cn(tdClass, "whitespace-nowrap");

const EXPAND_TRANSITION = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

const celdaTextoMultilinea = "block line-clamp-2 break-words leading-snug";

const tdBody = cn(tdCompact, tablaSurface, tablaRowHover);
const tdColTexto = cn(tdClass, tablaSurface, tablaRowHover, COL_CORREO_ANCHO);
const thColTexto = cn(thClass, COL_CORREO_ANCHO);
const tdNombre = cn(
  tdClass,
  tablaSurface,
  tablaRowHover,
  "min-w-[12rem] max-w-[20rem]",
);

const stickyRegistroTh = cn(
  thCompact,
  REGISTRO_COL_MIN,
  "sticky right-0 z-30 text-right",
  tablaHeadSurface,
);

const stickyRegistroTd = cn(
  tdCompact,
  REGISTRO_COL_MIN,
  "sticky right-0 z-20 text-right",
  tablaSurface,
  tablaRowHover,
);

function CeldaColumnaExpandible({
  abierto,
  maxWidth,
  anchoClass,
  children,
}: {
  abierto: boolean;
  maxWidth: number;
  anchoClass: string;
  children: React.ReactNode;
}) {
  return (
    <td className="w-0 p-0 align-middle">
      <motion.div
        initial={false}
        animate={{
          width: abierto ? maxWidth : 0,
          opacity: abierto ? 1 : 0,
        }}
        transition={EXPAND_TRANSITION}
        className="overflow-hidden"
      >
        <div className={cn(tdClass, tablaSurface, tablaRowHover, anchoClass, "text-xs text-foreground")}>
          {children}
        </div>
      </motion.div>
    </td>
  );
}

function EncabezadoColumnaExpandible({
  abierto,
  maxWidth,
  anchoClass,
  children,
}: {
  abierto: boolean;
  maxWidth: number;
  anchoClass: string;
  children: React.ReactNode;
}) {
  return (
    <th className="w-0 p-0 align-middle">
      <motion.div
        initial={false}
        animate={{
          width: abierto ? maxWidth : 0,
          opacity: abierto ? 1 : 0,
        }}
        transition={EXPAND_TRANSITION}
        className="overflow-hidden"
      >
        <div className={cn(thClass, tablaHeadSurface, anchoClass, "whitespace-nowrap")}>
          {children}
        </div>
      </motion.div>
    </th>
  );
}

function EncabezadoRegistro({
  abierto,
  onToggle,
}: {
  abierto: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full cursor-pointer items-center justify-end gap-1 border-0 bg-transparent px-3 py-3 text-inherit transition-opacity hover:opacity-80"
      aria-label={
        abierto
          ? "Ocultar institución y puesto"
          : "Mostrar institución y puesto"
      }
      aria-expanded={abierto}
    >
      <span>Mas información</span>
      <span className="inline-flex size-6 shrink-0 items-center justify-center">
        <MorphHoverIcon
          from={ChevronLeft}
          to={ChevronRight}
          hovered={abierto}
          size={14}
          color="#1a95d3"
          spring="smooth"
        />
      </span>
    </button>
  );
}

function MenuAccionesRegistro({
  registro,
  rowHovered,
  onEdit,
  onDelete,
  deleting,
}: {
  registro: RegistroAsistenciaRecord;
  rowHovered: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-azul-trifinio transition-opacity hover:opacity-70"
          aria-label={`Más acciones de ${registro.nombre}`}
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
          onSelect={onEdit}
        >
          <Pencil className="size-3.5" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 bg-white text-red-600 focus:bg-red-50 focus:text-red-600 dark:bg-zinc-900 dark:text-red-400 dark:focus:bg-red-950/60"
          disabled={deleting}
          onSelect={onDelete}
        >
          {deleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TablaRegistros({
  registros,
  actividadId,
  nombreActividad,
  isLoading,
  title = "Registros de asistencia",
}: {
  registros: RegistroAsistenciaRecord[];
  actividadId: string;
  nombreActividad: string;
  isLoading: boolean;
  title?: string;
}) {
  const [search, setSearch] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [buscarActivo, setBuscarActivo] = useState(false);
  const [excelHovered, setExcelHovered] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [editarRegistro, setEditarRegistro] =
    useState<RegistroAsistenciaRecord | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const eliminar = useEliminarRegistro(actividadId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter(
      (r) =>
        r.dpi.includes(q) ||
        r.nombre.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.telefono ?? "").includes(q.replace(/\D/g, "")) ||
        (r.institucion ?? "").toLowerCase().includes(q) ||
        (r.puesto ?? "").toLowerCase().includes(q),
    );
  }, [registros, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await confirmQuitarActividad(
      `¿Eliminar el registro de ${nombre}?`,
    );
    if (!ok) return;
    setDeletingId(id);
    const res = await eliminar.mutateAsync(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Registro eliminado.");
    } else {
      toast.error("No se pudo eliminar el registro.");
    }
  };

  const handleExport = async () => {
    if (registros.length === 0) {
      toast.warn("No hay registros para exportar.");
      return;
    }
    try {
      await downloadAsistenciaExcel(registros, nombreActividad);
      toast.success("Excel descargado.");
    } catch (err) {
      console.error("Error al generar Excel:", err);
      toast.error("No se pudo generar el Excel.");
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
        <div className="bg-celeste-trifinio pt-1">
          <div className="overflow-hidden rounded-t-2xl bg-card dark:bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center dark:border-zinc-700">
              <Skeleton className="h-5 w-48 rounded-md" />
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <Skeleton className="h-11 min-w-0 flex-1 rounded-xl" />
                <Skeleton className="h-11 w-36 shrink-0 rounded-xl" />
              </div>
            </div>
            <div className="space-y-0 p-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 border-b border-border px-4 py-3 last:border-0 dark:border-zinc-800"
                >
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-14 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900">
      <div className="bg-celeste-trifinio pt-1">
        <div className="overflow-hidden rounded-t-2xl bg-card dark:bg-zinc-900">
          <div
            className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center dark:border-zinc-700"
            onPointerEnter={() => setHeaderHovered(true)}
            onPointerLeave={() => setHeaderHovered(false)}
          >
            <div className="flex shrink-0 items-center gap-2.5">
              <MorphCycleIcon
                icons={REGISTROS_ICON_CYCLE}
                hovered={headerHovered}
                size={22}
                color="#1a95d3"
                spring="snappy"
                cycleMs={850}
              />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {title}
              </h2>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div
                className="relative min-w-0 flex-1"
                onPointerEnter={() => setBuscarActivo(true)}
                onPointerLeave={() => setBuscarActivo(false)}
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-celeste-trifinio">
                  <MorphHoverIcon
                    from={Search}
                    to={SearchCheck}
                    hovered={buscarActivo || search.trim().length > 0}
                    size={16}
                    color="currentColor"
                    spring="snappy"
                  />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setBuscarActivo(true)}
                  onBlur={() => setBuscarActivo(false)}
                  placeholder="Buscar por DPI, nombre, correo..."
                  className="h-11 w-full rounded-xl border border-celeste-trifinio/40 bg-sky-50/60 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-celeste-trifinio focus:ring-2 focus:ring-celeste-trifinio/25 dark:bg-sky-950/20"
                />
              </div>
              {registros.length > 0 ? (
                <button
                  type="button"
                  onClick={handleExport}
                  onPointerEnter={() => setExcelHovered(true)}
                  onPointerLeave={() => setExcelHovered(false)}
                  className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-600 bg-transparent px-5 text-xs font-bold uppercase tracking-widest text-green-600 transition-colors hover:bg-green-50 dark:border-green-500 dark:text-green-500 dark:hover:bg-green-950/40"
                >
                  <MorphHoverIcon
                    from={FileSpreadsheet}
                    to={ArrowDownToLine}
                    hovered={excelHovered}
                    size={18}
                    color="currentColor"
                    spring="snappy"
                  />
                  <span className="hidden sm:inline">Descargar Excel</span>
                  <span className="sm:hidden">Excel</span>
                </button>
              ) : null}
            </div>
          </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="font-semibold text-foreground">
            {registros.length === 0
              ? "Aún no hay registros de asistencia"
              : "Sin coincidencias"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {registros.length === 0
              ? "Los registros del QR aparecerán aquí."
              : "Prueba con otro DPI, nombre o correo."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-left text-sm">
            <thead>
              <tr className={cn("border-b border-border dark:border-zinc-700", tablaHeadSurface)}>
                <th className={thCompact}>DPI</th>
                <th className={cn(thClass, "min-w-[12rem]")}>Nombre</th>
                <th className={cn(thCompact, "text-center")}>Género</th>
                <th className={thColTexto}>Correo</th>
                <th className={thCompact}>Teléfono</th>
                <EncabezadoColumnaExpandible
                  abierto={detalleAbierto}
                  maxWidth={COL_INST_PX}
                  anchoClass={COL_INST_ANCHO}
                >
                  Institución
                </EncabezadoColumnaExpandible>
                <EncabezadoColumnaExpandible
                  abierto={detalleAbierto}
                  maxWidth={COL_PUESTO_PX}
                  anchoClass={COL_PUESTO_ANCHO}
                >
                  Puesto
                </EncabezadoColumnaExpandible>
                <th className={cn(stickyRegistroTh, "p-0")}>
                  <EncabezadoRegistro
                    abierto={detalleAbierto}
                    onToggle={() => setDetalleAbierto((v) => !v)}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  onMouseEnter={() => setHoveredRowId(r.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  className={cn(
                    "group border-b border-border last:border-0 dark:border-zinc-800",
                    tablaSurface,
                    tablaRowHover,
                  )}
                >
                  <td
                    className={cn(
                      tdBody,
                      "font-mono text-xs tabular-nums text-foreground",
                    )}
                  >
                    {formatoDpiVisible(r.dpi)}
                  </td>
                  <td
                    className={cn(
                      tdNombre,
                      "font-semibold text-foreground",
                    )}
                  >
                        <span className={celdaTextoMultilinea} title={r.nombre}>
                      {r.nombre}
                    </span>
                  </td>
                  <td
                    className={cn(
                      tdBody,
                      "text-center text-xs text-foreground",
                    )}
                  >
                    {etiquetaGenero(r.genero)}
                  </td>
                  <td className={cn(tdColTexto, "text-xs text-foreground")}>
                    <span
                        className={cn(celdaTextoMultilinea, "break-all")}
                      title={r.email ?? undefined}
                    >
                      {celdaOpcional(r.email)}
                    </span>
                  </td>
                  <td className={cn(tdBody, "text-xs")}>
                    <CeldaTelefono telefono={r.telefono} />
                  </td>
                  <CeldaColumnaExpandible
                    abierto={detalleAbierto}
                    maxWidth={COL_INST_PX}
                    anchoClass={COL_INST_ANCHO}
                  >
                    <span
                      className={celdaTextoMultilinea}
                      title={r.institucion ?? undefined}
                    >
                      {celdaOpcional(r.institucion)}
                    </span>
                  </CeldaColumnaExpandible>
                  <CeldaColumnaExpandible
                    abierto={detalleAbierto}
                    maxWidth={COL_PUESTO_PX}
                    anchoClass={COL_PUESTO_ANCHO}
                  >
                    <span
                      className={celdaTextoMultilinea}
                      title={r.puesto ?? undefined}
                    >
                      {celdaOpcional(r.puesto)}
                    </span>
                  </CeldaColumnaExpandible>
                  <td className={stickyRegistroTd}>
                    <CeldaRegistro
                      createdAt={r.created_at}
                      registro={r}
                      rowHovered={hoveredRowId === r.id}
                      onEdit={() => setEditarRegistro(r)}
                      onDelete={() => handleDelete(r.id, r.nombre)}
                      deleting={deletingId === r.id}
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border px-4 py-3 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageSafe <= 1}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 text-celeste-trifinio transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-sky-950/40"
          aria-label="Página anterior"
        >
          <ChevronLeftNav className="size-5" />
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
          <ChevronRightNav className="size-5" />
        </button>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="h-9 cursor-pointer rounded-lg border-0 bg-transparent px-2 text-sm font-bold text-celeste-trifinio outline-none focus:ring-2 focus:ring-celeste-trifinio/25"
          aria-label="Filas por página"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <EditarRegistro
        open={editarRegistro !== null}
        registro={editarRegistro}
        actividadId={actividadId}
        onClose={() => setEditarRegistro(null)}
      />
        </div>
      </div>
    </div>
  );
}
