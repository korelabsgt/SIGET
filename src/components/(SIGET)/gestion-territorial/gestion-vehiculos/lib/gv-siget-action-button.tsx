"use client";

import { useState } from "react";
import type { IconNode } from "lucide";
import {
  SigetActionIcon,
  sigetAccent,
  sigetBtnSurface,
} from "@/components/ui/siget-action-button";
import { RippleButton } from "@/components/ui/ripple-button";
import { cn } from "@/lib/utils";
import { useGvTableRowMorphHover } from "./gv-table-morph-row";

export { sigetAccent };

export function GvSigetActionButton({
  label,
  accentColor,
  rippleColor = "#E5E7EB",
  morphFrom,
  morphTo,
  onClick,
  ariaLabel,
  className,
  disabled,
  role,
  ariaChecked,
  ariaBusy,
  morphOnHover = true,
  type = "button",
  iconOnly = false,
}: {
  label: string;
  accentColor: string;
  rippleColor?: string;
  morphFrom: IconNode;
  morphTo: IconNode;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  role?: "switch";
  ariaChecked?: boolean;
  ariaBusy?: boolean;
  morphOnHover?: boolean;
  type?: "button" | "submit";
  iconOnly?: boolean;
}) {
  const [buttonHovered, setButtonHovered] = useState(false);
  const rowMorphHover = useGvTableRowMorphHover();
  const hovered =
    rowMorphHover !== null ? rowMorphHover : morphOnHover ? buttonHovered : false;

  return (
    <RippleButton
      type={type}
      rippleColor={rippleColor}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      role={role}
      aria-checked={ariaChecked}
      aria-busy={ariaBusy || undefined}
      disabled={disabled}
      onPointerEnter={
        rowMorphHover === null && morphOnHover ? () => setButtonHovered(true) : undefined
      }
      onPointerLeave={
        rowMorphHover === null && morphOnHover ? () => setButtonHovered(false) : undefined
      }
      className={cn(
        sigetBtnSurface,
        iconOnly ? "size-9 w-9 shrink-0 px-0" : "w-full",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex max-w-full items-center justify-center leading-none",
          !iconOnly && "w-full gap-1",
        )}
      >
        {!iconOnly ? (
          <span className="truncate leading-none" style={{ color: accentColor }}>
            {label}
          </span>
        ) : null}
        <SigetActionIcon
          from={morphFrom}
          to={morphTo}
          color={accentColor}
          hovered={hovered}
          morphOnHover={morphOnHover}
        />
      </span>
    </RippleButton>
  );
}
