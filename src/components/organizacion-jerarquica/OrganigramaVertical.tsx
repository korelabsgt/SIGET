"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Tree from "react-d3-tree";
import type {
  CustomNodeElementProps,
  RawNodeDatum,
  TreeLinkDatum,
} from "react-d3-tree";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Check,
  Clipboard,
  Eye,
  EyeOff,
  ListTree,
  Loader2,
  Pencil,
  UserPlus,
  UserMinus,
  UserRound,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OrgActionButton,
  type AdminHandlers,
} from "./lib/org-actions";
import type { NodoOrganizacion } from "./lib/zod";
import { toast } from "react-toastify";
import { OrganigramaIcon } from "./OrganigramaIcon";
import {
  OrganigramaExportMenu,
  organigramaExportIcons,
} from "./OrganigramaExportMenu";
import {
  copyOrganigramaToClipboard,
  downloadOrganigramaPdf,
  downloadOrganigramaPng,
  loadLogoDataUrl,
  organigramaExportBasename,
} from "./lib/organigrama-export";
import "./organigrama.css";

const ORG_CARD_W = 172;
const ORG_CARD_H = 58;
const ORG_CARD_H_TITULAR = 86;
const ORG_GAP_X = 16;
const ORG_GAP_Y = 20;
const ORG_FORK_BOOST = 20;
const ORG_SEP_SIBLINGS = 1.1;
const ORG_SEP_NON_SIBLINGS = 1.15;

const ORG_LAYOUT_COMPACT = {
  gapX: ORG_GAP_X,
  gapY: ORG_GAP_Y,
  forkBoost: ORG_FORK_BOOST,
  sepSiblings: ORG_SEP_SIBLINGS,
  sepNonSiblings: ORG_SEP_NON_SIBLINGS,
} as const;

const ORG_LAYOUT_AMPLIO = {
  gapX: ORG_GAP_X,
  gapY: 40,
  forkBoost: ORG_FORK_BOOST,
  sepSiblings: ORG_SEP_SIBLINGS,
  sepNonSiblings: ORG_SEP_NON_SIBLINGS,
} as const;

type OrgLayoutConfig = {
  gapX: number;
  gapY: number;
  forkBoost: number;
  sepSiblings: number;
  sepNonSiblings: number;
};
const ORG_NODE_X = ORG_CARD_W + ORG_GAP_X;
const ORG_NODE_Y = ORG_CARD_H_TITULAR + ORG_GAP_Y;
const ORG_FO_W = ORG_CARD_W;
const ORG_FO_X = -ORG_CARD_W / 2;
const ORG_RAIL_X = -ORG_CARD_W / 2 - 16;
const ORG_RAIZ_CARD_H = 104;
const ORG_RAIZ_LOGO_H = 88;
const ORG_RAIZ_LOGO_W = Math.round(ORG_RAIZ_LOGO_H * (1654 / 1863));

const ORG_LEYENDA = [
  {
    swatch: "bg-azul-trifinio",
    text: "text-azul-trifinio",
    label: "Departamento / Dependencia / Oficina",
  },
  {
    swatch: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    label: "Director / Encargado / Coordinador",
  },
  {
    swatch: "bg-emerald-600",
    text: "text-emerald-600",
    label: "Puesto / Consultoría",
  },
] as const;

const ORG_ACTIONS_EASE = [0.33, 1, 0.68, 1] as const;
const ORG_MODAL_MS = 320;
const ORG_CARD_ANIM_MS = 360;

function orgNodeStrideY(gapY = ORG_GAP_Y) {
  return ORG_CARD_H_TITULAR + gapY;
}

type OrgHierarchyPoint = {
  x: number;
  y: number;
  data: RawNodeDatum;
  parent?: OrgHierarchyPoint | null;
  children?: OrgHierarchyPoint[];
};

function forkOffset(
  node: OrgHierarchyPoint | null | undefined,
  forkBoost: number,
): number {
  if (!node?.parent) return 0;
  let offset = 0;
  let current: OrgHierarchyPoint | null | undefined = node.parent;
  while (current) {
    if ((current.children?.length ?? 0) > 1) {
      offset += forkBoost;
    }
    current = current.parent ?? null;
  }
  return offset;
}

