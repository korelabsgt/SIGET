"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { searchProfiles } from "./lib/actions";

type ProfileOption = { id: string; nombre: string; email: string };

function etiquetaUsuario(profile: Pick<ProfileOption, "nombre" | "email">): string {
  const nombre = profile.nombre?.trim();
  if (nombre) return nombre;
  return profile.email?.trim() || "Usuario";
}

export function PilotoSelect({
  value,
  onChange,
  disabled,
  excludeUserId,
}: {
  value: string;
  onChange: (profileId: string) => void;
  disabled?: boolean;
  excludeUserId?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<ProfileOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ProfileOption | null>(null);

  React.useEffect(() => {
    if (!value.trim()) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    setSelected((prev) => (prev?.id === value ? prev : null));
  }, [value, selected?.id]);

  React.useEffect(() => {
    if (selected && query === etiquetaUsuario(selected)) return;
    if (query.length < 3) {
      setOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchProfiles(query, excludeUserId);
        setOptions(results);
        const match = results.find((item) => item.id === value);
        if (match) setSelected(match);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, value, selected, excludeUserId]);

  const handleSelect = (profile: ProfileOption) => {
    setSelected(profile);
    setQuery(etiquetaUsuario(profile));
    onChange(profile.id);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setOptions([]);
    onChange("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (next: string) => {
    setQuery(next);
    if (selected) {
      setSelected(null);
      onChange("");
    }
    setOpen(true);
  };

  const showList =
    open &&
    !disabled &&
    (query.length >= 3 || loading || options.length > 0 || (query.length > 0 && query.length < 3));

  return (
    <Popover
      modal={false}
      open={showList}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            disabled={disabled}
            placeholder="Buscar por nombre o correo…"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-10 bg-white pr-16 dark:bg-zinc-950"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {loading ? <Loader2 className="size-4 animate-spin opacity-50" /> : null}
          </div>
          {selected || value ? (
            <button
              type="button"
              disabled={disabled}
              className="absolute inset-y-0 right-2 flex items-center rounded-md p-1 text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
              aria-label="Quitar piloto"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={() => setOpen(false)}
        className="z-[250] w-[var(--radix-popover-trigger-width)] border border-border bg-white p-1 opacity-100 shadow-lg dark:bg-zinc-900"
      >
        <div className="max-h-[220px] overflow-y-auto">
          {query.length > 0 && query.length < 3 ? (
            <p className="p-2 text-center text-sm text-muted-foreground">
              Escribe al menos 3 letras…
            </p>
          ) : null}
          {query.length >= 3 && !loading && options.length === 0 ? (
            <p className="p-2 text-center text-sm text-muted-foreground">
              No se encontraron usuarios.
            </p>
          ) : null}
          {options.map((option) => {
            const isSelected = value === option.id;
            const label = etiquetaUsuario(option);
            return (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sky-50 dark:hover:bg-zinc-800",
                  isSelected && "bg-sky-50/80 dark:bg-zinc-800/80",
                )}
              >
                <span
                  className={cn(
                    "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible",
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="min-w-0 truncate font-medium">{label}</span>
                {option.email ? (
                  <span className="ml-2 min-w-0 truncate text-xs text-muted-foreground">
                    {option.email}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
