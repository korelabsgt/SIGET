"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { asegurarBitacorasPendientesMisionesEnCurso } from "./crear-pendiente-mision";
import {
  asegurarBitacorasPendientesReservaIndividual,
  crearBitacoraPendienteReservaIndividual,
} from "./crear-pendiente-reserva-individual";
import { estadoVehiculoNormalizado } from "../../flota/lib/helpers";
import { revalidatePath } from "next/cache";
import { type BitacoraInput, bitacoraInputSchema, type BitacoraRow, toComentariosJsonbPayload } from "./zod";
import { BITACORA_LIST_SELECT, evidenciasBitacora, normalizeBitacoraRow } from "./helpers";
import { loadMisionesVinculablesBitacora } from "./misiones-vinculables";
import { aplicarMantenimientoForzadoPorKm } from "../../lib/mantenimiento-km-forzado";
import { sincronizarEstadoFlotaVehiculo } from "../../lib/sincronizar-estado-vehiculo";
import {
  canConfirmarBitacoraDeOtros,
  canExportBitacoraReporte,
  canViewAllBitacoras,
} from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";
import {
  combustibleAprobadoParaBitacora,
  misionRequiereReciboCombustible,
  type CombustibleAprobadoMision,
} from "./combustible-mision";

const TABLE = "ot_bitacoras";
const SOLICITUD_COMBUSTIBLE_TABLE = "ot_solicitud_combustible";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  return { supabase, user, role };
}

export async function sincronizarBitacorasPendientesMisionesActivas(): Promise<{
  creadas: number;
}> {
  await requireAuth();
  const admin = createAdminClient();
  const creadasMision = await asegurarBitacorasPendientesMisionesEnCurso(admin);
  const creadasReserva = await asegurarBitacorasPendientesReservaIndividual(admin);
  const creadas = creadasMision + creadasReserva;
  if (creadas > 0) {
    revalidatePath(REVALIDATE_ROUTE);
  }
  return { creadas };
}

export async function getBitacoras(): Promise<BitacoraRow[]> {
  try {
    const { supabase, user, role } = await requireAuth();
    const admin = createAdminClient();
    await asegurarBitacorasPendientesMisionesEnCurso(admin);
    await asegurarBitacorasPendientesReservaIndividual(admin);

    let query = supabase
      .from(TABLE)
      .select(BITACORA_LIST_SELECT)
      .order("fecha", { ascending: false });

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []).map((row) => normalizeBitacoraRow(row as BitacoraRow));
  } catch (error) {
    console.error("Error fetching bitacoras:", error);
    return [];
  }
}

