"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IconNode } from "lucide";
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsLeftRight,
  Ellipsis,
  EllipsisVertical,
  GitBranch,
  MapPin,
  MapPinned,
  Network,
  UserCog,
  UserRound,
  UserPlus,
  UserMinus,
  Users,
  Ban,
  CirclePlus,
  Settings2,
  Cog,
} from "lucide";
import {
  Briefcase as BriefcaseMenu,
  Move,
  Pencil,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { RippleButton } from "@/components/ui/ripple-button";
import { sigetBtnSurface } from "@/components/ui/siget-action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NodoOrganizacion } from "./lib/zod";
import { type AdminHandlers } from "./lib/org-actions";

export type { AdminHandlers };

const ACCORDION_EASE = [0.4, 0, 0.2, 1] as const;
const ROW_TRANSITION = { duration: 0.22, ease: ACCORDION_EASE };

type TreeExpansionContextValue = {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  allExpanded: boolean;
  setAllExpanded: (expanded: boolean) => void;
};

const TreeExpansionContext = createContext<TreeExpansionContextValue | null>(
  null,
);

function nodoPuedeExpandir(nodo: NodoOrganizacion): boolean {
  const hasChildren = Boolean(nodo.hijos?.length);
  if (!hasChildren) return false;
  if (nodo.tipo === "raiz" || nodo.tipo === "nivel") return true;
  return nodo.tipo === "unidad" && Boolean(nodo.tiene_jefaturas);
}

function collectExpandableIds(nodo: NodoOrganizacion): string[] {
  const ids: string[] = [];
  if (nodoPuedeExpandir(nodo)) ids.push(nodo.id);
  for (const hijo of nodo.hijos ?? []) {
    ids.push(...collectExpandableIds(hijo));
  }
  return ids;
}

type FilaVisible = {
  nodo: NodoOrganizacion;
  depth: number;
  canToggle: boolean;
  expanded: boolean;
};

function recolectarFilas(
  nodo: NodoOrganizacion,
  depth: number,
  isExpanded: (id: string) => boolean,
): FilaVisible[] {
  const canToggle = nodoPuedeExpandir(nodo);
  const expanded = canToggle && isExpanded(nodo.id);
  const fila: FilaVisible = { nodo, depth, canToggle, expanded };
  if (!expanded || !nodo.hijos?.length) return [fila];
  return [
    fila,
    ...nodo.hijos.flatMap((hijo) =>
      recolectarFilas(hijo, depth + 1, isExpanded),
    ),
  ];
}

function TreeExpansionProvider({
  estructura,
  children,
}: {
  estructura: NodoOrganizacion;
  children: React.ReactNode;
}) {
  const expandableIds = useMemo(
    () => collectExpandableIds(estructura),
    [estructura],
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(nodoPuedeExpandir(estructura) ? [estructura.id] : []),
  );

  useEffect(() => {
    setExpandedIds(
      new Set(nodoPuedeExpandir(estructura) ? [estructura.id] : []),
    );
  }, [estructura.id]);

  const isExpanded = useCallback(
    (id: string) => expandedIds.has(id),
    [expandedIds],
  );

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allExpanded = useMemo(
    () =>
      expandableIds.length > 0 &&
      expandableIds.every((id) => expandedIds.has(id)),
    [expandableIds, expandedIds],
  );

  const setAllExpanded = useCallback(
    (expanded: boolean) => {
      if (expanded) {
        setExpandedIds(new Set(expandableIds));
        return;
      }
      const rootExpandable = expandableIds.includes(estructura.id);
      setExpandedIds(rootExpandable ? new Set([estructura.id]) : new Set());
    },
    [expandableIds, estructura.id],
  );

  const value = useMemo(
    () => ({ isExpanded, toggle, allExpanded, setAllExpanded }),
    [isExpanded, toggle, allExpanded, setAllExpanded],
  );

  return (
    <TreeExpansionContext.Provider value={value}>
      {children}
    </TreeExpansionContext.Provider>
  );
}

function useTreeExpansion() {
  const ctx = useContext(TreeExpansionContext);
  if (!ctx) {
    throw new Error("useTreeExpansion debe usarse dentro de TreeExpansionProvider");
  }
  return ctx;
}

type ClaveTipoUnidad =
  | "institucion"
  | "territorio"
  | "dependencia"
  | "jefatura"
  | "puesto";

const ESTILO_TIPO: Record<
  ClaveTipoUnidad,
  {
    label: string;
    fila: string;
    swatch: string;
    icono: string;
    iconFrom: IconNode;
    iconTo: IconNode;
  }
> = {
  institucion: {
    label: "Institución",
    fila: "bg-celeste-trifinio/10 text-celeste-trifinio hover:bg-celeste-trifinio/15",
    swatch: "bg-celeste-trifinio/10 text-celeste-trifinio",
    icono: "text-[#1a95d3] dark:text-[#6f9fd4]",
    iconFrom: Network,
    iconTo: GitBranch,
  },
  territorio: {
    label: "Territorio",
    fila: "bg-sky-100 text-sky-800 hover:bg-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-950/70",
    swatch: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
    icono: "text-[#075985] dark:text-sky-400",
    iconFrom: MapPin,
    iconTo: MapPinned,
  },
  dependencia: {
    label: "Dependencia",
    fila: "bg-celeste-trifinio/10 text-celeste-trifinio hover:bg-celeste-trifinio/15",
    swatch: "bg-celeste-trifinio/10 text-celeste-trifinio",
    icono: "text-[#1a95d3] dark:text-[#6f9fd4]",
    iconFrom: Building2,
    iconTo: GitBranch,
  },
  jefatura: {
    label: "Jefatura",
    fila: "bg-amber-100 text-amber-800 hover:bg-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25",
    swatch: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    icono: "text-[#92400e] dark:text-amber-400",
    iconFrom: UserRound,
    iconTo: UserCog,
  },
  puesto: {
    label: "Puesto",
    fila: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25",
    swatch: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    icono: "text-[#065f46] dark:text-emerald-400",
    iconFrom: Briefcase,
    iconTo: Building2,
  },
};

const ICONO_ARBOL_STROKE = 2;

function claveTipoUnidad(nodo: NodoOrganizacion): ClaveTipoUnidad {
  if (nodo.tipo === "raiz" || nodo.tipo === "institucion") return "institucion";
  if (nodo.tipo === "nivel") {
    return nodo.es_territorio ? "territorio" : "dependencia";
  }
  if (nodo.tipo === "unidad" && nodo.tiene_jefaturas) return "jefatura";
  return "puesto";
}

function LeyendaPill({
  clave,
  className,
}: {
  clave: ClaveTipoUnidad;
  className?: string;
}) {
  const estilo = ESTILO_TIPO[clave];
  const [hovered, setHovered] = useState(false);

  return (
    <span
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "inline-flex min-w-0 cursor-default select-none items-center justify-center gap-0.5 rounded-md px-1.5 py-1.5 text-[8px] font-black uppercase tracking-normal md:gap-1.5 md:px-3 md:py-1.5 md:text-xs md:tracking-wider",
        estilo.swatch,
        className,
      )}
    >
      <MorphHoverIcon
        from={estilo.iconFrom}
        to={estilo.iconTo}
        hovered={hovered}
        size={12}
        color="currentColor"
        strokeWidth={ICONO_ARBOL_STROKE}
        spring="snappy"
        className={cn("shrink-0", estilo.icono)}
      />
      <span className="truncate">{estilo.label}</span>
    </span>
  );
}

