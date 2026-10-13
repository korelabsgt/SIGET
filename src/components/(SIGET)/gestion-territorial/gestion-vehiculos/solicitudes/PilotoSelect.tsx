"use client";

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GV_QUERY_OPTIONS, shareInflight } from "../lib/query";
import { fetchProfileBasico } from "./lib/actions";
import { useProfileBasico, useSearchProfiles } from "./lib/hooks";

type ProfileOption = { id: string; nombre: string; email: string };

function etiquetaUsuario(profile: Pick<ProfileOption, "nombre" | "email">): string {
  const nombre = profile.nombre?.trim();
  if (nombre) return nombre;
  return profile.email?.trim() || "Usuario";
}

function PilotoSelectSingle({
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
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [selected, setSelected] = React.useState<ProfileOption | null>(null);

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const valueStr = Array.isArray(value) ? "" : (value ?? "").trim();

  const { data: profileLoaded, isFetching: loadingProfile } = useProfileBasico(
    valueStr,
    Boolean(valueStr),
  );

  React.useEffect(() => {
    if (!valueStr) {
      setSelected(null);
      return;
    }
    if (selected?.id === valueStr) return;
    if (!profileLoaded) return;
    setSelected(profileLoaded);
    setQuery(etiquetaUsuario(profileLoaded));
  }, [valueStr, selected?.id, profileLoaded]);

  const { data: options = [], isFetching: loadingSearch } = useSearchProfiles(
    debouncedQuery,
    excludeUserId,
    open && debouncedQuery.length >= 3,
  );

  const loading = loadingProfile || loadingSearch;

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
    <PilotoSelectPopover
      showList={showList}
      setOpen={setOpen}
      query={query}
      loading={loading}
      options={options}
      disabled={disabled}
      isOptionSelected={(option) => valueStr === option.id}
      onPick={handleSelect}
      anchor={
        <div className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            disabled={disabled}
            placeholder="Buscar por nombre"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className="h-10 bg-white pr-16 dark:bg-zinc-950"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {loading ? <Loader2 className="size-4 animate-spin opacity-50" /> : null}
          </div>
          {selected || valueStr ? (
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
      }
    />
  );
}

function PilotoSelectMultiple({
  value,
  onChange,
  disabled,
  excludeUserId,
}: {
  value: string[];
  onChange: (profileIds: string[]) => void;
  disabled?: boolean;
  excludeUserId?: string;
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
    excludeUserId,
    open && debouncedQuery.length >= 3,
  );

  const loading = loadingProfiles || loadingSearch;

  const commitSelection = (nextIds: string[]) => {
    onChange([...new Set(nextIds.map((id) => id.trim()).filter(Boolean))]);
  };

  const handleSelect = (profile: ProfileOption) => {
    const exists = ids.includes(profile.id);
    const next = exists
      ? ids.filter((id) => id !== profile.id)
      : [...ids, profile.id];
    commitSelection(next);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemove = (profileId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    commitSelection(ids.filter((id) => id !== profileId));
    inputRef.current?.focus();
  };

  const handleInputChange = (next: string) => {
    setQuery(next);
    setOpen(true);
  };

  const showList =
    open &&
    !disabled &&
    (query.length >= 3 ||
      loading ||
      options.length > 0 ||
      (query.length > 0 && query.length < 3));

  return (
    <PilotoSelectPopover
      showList={showList}
      setOpen={setOpen}
      query={query}
      loading={loading}
      options={options}
      disabled={disabled}
      isOptionSelected={(option) => ids.includes(option.id)}
      onPick={handleSelect}
      anchor={
        <div
          className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:bg-zinc-950"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              inputRef.current?.focus();
            }
          }}
        >
          {ids.map((id) => {
            const profile = profilesById.get(id);
            const label = profile ? etiquetaUsuario(profile) : "…";
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
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            disabled={disabled}
            placeholder={ids.length > 0 ? "Agregar otro usuario…" : "Buscar por nombre"}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-50" aria-hidden />
          ) : null}
        </div>
      }
    />
  );
}

function PilotoSelectPopover({
  showList,
  setOpen,
  query,
  loading,
  options,
  disabled,
  isOptionSelected,
  onPick,
  anchor,
}: {
  showList: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  loading: boolean;
  options: ProfileOption[];
  disabled?: boolean;
  isOptionSelected: (option: ProfileOption) => boolean;
  onPick: (option: ProfileOption) => void;
  anchor: React.ReactNode;
}) {
  return (
    <Popover
      modal={false}
      open={showList}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <PopoverAnchor asChild>{anchor}</PopoverAnchor>
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
            const isSelected = isOptionSelected(option);
            const label = etiquetaUsuario(option);
            return (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(option);
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

type PilotoSelectProps =
  | {
      multiple?: false;
      value: string;
      onChange: (profileId: string) => void;
      disabled?: boolean;
      excludeUserId?: string;
    }
  | {
      multiple: true;
      value: string[];
      onChange: (profileIds: string[]) => void;
      disabled?: boolean;
      excludeUserId?: string;
    };

export function PilotoSelect(props: PilotoSelectProps) {
  if (props.multiple) {
    return (
      <PilotoSelectMultiple
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        excludeUserId={props.excludeUserId}
      />
    );
  }
  return (
    <PilotoSelectSingle
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      excludeUserId={props.excludeUserId}
    />
  );
}
