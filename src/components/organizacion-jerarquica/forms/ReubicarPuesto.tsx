"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  useDepartamentos,
  useEstructuraOrganizacional,
  useReubicarPuesto,
} from "../lib/hooks";
import {
  buscarNodoPorId,
  reubicarPuestoSchema,
  rutaDepartamento,
  type DepartamentoRecord,
} from "../lib/zod";
import {
  EstructuraFormShell,
  FormFooter,
  FormInput,
  FormLabel,
  FormSubmitButton,
  modalActionMessage,
} from "./EstructuraFormShell";

function DepartamentoSearchField({
  departamentos,
  departamentoActualId,
  departamentoId,
  onSelect,
  onClear,
}: {
  departamentos: DepartamentoRecord[];
  departamentoActualId: string | null;
  departamentoId: string | null;
  onSelect: (departamento: DepartamentoRecord) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected =
    departamentos.find((d) => d.id === departamentoId) ?? null;

  useEffect(() => {
    if (!departamentoId) return;
    const departamento = departamentos.find((d) => d.id === departamentoId);
    if (departamento) {
      setQuery(rutaDepartamento(departamentos, departamento.id));
    }
  }, [departamentoId, departamentos]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const candidatos = useMemo(
    () =>
      departamentos.filter(
        (d) => d.activo && d.id !== departamentoActualId,
      ),
    [departamentos, departamentoActualId],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 1) return [];
    return candidatos
      .filter((d) => {
        const ruta = rutaDepartamento(departamentos, d.id).toLowerCase();
        return (
          d.nombre.toLowerCase().includes(term) || ruta.includes(term)
        );
      })
      .slice(0, 10);
  }, [candidatos, departamentos, query]);

  const handleChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    if (selected && value !== rutaDepartamento(departamentos, selected.id)) {
      onClear();
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <FormLabel htmlFor="departamento-reubicar">Dependencia destino</FormLabel>
      <FormInput
        id="departamento-reubicar"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.trim().length >= 1 && setOpen(true)}
        autoComplete="off"
      />
      {departamentoId && (
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery("");
            setOpen(false);
          }}
          className="cursor-pointer text-xs font-semibold text-celeste-trifinio hover:underline"
        >
          Quitar selección
        </button>
      )}
      {open && query.trim().length >= 1 && (
        <ul className="absolute top-full z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border-2 border-celeste-trifinio/40 bg-zinc-100 shadow-md dark:bg-zinc-800">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Sin coincidencias
            </li>
          ) : (
            filtered.map((departamento) => (
              <li key={departamento.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-celeste-trifinio/10",
                    departamentoId === departamento.id &&
                      "bg-celeste-trifinio/15",
                  )}
                  onClick={() => {
                    onSelect(departamento);
                    setQuery(rutaDepartamento(departamentos, departamento.id));
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold text-foreground">
                    {departamento.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {rutaDepartamento(departamentos, departamento.id)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {query.trim().length < 1 && !departamentoId && (
        <p className="text-xs text-muted-foreground">
          Escribe para buscar la dependencia a donde mover el puesto.
        </p>
      )}
    </div>
  );
}

function ReubicarPuestoBody({
  puestoId,
  puestoNombre,
  departamentoActualId,
  onClose,
}: {
  puestoId: string;
  puestoNombre: string;
  departamentoActualId: string | null;
  onClose: () => void;
}) {
  const { data: departamentos = [], isLoading: cargandoDeps } =
    useDepartamentos();
  const { data: estructura } = useEstructuraOrganizacional();
  const reubicar = useReubicarPuesto();
  const [departamentoId, setDepartamentoId] = useState<string | null>(null);

  const tieneHijos = useMemo(() => {
    if (!estructura) return false;
    const nodo = buscarNodoPorId(estructura, puestoId);
    return (nodo?.hijos?.length ?? 0) > 0;
  }, [estructura, puestoId]);

  const ubicacionActual = useMemo(() => {
    if (!departamentoActualId) return "Sin dependencia asignada";
    return rutaDepartamento(departamentos, departamentoActualId);
  }, [departamentoActualId, departamentos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tieneHijos) {
      toast.warn(
        modalActionMessage(
          "PUESTO_HAS_CHILDREN",
          "Este puesto tiene puestos bajo su cargo.",
        ),
      );
      return;
    }

    const values = reubicarPuestoSchema.safeParse({
      puesto_id: puestoId,
      departamento_id: departamentoId,
    });

    if (!values.success) {
      toast.warn("Selecciona una dependencia destino.");
      return;
    }

    const res = await reubicar.mutateAsync(values.data);
    if (res.success) {
      toast.success("Puesto reubicado correctamente.");
      onClose();
      return;
    }

    toast.error(
      modalActionMessage(res.error ?? undefined, "No se pudo reubicar."),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Puesto:{" "}
        <span className="font-semibold text-foreground">{puestoNombre}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Ubicación actual:{" "}
        <span className="font-medium text-foreground">{ubicacionActual}</span>
      </p>

      {tieneHijos && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Este puesto tiene puestos bajo su cargo. Reubícalos o elimínalos
          antes de moverlo.
        </p>
      )}

      {cargandoDeps ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-celeste-trifinio" />
          Cargando dependencias...
        </div>
      ) : (
        <DepartamentoSearchField
          departamentos={departamentos}
          departamentoActualId={departamentoActualId}
          departamentoId={departamentoId}
          onSelect={(dep) => setDepartamentoId(dep.id)}
          onClear={() => setDepartamentoId(null)}
        />
      )}

      <FormFooter>
        <FormSubmitButton
          disabled={reubicar.isPending || cargandoDeps || tieneHijos}
          label="Guardar"
        />
      </FormFooter>
    </form>
  );
}

export function ReubicarPuestoModal({
  open,
  onOpenChange,
  puestoId,
  puestoNombre,
  departamentoActualId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puestoId: string | null;
  puestoNombre: string;
  departamentoActualId: string | null;
}) {
  const onClose = () => onOpenChange(false);

  return (
    <EstructuraFormShell
      open={open}
      onClose={onClose}
      title="Reubicar puesto"
      subtitle="Cambiar dependencia"
    >
      {open && puestoId ? (
        <ReubicarPuestoBody
          key={puestoId}
          puestoId={puestoId}
          puestoNombre={puestoNombre}
          departamentoActualId={departamentoActualId}
          onClose={onClose}
        />
      ) : null}
    </EstructuraFormShell>
  );
}
