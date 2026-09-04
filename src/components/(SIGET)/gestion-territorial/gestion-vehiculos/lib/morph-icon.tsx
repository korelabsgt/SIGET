"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { MorphIcon, type MorphHandle } from "morphicons/react";
import type { IconNode } from "lucide";
import { cn } from "@/lib/utils";
import { useGvTableRowMorphHover } from "./gv-table-morph-row";

export const GV_MORPH_HOVER_SCOPE = "data-morph-hover-scope";

export function resolveMorphHoverScope(el: Element | null): Element | null {
  if (!el) return null;
  return (
    el.closest(`tr[${GV_MORPH_HOVER_SCOPE}]`) ??
    el.closest(`button, a, [role='button'], label, [${GV_MORPH_HOVER_SCOPE}]`) ??
    el
  );
}

function attachMorphHoverListeners(
  scope: Element,
  onEnter: () => void,
  onLeave: () => void,
) {
  const onPointerDown = (event: Event) => {
    if (event instanceof PointerEvent && event.pointerType === "touch") onEnter();
  };
  const onPointerUp = (event: Event) => {
    if (event instanceof PointerEvent && event.pointerType === "touch") onLeave();
  };

  scope.addEventListener("pointerenter", onEnter);
  scope.addEventListener("pointerleave", onLeave);
  scope.addEventListener("pointerdown", onPointerDown);
  scope.addEventListener("pointerup", onPointerUp);
  scope.addEventListener("pointercancel", onPointerUp);

  return () => {
    scope.removeEventListener("pointerenter", onEnter);
    scope.removeEventListener("pointerleave", onLeave);
    scope.removeEventListener("pointerdown", onPointerDown);
    scope.removeEventListener("pointerup", onPointerUp);
    scope.removeEventListener("pointercancel", onPointerUp);
  };
}

export function useMorphHoverScope(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  externalHover?: boolean,
): boolean {
  const [internalHover, setInternalHover] = useState(false);
  const useExternalHover = externalHover !== undefined;

  useEffect(() => {
    if (!enabled || useExternalHover) return;

    const el = ref.current;
    if (!el) return;

    const scope = resolveMorphHoverScope(el);
    if (!scope) return;

    return attachMorphHoverListeners(scope, () => setInternalHover(true), () =>
      setInternalHover(false),
    );
  }, [enabled, useExternalHover]);

  return useExternalHover ? Boolean(externalHover) : internalHover;
}

export function GvMorphIcon({
  icon,
  hoverIcon,
  className,
  size = 16,
  strokeWidth,
  morphOnHover = true,
  externalHover,
}: {
  icon: IconNode;
  hoverIcon?: IconNode;
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  morphOnHover?: boolean;
  externalHover?: boolean;
}) {
  const morphRef = useRef<MorphHandle>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef(icon);
  const hoverIconRef = useRef(hoverIcon);
  const rowMorphHover = useGvTableRowMorphHover();
  const scopeHover = useMorphHoverScope(
    wrapperRef,
    morphOnHover && rowMorphHover === null,
    externalHover,
  );
  const isHovered =
    externalHover !== undefined
      ? externalHover
      : rowMorphHover !== null
        ? rowMorphHover
        : scopeHover;

  iconRef.current = icon;
  hoverIconRef.current = hoverIcon;

  useEffect(() => {
    if (!morphOnHover || !hoverIconRef.current) return;

    const handle = morphRef.current;
    if (!handle) return;

    if (isHovered) {
      handle.morphTo(hoverIconRef.current, "snappy");
      return;
    }

    handle.morphTo(iconRef.current, "snappy");
  }, [isHovered, morphOnHover]);

  return (
    <span ref={wrapperRef} className="inline-flex shrink-0">
      <MorphIcon
        ref={morphRef}
        icon={icon}
        size={size}
        strokeWidth={strokeWidth}
        spring="snappy"
        className={cn(className)}
      />
    </span>
  );
}
