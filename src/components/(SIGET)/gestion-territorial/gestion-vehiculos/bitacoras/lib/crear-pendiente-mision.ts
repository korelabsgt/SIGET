import type { SupabaseClient } from "@supabase/supabase-js";

const BITACORAS_TABLE = "ot_bitacoras";

type MisionBitacoraPendienteRef = {
  id: string;
  destino: string;
  vehiculo_id: string | null;
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

  const conductorId = mision.solicitante_id;

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
    .select("id, destino, vehiculo_id, solicitante_id")
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
      solicitante_id: mision.solicitante_id,
    });
    creadas += 1;
  }

  await alinearConductorBitacorasMisionPendientes(supabase);

  return creadas;
}

async function alinearConductorBitacorasMisionPendientes(
  supabase: SupabaseClient,
): Promise<void> {
  const { data: vinculadas, error } = await supabase
    .from(BITACORAS_TABLE)
    .select("id, conductor_id, solicitud_id, ot_solicitudes!inner(solicitante_id)")
    .not("solicitud_id", "is", null);

  if (error) {
    throw new Error("No se pudieron alinear las bitácoras de misión.");
  }

  for (const row of vinculadas ?? []) {
    const solicitudJoin = row.ot_solicitudes as
      | { solicitante_id: string }
      | { solicitante_id: string }[]
      | null;
    const solicitanteId = Array.isArray(solicitudJoin)
      ? solicitudJoin[0]?.solicitante_id
      : solicitudJoin?.solicitante_id;
    if (
      typeof row.id !== "string" ||
      typeof solicitanteId !== "string" ||
      row.conductor_id === solicitanteId
    ) {
      continue;
    }
    const { error: updateError } = await supabase
      .from(BITACORAS_TABLE)
      .update({ conductor_id: solicitanteId })
      .eq("id", row.id);
    if (updateError) {
      throw new Error("No se pudo actualizar el responsable de una bitácora de misión.");
    }
  }
}
