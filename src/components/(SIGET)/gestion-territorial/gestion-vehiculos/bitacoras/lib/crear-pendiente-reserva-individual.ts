import type { SupabaseClient } from "@supabase/supabase-js";

const BITACORAS_TABLE = "ot_bitacoras";
const VEHICULOS_TABLE = "ot_vehiculos";

export const DESTINO_BITACORA_RESERVA_INDIVIDUAL_PENDIENTE = "Por confirmar";

type VehiculoReservaIndividualRef = {
  id: string;
  reserva_usuario_id: string | null;
  kilometraje_actual: number | null;
};

export async function crearBitacoraPendienteReservaIndividual(
  supabase: SupabaseClient,
  vehiculo: VehiculoReservaIndividualRef,
): Promise<void> {
  const vehiculoId = vehiculo.id?.trim();
  const conductorId = vehiculo.reserva_usuario_id?.trim();
  if (!vehiculoId || !conductorId) return;

  const { data: existente, error: existenteError } = await supabase
    .from(BITACORAS_TABLE)
    .select("id")
    .eq("vehiculo_id", vehiculoId)
    .eq("estado", "PENDIENTE")
    .is("solicitud_id", null)
    .maybeSingle();

  if (existenteError) {
    throw new Error("No se pudo verificar la bitácora de reserva individual.");
  }
  if (existente?.id) return;

  const km = vehiculo.kilometraje_actual ?? 0;
  const ahora = new Date().toISOString();

  const { error: insertError } = await supabase.from(BITACORAS_TABLE).insert({
    solicitud_id: null,
    vehiculo_id: vehiculoId,
    conductor_id: conductorId,
    destino: DESTINO_BITACORA_RESERVA_INDIVIDUAL_PENDIENTE,
    km_inicial: km,
    km_final: km,
    vale_combustible: null,
    monto_combustible: 0,
    comentarios: [],
    evidencia_url: [],
    fecha: ahora,
    estado: "PENDIENTE",
  });

  if (insertError) {
    throw new Error("No se pudo abrir la bitácora de reserva individual.");
  }
}

export async function asegurarBitacorasPendientesReservaIndividual(
  supabase: SupabaseClient,
): Promise<number> {
  const { data: vehiculos, error: vehiculosError } = await supabase
    .from(VEHICULOS_TABLE)
    .select("id, reserva_usuario_id, kilometraje_actual")
    .eq("estado", "RESERVA_INDIVIDUAL");

  if (vehiculosError) {
    throw new Error("No se pudieron listar vehículos en reserva individual.");
  }

  let creadas = 0;

  for (const vehiculo of vehiculos ?? []) {
    if (typeof vehiculo.id !== "string") continue;

    const { data: existente, error: existenteError } = await supabase
      .from(BITACORAS_TABLE)
      .select("id")
      .eq("vehiculo_id", vehiculo.id)
      .eq("estado", "PENDIENTE")
      .is("solicitud_id", null)
      .maybeSingle();

    if (existenteError) {
      throw new Error("No se pudo verificar bitácoras de reserva individual.");
    }
    if (existente?.id) continue;

    const reservaUsuarioId =
      typeof vehiculo.reserva_usuario_id === "string" ? vehiculo.reserva_usuario_id : null;

    await crearBitacoraPendienteReservaIndividual(supabase, {
      id: vehiculo.id,
      reserva_usuario_id: reservaUsuarioId,
      kilometraje_actual:
        typeof vehiculo.kilometraje_actual === "number" ? vehiculo.kilometraje_actual : 0,
    });
    creadas += 1;
  }

  return creadas;
}
