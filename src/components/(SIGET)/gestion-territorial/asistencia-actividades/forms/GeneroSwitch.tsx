"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Genero } from "../lib/zod";

export function GeneroSwitch({
  value,
  onChange,
  id = "genero-switch",
}: {
  value: Genero | "";
  onChange: (value: Genero) => void;
  id?: string;
}) {
  const esFemenino = value === "femenino";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50/80 px-3 py-2.5 dark:bg-zinc-800/40">
      <span
        className={cn(
          "text-sm font-bold transition-colors",
          !esFemenino ? "text-[#2563eb]" : "text-muted-foreground",
        )}
      >
        Masculino
      </span>
      <Switch
        id={id}
        checked={esFemenino}
        onCheckedChange={(checked) =>
          onChange(checked ? "femenino" : "masculino")
        }
        className="shrink-0 data-[state=checked]:bg-[#ec4899] data-[state=unchecked]:bg-[#2563eb]"
        aria-label="Cambiar género"
      />
      <span
        className={cn(
          "text-sm font-bold transition-colors",
          esFemenino ? "text-[#ec4899]" : "text-muted-foreground",
        )}
      >
        Femenino
      </span>
    </div>
  );
}