const LEYENDA_TIPOS: ClaveTipoUnidad[] = [
  "territorio",
  "dependencia",
  "jefatura",
  "puesto",
];

function LeyendaTipos() {
  const { allExpanded, setAllExpanded } = useTreeExpansion();

  return (
    <div className="grid grid-cols-[1fr_auto] items-stretch gap-2 p-1">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:justify-center md:gap-2">
        {LEYENDA_TIPOS.map((clave) => (
          <LeyendaPill
            key={clave}
            clave={clave}
            className="w-full justify-center md:w-auto"
          />
        ))}
      </div>
      <RippleButton
        type="button"
        rippleColor="#E5E7EB"
        onClick={() => setAllExpanded(!allExpanded)}
        aria-label={
          allExpanded
            ? "Cerrar todos los acordeones"
            : "Abrir todos los acordeones"
        }
        className={cn(
          sigetBtnSurface,
          "w-9 shrink-0 self-stretch !h-full min-h-0 p-1",
        )}
      >
        <span
          className={cn(
            "inline-flex transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
            allExpanded && "rotate-90",
          )}
        >
          <MorphHoverIcon
            from={ChevronsLeftRight}
            to={ChevronsLeftRight}
            hovered={false}
            size={16}
            color="currentColor"
            strokeWidth={ICONO_ARBOL_STROKE}
            spring="snappy"
            className="text-celeste-trifinio dark:text-[#6f9fd4]"
          />
        </span>
      </RippleButton>
    </div>
  );
}

