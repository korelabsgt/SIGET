"use client";

import { cn } from "@/lib/utils";
import type { IconNode } from "lucide";
import { MorphIcon } from "morphicons/react";
import { useEffect, useRef, useState } from "react";

const CYCLE_MS = 1000;

type MorphCycleIconProps = {
  icons: readonly [IconNode, IconNode, IconNode, IconNode];
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  spring?: "smooth" | "snappy" | "bouncy";
  hovered?: boolean;
  cycleMs?: number;
};

export function MorphCycleIcon({
  icons,
  size = 28,
  color = "currentColor",
  strokeWidth = 1.75,
  className,
  spring = "snappy",
  hovered,
  cycleMs = CYCLE_MS,
}: MorphCycleIconProps) {
  const hoverSessionRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localHovered, setLocalHovered] = useState(false);
  const [displayIcon, setDisplayIcon] = useState<IconNode>(icons[0]);
  const active = hovered ?? localHovered;

  useEffect(() => {
    const clearTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    clearTimer();

    if (!active) {
      timeoutRef.current = setTimeout(() => {
        setDisplayIcon(icons[0]);
      }, 0);
      return clearTimer;
    }

    let cancelled = false;
    let index = (hoverSessionRef.current++ % (icons.length - 1)) + 1;

    const advance = () => {
      if (cancelled) return;
      setDisplayIcon(icons[index]);
      index = (index + 1) % icons.length;
      timeoutRef.current = setTimeout(advance, cycleMs);
    };

    timeoutRef.current = setTimeout(advance, 0);

    return () => {
      cancelled = true;
      clearTimer();
    };
  }, [active, cycleMs, icons]);

  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      onPointerEnter={
        hovered === undefined ? () => setLocalHovered(true) : undefined
      }
      onPointerLeave={
        hovered === undefined ? () => setLocalHovered(false) : undefined
      }
    >
      <MorphIcon
        icon={displayIcon}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        spring={spring}
      />
    </span>
  );
}
