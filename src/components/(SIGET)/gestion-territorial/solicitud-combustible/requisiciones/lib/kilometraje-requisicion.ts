import type { SupabaseClient } from "@supabase/supabase-js";

import { formatValeCombustibleBitacora } from "../../../gestion-vehiculos/bitacoras/lib/combustible-mision";
import type { SolicitudCombustibleRow } from "../../solicitudes/lib/zod";

export type KilometrajeRequisicionCombustible = {
  kmAnterior: number | null;
  kmActual: number | null;
};

type BitacoraKmRow = {
  km_inicial: number;
  km_final: number;
  estado?: string | null;
  created_at?: string;
};

function normalizarValeCombustible(value: string): string {
  return value
    .trim()
    .replace(/\s*[–—-]\s*/g, " – ")
    .replace(/\s+/g, " ");
}

function kilometrajeDesdeBitacora(row: BitacoraKmRow): KilometrajeRequisicionCombustible {
  return {
    kmAnterior: row.km_inicial,
    kmActual: row.km_final,
  };
}

function elegirBitacoraVinculada(rows: BitacoraKmRow[]): BitacoraKmRow | null {
  if (!rows.length) return null;
  const confirmada = rows.find((row) => row.estado === "CONFIRMADA");
  return confirmada ?? rows[0];
}

async function bitacoraPorMision(
  supabase: SupabaseClient,
  solicitudVehiculoId: string,
): Promise<BitacoraKmRow | null> {
  const { data } = await supabase
    .from("ot_bitacoras")
    .select("km_inicial, km_final, estado, created_at")
    .eq("solicitud_id", solicitudVehiculoId)
    .order("created_at", { ascending: false });

  const rows: BitacoraKmRow[] = [];
  for (const row of data ?? []) {
    if (typeof row.km_inicial !== "number" || typeof row.km_final !== "number") continue;
    rows.push({
      km_inicial: row.km_inicial,
      km_final: row.km_final,
      estado: row.estado,
      created_at: row.created_at,
    });
  }

  return elegirBitacoraVinculada(rows);
}

async function bitacoraPorValeCombustible(
  supabase: SupabaseClient,
  vehiculoId: string,
  cuponDel: number | null,
  cuponAl: number | null,
): Promise<BitacoraKmRow | null> {
  if (cuponDel == null || cuponAl == null || cuponDel < 1 || cuponAl < cuponDel) {
    return null;
  }

  const valeEsperado = normalizarValeCombustible(
    formatValeCombustibleBitacora(cuponDel, cuponAl),
  );

  const { data } = await supabase
    .from("ot_bitacoras")
    .select("km_inicial, km_final, estado, created_at, vale_combustible")
    .eq("vehiculo_id", vehiculoId)
    .not("vale_combustible", "is", null)
    .order("created_at", { ascending: false });

  const rows: BitacoraKmRow[] = [];
  for (const row of data ?? []) {
    const vale = typeof row.vale_combustible === "string" ? row.vale_combustible : "";
    if (!vale.trim()) continue;
    if (normalizarValeCombustible(vale) !== valeEsperado) continue;
    if (typeof row.km_inicial !== "number" || typeof row.km_final !== "number") continue;
    rows.push({
      km_inicial: row.km_inicial,
      km_final: row.km_final,
      estado: row.estado,
      created_at: row.created_at,
    });
  }

  return elegirBitacoraVinculada(rows);
}

async function bitacoraRespaldoPorVehiculo(
  supabase: SupabaseClient,
  vehiculoId: string,
): Promise<BitacoraKmRow | null> {
  const { data } = await supabase
    .from("ot_bitacoras")
    .select("km_inicial, km_final, estado, created_at")
    .eq("vehiculo_id", vehiculoId)
    .eq("estado", "CONFIRMADA")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    !data ||
    typeof data.km_inicial !== "number" ||
    typeof data.km_final !== "number"
  ) {
    return null;
  }

  return data as BitacoraKmRow;
}

export async function fetchKilometrajeRequisicionCombustible(
  supabase: SupabaseClient,
  row: SolicitudCombustibleRow,
): Promise<KilometrajeRequisicionCombustible> {
  const vehiculoId = row.vehiculo_id;
  const misionId = row.solicitud_vehiculo_id?.trim();

  if (misionId) {
    const porMision = await bitacoraPorMision(supabase, misionId);
    if (porMision) return kilometrajeDesdeBitacora(porMision);
  }

  const porVale = await bitacoraPorValeCombustible(
    supabase,
    vehiculoId,
    row.cupon_del,
    row.cupon_al,
  );
  if (porVale) return kilometrajeDesdeBitacora(porVale);

  const respaldo = await bitacoraRespaldoPorVehiculo(supabase, vehiculoId);
  if (respaldo) return kilometrajeDesdeBitacora(respaldo);

  const kmFlota = row.vehiculo?.kilometraje_actual;
  if (typeof kmFlota === "number") {
    return { kmAnterior: kmFlota, kmActual: kmFlota };
  }

  const { data: vehiculo } = await supabase
    .from("ot_vehiculos")
    .select("kilometraje_actual")
    .eq("id", vehiculoId)
    .maybeSingle();

  const kmActual =
    typeof vehiculo?.kilometraje_actual === "number" ? vehiculo.kilometraje_actual : null;

  return { kmAnterior: kmActual, kmActual };
}