function PersonaNodo({
  nodo,
  admin,
  filaHover,
}: {
  nodo: NodoOrganizacion;
  admin?: AdminHandlers;
  filaHover: boolean;
}) {
  const stop = (e: MouseEvent) => e.stopPropagation();
  const isPuesto = nodo.tipo === "unidad";

  if (!admin || !isPuesto) {
    return <span className="inline-flex size-5" aria-hidden />;
  }

  const estilo = ESTILO_TIPO[claveTipoUnidad(nodo)];
  const accionGhostClass =
    "inline-flex size-5 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0";

  return (
    <div className="relative z-10 flex justify-center" onClick={stop}>
      <button
        type="button"
        aria-label={
          nodo.titular
            ? `Quitar persona de ${nodo.nombre}`
            : `Asignar persona a ${nodo.nombre}`
        }
        onClick={() =>
          nodo.titular
            ? admin.onDesasignarPersona(nodo.id, nodo.nombre, nodo.titular)
            : admin.onAsignarPersona(nodo.id, nodo.nombre)
        }
        className={accionGhostClass}
      >
        <MorphHoverIcon
          from={nodo.titular ? UserMinus : UserPlus}
          to={nodo.titular ? Ban : CirclePlus}
          hovered={filaHover}
          size={14}
          color="currentColor"
          strokeWidth={ICONO_ARBOL_STROKE}
          spring="snappy"
          className={estilo.icono}
        />
      </button>
    </div>
  );
}

