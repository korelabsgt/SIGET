"use client";

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { GV_QUERY_OPTIONS, shareInflight } from "../../lib/query";
import { fetchProfileBasico } from "../../solicitudes/lib/actions";
import { useSearchProfiles } from "../../solicitudes/lib/hooks";

type ProfileOption = { id: string; nombre: string; email: string };

function etiquetaUsuario(profile: Pick<ProfileOption, "nombre" | "email">): string {
  const nombre = profile.nombre?.trim();
  if (nombre) return nombre;
  return profile.email?.trim() || "Usuario";
}

export function ReservaUsuariosField({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  const ids = React.useMemo(
    () => [...new Set(value.map((id) => id.trim()).filter(Boolean))],
    [value],
  );

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const profileQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["gv-profile-basico", id],
      queryFn: () => shareInflight(`gv-profile-basico:${id}`, () => fetchProfileBasico(id)),
      enabled: id.length > 0,
      ...GV_QUERY_OPTIONS,
    })),
  });

  const profilesById = React.useMemo(() => {
    const map = new Map<string, ProfileOption>();
    ids.forEach((id, index) => {
      const data = profileQueries[index]?.data;
      if (data?.id) map.set(id, data);
    });
    return map;
  }, [ids, profileQueries]);

  const loadingProfiles = profileQueries.some((q) => q.isFetching);

  const { data: options = [], isFetching: loadingSearch } = useSearchProfiles(
    debouncedQuery,
    undefined,
    open && debouncedQuery.length >= 3,
  );

  const loading = loadingProfiles || loadingSearch;

  const commitIds = (next: string[]) => {
    onChange([...new Set(next.map((id) => id.trim()).filter(Boolean))]);
  };

  const handleSelect = (profile: ProfileOption) => {
    const exists = ids.includes(profile.id);
    commitIds(exists ? ids.filter((id) => id !== profile.id) : [...ids, profile.id]);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemove = (profileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commitIds(ids.filter((id) => id !== profileId));
    inputRef.current?.focus();
  };

  const showList =
    open &&
    !disabled &&
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
          id="reserva_usuario_ids"
          role="group"
          aria-label="Usuarios en reserva individual"
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs",
            "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            "dark:bg-zinc-950",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onMouseDown={(e) => {
            if (disabled) return;
            if (e.target === e.currentTarget) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
        >
          {ids.map((id) => {
            const profile = profilesById.get(id);
            const label = profile ? etiquetaUsuario(profile) : "Cargando…";
            return (
              <Badge
                key={id}
                variant="secondary"
                className="max-w-full bg-blue-100 font-normal text-[#00A3FF] hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
              >
                <span className="truncate">{label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  className="ml-1 shrink-0 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                  onMouseDown={(e) => handleRemove(id, e)}
                  aria-label={`Quitar ${label}`}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            );
          })}
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            aria-controls="reserva-usuarios-listbox"
            disabled={disabled}
            placeholder={
              ids.length > 0
                ? "Agregar otro usuario…"
                : "Escribe al menos 3 letras para buscar"
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) setOpen(true);
            }}
            className="min-h-8 min-w-[12rem] flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
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
        <div id="reserva-usuarios-listbox" className="max-h-[220px] overflow-y-auto">
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
            const isSelected = ids.includes(option.id);
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
