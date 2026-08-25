"use client";

import { useId, useState } from "react";
import { MorphIcon } from "morphicons/react";
import { CircleCheck, CircleOff, Lock, LockOpen } from "lucide";
import { motion, useReducedMotion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { cn } from "@/lib/utils";

const CARD_EASE = [0.4, 0, 0.2, 1] as const;
const CARD_DURATION = 0.5;
const THUMB_TRAVEL = 34;

type MorphSwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  pending?: boolean;
  variant?: "default" | "plain" | "card";
};

function FrameToggle({
  checked,
  reduceMotion,
  disabled,
}: {
  checked: boolean;
  reduceMotion: boolean | null;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const transition = reduceMotion
    ? { duration: 0.15 }
    : { duration: CARD_DURATION, ease: CARD_EASE };
  const accent = checked ? "#10b981" : "#ef4444";

  return (
    <div
      className={cn(
        "relative h-12 w-[5.75rem] shrink-0 rounded-[1.15rem] border-[3px] bg-white p-1.5 transition-[border-color] duration-500 ease-in-out dark:bg-zinc-900",
        checked
          ? "border-emerald-500 dark:border-emerald-500"
          : "border-red-400 dark:border-red-500",
        disabled && "opacity-60",
      )}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      aria-hidden
    >
      <div
        className={cn(
          "absolute top-1/2 flex -translate-y-1/2 items-center justify-center",
          checked ? "left-2.5" : "right-2.5",
        )}
      >
        <MorphHoverIcon
          from={checked ? Lock : LockOpen}
          to={checked ? LockOpen : Lock}
          hovered={hovered}
          size={19}
          color={accent}
          strokeWidth={2}
          spring="smooth"
        />
      </div>

      <motion.div
        className={cn(
          "absolute top-1.5 left-1.5 size-8 rounded-xl shadow-sm",
          checked
            ? "bg-emerald-500 dark:bg-emerald-500"
            : "bg-red-400 dark:bg-red-500",
        )}
        initial={false}
        animate={{ x: checked ? THUMB_TRAVEL : 0 }}
        transition={transition}
      />
    </div>
  );
}

function CardMorphSwitch({
  switchId,
  checked,
  onCheckedChange,
  className,
  disabled = false,
  pending = false,
}: Omit<MorphSwitchProps, "variant" | "id" | "label" | "description"> & {
  switchId: string;
}) {
  const reduceMotion = useReducedMotion();
  const blocked = disabled || pending;

  return (
    <button
      type="button"
      id={switchId}
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "Activa" : "Inactiva"}
      aria-busy={pending || undefined}
      disabled={blocked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/60",
        !blocked && "cursor-pointer active:scale-[0.995]",
        blocked && "pointer-events-none",
        pending && "opacity-80",
        disabled && !pending && "opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-[4.5rem] text-sm font-semibold transition-colors duration-500 ease-in-out",
          checked
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400",
        )}
      >
        {checked ? "Activa" : "Inactiva"}
      </span>
      <FrameToggle
        checked={checked}
        reduceMotion={reduceMotion}
        disabled={blocked}
      />
    </button>
  );
}

export function MorphSwitch({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  className,
  disabled = false,
  pending = false,
  variant = "default",
}: MorphSwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  if (variant === "card") {
    return (
      <CardMorphSwitch
        switchId={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={className}
        disabled={disabled}
        pending={pending}
      />
    );
  }

  const iconSize = variant === "default" ? 22 : 18;
  const iconWrapSize = variant === "default" ? "size-11" : "size-8";

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl transition-[background-color,color] duration-500 ease-in-out",
            iconWrapSize,
            checked
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
              : "bg-zinc-200/80 text-muted-foreground dark:bg-zinc-700",
          )}
        >
          <MorphIcon
            icon={checked ? CircleCheck : CircleOff}
            size={iconSize}
            strokeWidth={1.75}
            spring="snappy"
          />
        </span>
        <div className="min-w-0 flex-1 py-0.5">
          <p
            id={`${switchId}-label`}
            className="truncate text-sm font-semibold leading-tight text-foreground"
          >
            {label}
          </p>
          {description ? (
            <p className="mt-0.5 min-h-8 text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || pending}
        aria-labelledby={`${switchId}-label`}
        aria-busy={pending}
        className="shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-300 dark:data-[state=unchecked]:bg-zinc-600"
      />
    </>
  );

  const containerClassName = cn(
    "flex w-full items-center justify-between gap-4",
    variant === "default" &&
      "rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50",
    !disabled && !pending && "cursor-pointer",
    pending && "pointer-events-none",
    disabled && !pending && "cursor-not-allowed opacity-60",
    className,
  );

  if (disabled || pending) {
    return <div className={containerClassName}>{content}</div>;
  }

  return (
    <label htmlFor={switchId} className={containerClassName}>
      {content}
    </label>
  );
}
