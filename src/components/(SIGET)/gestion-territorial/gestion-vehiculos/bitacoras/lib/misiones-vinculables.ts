import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MISION_VINCULABLE_SELECT,
  buildMisionesVinculablesList,
  type MisionVinculableBitacora,
} from "./helpers";

const SOLICITUDES_TABLE = "ter_solicitudes";
const BITACORAS_TABLE = "ter_bitacoras";

export async function loadMisionesVinculablesBitacora(
  supabase: SupabaseClient,
  userId: string,
): Promise<MisionVinculableBitacora[]> {
  const { data: enMision, error: enMisionError } = await supabase
    .from(SOLICITUDES_TABLE)
    .select(MISION_VINCULABLE_SELECT)
    .eq("estado", "EN_MISION")
    .eq("solicitante_id", userId);

  if (enMisionError) throw enMisionError;

  const { data: bitacorasVinculadas } = await supabase
    .from(BITACORAS_TABLE)
    .select("solicitud_id")
    .eq("conductor_id", userId)
    .not("solicitud_id", "is", null);

  const solicitudesConBitacora = new Set(
    (bitacorasVinculadas ?? [])
      .map((row) => row.solicitud_id)
      .filter((id): id is string => typeof id === "string"),
  );

  const { data: finalizadas, error: finalizadasError } = await supabase
    .from(SOLICITUDES_TABLE)
    .select(MISION_VINCULABLE_SELECT)
    .eq("estado", "FINALIZADA")
    .eq("solicitante_id", userId)
    .order("fecha_inicio", { ascending: false });

  if (finalizadasError) throw finalizadasError;

  return buildMisionesVinculablesList(
    enMision ?? [],
    finalizadas ?? [],
    solicitudesConBitacora,
  );
}