function orgStepPath(link: TreeLinkDatum, forkBoost: number) {
  const source = link.source as OrgHierarchyPoint;
  const target = link.target as OrgHierarchyPoint;
  const sy = source.y + forkOffset(source, forkBoost);
  const ty = target.y + forkOffset(target, forkBoost);
  const midY = sy + (ty - sy) / 2;
  return `M${source.x},${sy}V${midY}H${target.x}V${ty}`;
}

function nombrePersonaCorto(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0];
  if (partes.length === 2) return `${partes[0]} ${partes[1]}`;
  return `${partes[0]} ${partes[2]}`;
}

type OrgMenuCloseContextValue = {
  registerClose: (fn: () => void) => () => void;
};

const OrgMenuCloseContext = createContext<OrgMenuCloseContextValue | null>(
  null,
);

function useOrgMenuClose() {
  return useContext(OrgMenuCloseContext);
}

function isOrgInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-org-card]") || target.closest("[data-org-actions]"),
  );
}

function esPuestoJefatura(n: NodoOrganizacion) {
  return n.tipo === "unidad" && Boolean(n.tiene_jefaturas);
}

function esPuestoVerdeHoja(n: NodoOrganizacion) {
  return (
    n.tipo === "unidad" &&
    !n.tiene_jefaturas &&
    !(n.hijos && n.hijos.length > 0)
  );
}

function attrsPuestoOrganigrama(
  nodo: NodoOrganizacion,
  extra: Record<string, string> = {},
): Record<string, string> {
  const attrs: Record<string, string> = {
    id: nodo.id,
    tipo: nodo.tipo,
    jefatura: nodo.tiene_jefaturas ? "1" : "0",
    ...extra,
  };
  if (nodo.titular) {
    attrs.titular = "1";
    attrs.titularNombre = nodo.titular;
  }
  return attrs;
}

function attrsPuestoCadena(
  puesto: NodoOrganizacion,
  esRaiz: boolean,
): Record<string, string> {
  return attrsPuestoOrganigrama(puesto, {
    colapsable: "0",
    cadena: "1",
    cadenaRaiz: esRaiz ? "1" : "0",
  });
}

function cadenaVerdes(puestos: NodoOrganizacion[]): RawNodeDatum {
  let acc: RawNodeDatum | undefined;
  for (let i = puestos.length - 1; i >= 0; i--) {
    acc = {
      name: puestos[i].nombre,
      attributes: attrsPuestoCadena(puestos[i], i === 0),
      children: acc ? [acc] : undefined,
    };
  }
  return acc as RawNodeDatum;
}

function contarDescendientes(nodo: NodoOrganizacion): number {
  const hijos = nodo.hijos ?? [];
  if (hijos.length === 0) return 0;
  return hijos.reduce(
    (total, hijo) => total + 1 + contarDescendientes(hijo),
    0,
  );
}

function ordenarHermanosOrganigrama(
  hermanos: NodoOrganizacion[],
): NodoOrganizacion[] {
  return [...hermanos].sort((a, b) => {
    const diff = contarDescendientes(b) - contarDescendientes(a);
    return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre);
  });
}

function hijosParaOrganigrama(hijos: NodoOrganizacion[]): RawNodeDatum[] {
  const jefes = ordenarHermanosOrganigrama(hijos.filter(esPuestoJefatura));
  const dependencias = ordenarHermanosOrganigrama(
    hijos.filter((h) => h.tipo === "nivel"),
  );
  const verdes = hijos.filter(
    (h) => h.tipo === "unidad" && !h.tiene_jefaturas,
  );
  const verdesHoja = ordenarHermanosOrganigrama(
    verdes.filter(esPuestoVerdeHoja),
  );
  const verdesRama = ordenarHermanosOrganigrama(
    verdes.filter((h) => !esPuestoVerdeHoja(h)),
  );

  const lista: RawNodeDatum[] = [];

  for (const jefe of jefes) {
    lista.push(toDatum(jefe));
  }

  for (const puesto of verdesRama) {
    lista.push(toDatum(puesto));
  }

  if (verdesHoja.length > 0) {
    lista.push(cadenaVerdes(verdesHoja));
  }

  for (const dep of dependencias) {
    lista.push(toDatum(dep));
  }

  return lista;
}

