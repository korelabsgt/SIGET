"use client";

import { Loader2 } from "lucide";
import { User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GvModalInset, GvModalShell } from "../lib/gv-modal-shell";
import { GvMorphIcon } from "../lib/morph-icon";
import { GV_QUERY_OPTIONS } from "../lib/query";
import { fetchProfileBasico } from "../solicitudes/lib/actions";
import { type VehiculoRow } from "./lib/zod";

function etiquetaUsuario(nombre: string, email: string): string {
  const n = nombre.trim();
  if (n) return n;
  return email.trim() || "Usuario";
}

export function ReservaIndividualVehiculoModal({
  open,
  onClose,
  vehiculo,
}: {
  open: boolean;
  onClose: () => void;
  vehiculo: VehiculoRow | null;
}) {
  const usuarioId = vehiculo?.reserva_usuario_id?.trim() ?? "";
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["gv-reserva-individual-usuario", usuarioId],
    queryFn: async () => {
      if (!usuarioId) return null;
      return fetchProfileBasico(usuarioId);
    },
    enabled: open && Boolean(usuarioId),
    ...GV_QUERY_OPTIONS,
  });

  if (!vehiculo) return null;

  const nombre = profile ? etiquetaUsuario(profile.nombre, profile.email) : "";

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Reserva individual"
      subtitle={`${vehiculo.placa} · ${vehiculo.marca} ${vehiculo.modelo}`}
      maxWidth="max-w-md"
      fullHeight={false}
    >
      <GvModalInset className="pb-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Este vehículo está asignado de forma fija a un usuario mientras conserve el estado
          reserva individual.
        </p>

        {!usuarioId ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No hay un usuario asignado en el registro. Edita el vehículo para vincularlo.
          </p>
        ) : isLoading ? (
          <div className="flex min-h-[6rem] items-center justify-center text-celeste-trifinio">
            <span className="inline-flex animate-spin">
              <GvMorphIcon icon={Loader2} size={28} morphOnHover={false} />
            </span>
          </div>
        ) : isError || !profile ? (
          <p className="text-sm text-red-500">No se pudo cargar el usuario asignado.</p>
        ) : (
          <div className="rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-celeste-trifinio">
              Usuario asignado
            </p>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400">
                <User className="size-5" aria-hidden />
              </span>
              <dl className="min-w-0 space-y-1 text-sm">
                <div>
                  <dt className="sr-only">Nombre</dt>
                  <dd className="font-semibold text-foreground">{nombre}</dd>
                </div>
                {profile.email.trim() ? (
                  <div>
                    <dt className="sr-only">Correo</dt>
                    <dd className="truncate text-muted-foreground">{profile.email}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        )}
      </GvModalInset>
    </GvModalShell>
  );
}
