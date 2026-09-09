"use client";

import { Wand2 } from "lucide-react";

import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { cn } from "@/lib/utils";

import { isSuperRole } from "./permissions";

const autofillButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30";

export function GvDevAutofillButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  const { realRole } = useUserContext();

  if (!isSuperRole(realRole)) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(autofillButtonClass, "cursor-pointer", className)}
    >
      <Wand2 className="size-3.5 shrink-0" />
      Simular datos
    </button>
  );
}