function toDatum(nodo: NodoOrganizacion): RawNodeDatum {
  const hijos = nodo.hijos ?? [];
  const children = hijos.length > 0 ? hijosParaOrganigrama(hijos) : undefined;

  return {
    name: nodo.nombre,
    attributes: attrsPuestoOrganigrama(nodo),
    children,
  };
}

function useCenteredTree(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setCanvasReady(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const sync = () => {
      const { width } = el.getBoundingClientRect();
      if (width > 0) {
        setTranslate({ x: width / 2, y: 160 });
        setCanvasReady(true);
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return { containerRef, translate, canvasReady };
}

function stopPropagation(e: MouseEvent) {
  e.stopPropagation();
}

function renderOrgNode(
  props: CustomNodeElementProps,
  admin?: AdminHandlers,
  mostrarNombres = true,
  nodeStrideY = ORG_NODE_Y,
  logoHref: string | null = null,
  usarLogoRaiz = true,
  layout: OrgLayoutConfig = ORG_LAYOUT_COMPACT,
) {
  return (
    <OrgNode
      {...props}
      admin={admin}
      mostrarNombres={mostrarNombres}
      nodeStrideY={nodeStrideY}
      logoHref={logoHref}
      usarLogoRaiz={usarLogoRaiz}
      layout={layout}
    />
  );
}

function OrgCardTooltip({ label, anchor }: { label: string; anchor: DOMRect }) {
  return createPortal(
    <span
      role="tooltip"
      style={{
        position: "fixed",
        left: anchor.left + anchor.width / 2,
        top: anchor.top - 8,
        transform: "translate(-50%, -100%)",
        maxWidth: "min(22rem, 90vw)",
      }}
      className="pointer-events-none z-[300] rounded-lg border border-border/50 bg-zinc-100 px-3 py-2 text-center text-xs font-semibold leading-snug text-foreground shadow-md dark:bg-zinc-800"
    >
      {label}
    </span>,
    document.body,
  );
}

function OrgActionsPortal({
  anchor,
  visible,
  onExitComplete,
  borderTone,
  buttonTone,
  children,
}: {
  anchor: DOMRect;
  visible: boolean;
  onExitComplete: () => void;
  borderTone: string;
  buttonTone: string;
  children: ReactNode;
}) {
  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible ? (
        <motion.div
          key="org-actions-bar"
          initial={{ opacity: 0, x: -8, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.96 }}
          transition={{ duration: 0.3, ease: ORG_ACTIONS_EASE }}
          style={{
            position: "fixed",
            left: anchor.right + ORG_GAP_X / 2,
            top: anchor.top,
            height: anchor.height,
          }}
          className={cn(
            "z-[250] flex items-stretch divide-x overflow-hidden rounded-xl bg-zinc-50 shadow-sm dark:bg-zinc-800",
            borderTone,
            buttonTone,
            "[&_button]:!h-full [&_button]:!w-[3.75rem] [&_button]:!min-h-0 [&_button]:!min-w-[3.75rem] [&_button]:bg-zinc-50 [&_button]:transition-colors [&_button]:hover:bg-zinc-100 dark:[&_button]:bg-zinc-800 dark:[&_button]:hover:bg-zinc-700/60",
          )}
          data-org-actions=""
          onClick={stopPropagation}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function OrgNode({
  nodeDatum,
  hierarchyPointNode,
  admin,
  mostrarNombres = true,
  nodeStrideY = ORG_NODE_Y,
  logoHref = null,
  usarLogoRaiz = true,
  layout = ORG_LAYOUT_COMPACT,
}: CustomNodeElementProps & {
  admin?: AdminHandlers;
  mostrarNombres?: boolean;
  nodeStrideY?: number;
  logoHref?: string | null;
  usarLogoRaiz?: boolean;
  layout?: OrgLayoutConfig;
}) {
  "use no memo";

  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [tooltip, setTooltip] = useState<DOMRect | null>(null);
  const [actionsAnchor, setActionsAnchor] = useState<DOMRect | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const attrs = nodeDatum.attributes ?? {};
  const tipo = String(attrs.tipo ?? "");
  const nodoId = String(attrs.id ?? "");
  const esJefatura = String(attrs.jefatura ?? "") === "1";
  const tieneTitular = String(attrs.titular ?? "") === "1";
  const titularNombre = String(attrs.titularNombre ?? "");
  const esCadena = String(attrs.cadena ?? "") === "1";
  const esCadenaRaiz = String(attrs.cadenaRaiz ?? "") === "1";
  const isRaiz = tipo === "raiz";
  const isDependencia = tipo === "nivel";
  const isPuesto = tipo === "unidad";
  const forkLift = forkOffset(
    hierarchyPointNode as OrgHierarchyPoint,
    layout.forkBoost,
  );
  const mostrarLogoRaiz = isRaiz && usarLogoRaiz && Boolean(logoHref);

  const titularCorto = titularNombre
    ? nombrePersonaCorto(titularNombre)
    : "";
  const mostrarTitular =
    isPuesto && tieneTitular && Boolean(titularCorto) && mostrarNombres;

  const showAdmin = Boolean(admin && nodoId);
  const menuClose = useOrgMenuClose();

  useEffect(() => {
    if (!menuClose) return;
    return menuClose.registerClose(() => {
      setActionsOpen(false);
      setTooltip(null);
    });
  }, [menuClose]);

  useEffect(() => {
    if (!actionsOpen) return;
    const onDocClick = () => setActionsOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActionsOpen(false);
    };
    const id = setTimeout(
      () => document.addEventListener("click", onDocClick),
      0,
    );
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [actionsOpen]);

  const handleEnter = () => {
    const el = titleRef.current;
    if (!el) return;
    if (el.scrollHeight - el.clientHeight > 1) {
      setTooltip(el.getBoundingClientRect());
    }
  };

  const handleLeave = () => setTooltip(null);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!showAdmin) return;

    const el = cardRef.current;
    if (actionsOpen) {
      setActionsOpen(false);
    } else if (el) {
      setActionsAnchor(el.getBoundingClientRect());
      setActionsOpen(true);
    }
    setTooltip(null);
  };

  const runAction = (fn: () => void) => {
    setActionsOpen(false);
    fn();
  };

  const cardSurfaceTone =
    isRaiz || isDependencia
      ? "border-azul-trifinio/45 bg-zinc-100 dark:bg-zinc-800"
      : esJefatura
        ? "border-amber-500/40 bg-zinc-100 dark:bg-zinc-800"
        : "border-emerald-500/40 bg-zinc-100 dark:bg-zinc-800";

  const textTone =
    isRaiz || isDependencia
      ? "text-azul-trifinio"
      : esJefatura
        ? "text-amber-800 dark:text-amber-300"
        : "text-emerald-800 dark:text-emerald-300";

  const borderTone =
    isRaiz || isDependencia
      ? "border-[3px] border-azul-trifinio divide-azul-trifinio/40"
      : esJefatura
        ? "border-[3px] border-amber-500 divide-amber-500/40"
        : "border-[3px] border-emerald-500 divide-emerald-500/40";

  const selectedTone =
    isRaiz || isDependencia
      ? "border-azul-trifinio shadow-md ring-2 ring-azul-trifinio/30"
      : esJefatura
        ? "border-amber-500 shadow-md ring-2 ring-amber-500/30"
        : "border-emerald-500 shadow-md ring-2 ring-emerald-500/30";

  const buttonTone =
    isRaiz || isDependencia
      ? "[&_button]:text-azul-trifinio"
      : esJefatura
        ? "[&_button]:text-amber-600 dark:[&_button]:text-amber-400"
        : "[&_button]:text-emerald-600 dark:[&_button]:text-emerald-400";

  const separatorTone = esJefatura
    ? "border-amber-500/60"
    : "border-emerald-500/60";

  const puedeAnimarTitular = isPuesto && tieneTitular;
  const cardHVisual = isRaiz
    ? ORG_RAIZ_CARD_H
    : mostrarTitular
      ? ORG_CARD_H_TITULAR
      : ORG_CARD_H;
  const foH = puedeAnimarTitular ? ORG_CARD_H_TITULAR : cardHVisual;
  const foW = ORG_FO_W;
  const cardFoY = -foH / 2;
  const railTopY = -nodeStrideY / 2;

  const cardClassName = cn(
    "pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-lg border text-center shadow-sm transition-[border-color,box-shadow,ring-color] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] hover:shadow-md",
    mostrarTitular
      ? "justify-between gap-0 px-2 py-1.5"
      : "items-center justify-center gap-0.5 px-2 py-1",
    cardSurfaceTone,
    showAdmin && "cursor-pointer",
    actionsOpen && selectedTone,
    !actionsOpen && isRaiz && "border-l-[3px] border-l-azul-trifinio",
    !actionsOpen && isDependencia && "border-l-[3px] border-l-azul-trifinio",
    !actionsOpen && isPuesto && esJefatura && "border-l-[3px] border-l-amber-500",
    !actionsOpen &&
      isPuesto &&
      !esJefatura &&
      "border-l-[3px] border-l-emerald-500",
  );

  const cardHandlers = {
    onClick: handleClick,
    onMouseDown: (e: MouseEvent) => e.stopPropagation(),
    onPointerDown: (e: MouseEvent) => e.stopPropagation(),
    onMouseEnter: handleEnter,
    onMouseLeave: handleLeave,
  };

  const titularRow = (
    <AnimatePresence initial={false}>
      {mostrarTitular ? (
        <motion.div
          key="titular"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: ORG_CARD_ANIM_MS / 1000, ease: ORG_ACTIONS_EASE }}
          className="w-full overflow-hidden"
        >
          <div className={cn("w-full shrink-0 border-t", separatorTone)} />
          <div className="flex w-full min-w-0 shrink-0 items-center justify-center gap-1 py-1">
            <UserRound className={cn("size-3 shrink-0", textTone)} />
            <p
              className={cn(
                "line-clamp-1 min-w-0 text-[0.625rem] font-medium leading-tight",
                textTone,
              )}
            >
              {titularCorto}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const cardBody = (
    <>
      <div
        className={cn(
          "flex w-full min-w-0 items-center justify-center overflow-hidden",
          mostrarTitular && "min-h-0 flex-1",
        )}
      >
        {mostrarLogoRaiz ? (
          <img
            src={logoHref!}
            alt={nodeDatum.name}
            title={nodeDatum.name}
            width={ORG_RAIZ_LOGO_W}
            height={ORG_RAIZ_LOGO_H}
            className="max-h-[88px] w-auto object-contain"
          />
        ) : (
          <p
            ref={titleRef}
            className={cn(
              "w-full min-w-0 break-words leading-snug tracking-tight",
              textTone,
              mostrarTitular ? "line-clamp-2" : "line-clamp-3",
              isRaiz && "text-sm font-black md:text-base",
              isDependencia && "text-xs font-bold",
              isPuesto && "text-[0.75rem] font-semibold",
            )}
          >
            {nodeDatum.name}
          </p>
        )}
      </div>
      {puedeAnimarTitular ? titularRow : null}
    </>
  );

  const parentConnector = (() => {
    if (!esCadenaRaiz) return null;
    const node = hierarchyPointNode as OrgHierarchyPoint | undefined;
    const parent = node?.parent;
    if (!node || !parent) return null;
    const px = parent.x - node.x;
    const parentLeftX = px - ORG_CARD_W / 2;
    const parentLeftMidY =
      parent.y - node.y + (forkOffset(parent, layout.forkBoost) - forkLift);
    return `M ${parentLeftX},${parentLeftMidY} H ${ORG_RAIL_X} V ${railTopY}`;
  })();

  return (
    <g transform={forkLift > 0 ? `translate(0, ${forkLift})` : undefined}>
      {esCadena && (
        <>
          {parentConnector && (
            <path
              d={parentConnector}
              className="org-link org-link--rail"
              fill="none"
            />
          )}
          <line
            x1={ORG_RAIL_X}
            y1={esCadenaRaiz ? railTopY : -nodeStrideY}
            x2={ORG_RAIL_X}
            y2={0}
            className="org-link org-link--rail"
          />
          <line
            x1={ORG_RAIL_X}
            y1={0}
            x2={ORG_FO_X}
            y2={0}
            className="org-link org-link--rail"
          />
        </>
      )}
      <foreignObject
        width={foW}
        height={foH}
        x={ORG_FO_X}
        y={cardFoY}
        style={{ overflow: "visible", pointerEvents: "none" }}
      >
        {puedeAnimarTitular ? (
          <div className="flex h-full w-full items-end justify-center">
            <motion.div
              ref={cardRef}
              data-org-card=""
              {...cardHandlers}
              initial={false}
              animate={{ height: cardHVisual }}
              transition={{ duration: ORG_CARD_ANIM_MS / 1000, ease: ORG_ACTIONS_EASE }}
              className={cardClassName}
            >
              {cardBody}
            </motion.div>
          </div>
        ) : (
          <div
            ref={cardRef}
            data-org-card=""
            {...cardHandlers}
            className={cn(cardClassName, "h-full w-full")}
          >
            {cardBody}
          </div>
        )}
      </foreignObject>

      {tooltip ? (
        <OrgCardTooltip label={nodeDatum.name} anchor={tooltip} />
      ) : null}

      {showAdmin && actionsAnchor ? (
        <OrgActionsPortal
          anchor={actionsAnchor}
          visible={actionsOpen}
          onExitComplete={() => setActionsAnchor(null)}
          borderTone={borderTone}
          buttonTone={buttonTone}
        >
          {isRaiz && (
            <OrgActionButton
              label="Añadir dependencia"
              onClick={() => runAction(() => admin?.onAddDepartamento(null))}
            >
              <ListTree className="size-5" />
            </OrgActionButton>
          )}

          {isDependencia && (
            <>
              <OrgActionButton
                label="Añadir dependencia"
                onClick={() =>
                  runAction(() => admin?.onAddDepartamento(nodoId))
                }
              >
                <ListTree className="size-5" />
              </OrgActionButton>
              <OrgActionButton
                label="Añadir puesto"
                onClick={() => runAction(() => admin?.onAddPuesto(nodoId))}
              >
                <Briefcase className="size-5" />
              </OrgActionButton>
              <OrgActionButton
                label="Editar"
                onClick={() =>
                  runAction(() => admin?.onEdit("departamento", nodoId))
                }
              >
                <Pencil className="size-5" />
              </OrgActionButton>
            </>
          )}

          {isPuesto && (
            <>
              {tieneTitular ? (
                <OrgActionButton
                  label="Desasignar persona"
                  onClick={() =>
                    runAction(() =>
                      admin?.onDesasignarPersona(
                        nodoId,
                        nodeDatum.name,
                        titularNombre,
                      ),
                    )
                  }
                >
                  <UserMinus className="size-5" />
                </OrgActionButton>
              ) : (
                <OrgActionButton
                  label="Asignar persona"
                  onClick={() =>
                    runAction(() =>
                      admin?.onAsignarPersona(nodoId, nodeDatum.name),
                    )
                  }
                >
                  <UserPlus className="size-5" />
                </OrgActionButton>
              )}
              <OrgActionButton
                label="Reubicar puesto"
                onClick={() =>
                  runAction(() =>
                    admin?.onReubicarPuesto(nodoId, nodeDatum.name),
                  )
                }
              >
                <ArrowRightLeft className="size-5" />
              </OrgActionButton>
              <OrgActionButton
                label="Editar"
                onClick={() => runAction(() => admin?.onEdit("puesto", nodoId))}
              >
                <Pencil className="size-5" />
              </OrgActionButton>
            </>
          )}
        </OrgActionsPortal>
      ) : null}
    </g>
  );
}

export type OrganigramaVerticalHandle = {
  getCanvas: () => HTMLDivElement | null;
  closeMenus: () => void;
};

export const OrganigramaVertical = forwardRef<
  OrganigramaVerticalHandle,
  {
    estructura: NodoOrganizacion;
    fullHeight?: boolean;
    admin?: AdminHandlers;
    mostrarNombres?: boolean;
    usarLogoRaiz?: boolean;
    espaciadoAmplio?: boolean;
  }
>(function OrganigramaVertical(
  {
    estructura,
    fullHeight = false,
    admin,
    mostrarNombres = true,
    usarLogoRaiz = true,
    espaciadoAmplio = false,
  },
  ref,
) {
  const [mounted, setMounted] = useState(false);
  const { containerRef, translate, canvasReady } = useCenteredTree(mounted);
  const closeHandlers = useRef(new Set<() => void>());

  const registerClose = useCallback((fn: () => void) => {
    closeHandlers.current.add(fn);
    return () => {
      closeHandlers.current.delete(fn);
    };
  }, []);

  const closeAllMenus = useCallback(() => {
    closeHandlers.current.forEach((fn) => fn());
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getCanvas: () => containerRef.current,
      closeMenus: closeAllMenus,
    }),
    [closeAllMenus],
  );

  const layout = espaciadoAmplio ? ORG_LAYOUT_AMPLIO : ORG_LAYOUT_COMPACT;
  const nodeSizeX = ORG_CARD_W + layout.gapX;
  const nodeStrideY = orgNodeStrideY(layout.gapY);
  const [logoHref, setLogoHref] = useState<string | null>(null);

  const stepPath = useCallback(
    (link: TreeLinkDatum) => orgStepPath(link, layout.forkBoost),
    [layout.forkBoost],
  );

  const renderNode = useCallback(
    (props: CustomNodeElementProps) =>
      renderOrgNode(
        props,
        admin,
        mostrarNombres,
        nodeStrideY,
        logoHref,
        usarLogoRaiz,
        layout,
      ),
    [admin, mostrarNombres, nodeStrideY, logoHref, usarLogoRaiz, layout],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!usarLogoRaiz) {
      setLogoHref(null);
      return;
    }
    let active = true;
    loadLogoDataUrl()
      .then((url) => {
        if (active) setLogoHref(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [usarLogoRaiz]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasReady) return;

    const onWheel = () => closeAllMenus();

    let panning = false;
    const onPointerDown = (e: PointerEvent) => {
      if (isOrgInteractiveTarget(e.target)) return;
      panning = true;
      closeAllMenus();
    };
    const onPointerMove = () => {
      if (panning) closeAllMenus();
    };
    const endPan = () => {
      panning = false;
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endPan);
    el.addEventListener("pointercancel", endPan);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endPan);
      el.removeEventListener("pointercancel", endPan);
    };
  }, [canvasReady, closeAllMenus]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasReady) return;

    const group = el.querySelector("g.rd3t-g");
    if (!group) return;

    const observer = new MutationObserver(() => closeAllMenus());
    observer.observe(group, {
      attributes: true,
      attributeFilter: ["transform"],
    });
    return () => observer.disconnect();
  }, [canvasReady, closeAllMenus, mostrarNombres]);

  if (!estructura.hijos?.length) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No hay estructura para mostrar en el organigrama.
      </div>
    );
  }

  const data = toDatum(estructura);

  return (
    <OrgMenuCloseContext.Provider value={{ registerClose }}>
      <div
        ref={containerRef}
        className={cn(
          "org-canvas relative overflow-hidden bg-zinc-50/60 dark:bg-zinc-900/40",
          fullHeight
            ? "org-canvas--full h-full w-full"
            : "-mx-4 rounded-xl border border-border/50 md:mx-0",
        )}
      >
        {mounted && canvasReady && (
          <Tree
            data={data}
            orientation="vertical"
            translate={translate}
            pathFunc={stepPath}
            nodeSize={{ x: nodeSizeX, y: nodeStrideY }}
            separation={{
              siblings: layout.sepSiblings,
              nonSiblings: layout.sepNonSiblings,
            }}
            renderCustomNodeElement={renderNode}
            collapsible={false}
            zoomable
            draggable
            zoom={1}
            scaleExtent={{ min: 0.2, max: 1.5 }}
            pathClassFunc={(link) => {
              const target = link.target.data.attributes ?? {};
              if (String(target.cadena ?? "") === "1") {
                return "org-link org-link--cadena";
              }
              return "org-link";
            }}
          />
        )}
        <div className="org-export-hide pointer-events-none absolute left-3 top-3 rounded-xl border border-border/50 bg-card/85 p-2.5 shadow-sm backdrop-blur">
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Descripción
          </p>
          <ul className="space-y-1.5">
            {ORG_LEYENDA.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-3 shrink-0 rounded-[4px]",
                    item.swatch,
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-tight",
                    item.text,
                  )}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="org-export-hide pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          Arrastra para mover · rueda para zoom · clic en tarjeta para acciones
        </p>
      </div>
    </OrgMenuCloseContext.Provider>
  );
});

