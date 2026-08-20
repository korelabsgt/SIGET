"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Loader2,
  FileText,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  deleteProyectoMemoria,
  getAutofillInformeUsuario,
  getProyectosMemoria,
} from "./lib/actions";
import { confirmQuitarMemoria } from "./lib/swal";
import { TITULO_INFORME_MEMORIA } from "./lib/zod";
import {
  formatMemoriaPeriodo,
  filtroPeriodoActual,
  memoriaCoincidePeriodo,
  sortMemoriasPorMesDir,
} from "./lib/helpers";
import type { FiltroPeriodoMemoria, ProyectosMemoria } from "./lib/zod";
import Crear from "./forms/Crear";
import VerEditar from "./forms/VerEditar";
import { InformeMemoriaVista } from "./InformeMemoriaVista";
import { MemoriaPeriodoFiltro } from "./MemoriaPeriodoFiltro";

type View =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; memoria: ProyectosMemoria };

type TabMemoria = "propios" | "otras";

const TODOS = "__todos__";

const filterSelectClass =
  "h-10 w-full min-w-0 rounded-xl border border-border bg-card pl-3 pr-10 text-sm font-semibold text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-celeste-trifinio dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function InformeMemoriaAccordion({
  informe,
  canDelete,
  open,
  onToggle,
  onEdit,
  onDelete,
}: {
  informe: ProyectosMemoria;
  canDelete: boolean;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group w-full">
      <InformeMemoriaVista
        cargo={informe.cargo}
        nombre={informe.nombre}
        oficina={informe.oficina}
        proyectos={informe.proyectos}
        imagenes={informe.imagenes}
        periodo={informe.periodo}
        createdAt={informe.created_at}
        updatedAt={informe.updated_at}
        accordionOpen={open}
        onAccordionToggle={onToggle}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-100 px-3 text-xs font-bold text-azul-trifinio transition-colors hover:bg-sky-200 cursor-pointer dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}

