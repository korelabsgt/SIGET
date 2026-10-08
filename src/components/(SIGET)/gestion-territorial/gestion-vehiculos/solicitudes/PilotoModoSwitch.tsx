"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { PilotoModo } from "./lib/zod";

const trifinioActive = "text-[#2c5f9b] dark:text-[#6f9fd4]";

export function PilotoModoSwitch({
  value,
  onChange,
  labelSolicitante,
  id = "piloto-modo-switch",
}: {
  value: PilotoModo;
  onChange: (value: PilotoModo) => void;
  labelSolicitante: string;
  id?: string;
}) {
  const esOtro = value === "otro";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50/80 px-3 py-2.5 dark:bg-zinc-800/40">
      <span
        className={cn(
          "min-w-0 text-sm font-bold transition-colors",
          !esOtro ? trifinioActive : "text-muted-foreground",
        )}
      >
        {labelSolicitante}
      </span>
      <Switch
        id={id}
        checked={esOtro}
        onCheckedChange={(checked) => onChange(checked ? "otro" : "solicitante")}
        className={cn(
          "shrink-0 data-[state=checked]:bg-[#2c5f9b] data-[state=unchecked]:bg-[#2c5f9b]",
          "dark:data-[state=checked]:bg-[#6f9fd4] dark:data-[state=unchecked]:bg-[#6f9fd4]",
        )}
        aria-label="Cambiar piloto del vehículo"
      />
      <span
        className={cn(
          "shrink-0 text-sm font-bold transition-colors",
          esOtro ? trifinioActive : "text-muted-foreground",
        )}
      >
        Otra persona
      </span>
    </div>
  );
}
