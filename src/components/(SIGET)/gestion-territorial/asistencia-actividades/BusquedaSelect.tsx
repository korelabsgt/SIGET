"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function normalizarBusqueda(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function BusquedaSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccione…",
  disabled = false,
  emptyMessage = "Sin resultados",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalizarBusqueda(query.trim());
    if (!q) return options;
    return options.filter((opt) =>
      normalizarBusqueda(opt).includes(q),
    );
  }, [options, query]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30 disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        collisionPadding={12}
        className="z-[210] w-[var(--radix-popover-trigger-width)] border-celeste-trifinio/30 bg-zinc-100 p-0 dark:bg-zinc-900"
      >
        <div className="border-b border-border p-2 dark:border-zinc-700">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30"
              autoFocus
            />
          </div>
        </div>
        <ul className="max-h-52 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((opt) => {
              const selected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-celeste-trifinio/10",
                      selected && "bg-celeste-trifinio/15 font-semibold",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0 text-celeste-trifinio",
                        !selected && "opacity-0",
                      )}
                    />
                    <span className="truncate">{opt}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
