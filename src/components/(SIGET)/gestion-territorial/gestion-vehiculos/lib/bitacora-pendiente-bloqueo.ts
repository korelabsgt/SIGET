import type { SupabaseClient } from "@supabase/supabase-js";

export type BitacoraPendienteMision = {
  solicitudId: string;
  destino: string;
  estado: string;
};

export type BitacoraPendienteBloqueos = {
  vehiculo: BitacoraPendienteMision | null;
  combustible: BitacoraPendienteMision | null;
};

const SOLICITUDES_TABLE = "ot_solicitudes";
const BITACORAS_TABLE = "ot_bitacoras";
const COMBUSTIBLE_TABLE = "ot_solicitud_combustible";

const ESTADOS_MISION_PENDIENTE_BITACORA = ["EN_MISION", "FINALIZADA"] as const;

async function idsMisionesConBitacora(
  supabase: SupabaseClient,
  solicitudIds: string[],
): Promise<Set<string>> {
  if (solicitudIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from(BITACORAS_TABLE)
    .select("solicitud_id")
    .in("solicitud_id", solicitudIds);

  if (error) throw error;

  return new Set(
    (data ?? [])
      .map((row) => row.solicitud_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
}

export async function fetchBitacoraPendienteBloqueos(
  supabase: SupabaseClient,
  userId: string,
): Promise<BitacoraPendienteBloqueos> {
  const { data: misiones, error: misionesError } = await supabase
    .from(SOLICITUDES_TABLE)
    .select("id, destino, estado")
    .eq("solicitante_id", userId)
    .in("estado", [...ESTADOS_MISION_PENDIENTE_BITACORA]);

  if (misionesError) throw misionesError;

  const candidatas = (misiones ?? []).filter(
    (row): row is { id: string; destino: string; estado: string } =>
      typeof row.id === "string" &&
      typeof row.destino === "string" &&
      typeof row.estado === "string",
  );

  const conBitacora = await idsMisionesConBitacora(
    supabase,
    candidatas.map((m) => m.id),
  );

  const misionSinBitacora =
    candidatas.find((m) => !conBitacora.has(m.id)) ?? null;

  const { data: combustiblesAprobados, error: combustibleError } = await supabase
    .from(COMBUSTIBLE_TABLE)
    .select("id, solicitud_vehiculo_id")
    .eq("solicitante_id", userId)
    .eq("estado", "APROBADO")
    .not("solicitud_vehiculo_id", "is", null);

  if (combustibleError) throw combustibleError;

  const misionIdsCombustible = [
    ...new Set(
      (combustiblesAprobados ?? [])
        .map((row) => row.solicitud_vehiculo_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  let combustiblePendiente: BitacoraPendienteMision | null = null;

  if (misionIdsCombustible.length > 0) {
    const conBitacoraCombustible = await idsMisionesConBitacora(
      supabase,
      misionIdsCombustible,
    );

    const misionIdPendiente = misionIdsCombustible.find(
      (id) => !conBitacoraCombustible.has(id),
    );

    if (misionIdPendiente) {
      const { data: misionRow, error: misionRowError } = await supabase
        .from(SOLICITUDES_TABLE)
        .select("id, destino, estado")
        .eq("id", misionIdPendiente)
        .maybeSingle();

      if (misionRowError) throw misionRowError;

      if (
        misionRow?.id &&
        typeof misionRow.destino === "string" &&
        typeof misionRow.estado === "string"
      ) {
        combustiblePendiente = {
          solicitudId: misionRow.id,
          destino: misionRow.destino,
          estado: misionRow.estado,
        };
      }
    }
  }

  return {
    vehiculo: misionSinBitacora
      ? {
          solicitudId: misionSinBitacora.id,
          destino: misionSinBitacora.destino,
          estado: misionSinBitacora.estado,
        }
      : null,
    combustible: combustiblePendiente,
  };
}

export function mensajeBloqueoNuevaSolicitudVehiculo(mision: BitacoraPendienteMision): string {
  return `Debe registrar la bitácora de la misión a ${mision.destino} antes de solicitar otro vehículo.`;
}

export function mensajeBloqueoNuevaSolicitudCombustible(
  mision: BitacoraPendienteMision,
): string {
  return `Tiene combustible aprobado para la misión a ${mision.destino}. Registre la bitácora vinculada a esa misión antes de crear otra solicitud de combustible.`;
}
