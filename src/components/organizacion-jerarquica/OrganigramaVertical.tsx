"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ComponentProps,
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
  ListTree,
  Pencil,
  UserPlus,
  UserMinus,
  UserRound,
  ArrowRightLeft,
} from "lucide-react";
import { modalAccentClass } from "@/components/ui/general-modal";
import { Check, Clipboard, Eye, EyeOff, X, Ban } from "lucide";
import type { IconNode } from "lucide";
import { cn } from "@/lib/utils";
import { SigetActionIcon, sigetAccent } from "@/components/ui/siget-action-button";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  OrgActionButton,
  type AdminHandlers,
} from "./lib/org-actions";
import type { NodoOrganizacion } from "./lib/zod";
import { toast } from "react-toastify";
import { ModalShell } from "@/components/ui/general-modal";
import {
  OrganigramaExportMenu,
  organigramaExportIcons,
  type OrganigramaToolbarHint,
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

const ORG_ZOOM_MIN = 0.5;
const ORG_ZOOM_MAX = 2;

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

function profundidadNodo(nodo: NodoOrganizacion): number {
  if (!nodo.hijos?.length) return 1;
  return 1 + Math.max(...nodo.hijos.map(profundidadNodo));
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
    target.closest("[data-org-toolbar]") ||
      target.closest("[data-org-card]") ||
      target.closest("[data-org-actions]"),
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

function rd3tTransformToCss(transform: string | null): string | undefined {
  if (!transform) return undefined;
  const parts: string[] = [];
  const translate = transform.match(
    /translate\(\s*([-\d.eE]+)\s*[, ]\s*([-\d.eE]+)\s*\)/,
  );
  if (translate) {
    parts.push(`translate(${translate[1]}px, ${translate[2]}px)`);
  }
  const scale = transform.match(/scale\(\s*([-\d.eE]+)\s*\)/);
  if (scale) {
    parts.push(`scale(${scale[1]})`);
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function useCenteredTree(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    if (!active) {
      setCanvasReady(false);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const sync = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
        setTranslate({ x: width / 2, y: Math.max(120, Math.min(160, height * 0.15)) });
        setCanvasReady(true);
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return { containerRef, translate, dimensions, canvasReady };
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

type OrganigramaToolbarConfig = {
  mostrarNombres: boolean;
  onToggleNombres: () => void;
  copyState: "idle" | "copying" | "copied";
  onCopy: () => void;
  exportOptions: ComponentProps<typeof OrganigramaExportMenu>["options"];
};

export type { OrganigramaToolbarConfig };

const ORG_TOOLBAR_SEGMENT =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent shadow-none transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/80";

const ORG_TOOLBAR_SEGMENT_COMPACT =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-none border-0 bg-transparent shadow-none transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/80";

function OrganigramaToolbarSegment({
  hint,
  accentColor,
  morphFrom,
  morphTo,
  onClick,
  disabled,
  ariaLabel,
  ariaBusy,
  onHintChange,
  className,
  segmentClass = ORG_TOOLBAR_SEGMENT,
}: {
  hint: string;
  accentColor: string;
  morphFrom: IconNode;
  morphTo: IconNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaBusy?: boolean;
  onHintChange: (hint: OrganigramaToolbarHint) => void;
  className?: string;
  segmentClass?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <RippleButton
      type="button"
      rippleColor="#E5E7EB"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? hint}
      aria-busy={ariaBusy || undefined}
      onPointerEnter={() => {
        setHovered(true);
        onHintChange({ label: hint, color: accentColor });
      }}
      onPointerLeave={() => {
        setHovered(false);
        onHintChange(null);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        segmentClass,
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <SigetActionIcon
        from={morphFrom}
        to={morphTo}
        color={accentColor}
        hovered={hovered}
      />
    </RippleButton>
  );
}

function OrganigramaCanvasToolbar({
  mostrarNombres,
  onToggleNombres,
  copyState,
  onCopy,
  exportOptions,
  inline = false,
  onClose,
}: OrganigramaToolbarConfig & { inline?: boolean; onClose?: () => void }) {
  const [hoverHint, setHoverHint] = useState<OrganigramaToolbarHint>(null);
  const ocultarHint = mostrarNombres ? "Ocultar nombres" : "Mostrar nombres";
  const copiarHint =
    copyState === "copied"
      ? "Copiado"
      : copyState === "copying"
        ? "Copiando"
        : "Copiar";
  const segmentClass = inline ? ORG_TOOLBAR_SEGMENT_COMPACT : ORG_TOOLBAR_SEGMENT;

  const titleLabel = (
    <AnimatePresence mode="wait">
      {hoverHint ? (
        <motion.span
          key={hoverHint.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="text-sm font-bold tracking-tight whitespace-nowrap md:text-base"
          style={{ color: hoverHint.color }}
          aria-live="polite"
        >
          {hoverHint.label}
        </motion.span>
      ) : (
        <motion.span
          key="organigrama"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "text-sm font-bold tracking-tight md:text-base",
            modalAccentClass,
          )}
        >
          Organigrama
        </motion.span>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={cn(
        inline ? "w-full" : "mt-3 border-t border-border/50 pt-2.5",
      )}
      data-org-toolbar=""
    >
      <div
        className={cn(
          "flex items-center",
          inline ? "w-full justify-between gap-2" : "gap-2.5",
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {inline ? (
          <div className="min-h-5 min-w-0 flex-1 overflow-hidden">
            {titleLabel}
          </div>
        ) : null}
        <div
          className={cn(
            "flex items-center gap-2",
            inline ? "shrink-0" : undefined,
          )}
        >
          {!inline ? (
            <div className="flex min-h-5 min-w-[5rem] items-center justify-end">
              <AnimatePresence mode="wait">
                {hoverHint ? (
                  <motion.span
                    key={hoverHint.label}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="text-xs font-bold whitespace-nowrap"
                    style={{ color: hoverHint.color }}
                    aria-live="polite"
                  >
                    {hoverHint.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
          <div
            className={cn(
              "flex items-stretch overflow-hidden rounded-lg border-2 border-border bg-white dark:border-zinc-700 dark:bg-card",
              inline && "h-8",
            )}
          >
          <OrganigramaExportMenu
            options={exportOptions}
            iconOnly
            segmented
            compact={inline}
            onHintChange={setHoverHint}
          />
          <OrganigramaToolbarSegment
            hint={copiarHint}
            accentColor={sigetAccent.enlace}
            morphFrom={Clipboard}
            morphTo={Check}
            onClick={onCopy}
            disabled={copyState === "copying"}
            ariaBusy={copyState === "copying"}
            ariaLabel="Copiar organigrama"
            onHintChange={setHoverHint}
            segmentClass={segmentClass}
            className="border-l border-border dark:border-zinc-700"
          />
          <OrganigramaToolbarSegment
            hint={ocultarHint}
            accentColor={sigetAccent.editar}
            morphFrom={mostrarNombres ? EyeOff : Eye}
            morphTo={mostrarNombres ? Eye : EyeOff}
            onClick={onToggleNombres}
            ariaLabel={
              mostrarNombres ? "Ocultar nombres" : "Mostrar nombres"
            }
            onHintChange={setHoverHint}
            segmentClass={segmentClass}
            className="border-l border-border dark:border-zinc-700"
          />
          {onClose ? (
            <OrganigramaToolbarSegment
              hint="Cerrar"
              accentColor={sigetAccent.quitar}
              morphFrom={X}
              morphTo={Ban}
              onClick={onClose}
              ariaLabel="Cerrar organigrama"
              onHintChange={setHoverHint}
              segmentClass={segmentClass}
              className="border-l border-border dark:border-zinc-700"
            />
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export { OrganigramaCanvasToolbar };

export const OrganigramaVertical = forwardRef<
  OrganigramaVerticalHandle,
  {
    estructura: NodoOrganizacion;
    fullHeight?: boolean;
    modal?: boolean;
    admin?: AdminHandlers;
    mostrarNombres?: boolean;
    usarLogoRaiz?: boolean;
    espaciadoAmplio?: boolean;
  }
>(function OrganigramaVertical(
  {
    estructura,
    fullHeight = false,
    modal = false,
    admin,
    mostrarNombres = true,
    usarLogoRaiz = true,
    espaciadoAmplio = false,
  },
  ref,
) {
  const [mounted, setMounted] = useState(false);
  const [panCss, setPanCss] = useState<string | undefined>();
  const { containerRef, translate, dimensions, canvasReady } =
    useCenteredTree(mounted);
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
  const altoArbol = useMemo(
    () => 200 + profundidadNodo(estructura) * nodeStrideY,
    [estructura, nodeStrideY],
  );
  const treeDimensions = useMemo(() => {
    if (dimensions.width <= 0 || dimensions.height <= 0) {
      return dimensions;
    }
    const contentHeight = Math.max(
      dimensions.height,
      Math.round(altoArbol),
    );
    return { width: dimensions.width, height: contentHeight };
  }, [dimensions, altoArbol]);
  const [logoHref, setLogoHref] = useState<string | null>(null);
  const [treeTranslate, setTreeTranslate] = useState<{ x: number; y: number } | null>(
    null,
  );

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
    if (!canvasReady) return;
    setTreeTranslate(translate);
  }, [canvasReady, translate.x, translate.y]);

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

    const onPointerDown = (e: PointerEvent) => {
      if (isOrgInteractiveTarget(e.target)) return;
      closeAllMenus();
    };

    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [canvasReady, closeAllMenus]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasReady) return;

    const group = el.querySelector("g.rd3t-g");
    if (!group) return;

    const syncTransform = () => {
      if (modal) {
        setPanCss(rd3tTransformToCss(group.getAttribute("transform")));
      }
      closeAllMenus();
    };

    syncTransform();
    const observer = new MutationObserver(syncTransform);
    observer.observe(group, {
      attributes: true,
      attributeFilter: ["transform"],
    });
    return () => observer.disconnect();
  }, [canvasReady, closeAllMenus, mostrarNombres, modal]);

  if (!estructura.hijos?.length) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No hay estructura para mostrar en el organigrama.
      </div>
    );
  }

  const data = toDatum(estructura);

  const legendPanel = modal ? (
    <div className="org-export-hide pointer-events-none absolute left-3 top-3 z-20 w-auto overflow-visible rounded-xl border border-border/50 bg-card/95 p-2.5 shadow-sm backdrop-blur">
      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
        Descripción
      </p>
      <ul className="space-y-1.5">
        {ORG_LEYENDA.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className={cn("size-3 shrink-0 rounded-[4px]", item.swatch)}
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
  ) : null;

  const treeViewport = (
    <>
      {mounted && canvasReady && treeTranslate && treeDimensions.height > 0 && (
        <Tree
          data={data}
          dimensions={treeDimensions}
          orientation="vertical"
          translate={treeTranslate}
          pathFunc={stepPath}
          nodeSize={{ x: nodeSizeX, y: nodeStrideY }}
          separation={{
            siblings: layout.sepSiblings,
            nonSiblings: layout.sepNonSiblings,
          }}
          renderCustomNodeElement={renderNode}
          collapsible={false}
          zoomable={modal}
          draggable={modal}
          zoom={1}
          scaleExtent={{ min: ORG_ZOOM_MIN, max: ORG_ZOOM_MAX }}
          pathClassFunc={(link) => {
            const target = link.target.data.attributes ?? {};
            if (String(target.cadena ?? "") === "1") {
              return "org-link org-link--cadena";
            }
            return "org-link";
          }}
        />
      )}
      {!modal ? (
        <p className="org-export-hide pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          Clic en tarjeta para acciones
        </p>
      ) : null}
    </>
  );

  return (
    <OrgMenuCloseContext.Provider value={{ registerClose }}>
      <div
        ref={containerRef}
        className={cn(
          "org-canvas relative bg-zinc-50/60 dark:bg-zinc-900/40",
          modal
            ? "org-canvas--modal w-full min-h-0 flex-1"
            : fullHeight
              ? "org-canvas--panel w-full min-h-0 flex-1"
              : "-mx-4 overflow-hidden rounded-xl border border-border/50 md:mx-0",
        )}
      >
        {treeViewport}
        {legendPanel ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 overflow-visible"
            style={{
              transform: panCss,
              transformOrigin: "0 0",
              willChange: "transform",
            }}
          >
            {legendPanel}
          </div>
        ) : null}
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
  const [mostrarNombres, setMostrarNombres] = useState(true);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">(
    "idle",
  );
  const organigramaRef = useRef<OrganigramaVerticalHandle>(null);

  const exportBasename = organigramaExportBasename(estructura.nombre);

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

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title=""
      fullscreen
      hideCloseButton
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      headerActionsAlign="end"
      headerClassName="min-h-10 gap-2 px-3 !py-0 pt-[max(0.25rem,env(safe-area-inset-top))] md:px-4"
      headerActions={
        <OrganigramaCanvasToolbar
          inline
          onClose={onClose}
          mostrarNombres={mostrarNombres}
          onToggleNombres={() => setMostrarNombres((prev) => !prev)}
          copyState={copyState}
          onCopy={() => void copiarImagen()}
          exportOptions={exportOptions}
        />
      }
    >
      {open ? (
        <OrganigramaVertical
          ref={organigramaRef}
          estructura={estructura}
          modal
          admin={admin}
          mostrarNombres={mostrarNombres}
          usarLogoRaiz={usarLogoRaiz}
          espaciadoAmplio={espaciadoAmplio}
        />
      ) : null}
    </ModalShell>
  );
}
