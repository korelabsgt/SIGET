"use client";

import * as React from "react";
import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { searchProfiles } from "./lib/actions";

type ProfileOption = { id: string; nombre: string; email: string };

interface PasajerosSelectProps {
  value: string;
  onChange: (value: string) => void;
}

function etiquetaUsuario(profile: Pick<ProfileOption, "nombre" | "email">): string {
  const nombre = profile.nombre?.trim();
  if (nombre) return nombre;
  return profile.email?.trim() || "Usuario";
}

export function PasajerosSelect({ value, onChange }: PasajerosSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<ProfileOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ProfileOption[]>([]);

  React.useEffect(() => {
    if (!value.trim()) {
      setSelected([]);
      return;
    }
    const names = value.split(", ").filter(Boolean);
    setSelected((prev) => {
      const knownByName = new Map(prev.map((profile) => [etiquetaUsuario(profile), profile]));
      return names
        .map(
          (name) =>
            knownByName.get(name) ?? {
              id: `legacy:${name}`,
              nombre: name,
              email: "",
            },
        )
        .filter(
          (profile, index, list) =>
            list.findIndex((item) => item.id === profile.id) === index,
        );
    });
  }, [value]);

  React.useEffect(() => {
    if (query.length < 3) {
      setOptions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchProfiles(query);
        setOptions(results);
      } catch (error) {
        console.error("Error searching profiles", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const commitSelection = (next: ProfileOption[]) => {
    setSelected(next);
    onChange(next.map((profile) => etiquetaUsuario(profile)).join(", "));
  };

  const handleSelect = (profile: ProfileOption) => {
    const exists = selected.some((item) => item.id === profile.id);
    const next = exists
      ? selected.filter((item) => item.id !== profile.id)
      : [...selected.filter((item) => item.id !== profile.id), profile];
    commitSelection(next);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemove = (profileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commitSelection(selected.filter((item) => item.id !== profileId));
    inputRef.current?.focus();
  };

  const handleInputChange = (next: string) => {
    setQuery(next);
    setOpen(true);
  };

  const showList =
    open &&
    (query.length >= 3 ||
      loading ||
      options.length > 0 ||
      (query.length > 0 && query.length < 3));

  return (
    <Popover
      modal={false}
      open={showList}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <PopoverAnchor asChild>
        <div
          className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:bg-zinc-950"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
        >
          {selected.map((profile) => (
            <Badge
              key={profile.id}
              variant="secondary"
              className="max-w-full bg-blue-100 font-normal text-[#00A3FF] hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
            >
              <span className="truncate">{etiquetaUsuario(profile)}</span>
              <button
                type="button"
                className="ml-1 shrink-0 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onMouseDown={(e) => handleRemove(profile.id, e)}
                aria-label={`Quitar ${etiquetaUsuario(profile)}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            placeholder={selected.length > 0 ? "Agregar pasajero…" : "Buscar usuarios…"}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-50" aria-hidden />
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
            const isSelected = selected.some((item) => item.id === option.id);
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
