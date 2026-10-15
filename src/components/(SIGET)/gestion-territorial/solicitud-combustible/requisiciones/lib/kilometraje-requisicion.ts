import type { SupabaseClient } from "@supabase/supabase-js";

import {
  cantidadCuponesRango,
  parseValeCombustibleBitacora,
} from "../../../gestion-vehiculos/bitacoras/lib/combustible-mision";
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
  vale_combustible?: string | null;
};

function valePerteneceASolicitudCombustible(
  vale: string,
  cuponDelSolicitud: number,
  cuponAlSolicitud: number,
): boolean {
  const rango = parseValeCombustibleBitacora(vale);
  if (!rango) return false;
  return (
    rango.cupon_del >= cuponDelSolicitud &&
    rango.cupon_al <= cuponAlSolicitud
  );
}

function cuponesValeEnSolicitud(
  vale: string,
  cuponDelSolicitud: number,
  cuponAlSolicitud: number,
): number {
  if (!valePerteneceASolicitudCombustible(vale, cuponDelSolicitud, cuponAlSolicitud)) {
    return 0;
  }
  const rango = parseValeCombustibleBitacora(vale);
  if (!rango) return 0;
  return cantidadCuponesRango(rango.cupon_del, rango.cupon_al);
}

export function kilometrajeDesdeBitacorasSolicitudCombustible(
  rows: BitacoraKmRow[],
  cuponDelSolicitud: number | null,
  cuponAlSolicitud: number | null,
): KilometrajeRequisicionCombustible {
  if (!rows.length) {
    return { kmAnterior: null, kmActual: null };
  }

  const ordenadas = [...rows].sort((a, b) => {
    const ta = a.created_at ?? "";
    const tb = b.created_at ?? "";
    return ta.localeCompare(tb);
  });

  let filtradas = ordenadas;
  if (
    cuponDelSolicitud != null &&
    cuponAlSolicitud != null &&
    cuponAlSolicitud >= cuponDelSolicitud
  ) {
    const conVale = ordenadas.filter((row) =>
      valePerteneceASolicitudCombustible(
        typeof row.vale_combustible === "string" ? row.vale_combustible : "",
        cuponDelSolicitud,
        cuponAlSolicitud,
      ),
    );
    if (conVale.length > 0) filtradas = conVale;
  }

  const kmAnterior = filtradas[0].km_inicial;

  if (
    cuponDelSolicitud == null ||
    cuponAlSolicitud == null ||
    cuponAlSolicitud < cuponDelSolicitud
  ) {
    const ultima = filtradas[filtradas.length - 1];
    return { kmAnterior, kmActual: ultima.km_final };
  }

  const cuponesTotal = cantidadCuponesRango(cuponDelSolicitud, cuponAlSolicitud);
  let acumulado = 0;
  let kmActual: number | null = null;

  for (const row of filtradas) {
    const vale = typeof row.vale_combustible === "string" ? row.vale_combustible : "";
    acumulado += cuponesValeEnSolicitud(vale, cuponDelSolicitud, cuponAlSolicitud);
    if (acumulado >= cuponesTotal) {
      kmActual = row.km_final;
      break;
    }
  }

  return { kmAnterior, kmActual };
}

function mapBitacoraKmRow(row: Record<string, unknown>): BitacoraKmRow | null {
  if (typeof row.km_inicial !== "number" || typeof row.km_final !== "number") {
    return null;
  }
  return {
    km_inicial: row.km_inicial,
    km_final: row.km_final,
    estado: typeof row.estado === "string" ? row.estado : null,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
    vale_combustible:
      typeof row.vale_combustible === "string" ? row.vale_combustible : null,
  };
}

async function bitacorasConfirmadasPorMision(
  supabase: SupabaseClient,
  solicitudVehiculoId: string,
): Promise<BitacoraKmRow[]> {
  const { data } = await supabase
    .from("ot_bitacoras")
    .select("km_inicial, km_final, estado, created_at, vale_combustible")
    .eq("solicitud_id", solicitudVehiculoId)
    .eq("estado", "CONFIRMADA")
    .order("created_at", { ascending: true });

  const rows: BitacoraKmRow[] = [];
  for (const row of data ?? []) {
    const mapped = mapBitacoraKmRow(row as Record<string, unknown>);
    if (mapped) rows.push(mapped);
  }
  return rows;
}

async function bitacorasConfirmadasPorValesSolicitud(
  supabase: SupabaseClient,
  vehiculoId: string,
  cuponDel: number | null,
  cuponAl: number | null,
): Promise<BitacoraKmRow[]> {
  if (cuponDel == null || cuponAl == null || cuponDel < 1 || cuponAl < cuponDel) {
    return [];
  }

  const { data } = await supabase
    .from("ot_bitacoras")
    .select("km_inicial, km_final, estado, created_at, vale_combustible")
    .eq("vehiculo_id", vehiculoId)
    .eq("estado", "CONFIRMADA")
    .not("vale_combustible", "is", null)
    .order("created_at", { ascending: true });

  const rows: BitacoraKmRow[] = [];
  for (const row of data ?? []) {
    const mapped = mapBitacoraKmRow(row as Record<string, unknown>);
    if (!mapped) continue;
    const vale = mapped.vale_combustible ?? "";
    if (!valePerteneceASolicitudCombustible(vale, cuponDel, cuponAl)) continue;
    rows.push(mapped);
  }
  return rows;
}

async function bitacoraRespaldoPorVehiculo(
  supabase: SupabaseClient,
  vehiculoId: string,
): Promise<BitacoraKmRow | null> {
  const { data } = await supabase
    .from("ot_bitacoras")
    .select("km_inicial, km_final, estado, created_at, vale_combustible")
    .eq("vehiculo_id", vehiculoId)
    .eq("estado", "CONFIRMADA")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return mapBitacoraKmRow(data as Record<string, unknown>);
}

export async function fetchKilometrajeRequisicionCombustible(
  supabase: SupabaseClient,
  row: SolicitudCombustibleRow,
): Promise<KilometrajeRequisicionCombustible> {
  const vehiculoId = row.vehiculo_id;
  const misionId = row.solicitud_vehiculo_id?.trim();
  const cuponDel = row.cupon_del != null ? Number(row.cupon_del) : null;
  const cuponAl = row.cupon_al != null ? Number(row.cupon_al) : null;

  if (misionId) {
    const porMision = await bitacorasConfirmadasPorMision(supabase, misionId);
    if (porMision.length > 0) {
      return kilometrajeDesdeBitacorasSolicitudCombustible(porMision, cuponDel, cuponAl);
    }
  }

  const porVales = await bitacorasConfirmadasPorValesSolicitud(
    supabase,
    vehiculoId,
    cuponDel,
    cuponAl,
  );
  if (porVales.length > 0) {
    return kilometrajeDesdeBitacorasSolicitudCombustible(porVales, cuponDel, cuponAl);
  }

  const respaldo = await bitacoraRespaldoPorVehiculo(supabase, vehiculoId);
  if (respaldo) {
    return {
      kmAnterior: respaldo.km_inicial,
      kmActual: respaldo.km_final,
    };
  }

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
