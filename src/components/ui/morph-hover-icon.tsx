"use client";

import { useState } from "react";
import { MorphIcon } from "morphicons/react";
import type { IconNode } from "lucide";
import { cn } from "@/lib/utils";

type MorphHoverIconProps = {
  from: IconNode;
  to: IconNode;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  spring?: "smooth" | "snappy" | "bouncy";
  hovered?: boolean;
};

export function MorphHoverIcon({
  from,
  to,
  size = 28,
  color = "currentColor",
  strokeWidth = 1.75,
  className,
  spring = "smooth",
  hovered,
}: MorphHoverIconProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const active = hovered ?? localHovered;

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
        icon={active ? to : from}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        spring={spring}
      />
    </span>
  );
}
