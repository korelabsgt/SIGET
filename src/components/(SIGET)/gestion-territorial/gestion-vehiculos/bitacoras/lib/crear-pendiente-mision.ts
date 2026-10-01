import type { SupabaseClient } from "@supabase/supabase-js";

const BITACORAS_TABLE = "ot_bitacoras";

type MisionBitacoraPendienteRef = {
  id: string;
  destino: string;
  vehiculo_id: string | null;
  piloto: string | null;
  solicitante_id: string;
};

export async function crearBitacoraPendienteAlIniciarMision(
  supabase: SupabaseClient,
  mision: MisionBitacoraPendienteRef,
): Promise<void> {
  const vehiculoId = mision.vehiculo_id?.trim();
  if (!vehiculoId) return;

  const { data: existente, error: existenteError } = await supabase
    .from(BITACORAS_TABLE)
    .select("id")
    .eq("solicitud_id", mision.id)
    .maybeSingle();

  if (existenteError) {
    throw new Error("No se pudo verificar la bitácora de la misión.");
  }
  if (existente?.id) return;

  const conductorId = mision.piloto?.trim() || mision.solicitante_id;

  const { data: vehiculo, error: vehiculoError } = await supabase
    .from("ot_vehiculos")
    .select("kilometraje_actual")
    .eq("id", vehiculoId)
    .maybeSingle();

  if (vehiculoError || !vehiculo) {
    throw new Error("No se pudo preparar la bitácora del vehículo.");
  }

  const km = vehiculo.kilometraje_actual ?? 0;
  const ahora = new Date().toISOString();

  const { error: insertError } = await supabase.from(BITACORAS_TABLE).insert({
    solicitud_id: mision.id,
    vehiculo_id: vehiculoId,
    conductor_id: conductorId,
    destino: mision.destino,
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
    throw new Error("No se pudo abrir la bitácora de la misión.");
  }
}

export async function asegurarBitacorasPendientesMisionesEnCurso(
  supabase: SupabaseClient,
): Promise<number> {
  const { data: misiones, error: misionesError } = await supabase
    .from("ot_solicitudes")
    .select("id, destino, vehiculo_id, piloto, solicitante_id")
    .eq("estado", "EN_MISION")
    .not("vehiculo_id", "is", null);

  if (misionesError) {
    throw new Error("No se pudieron listar las misiones en curso.");
  }

  let creadas = 0;

  for (const mision of misiones ?? []) {
    if (
      typeof mision.id !== "string" ||
      typeof mision.destino !== "string" ||
      typeof mision.solicitante_id !== "string"
    ) {
      continue;
    }

    const { data: existente, error: existenteError } = await supabase
      .from(BITACORAS_TABLE)
      .select("id")
      .eq("solicitud_id", mision.id)
      .maybeSingle();

    if (existenteError) {
      throw new Error("No se pudo verificar bitácoras de misiones activas.");
    }
    if (existente?.id) continue;

    await crearBitacoraPendienteAlIniciarMision(supabase, {
      id: mision.id,
      destino: mision.destino,
      vehiculo_id: mision.vehiculo_id,
      piloto: mision.piloto,
      solicitante_id: mision.solicitante_id,
    });
    creadas += 1;
  }

  return creadas;
}