export default function ProyectosMemoriaList() {
  const router = useRouter();
  const { effectiveRole, user } = useUserContext();
  const roleNormalized = effectiveRole.toLowerCase();
  const canViewAll =
    roleNormalized === "super" || roleNormalized.includes("admin");
  const canVerOtrasOficinas =
    canViewAll || roleNormalized === "comunicacion";
  const canDelete = canViewAll;

  const [view, setView] = useState<View>({ mode: "list" });
  const [tabActiva, setTabActiva] = useState<TabMemoria>("propios");
  const [miOficina, setMiOficina] = useState("");
  const [memorias, setMemorias] = useState<ProyectosMemoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroInformante, setFiltroInformante] = useState(TODOS);
  const [filtroOficina, setFiltroOficina] = useState(TODOS);
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodoMemoria>(
    filtroPeriodoActual,
  );
  const [ordenMesDesc, setOrdenMesDesc] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const load = () => {
    setLoading(true);
    getProyectosMemoria()
      .then((data) => {
        setMemorias(data);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error al cargar"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    getAutofillInformeUsuario()
      .then((data) => {
        if (data?.oficina?.trim()) {
          setMiOficina(data.oficina.trim());
        }
      })
      .catch(() => {});
  }, []);

  const esInformePropio = useCallback(
    (memoria: ProyectosMemoria) => {
      const oficinaMemoria = memoria.oficina?.trim() ?? "";
      if (miOficina && oficinaMemoria) {
        return oficinaMemoria === miOficina;
      }
      if (user?.id && memoria.created_by) {
        return memoria.created_by === user.id;
      }
      return true;
    },
    [miOficina, user?.id],
  );

  const memoriasPorTab = useMemo(() => {
    if (!canVerOtrasOficinas || tabActiva === "propios") {
      return memorias.filter(esInformePropio);
    }
    return memorias.filter((m) => !esInformePropio(m));
  }, [memorias, tabActiva, canVerOtrasOficinas, esInformePropio]);

  const informantes = useMemo(() => {
    const valores = new Set<string>();
    for (const m of memoriasPorTab) {
      const nombre = m.nombre?.trim();
      if (nombre) valores.add(nombre);
    }
    return Array.from(valores).sort((a, b) => a.localeCompare(b, "es"));
  }, [memoriasPorTab]);

  const oficinas = useMemo(() => {
    const valores = new Set<string>();
    for (const m of memoriasPorTab) {
      const oficina = m.oficina?.trim();
      if (oficina) valores.add(oficina);
    }
    return Array.from(valores).sort((a, b) => a.localeCompare(b, "es"));
  }, [memoriasPorTab]);

  const memoriasFiltradas = useMemo(() => {
    return sortMemoriasPorMesDir(
      memoriasPorTab.filter((m) => {
        const coincideInformante =
          filtroInformante === TODOS ||
          m.nombre?.trim() === filtroInformante;
        const coincideOficina =
          filtroOficina === TODOS || m.oficina?.trim() === filtroOficina;
        const coincidePeriodo = memoriaCoincidePeriodo(m, filtroPeriodo);
        return coincideInformante && coincideOficina && coincidePeriodo;
      }),
      ordenMesDesc,
    );
  }, [
    memoriasPorTab,
    filtroInformante,
    filtroOficina,
    filtroPeriodo,
    ordenMesDesc,
  ]);

  useEffect(() => {
    setFiltroInformante(TODOS);
    setFiltroOficina(TODOS);
  }, [tabActiva]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (m: ProyectosMemoria) => {
    const result = await confirmQuitarMemoria({
      title: "¿Eliminar informe?",
      text: `${TITULO_INFORME_MEMORIA} — ${formatMemoriaPeriodo(m)}`,
      confirmButtonText: "Sí, eliminar",
    });
    if (!result.isConfirmed) return;

    startTransition(async () => {
      try {
        await deleteProyectoMemoria(m.id);
        setMemorias((prev) => prev.filter((x) => x.id !== m.id));
        setOpenIds((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "No se pudo eliminar.",
        );
      }
    });
  };

  if (view.mode !== "list") {
    return (
      <div className="mx-auto w-full px-0 pt-6 sm:px-6 md:pt-10 lg:px-8 xl:w-[80%]">
        {view.mode === "create" ? (
          <Crear
            onBack={() => setView({ mode: "list" })}
            onSaved={() => {
              setView({ mode: "list" });
              load();
            }}
          />
        ) : (
          <VerEditar
            initial={view.memoria}
            onBack={() => setView({ mode: "list" })}
            onSaved={() => {
              setView({ mode: "list" });
              load();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-0 pt-6 pb-20 sm:px-6 md:pt-10 lg:px-8 xl:w-[80%]">
      <div className="mb-4 flex items-start gap-3 px-3 sm:mb-8 sm:px-0">
        <button
          type="button"
          onClick={() => router.push("/siget")}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
            Plan Trifinio
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
            {TITULO_INFORME_MEMORIA}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informes institucionales recopilados por período.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView({ mode: "create" })}
          className="hidden h-11 shrink-0 items-center gap-2 rounded-xl bg-azul-trifinio px-5 text-white font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all active:scale-95 cursor-pointer lg:flex"
        >
          <Plus className="w-4 h-4" />
          Nuevo informe
        </button>
      </div>

      <button
        type="button"
        onClick={() => setView({ mode: "create" })}
        className="mb-4 flex h-11 w-full items-center justify-center gap-2 bg-azul-trifinio text-white font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all active:scale-95 cursor-pointer lg:hidden"
      >
        <Plus className="w-4 h-4" />
        Nuevo informe
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center px-3 py-24 sm:px-0">
          <Loader2 className="w-10 h-10 animate-spin text-celeste-trifinio mb-4" />
          <p className="text-muted-foreground">Cargando informes...</p>
        </div>
      ) : error ? (
        <div className="mx-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive sm:mx-0">
          {error}
        </div>
      ) : memorias.length === 0 ? (
        <div className="px-3 text-center py-24 sm:px-0">
          <div className="w-20 h-20 bg-muted dark:bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Aún no hay informes registrados
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Cree el primer informe de memoria de labores usando el botón “Nuevo
            informe”.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full sm:gap-6">
          {canVerOtrasOficinas && (
            <div className="flex flex-wrap gap-2 px-3 sm:px-0">
              <button
                type="button"
                onClick={() => setTabActiva("propios")}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-5 text-xs font-bold uppercase tracking-wider transition-colors",
                  tabActiva === "propios"
                    ? "bg-azul-trifinio text-white hover:opacity-90"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600",
                )}
              >
                Propios
              </button>
              <button
                type="button"
                onClick={() => setTabActiva("otras")}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center justify-center rounded-xl px-5 text-xs font-bold uppercase tracking-wider transition-colors",
                  tabActiva === "otras"
                    ? "bg-azul-trifinio text-white hover:opacity-90"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600",
                )}
              >
                Otras oficinas
              </button>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-2xl border border-border bg-card/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </div>
              <motion.p
                key={`${memoriasFiltradas.length}-${filtroPeriodo.anio}-${filtroPeriodo.mes}-${ordenMesDesc}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="max-w-[60%] text-right text-[10px] leading-snug text-muted-foreground sm:max-w-none sm:text-xs"
              >
                {memoriasFiltradas.length} informe
                {memoriasFiltradas.length !== 1 ? "s" : ""} ·{" "}
                {filtroPeriodo.mes === null
                  ? `año ${filtroPeriodo.anio}`
                  : "mes seleccionado"}{" "}
                · orden{" "}
                {ordenMesDesc ? "más reciente primero" : "más antiguo primero"}
              </motion.p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-2">
              {canViewAll && (
                <label className="grid w-full gap-1.5 lg:min-w-0 lg:flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Informante
                  </span>
                  <select
                    value={filtroInformante}
                    onChange={(e) => setFiltroInformante(e.target.value)}
                    className={filterSelectClass}
                  >
                    <option value={TODOS}>Todos los informantes</option>
                    {informantes.map((nombre) => (
                      <option key={nombre} value={nombre}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="grid w-full gap-1.5 lg:min-w-0 lg:flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Oficina
                </span>
                <select
                  value={filtroOficina}
                  onChange={(e) => setFiltroOficina(e.target.value)}
                  className={filterSelectClass}
                >
                  <option value={TODOS}>Todas las oficinas</option>
                  {oficinas.map((oficina) => (
                    <option key={oficina} value={oficina}>
                      {oficina}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid w-full justify-items-center gap-1.5 lg:ml-auto lg:w-auto lg:shrink-0 lg:justify-items-end">
                <span className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:text-right">
                  Período de reporte
                </span>
                <MemoriaPeriodoFiltro
                  value={filtroPeriodo}
                  onChange={setFiltroPeriodo}
                  ordenDesc={ordenMesDesc}
                  onOrdenToggle={() => setOrdenMesDesc((v) => !v)}
                />
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="popLayout">
          {memoriasFiltradas.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mx-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center sm:mx-0 dark:border-zinc-800"
            >
              <p className="text-sm font-semibold text-foreground">
                {tabActiva === "otras"
                  ? "No hay informes de otras oficinas con los filtros seleccionados"
                  : "No hay informes con los filtros seleccionados"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pruebe con otro informante, oficina o período.
              </p>
            </motion.div>
          ) : (
            <>
              {memoriasFiltradas.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(i * 0.04, 0.2),
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                <InformeMemoriaAccordion
                  informe={m}
                  canDelete={canDelete}
                  open={openIds.has(m.id)}
                  onToggle={() => toggleOpen(m.id)}
                  onEdit={() => setView({ mode: "edit", memoria: m })}
                  onDelete={() => handleDelete(m)}
                />
                </motion.div>
              ))}
            </>
          )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
