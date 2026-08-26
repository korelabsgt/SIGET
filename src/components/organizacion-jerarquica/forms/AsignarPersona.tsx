"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  useAsignarPersonaAPuesto,
  usePersonasParaAsignar,
} from "../lib/hooks";
import { asignarPersonaSchema, type ProfileOpcion } from "../lib/zod";
import {
  EstructuraFormShell,
  FormFooter,
  FormInput,
  FormLabel,
  FormSubmitButton,
  modalActionMessage,
} from "./EstructuraFormShell";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function PersonaSearchField({
  personas,
  puestoId,
  profileId,
  onSelect,
  onClear,
}: {
  personas: ProfileOpcion[];
  puestoId: string;
  profileId: string | null;
  onSelect: (persona: ProfileOpcion) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = personas.find((p) => p.id === profileId) ?? null;

  useEffect(() => {
    if (!profileId) return;
    const persona = personas.find((p) => p.id === profileId);
    if (persona) setQuery(persona.nombre);
  }, [profileId, personas]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const filtered = useMemo(() => {
    const term = normalizeSearchText(query.trim());
    if (term.length < 1) return [];
    return personas
      .filter(
        (p) =>
          normalizeSearchText(p.nombre).includes(term) ||
          (p.email ? normalizeSearchText(p.email).includes(term) : false),
      )
      .slice(0, 8);
  }, [personas, query]);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (selected && value !== selected.nombre) {
      onClear();
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-56 space-y-2">
      <FormLabel htmlFor="persona-puesto">Persona</FormLabel>
      <FormInput
        id="persona-puesto"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.trim().length >= 1 && setOpen(true)}
        autoComplete="off"
      />
      {profileId && (
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery("");
            setOpen(false);
          }}
          className="cursor-pointer text-xs font-semibold text-celeste-trifinio hover:underline"
        >
          Quitar asignación
        </button>
      )}
      {open && query.trim().length >= 1 && (
        <ul className="mt-1 max-h-52 w-full overflow-y-auto rounded-lg border-2 border-celeste-trifinio/40 bg-zinc-100 shadow-md dark:bg-zinc-800">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Sin coincidencias
            </li>
          ) : (
            filtered.map((persona) => {
              const ocupadoEnOtro =
                persona.puesto_id &&
                persona.puesto_id !== puestoId &&
                persona.puesto_nombre;
              return (
                <li key={persona.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-celeste-trifinio/10",
                      profileId === persona.id && "bg-celeste-trifinio/15",
                    )}
                    onClick={() => {
                      onSelect(persona);
                      setQuery(persona.nombre);
                      setOpen(false);
                    }}
                  >
                    <span className="font-semibold text-foreground">
                      {persona.nombre}
                    </span>
                    {(persona.email || ocupadoEnOtro) && (
                      <span className="text-xs text-muted-foreground">
                        {[persona.email, ocupadoEnOtro ? persona.puesto_nombre : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
      {query.trim().length < 1 && !profileId && (
        <p className="text-xs text-muted-foreground">
          Escribe para buscar entre los usuarios activos.
        </p>
      )}
    </div>
  );
}

function AsignarPersonaBody({
  puestoId,
  puestoNombre,
  onClose,
}: {
  puestoId: string;
  puestoNombre: string;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = usePersonasParaAsignar(puestoId, true);
  const asignar = useAsignarPersonaAPuesto();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    setProfileId(data?.titularActualId ?? null);
  }, [data?.titularActualId, puestoId]);

  const guardando = asignar.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const values = asignarPersonaSchema.safeParse({
      puesto_id: puestoId,
      profile_id: profileId,
    });

    if (!values.success) {
      toast.warn("Seleccione una persona válida.");
      return;
    }

    const res = await asignar.mutateAsync(values.data);
    if (res.success) {
      toast.success(
        values.data.profile_id
          ? "Persona asignada al puesto."
          : "Se quitó la persona del puesto.",
      );
      onClose();
      return;
    }

    toast.error(
      modalActionMessage(res.error ?? undefined, "No se pudo asignar."),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-[22rem] flex-col space-y-4">
      <p className="text-sm text-muted-foreground">
        Puesto:{" "}
        <span className="font-semibold text-foreground">{puestoNombre}</span>
      </p>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-celeste-trifinio" />
          Cargando usuarios...
        </div>
      )}

      {!isLoading && isError && (
        <p className="text-sm font-semibold text-destructive">
          No se pudieron cargar los usuarios.
        </p>
      )}

      {!isLoading && !isError && data && (
        <PersonaSearchField
          personas={data.personas}
          puestoId={puestoId}
          profileId={profileId}
          onSelect={(persona) => setProfileId(persona.id)}
          onClear={() => setProfileId(null)}
        />
      )}

      <FormFooter>
        <FormSubmitButton disabled={guardando || isLoading} label="Guardar" />
      </FormFooter>
    </form>
  );
}

export function AsignarPersonaPuesto({
  open,
  onOpenChange,
  puestoId,
  puestoNombre,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puestoId: string | null;
  puestoNombre: string;
}) {
  const onClose = () => onOpenChange(false);

  return (
    <EstructuraFormShell
      open={open}
      onClose={onClose}
      title="Asignar persona"
      subtitle="Puesto"
    >
      {open && puestoId ? (
        <AsignarPersonaBody
          key={puestoId}
          puestoId={puestoId}
          puestoNombre={puestoNombre}
          onClose={onClose}
        />
      ) : null}
    </EstructuraFormShell>
  );
}
