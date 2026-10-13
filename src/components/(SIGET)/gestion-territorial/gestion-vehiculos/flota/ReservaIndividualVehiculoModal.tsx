"use client";

import { Loader2 } from "lucide";
import { User } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { GvModalInset, GvModalShell } from "../lib/gv-modal-shell";
import { GvMorphIcon } from "../lib/morph-icon";
import { GV_QUERY_OPTIONS, shareInflight } from "../lib/query";
import { fetchProfileBasico } from "../solicitudes/lib/actions";
import { reservaUsuarioIdsDeVehiculo } from "./lib/helpers";
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
  const usuarioIds = vehiculo ? reservaUsuarioIdsDeVehiculo(vehiculo) : [];

  const profileQueries = useQueries({
    queries: usuarioIds.map((id) => ({
      queryKey: ["gv-reserva-individual-usuario", id],
      queryFn: () =>
        shareInflight(`gv-reserva-individual-usuario:${id}`, () => fetchProfileBasico(id)),
      enabled: open && id.length > 0,
      ...GV_QUERY_OPTIONS,
    })),
  });

  const isLoading = profileQueries.some((q) => q.isFetching);
  const isError = profileQueries.some((q) => q.isError);
  const profiles = profileQueries
    .map((q) => q.data)
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile?.id));

  if (!vehiculo) return null;

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
          Este vehículo está asignado de forma fija a los usuarios indicados mientras conserve el
          estado reserva individual.
        </p>

        {usuarioIds.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No hay usuarios asignados en el registro. Edita el vehículo para vincular al menos uno.
          </p>
        ) : isLoading ? (
          <div className="flex min-h-[6rem] items-center justify-center text-celeste-trifinio">
            <span className="inline-flex animate-spin">
              <GvMorphIcon icon={Loader2} size={28} morphOnHover={false} />
            </span>
          </div>
        ) : isError || profiles.length === 0 ? (
          <p className="text-sm text-red-500">No se pudieron cargar los usuarios asignados.</p>
        ) : (
          <ul className="space-y-3">
            {profiles.map((profile) => {
              const nombre = etiquetaUsuario(profile.nombre, profile.email);
              return (
                <li
                  key={profile.id}
                  className="rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/80"
                >
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
                </li>
              );
            })}
          </ul>
        )}
      </GvModalInset>
    </GvModalShell>
  );
}
