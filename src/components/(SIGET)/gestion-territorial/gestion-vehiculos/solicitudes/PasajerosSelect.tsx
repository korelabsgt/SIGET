"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

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
  };

  const handleRemove = (profileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commitSelection(selected.filter((item) => item.id !== profileId));
  };

  return (
    <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-auto min-h-[40px] w-full cursor-pointer items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-zinc-950"
        >
          <div className="flex w-full flex-wrap items-center gap-1 overflow-hidden">
            {selected.length > 0 ? (
              selected.map((profile) => (
                <Badge
                  key={profile.id}
                  variant="secondary"
                  className="mb-1 mr-1 bg-blue-100 font-normal text-[#00A3FF] hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                >
                  {etiquetaUsuario(profile)}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => handleRemove(profile.id, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="font-normal text-muted-foreground">Buscar usuarios...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="z-[250] w-[var(--radix-popover-trigger-width)] border border-border bg-white p-0 opacity-100 shadow-lg dark:bg-zinc-900"
      >
        <div className="flex items-center border-b border-border px-3 dark:border-zinc-700">
          <Input
            placeholder="Nombre o correo (mín. 3 letras)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-none border-0 px-0 shadow-none focus-visible:ring-0"
          />
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" /> : null}
        </div>
        <div className="max-h-[220px] overflow-y-auto p-1">
          {query.length > 0 && query.length < 3 ? (
            <p className="p-2 text-center text-sm text-muted-foreground">
              Escribe al menos 3 letras...
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
