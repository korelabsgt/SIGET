"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  ChevronDown,
  Users,
  Mail,
  User,
  Trash2,
  Inbox,
  RotateCcw,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useRegistrosHistoricos,
  useSectores,
  useOrganizacionSectores,
} from "./lib/hooks";
import type { RegistroHistorico } from "./lib/zod";

const MONTH_FULL = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function fmt(n: number) {
  return new Intl.NumberFormat("es-GT").format(n);
}

function formatCreatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface RegistrosHistoricosProps {
  restrictByOrg?: boolean;
  userOrganizacionId?: string;
  canDelete?: boolean;
}

export default function RegistrosHistoricos({
  restrictByOrg = false,
  userOrganizacionId,
  canDelete = false,
}: RegistrosHistoricosProps) {
  const orgFilter = restrictByOrg ? userOrganizacionId : undefined;
  const enabled = !restrictByOrg || !!userOrganizacionId;

  const {
    data: registros = [],
    isLoading,
    deleteRegistro,
  } = useRegistrosHistoricos(orgFilter, enabled);

  const { data: sectores = [], isLoading: loadingSectores } = useSectores();
  const { data: orgSectorIds = [], isLoading: loadingOrgSectores } =
    useOrganizacionSectores(userOrganizacionId, restrictByOrg && enabled);

  const [activeSector, setActiveSector] = useState<string>("all");

  const visibleSectores = useMemo(() => {
    if (!restrictByOrg) return sectores;
    if (!userOrganizacionId) return [];
    return sectores.filter((s) => orgSectorIds.includes(s.id));
  }, [restrictByOrg, sectores, userOrganizacionId, orgSectorIds]);

  const effectiveSector =
    activeSector === "all" && visibleSectores.length > 0
      ? visibleSectores[0].id
      : activeSector;

  const sectorRegistros = useMemo(() => {
    if (!effectiveSector || effectiveSector === "all") return registros;
    return registros.filter((r) =>
      r.valores.some((v) => v.sectorId === effectiveSector),
    );
  }, [registros, effectiveSector]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnio, setFilterAnio] = useState<string>("all");
  const [filterMes, setFilterMes] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedId(null);
  }, [effectiveSector]);

  const availableYears = useMemo(() => {
    const years = new Set(sectorRegistros.map((r) => r.anio));
    return Array.from(years).sort((a, b) => b - a);
  }, [sectorRegistros]);

  const availableMonths = useMemo(() => {
    const source =
      filterAnio === "all"
        ? sectorRegistros
        : sectorRegistros.filter((r) => r.anio === Number(filterAnio));
    const months = new Set(source.map((r) => r.mes));
    return Array.from(months).sort((a, b) => a - b);
  }, [sectorRegistros, filterAnio]);

  const hasActiveFilters =
    searchTerm.trim() !== "" || filterAnio !== "all" || filterMes !== "all";

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sectorRegistros.filter((r) => {
      if (filterAnio !== "all" && r.anio !== Number(filterAnio)) return false;
      if (filterMes !== "all" && r.mes !== Number(filterMes)) return false;
      if (!q) return true;
      const periodo = `${MONTH_FULL[r.mes] ?? ""} ${r.anio}`.toLowerCase();
      return (
        r.organizacionNombre.toLowerCase().includes(q) ||
        periodo.includes(q) ||
        (r.creadorNombre?.toLowerCase().includes(q) ?? false) ||
        (r.creadorEmail?.toLowerCase().includes(q) ?? false) ||
        r.politicas.some(
          (p) =>
            p.codigo.toLowerCase().includes(q) ||
            p.descripcion.toLowerCase().includes(q),
        )
      );
    });
  }, [sectorRegistros, searchTerm, filterAnio, filterMes]);

  const groupedByPeriod = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; sortKey: number; registros: RegistroHistorico[] }
    >();

    for (const r of filtered) {
      const key = `${r.anio}-${String(r.mes).padStart(2, "0")}`;
      if (!groups.has(key)) {
        groups.set(key, {
          label: `${MONTH_FULL[r.mes] ?? r.mes} ${r.anio}`,
          sortKey: r.anio * 100 + r.mes,
          registros: [],
        });
      }
      groups.get(key)!.registros.push(r);
    }

    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        registros: [...g.registros].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      }))
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [filtered]);

  const handleDelete = async (registro: RegistroHistorico) => {
    const periodo = `${MONTH_FULL[registro.mes] ?? registro.mes} ${registro.anio}`;
    const result = await Swal.fire({
      title: "¿Eliminar registro?",
      html: `Se eliminará el registro de <strong>${registro.organizacionNombre}</strong> (${periodo}). Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Eliminar",
    });

    if (!result.isConfirmed) return;

    setDeletingId(registro.id);
    if (expandedId === registro.id) setExpandedId(null);
    try {
      await deleteRegistro.mutateAsync(registro.id);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterAnio("all");
    setFilterMes("all");
  };

  if (!enabled) {
    return (
      <EmptyState
        title="Sin organización asignada"
        message="No tiene una organización asignada. Contacte a un administrador para ver los registros."
      />
    );
  }

  const loading =
    isLoading || loadingSectores || (restrictByOrg && loadingOrgSectores);

  return (
    <div className="bg-card rounded-none md:rounded-[2.5rem] border border-border overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
      {!loading && visibleSectores.length > 0 && (
        <div className="flex items-center border-b border-border bg-muted/50 dark:bg-secondary/30 overflow-x-auto no-scrollbar">
          {visibleSectores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSector(s.id)}
              className={`px-8 py-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                effectiveSector === s.id
                  ? "text-purple-800 bg-purple-50 dark:bg-purple-900/20 border-b-2 border-b-purple-600 dark:text-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por organización, usuario, correo o política..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 lg:py-0 lg:px-4 border-t lg:border-t-0 lg:border-l border-border shrink-0">
            <select
              value={filterAnio}
              onChange={(e) => {
                setFilterAnio(e.target.value);
                setFilterMes("all");
              }}
              className="flex-1 lg:flex-none min-w-0 px-3 py-2 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer"
            >
              <option value="all">Todos los años</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              disabled={filterAnio === "all" && availableMonths.length === 0}
              className="flex-1 lg:flex-none min-w-0 px-3 py-2 rounded-xl border border-border bg-muted/40 dark:bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer disabled:opacity-50"
            >
              <option value="all">Todos los meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {MONTH_FULL[m]}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
                title="Limpiar filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="py-4 px-0 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
            <p className="text-muted-foreground">Cargando registros...</p>
          </div>
        ) : groupedByPeriod.length === 0 ? (
          <EmptyState
            title="No hay registros"
            message={
              hasActiveFilters
                ? "No se encontraron registros con los filtros aplicados."
                : visibleSectores.length === 0
                  ? "No tiene sectores asignados. Contacte a un administrador."
                  : "Aún no hay registros en este sector. Use la sección de Datos para crear el primero."
            }
          />
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground px-4 md:px-0">
              {fmt(filtered.length)}{" "}
              {filtered.length === 1 ? "registro" : "registros"} en{" "}
              {groupedByPeriod.length}{" "}
              {groupedByPeriod.length === 1 ? "período" : "períodos"}
            </p>

            {groupedByPeriod.map((group) => (
              <section key={group.sortKey}>
                <div className="flex items-center justify-between gap-3 mb-2 px-4 md:px-1">
                  <h3 className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    {group.label}
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                    {group.registros.length}{" "}
                    {group.registros.length === 1 ? "registro" : "registros"}
                  </span>
                </div>

                <div className="rounded-none md:rounded-2xl border-y md:border border-border overflow-hidden divide-y divide-border">
                  {group.registros.map((reg) => (
                    <RegistroRow
                      key={reg.id}
                      registro={reg}
                      sectorId={effectiveSector}
                      expanded={expandedId === reg.id}
                      canDelete={canDelete}
                      isDeleting={deletingId === reg.id}
                      onToggle={() =>
                        setExpandedId((prev) =>
                          prev === reg.id ? null : reg.id,
                        )
                      }
                      onDelete={() => handleDelete(reg)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function atencionesEnSector(
  registro: RegistroHistorico,
  sectorId: string,
): number {
  if (!sectorId || sectorId === "all") return registro.totalAtenciones;
  return registro.valores
    .filter((v) => v.sectorId === sectorId)
    .reduce((sum, v) => sum + v.cantidad, 0);
}

function RegistroRow({
  registro,
  sectorId,
  expanded,
  canDelete,
  isDeleting,
  onToggle,
  onDelete,
}: {
  registro: RegistroHistorico;
  sectorId: string;
  expanded: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const atencionesSector = atencionesEnSector(registro, sectorId);

  return (
    <div className="bg-muted/20 dark:bg-background">
      <div className="flex items-stretch min-h-[52px]">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 flex items-center gap-3 px-3 md:px-4 py-2.5 text-left cursor-pointer hover:bg-purple-50/50 dark:hover:bg-white/3 transition-colors"
        >
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-4 gap-y-1 items-center">
            <div className="min-w-0">
              <span className="text-xs font-bold text-foreground truncate block">
                {registro.organizacionNombre}
              </span>
            </div>

            <div className="min-w-0 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 shrink-0 text-purple-500" />
                <span className="font-semibold text-foreground/80 truncate">
                  {registro.creadorNombre ?? "Usuario desconocido"}
                </span>
              </div>
              {registro.creadorEmail && (
                <div className="flex items-center gap-1 truncate mt-0.5">
                  <Mail className="w-3 h-3 shrink-0 text-purple-500" />
                  <span className="truncate">{registro.creadorEmail}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0 text-purple-500" />
                <span>
                  <span className="font-bold text-foreground/80">
                    {fmt(atencionesSector)}
                  </span>{" "}
                  atenciones
                </span>
              </div>
              <div className="mt-0.5 truncate">
                {formatCreatedAt(registro.createdAt)}
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-muted-foreground shrink-0 justify-self-end transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            className="px-3 border-l border-border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            title="Eliminar registro"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detalle"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <RegistroDetalle registro={registro} sectorId={sectorId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RegistroDetalle({
  registro,
  sectorId,
}: {
  registro: RegistroHistorico;
  sectorId: string;
}) {
  const valoresSector = useMemo(() => {
    if (!sectorId || sectorId === "all") return registro.valores;
    return registro.valores.filter((v) => v.sectorId === sectorId);
  }, [registro.valores, sectorId]);

  const grupos = useMemo(() => {
    const byPolitica = new Map<
      string,
      {
        politicaCodigo: string;
        politicaDescripcion: string;
        sectorNombre: string;
        indicadores: Map<
          string,
          {
            indicadorNombre: string;
            valores: RegistroHistorico["valores"];
          }
        >;
      }
    >();

    for (const v of valoresSector) {
      const polKey = v.politicaId ?? v.politicaCodigo;
      if (!byPolitica.has(polKey)) {
        byPolitica.set(polKey, {
          politicaCodigo: v.politicaCodigo,
          politicaDescripcion: v.politicaDescripcion,
          sectorNombre: v.sectorNombre,
          indicadores: new Map(),
        });
      }
      const pol = byPolitica.get(polKey)!;
      if (!pol.indicadores.has(v.indicadorNombre)) {
        pol.indicadores.set(v.indicadorNombre, {
          indicadorNombre: v.indicadorNombre,
          valores: [],
        });
      }
      pol.indicadores.get(v.indicadorNombre)!.valores.push(v);
    }

    return Array.from(byPolitica.values())
      .map((p) => ({
        ...p,
        indicadores: Array.from(p.indicadores.values()).map((ind) => ({
          ...ind,
          valores: [...ind.valores].sort(
            (a, b) => a.campoOrden - b.campoOrden,
          ),
        })),
      }))
      .sort((a, b) =>
        a.politicaCodigo.localeCompare(b.politicaCodigo, "es", {
          numeric: true,
        }),
      );
  }, [valoresSector]);

  if (registro.valores.length === 0) {
    return (
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground italic">
          Este registro no tiene valores asociados.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 md:px-4 py-3 space-y-3 bg-card/50">
      {grupos.map((pol) => (
        <div key={pol.politicaCodigo}>
          <div className="mb-1.5 min-w-0">
            {pol.politicaDescripcion && (
              <PoliticaDescripcionFlotante
                codigo={pol.politicaCodigo}
                texto={pol.politicaDescripcion}
                sectorNombre={pol.sectorNombre}
              />
            )}
          </div>

          <div className="space-y-2">
            {pol.indicadores.map((ind) => (
              <IndicadorCollapsible
                key={ind.indicadorNombre}
                indicadorNombre={ind.indicadorNombre}
                valores={ind.valores}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const DESCRIPCION_TYPO =
  "text-[11px] font-bold leading-snug [font-size:11px] [line-height:1.375]";

const POLITICA_CODIGO_CLASS =
  "text-[9px] font-black text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0";

function PoliticaDescripcionFlotante({
  codigo,
  texto,
  sectorNombre,
}: {
  codigo: string;
  texto: string;
  sectorNombre: string;
}) {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen((prev) => !prev);

  return (
    <div
      className="relative w-full min-w-0 isolate"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div aria-hidden={open} className={open ? "invisible" : undefined}>
        <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
          {sectorNombre}
        </span>
        <div className="flex items-start gap-2 min-w-0">
          <span className={POLITICA_CODIGO_CLASS}>{codigo}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={toggleOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleOpen();
              }
            }}
            className={`flex-1 min-w-0 text-left cursor-help truncate text-foreground/80 ${DESCRIPCION_TYPO}`}
          >
            {texto}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute top-0 left-0 right-0 z-[60] rounded-md border border-border !bg-white dark:!bg-slate-900 p-2 shadow-xl ${DESCRIPCION_TYPO}`}
          >
            <span className="text-[10px] font-semibold text-muted-foreground block mb-1">
              {sectorNombre}
            </span>
            <div className="flex items-start gap-2 min-w-0">
              <span className={POLITICA_CODIGO_CLASS}>{codigo}</span>
              <span className="flex-1 min-w-0 text-purple-700 dark:text-purple-400">
                {texto}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IndicadorCollapsible({
  indicadorNombre,
  valores,
}: {
  indicadorNombre: string;
  valores: RegistroHistorico["valores"];
}) {
  const [expanded, setExpanded] = useState(false);
  const total = valores.reduce((s, v) => s + v.cantidad, 0);

  return (
    <div className="rounded-none md:rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-muted/50 dark:bg-secondary/30 hover:bg-muted/70 dark:hover:bg-secondary/50 transition-colors cursor-pointer text-left"
      >
        <p className="text-[11px] font-bold text-foreground/80 truncate min-w-0">
          {indicadorNombre}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-black text-purple-700 dark:text-purple-400">
            {fmt(total)}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="tabla"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="text-[9px] text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-3 py-1.5 font-bold">Campo</th>
                    <th className="px-3 py-1.5 font-bold">Nacionalidad</th>
                    <th className="px-3 py-1.5 font-bold">Perfil</th>
                    <th className="px-3 py-1.5 font-bold text-right">Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {valores.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-3 py-1.5 font-semibold text-foreground/80">
                        {v.campoNombre}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {v.nacionalidadNombre ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {v.perfilNombre ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-foreground">
                        {fmt(v.cantidad)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-muted dark:bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
        <Inbox className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">{message}</p>
    </div>
  );
}