export function OrganigramaModal({
  open,
  onClose,
  estructura,
  admin,
  usarLogoRaiz = true,
  espaciadoAmplio = false,
}: {
  open: boolean;
  onClose: () => void;
  estructura: NodoOrganizacion;
  admin?: AdminHandlers;
  usarLogoRaiz?: boolean;
  espaciadoAmplio?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [mostrarNombres, setMostrarNombres] = useState(true);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">(
    "idle",
  );
  const organigramaRef = useRef<OrganigramaVerticalHandle>(null);

  const exportBasename = organigramaExportBasename(estructura.nombre);

  const copiarImagen = async () => {
    if (copyState === "copying") return;
    setCopyState("copying");
    try {
      const canvas = requireCanvas();
      await copyOrganigramaToClipboard(canvas);
      setCopyState("copied");
      toast.success("Imagen copiada al portapapeles.");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (err) {
      setCopyState("idle");
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo copiar la imagen.";
      toast.error(message);
    }
  };

  const requireCanvas = () => {
    const canvas = organigramaRef.current?.getCanvas();
    if (!canvas?.querySelector("svg.rd3t-svg")) {
      throw new Error(
        "No se pudo capturar el organigrama. Espere a que termine de cargar e intente de nuevo.",
      );
    }
    organigramaRef.current?.closeMenus();
    return canvas;
  };

  const exportOptions = [
    {
      id: "pdf",
      label: "PDF",
      description: "Documento con el organigrama completo.",
      icon: organigramaExportIcons.pdf,
      iconClass: "text-red-600 dark:text-red-400",
      onSelect: async () => {
        try {
          const canvas = requireCanvas();
          await downloadOrganigramaPdf(canvas, `${exportBasename}.pdf`);
          toast.success("Organigrama exportado en PDF.");
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "No se pudo exportar el organigrama.";
          toast.error(message);
        }
      },
    },
    {
      id: "png",
      label: "Imagen PNG",
      description: "Captura completa del organigrama.",
      icon: organigramaExportIcons.image,
      iconClass: "text-celeste-trifinio",
      onSelect: async () => {
        try {
          const canvas = requireCanvas();
          await downloadOrganigramaPng(canvas, `${exportBasename}.png`);
          toast.success("Organigrama exportado en PNG.");
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "No se pudo exportar el organigrama.";
          toast.error(message);
        }
      },
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="organigrama-modal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: ORG_MODAL_MS / 1000, ease: ORG_ACTIONS_EASE }}
          className={cn(
            "fixed left-0 right-0 bottom-0 z-[90] flex flex-col bg-background",
            "top-[calc(var(--banner-height,0px)+var(--header-row-height)+var(--breadcrumb-row-height))]",
            "h-[calc(100dvh-var(--banner-height,0px)-var(--header-row-height)-var(--breadcrumb-row-height))]",
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-zinc-100 px-4 py-3 md:px-6 dark:bg-zinc-800">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-celeste-trifinio/30 bg-card text-celeste-trifinio">
                <OrganigramaIcon className="size-4.5" />
              </span>
              <h2 className="truncate text-sm font-black text-foreground md:text-base">
                Organigrama · {estructura.nombre}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <OrganigramaExportMenu options={exportOptions} />
              <button
                type="button"
                onClick={copiarImagen}
                disabled={copyState === "copying"}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-xl border border-celeste-trifinio/40 bg-card px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10 md:px-3 md:text-xs",
                  copyState === "copying" && "cursor-not-allowed opacity-60",
                )}
              >
                {copyState === "copying" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                ) : copyState === "copied" ? (
                  <Check className="size-4 shrink-0" />
                ) : (
                  <Clipboard className="size-4 shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {copyState === "copying"
                    ? "Copiando..."
                    : copyState === "copied"
                      ? "Copiado"
                      : "Copiar imagen"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarNombres((prev) => !prev)}
                aria-pressed={mostrarNombres}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-celeste-trifinio/40 bg-card px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10 md:px-3 md:text-xs"
              >
                {mostrarNombres ? (
                  <EyeOff className="size-4 shrink-0" />
                ) : (
                  <Eye className="size-4 shrink-0" />
                )}
                <span className="hidden sm:inline">
                  {mostrarNombres ? "Ocultar nombres" : "Mostrar nombres"}
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar organigrama"
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-celeste-trifinio transition-colors hover:bg-celeste-trifinio/10"
              >
                <X className="size-5" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1">
            <OrganigramaVertical
              ref={organigramaRef}
              estructura={estructura}
              fullHeight
              admin={admin}
              mostrarNombres={mostrarNombres}
              usarLogoRaiz={usarLogoRaiz}
              espaciadoAmplio={espaciadoAmplio}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