export async function confirmarBitacora(bitacoraId: string, input: BitacoraInput) {
  try {
    const { supabase, user, role } = await requireAuth();
    const parsed = bitacoraInputSchema.parse(input);
    const comentarios = toComentariosJsonbPayload(parsed.comentarios);
    const solicitudId = parsed.solicitud_id?.trim() || null;
    let evidenciaPaths = evidenciasBitacora(parsed);

    const { data: bitacoraActual, error: bitacoraActualError } = await supabase
      .from(TABLE)
      .select("id, solicitud_id, conductor_id, estado")
      .eq("id", bitacoraId)
      .maybeSingle();

    if (bitacoraActualError || !bitacoraActual) {
      return { success: false, error: "No se encontró la bitácora a confirmar." };
    }

    if (bitacoraActual.estado !== "PENDIENTE") {
      return { success: false, error: "Esta bitácora ya fue confirmada." };
    }

    if (bitacoraActual.conductor_id !== user.id && !canViewAllBitacoras(role)) {
      return { success: false, error: "No tienes permiso para confirmar esta bitácora." };
    }

    const solicitudVinculada = bitacoraActual.solicitud_id ?? solicitudId;
    const solicitudCombustibleId = parsed.solicitud_combustible_id?.trim() || null;

    if (solicitudVinculada) {
      const combustibleMision = await fetchCombustibleAprobadoPorMision(
        supabase,
        solicitudVinculada,
      );
      if (misionRequiereReciboCombustible(combustibleMision) && evidenciaPaths.length === 0) {
        return {
          success: false,
          error:
            "Esta misión tiene combustible aprobado con vales entregados. Debe adjuntar el recibo.",
        };
      }
    } else if (solicitudCombustibleId) {
      const combustibleReserva = await fetchCombustibleAprobadoPorId(
        supabase,
        solicitudCombustibleId,
        parsed.vehiculo_id,
      );
      if (misionRequiereReciboCombustible(combustibleReserva) && evidenciaPaths.length === 0) {
        return {
          success: false,
          error: "Debe adjuntar el recibo del vale de combustible seleccionado.",
        };
      }
    }

    if (!solicitudVinculada) {
      const { data: vehiculoReserva, error: vehiculoReservaError } = await supabase
        .from("ot_vehiculos")
        .select("estado, reserva_usuario_id")
        .eq("id", parsed.vehiculo_id)
        .maybeSingle();

      if (vehiculoReservaError || !vehiculoReserva) {
        return { success: false, error: "No se encontró el vehículo de la bitácora." };
      }

      if (estadoVehiculoNormalizado(vehiculoReserva.estado) !== "RESERVA_INDIVIDUAL") {
        return {
          success: false,
          error: "Esta bitácora sin misión solo aplica a vehículos en reserva individual.",
        };
      }

      const reservaUsuarioId = vehiculoReserva.reserva_usuario_id?.trim() ?? "";
      const puedeConfirmar =
        canViewAllBitacoras(role) ||
        user.id === bitacoraActual.conductor_id ||
        (reservaUsuarioId && user.id === reservaUsuarioId);

      if (!puedeConfirmar) {
        return { success: false, error: "No tienes permiso para confirmar esta bitácora." };
      }
    }

    if (solicitudVinculada) {
      const { data: solicitud, error: solicitudError } = await supabase
        .from("ot_solicitudes")
        .select("id, solicitante_id, estado")
        .eq("id", solicitudVinculada)
        .maybeSingle();

      if (solicitudError || !solicitud) {
        return { success: false, error: "La misión vinculada no existe." };
      }
      if (
        solicitud.solicitante_id !== user.id &&
        bitacoraActual.conductor_id !== user.id &&
        !canConfirmarBitacoraDeOtros(role)
      ) {
        return { success: false, error: "Solo puedes confirmar bitácoras de tus misiones." };
      }
      if (solicitud.estado !== "EN_MISION") {
        return {
          success: false,
          error: "La misión ya no está en curso. Actualice la lista de bitácoras.",
        };
      }
    }

    const fechaBitacoraIso = new Date().toISOString();

    const { error } = await supabase
      .from(TABLE)
      .update({
        solicitud_id: solicitudVinculada,
        vehiculo_id: parsed.vehiculo_id,
        destino: parsed.destino,
        km_inicial: parsed.km_inicial,
        km_final: parsed.km_final,
        vale_combustible: parsed.vale_combustible || null,
        monto_combustible: parsed.monto_combustible,
        comentarios,
        evidencia_url: evidenciaPaths,
        fecha: fechaBitacoraIso,
        estado: "CONFIRMADA",
      })
      .eq("id", bitacoraId)
      .eq("estado", "PENDIENTE");

    if (error) throw error;

    const { error: kmError } = await supabase
      .from("ot_vehiculos")
      .update({ kilometraje_actual: parsed.km_final })
      .eq("id", parsed.vehiculo_id);

    if (kmError) {
      console.error("Error updating vehiculo kilometraje:", kmError);
    } else {
      await aplicarMantenimientoForzadoPorKm(supabase, {
        vehiculoId: parsed.vehiculo_id,
        kmActual: parsed.km_final,
        reportadoPor: user.id,
      });
    }

    if (solicitudVinculada) {
      const { data: solicitudActual, error: solicitudActualError } = await supabase
        .from("ot_solicitudes")
        .select("estado")
        .eq("id", solicitudVinculada)
        .maybeSingle();

      if (solicitudActualError || !solicitudActual) {
        console.error("Error reading solicitud estado:", solicitudActualError);
      } else if (solicitudActual.estado === "EN_MISION") {
        const { error: updateError } = await supabase
          .from("ot_solicitudes")
          .update({ estado: "FINALIZADA", fecha_fin_estimada: fechaBitacoraIso })
          .eq("id", solicitudVinculada)
          .eq("estado", "EN_MISION");

        if (updateError) {
          console.error("Error finalizing solicitud:", updateError);
          return {
            success: false,
            error:
              "La bitácora se guardó, pero no se pudo finalizar la misión vinculada. Contacte al administrador.",
          };
        }
        revalidatePath(GV_BASE_ROUTE);
      }
    }

    await sincronizarEstadoFlotaVehiculo(supabase, parsed.vehiculo_id);

    if (!solicitudVinculada) {
      const { data: vehiculoReserva, error: vehiculoReservaError } = await supabase
        .from("ot_vehiculos")
        .select("estado, reserva_usuario_id")
        .eq("id", parsed.vehiculo_id)
        .maybeSingle();

      if (
        !vehiculoReservaError &&
        vehiculoReserva &&
        estadoVehiculoNormalizado(vehiculoReserva.estado) === "RESERVA_INDIVIDUAL"
      ) {
        const admin = createAdminClient();
        await crearBitacoraPendienteReservaIndividual(admin, {
          id: parsed.vehiculo_id,
          reserva_usuario_id: vehiculoReserva.reserva_usuario_id ?? null,
          kilometraje_actual: parsed.km_final,
        });
      }
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true };
  } catch (error) {
    console.error("Error creating bitacora:", error);
    return { success: false, error: "Error al crear la bitácora" };
  }
}

