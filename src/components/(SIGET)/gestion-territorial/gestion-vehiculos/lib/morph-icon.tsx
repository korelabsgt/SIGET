"use client";

import { useEffect, useRef, useState } from "react";
import { MorphIcon, type MorphHandle } from "morphicons/react";
import type { IconNode } from "lucide";
import { cn } from "@/lib/utils";

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
  const [internalHover, setInternalHover] = useState(false);

  iconRef.current = icon;
  hoverIconRef.current = hoverIcon;

  const useExternalHover = externalHover !== undefined;
  const isHovered = useExternalHover ? externalHover : internalHover;

  useEffect(() => {
    if (!morphOnHover || !hoverIconRef.current || useExternalHover) return;

    const el = wrapperRef.current;
    if (!el) return;

    const scope =
      el.closest("button, a, [role='button'], label, [data-morph-hover-scope]") ?? el;
    const onEnter = () => setInternalHover(true);
    const onLeave = () => setInternalHover(false);
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
  }, [morphOnHover, useExternalHover]);

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
