import type { SupabaseClient } from "@supabase/supabase-js";

import { estadoVehiculoConReservaFija, estadoVehiculoNormalizado } from "../flota/lib/helpers";
import {
  ESTADOS_FALLA_ACTIVA,
  severidadAveriaInmovilizaFlota,
} from "../mantenimiento/lib/helpers";
import {
  vehiculoReservadoFlotaEnDiaCalendario,
  type SolicitudCalendarioRef,
} from "../solicitudes/lib/calendario-reservas";
import { fechaCalendarioGt } from "@/lib/fechas-gt";

type SupabaseServer = SupabaseClient;

const VEHICULOS_TABLE = "ot_vehiculos";
const FALLAS_TABLE = "ot_fallas_mantenimiento";
const SOLICITUDES_TABLE = "ot_solicitudes";

const SOLICITUDES_RESERVA_FLOTA = ["APROBADA", "EN_MISION"] as const;

export async function sincronizarEstadoFlotaVehiculo(
  supabase: SupabaseServer,
  vehiculoId: string,
): Promise<void> {
  const { data: fallasActivas, error: fallasError } = await supabase
    .from(FALLAS_TABLE)
    .select("severidad")
    .eq("vehiculo_id", vehiculoId)
    .in("estado", [...ESTADOS_FALLA_ACTIVA]);

  if (fallasError) {
    throw new Error("No se pudieron verificar las averías del vehículo.");
  }

  const inmovilizaPorAveriaAlta = (fallasActivas ?? []).some((f) =>
    severidadAveriaInmovilizaFlota(f.severidad),
  );

  if (inmovilizaPorAveriaAlta) {
    const { error } = await supabase
      .from(VEHICULOS_TABLE)
      .update({ estado: "EN_MANTENIMIENTO" })
      .eq("id", vehiculoId);

    if (error) {
      throw new Error("No se pudo actualizar el estado del vehículo en flota.");
    }
    return;
  }

  const { data: solicitudesCalendario, error: reservasError } = await supabase
    .from(SOLICITUDES_TABLE)
    .select("id, vehiculo_id, estado, fecha_inicio, fecha_fin_estimada")
    .eq("vehiculo_id", vehiculoId)
    .in("estado", [...SOLICITUDES_RESERVA_FLOTA]);

  if (reservasError) {
    throw new Error("No se pudieron verificar las misiones del vehículo.");
  }

  const lista = (solicitudesCalendario ?? []) as SolicitudCalendarioRef[];
  const misionEnCurso = lista.some((s) => s.estado === "EN_MISION");
  const hoy = fechaCalendarioGt();
  const reservadoPorCalendarioHoy = vehiculoReservadoFlotaEnDiaCalendario(
    vehiculoId,
    hoy,
    lista,
  );
  const reservadoHoy = misionEnCurso || reservadoPorCalendarioHoy;

  const { data: vehiculo, error: vehiculoError } = await supabase
    .from(VEHICULOS_TABLE)
    .select("placa, estado")
    .eq("id", vehiculoId)
    .maybeSingle();

  if (vehiculoError) {
    throw new Error("No se pudo verificar el vehículo en flota.");
  }

  if (estadoVehiculoNormalizado(vehiculo?.estado) === "RESERVA_INDIVIDUAL") {
    return;
  }

  const estado = estadoVehiculoConReservaFija(
    vehiculo?.placa,
    reservadoHoy ? "RESERVADO" : "LIBRE",
  );
  const { error } = await supabase
    .from(VEHICULOS_TABLE)
    .update({ estado })
    .eq("id", vehiculoId);

  if (error) {
    throw new Error("No se pudo actualizar el estado del vehículo en flota.");
  }
}