function MenuNodo({
  nodo,
  admin,
  filaHover,
}: {
  nodo: NodoOrganizacion;
  admin?: AdminHandlers;
  filaHover: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stop = (e: MouseEvent) => e.stopPropagation();
  const isRoot = nodo.tipo === "raiz";
  const isDepartamento = nodo.tipo === "nivel";
  const isPuesto = nodo.tipo === "unidad";

  if (!admin) return <span className="text-muted-foreground">—</span>;

  const estilo = ESTILO_TIPO[claveTipoUnidad(nodo)];
  const accionGhostClass =
    "inline-flex size-5 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0";
  const accionMorph = filaHover || menuOpen;

  const itemClass =
    "cursor-pointer gap-2 bg-white focus:bg-sky-50 dark:bg-zinc-900 dark:focus:bg-zinc-800";

  return (
    <div className="relative z-10 flex justify-start" onClick={stop}>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Acciones de ${nodo.nombre}`}
            aria-expanded={menuOpen}
            className={accionGhostClass}
          >
            <MorphHoverIcon
              from={EllipsisVertical}
              to={Ellipsis}
              hovered={accionMorph}
              size={14}
              color="currentColor"
              strokeWidth={ICONO_ARBOL_STROKE}
              spring="snappy"
              className={estilo.icono}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-[200] min-w-[10rem] border border-border bg-white p-1 text-foreground opacity-100 shadow-lg dark:bg-zinc-900"
        >
          {isRoot && (
            <>
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => admin.onAddDepartamento(null)}
              >
                <Plus className="size-3.5" />
                Crear
              </DropdownMenuItem>
            </>
          )}
          {isDepartamento && (
            <>
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => admin.onAddDepartamento(nodo.id)}
              >
                <Plus className="size-3.5" />
                Crear
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => admin.onAddPuesto(nodo.id)}
              >
                <BriefcaseMenu className="size-3.5" />
                Puesto
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => admin.onEdit("departamento", nodo.id)}
              >
                <Pencil className="size-3.5" />
                Editar
              </DropdownMenuItem>
            </>
          )}
          {isPuesto && (
            <>
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => admin.onReubicarPuesto(nodo.id, nodo.nombre)}
              >
                <Move className="size-3.5" />
                Mover
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClass}
                onSelect={() => admin.onEdit("puesto", nodo.id)}
              >
                <Pencil className="size-3.5" />
                Editar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FilaNodo({
  nodo,
  depth,
  canToggle,
  expanded,
  admin,
}: FilaVisible & { admin?: AdminHandlers }) {
  const { toggle } = useTreeExpansion();
  const isPuesto = nodo.tipo === "unidad";
  const estilo = ESTILO_TIPO[claveTipoUnidad(nodo)];
  const [filaHover, setFilaHover] = useState(false);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={ROW_TRANSITION}
      onClick={() => canToggle && toggle(nodo.id)}
      onPointerEnter={() => setFilaHover(true)}
      onPointerLeave={() => setFilaHover(false)}
      className={cn(
        "border-b border-border last:border-0 dark:border-zinc-800",
        estilo.fila,
        canToggle && "cursor-pointer",
      )}
    >
      <td className="w-0 border-r border-border whitespace-nowrap px-1 py-2 align-middle dark:border-zinc-700">
        <PersonaNodo nodo={nodo} admin={admin} filaHover={filaHover} />
      </td>
      <td className="border-r border-border py-2 pr-4 pl-0 align-middle dark:border-zinc-700">
        <div
          className="flex min-w-0 items-center gap-2"
          style={{ paddingLeft: depth * 14 }}
        >
          {canToggle ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={expanded ? "Contraer" : "Expandir"}
              onClick={(e) => {
                e.stopPropagation();
                toggle(nodo.id);
              }}
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center"
            >
              <MorphHoverIcon
                from={ChevronRight}
                to={ChevronDown}
                size={14}
                hovered={expanded}
                color="currentColor"
                strokeWidth={ICONO_ARBOL_STROKE}
                spring="snappy"
                className={estilo.icono}
              />
            </button>
          ) : (
            <span className="size-5 shrink-0" />
          )}
          <MorphHoverIcon
            from={estilo.iconFrom}
            to={estilo.iconTo}
            hovered={filaHover}
            size={16}
            color="currentColor"
            strokeWidth={ICONO_ARBOL_STROKE}
            spring="snappy"
            className={cn("shrink-0", estilo.icono)}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{nodo.nombre}</p>
            {isPuesto && nodo.titular ? (
              <p className="truncate text-[11px] opacity-70">{nodo.titular}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="w-0 whitespace-nowrap px-1 py-2 align-middle">
        <MenuNodo nodo={nodo} admin={admin} filaHover={filaHover} />
      </td>
    </motion.tr>
  );
}

function TablaCuerpo({
  estructura,
  admin,
}: {
  estructura: NodoOrganizacion;
  admin?: AdminHandlers;
}) {
  const { isExpanded } = useTreeExpansion();
  const filas = useMemo(
    () => recolectarFilas(estructura, 0, isExpanded),
    [estructura, isExpanded],
  );

  return (
    <tbody>
      <AnimatePresence mode="popLayout" initial={false}>
        {filas.map((fila) => (
          <FilaNodo key={fila.nodo.id} {...fila} admin={admin} />
        ))}
      </AnimatePresence>
    </tbody>
  );
}

export function contarNodos(
  nodo: NodoOrganizacion,
): Record<NodoOrganizacion["tipo"], number> {
  const counts: Record<NodoOrganizacion["tipo"], number> = {
    raiz: 0,
    nivel: 0,
    institucion: 0,
    unidad: 0,
  };

  const walk = (current: NodoOrganizacion) => {
    counts[current.tipo] += 1;
    current.hijos?.forEach(walk);
  };

  walk(nodo);
  return counts;
}

function EncabezadoTabla() {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      className="border-y border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <th
        className="w-0 border-r border-border px-1 py-2.5 dark:border-zinc-700"
        aria-label="Persona"
      >
        <span className="flex w-full items-center justify-center text-celeste-trifinio dark:text-[#6f9fd4]">
          <MorphHoverIcon
            from={UserRound}
            to={Users}
            hovered={hovered}
            size={14}
            color="currentColor"
            strokeWidth={ICONO_ARBOL_STROKE}
            spring="snappy"
          />
        </span>
      </th>
      <th className="border-r border-border py-2.5 pr-4 pl-0 text-center dark:border-zinc-700">
        Unidad
      </th>
      <th
        className="w-0 px-1 py-2.5 text-center dark:border-zinc-700"
        aria-label="Acciones"
      >
        <span className="flex w-full items-center justify-center text-celeste-trifinio dark:text-[#6f9fd4]">
          <MorphHoverIcon
            from={Settings2}
            to={Cog}
            hovered={hovered}
            size={14}
            color="currentColor"
            strokeWidth={ICONO_ARBOL_STROKE}
            spring="snappy"
          />
        </span>
      </th>
    </tr>
  );
}

export function OrganizacionTree({
  estructura,
  admin,
}: {
  estructura: NodoOrganizacion;
  admin?: AdminHandlers;
  espaciadoVertical?: boolean;
}) {
  return (
    <TreeExpansionProvider estructura={estructura}>
      <div className="overflow-hidden rounded-none border border-border bg-card max-md:border-x-0 md:rounded-xl dark:border-zinc-700 dark:bg-zinc-900">
        <LeyendaTipos />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <EncabezadoTabla />
            </thead>
            <TablaCuerpo estructura={estructura} admin={admin} />
          </table>
        </div>
      </div>
    </TreeExpansionProvider>
  );
}