export async function getMetricasBitacoras() {
  try {
    const { supabase, user, role } = await requireAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let query = supabase
      .from(TABLE)
      .select("km_recorrido, monto_combustible")
      .gte("fecha", startOfMonth);

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total_km = data?.reduce((acc, curr) => acc + (curr.km_recorrido || 0), 0) || 0;
    const total_combustible = data?.reduce((acc, curr) => acc + (Number(curr.monto_combustible) || 0), 0) || 0;
    const total_misiones = data?.length || 0;

    return { total_km, total_combustible, total_misiones };
  } catch (error) {
    console.error("Error fetching metricas bitacoras:", error);
    return { total_km: 0, total_combustible: 0, total_misiones: 0 };
  }
}

export async function getConductores() {
  try {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre")
      .order("nombre");

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching conductores:", error);
    return [];
  }
}

export async function getSolicitudesEnMision() {
  try {
    const { supabase, user } = await requireAuth();
    return await loadMisionesVinculablesBitacora(supabase, user.id);
  } catch (error) {
    console.error("Error fetching solicitudes activas:", error);
    return [];
  }
}

async function fetchCombustibleAprobadoPorMision(
  supabase: Awaited<ReturnType<typeof createClient>>,
  solicitudVehiculoId: string,
): Promise<CombustibleAprobadoMision | null> {
  const id = solicitudVehiculoId.trim();
  if (!id) return null;

  const { data, error } = await supabase
    .from(SOLICITUD_COMBUSTIBLE_TABLE)
    .select("cupon_del, cupon_al, denominacion_cupon")
    .eq("solicitud_vehiculo_id", id)
    .eq("estado", "APROBADO")
    .order("fecha_aprobacion", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error?.message?.includes("denominacion_cupon")) {
    const { data: legacy, error: legacyError } = await supabase
      .from(SOLICITUD_COMBUSTIBLE_TABLE)
      .select("cupon_del, cupon_al")
      .eq("solicitud_vehiculo_id", id)
      .eq("estado", "APROBADO")
      .order("fecha_aprobacion", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (legacyError || !legacy) return null;
    return {
      cupon_del: legacy.cupon_del as number,
      cupon_al: legacy.cupon_al as number,
      denominacion_cupon: null,
    };
  }

  if (error || !data) return null;

  if (data.cupon_del == null || data.cupon_al == null) return null;

  return {
    cupon_del: Number(data.cupon_del),
    cupon_al: Number(data.cupon_al),
    denominacion_cupon:
      data.denominacion_cupon != null ? Number(data.denominacion_cupon) : null,
  };
}

export async function getCombustibleAprobadoPorMision(
  solicitudVehiculoId: string,
): Promise<CombustibleAprobadoMision | null> {
  const id = solicitudVehiculoId.trim();
  if (!id) return null;

  try {
    const { supabase } = await requireAuth();
    return await fetchCombustibleAprobadoPorMision(supabase, id);
  } catch (error) {
    console.error("getCombustibleAprobadoPorMision:", error);
    return null;
  }
}

async function fetchCombustibleAprobadoSinMisionPorVehiculo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehiculoId: string,
): Promise<CombustibleAprobadoMision | null> {
  const id = vehiculoId.trim();
  if (!id) return null;

  const { data, error } = await supabase
    .from(SOLICITUD_COMBUSTIBLE_TABLE)
    .select("cupon_del, cupon_al, denominacion_cupon")
    .eq("vehiculo_id", id)
    .is("solicitud_vehiculo_id", null)
    .eq("estado", "APROBADO")
    .order("fecha_aprobacion", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error?.message?.includes("denominacion_cupon")) {
    const { data: legacy, error: legacyError } = await supabase
      .from(SOLICITUD_COMBUSTIBLE_TABLE)
      .select("cupon_del, cupon_al")
      .eq("vehiculo_id", id)
      .is("solicitud_vehiculo_id", null)
      .eq("estado", "APROBADO")
      .order("fecha_aprobacion", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (legacyError || !legacy) return null;
    return {
      cupon_del: legacy.cupon_del as number,
      cupon_al: legacy.cupon_al as number,
      denominacion_cupon: null,
    };
  }

  if (error || !data) return null;

  if (data.cupon_del == null || data.cupon_al == null) return null;

  return {
    cupon_del: Number(data.cupon_del),
    cupon_al: Number(data.cupon_al),
    denominacion_cupon:
      data.denominacion_cupon != null ? Number(data.denominacion_cupon) : null,
  };
}

export async function getCombustibleAprobadoSinMisionPorVehiculo(
  vehiculoId: string,
): Promise<CombustibleAprobadoMision | null> {
  const id = vehiculoId.trim();
  if (!id) return null;

  try {
    const { supabase } = await requireAuth();
    return await fetchCombustibleAprobadoSinMisionPorVehiculo(supabase, id);
  } catch (error) {
    console.error("getCombustibleAprobadoSinMisionPorVehiculo:", error);
    return null;
  }
}

export type CombustibleSinMisionOpcion = {
  id: string;
  etiqueta: string;
  vale: string;
  monto: number;
};

function mapCombustibleSinMisionOpcion(row: {
  id: string;
  cupon_del: number | null;
  cupon_al: number | null;
  denominacion_cupon: number | null;
}): CombustibleSinMisionOpcion | null {
  if (row.cupon_del == null || row.cupon_al == null) return null;
  const datos = combustibleAprobadoParaBitacora({
    cupon_del: Number(row.cupon_del),
    cupon_al: Number(row.cupon_al),
    denominacion_cupon:
      row.denominacion_cupon != null ? Number(row.denominacion_cupon) : null,
  });
  if (!datos) return null;
  const montoLabel =
    datos.monto > 0
      ? ` · Q${datos.monto.toLocaleString("es-GT", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "";
  return {
    id: row.id,
    etiqueta: `Vale ${datos.vale}${montoLabel}`,
    vale: datos.vale,
    monto: datos.monto,
  };
}

async function fetchCombustibleAprobadoPorId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  solicitudCombustibleId: string,
  vehiculoId: string,
): Promise<CombustibleAprobadoMision | null> {
  const id = solicitudCombustibleId.trim();
  const vehiculo = vehiculoId.trim();
  if (!id || !vehiculo) return null;

  const { data, error } = await supabase
    .from(SOLICITUD_COMBUSTIBLE_TABLE)
    .select("cupon_del, cupon_al, denominacion_cupon, vehiculo_id, solicitud_vehiculo_id, estado")
    .eq("id", id)
    .eq("vehiculo_id", vehiculo)
    .is("solicitud_vehiculo_id", null)
    .eq("estado", "APROBADO")
    .maybeSingle();

  if (error || !data) return null;
  if (data.cupon_del == null || data.cupon_al == null) return null;

  return {
    cupon_del: Number(data.cupon_del),
    cupon_al: Number(data.cupon_al),
    denominacion_cupon:
      data.denominacion_cupon != null ? Number(data.denominacion_cupon) : null,
  };
}

export async function listCombustiblesAprobadosSinMisionPorVehiculo(
  vehiculoId: string,
): Promise<CombustibleSinMisionOpcion[]> {
  const id = vehiculoId.trim();
  if (!id) return [];

  try {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from(SOLICITUD_COMBUSTIBLE_TABLE)
      .select("id, cupon_del, cupon_al, denominacion_cupon, fecha_aprobacion")
      .eq("vehiculo_id", id)
      .is("solicitud_vehiculo_id", null)
      .eq("estado", "APROBADO")
      .order("fecha_aprobacion", { ascending: false });

    if (error) {
      console.error("listCombustiblesAprobadosSinMisionPorVehiculo:", error);
      return [];
    }

    return (data ?? [])
      .map((row) =>
        mapCombustibleSinMisionOpcion({
          id: String(row.id),
          cupon_del: row.cupon_del as number | null,
          cupon_al: row.cupon_al as number | null,
          denominacion_cupon: row.denominacion_cupon as number | null,
        }),
      )
      .filter((item): item is CombustibleSinMisionOpcion => item !== null);
  } catch (error) {
    console.error("listCombustiblesAprobadosSinMisionPorVehiculo:", error);
    return [];
  }
}

export async function getDatosReporteBitacora(mes: number, anio: number, vehiculo_id: string) {
  try {
    const { supabase, user, role } = await requireAuth();

    if (!canExportBitacoraReporte(role)) {
      return [];
    }

    const startDate = new Date(anio, mes - 1, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString();

    let query = supabase
      .from(TABLE)
      .select(`
        id,
        fecha,
        destino,
        km_inicial,
        km_final,
        km_recorrido,
        vale_combustible,
        monto_combustible,
        ot_vehiculos (placa, marca, modelo),
        profiles:conductor_id (nombre),
        ot_solicitudes (
          piloto,
          solicitante_id,
          solicitante:profiles!solicitante_id (nombre),
          piloto_profile:profiles!piloto (nombre)
        )
      `)
      .eq("estado", "CONFIRMADA")
      .gte("fecha", startDate)
      .lte("fecha", endDate)
      .order("fecha", { ascending: true });

    if (vehiculo_id && vehiculo_id !== "all") {
      query = query.eq("vehiculo_id", vehiculo_id);
    }

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching report data:", error);
    return [];
  }
}

export async function getDatosReporteComentariosBitacora(
  mes: number,
  anio: number,
  vehiculo_id: string,
): Promise<BitacoraRow[]> {
  try {
    const { supabase, user, role } = await requireAuth();

    if (!canExportBitacoraReporte(role)) {
      return [];
    }

    const startDate = new Date(anio, mes - 1, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999).toISOString();

    let query = supabase
      .from(TABLE)
      .select(BITACORA_LIST_SELECT)
      .eq("estado", "CONFIRMADA")
      .gte("fecha", startDate)
      .lte("fecha", endDate)
      .order("fecha", { ascending: true });

    if (vehiculo_id && vehiculo_id !== "all") {
      query = query.eq("vehiculo_id", vehiculo_id);
    }

    if (!canViewAllBitacoras(role)) {
      query = query.eq("conductor_id", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data ?? []).map((row) => normalizeBitacoraRow(row as BitacoraRow));
  } catch (error) {
    console.error("Error fetching comentarios report data:", error);
    return [];
  }
}
