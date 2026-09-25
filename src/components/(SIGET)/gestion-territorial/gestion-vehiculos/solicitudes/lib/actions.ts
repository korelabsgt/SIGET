"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import {
  esVehiculoDisponible,
  esVehiculoOperableParaIniciarMision,
} from "../../flota/lib/helpers";
import { sincronizarEstadoFlotaVehiculo } from "../../lib/sincronizar-estado-vehiculo";
import {
  canAprobarRechazarSolicitudes,
  canIniciarMisionSolicitud,
  canManageSolicitudesVehiculos,
  canViewAllSolicitudes,
  isSuperRole,
  puedeIniciarMisionEnHorarioProgramado,
} from "../../lib/permissions";
import { GV_BASE_ROUTE } from "../../lib/routes";
import {
  fetchBitacoraPendienteBloqueos,
  mensajeBloqueoNuevaSolicitudVehiculo,
} from "../../lib/bitacora-pendiente-bloqueo";
import {
  COMENTARIO_RECHAZO_SOLICITUD_VENCIDA,
  formatEstadoLabel,
  horaInicioSolicitudPasada,
} from "./helpers";
import {
  findConflictoDiaVehiculo,
  validarFechasMisionNoAnterioresAHoyGt,
  type SolicitudCalendarioRef,
} from "./calendario-reservas";
import { formatFechaCalendarioGt, formatFechaHoraGt } from "@/lib/fechas-gt";
import {
  type SolicitudInput,
  rechazoSolicitudComentarioSchema,
  solicitudInputSchema,
  type SolicitudRow,
} from "./zod";

const TABLE = "ot_solicitudes";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;
const FLOTA_ROUTE = GV_BASE_ROUTE;
const ESTADOS_CALENDARIO = ["PENDIENTE", "APROBADA", "EN_MISION"] as const;

async function fetchSolicitudesCalendario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehiculoId?: string,
): Promise<SolicitudCalendarioRef[]> {
  let query = supabase
    .from(TABLE)
    .select("id, vehiculo_id, estado, fecha_inicio, fecha_fin_estimada")
    .in("estado", [...ESTADOS_CALENDARIO]);

  if (vehiculoId) {
    query = query.eq("vehiculo_id", vehiculoId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SolicitudCalendarioRef[];
}

function mensajeConflictoDiaVehiculo(
  dia: string,
  estado?: SolicitudCalendarioRef["estado"],
  bloqueo?: Pick<SolicitudCalendarioRef, "fecha_inicio" | "fecha_fin_estimada">,
): string {
  const etiqueta = formatFechaCalendarioGt(dia, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const rangoBloqueo = bloqueo
    ? ` (salida ${formatFechaHoraGt(bloqueo.fecha_inicio)}, retorno ${formatFechaHoraGt(bloqueo.fecha_fin_estimada)})`
    : "";

  if (estado === "APROBADA") {
    return `Ese vehículo ya tiene una misión aprobada el ${etiqueta}${rangoBloqueo}. Solo una reserva por vehículo y día.`;
  }
  if (estado === "EN_MISION") {
    return `Ese vehículo ya está en misión el ${etiqueta}${rangoBloqueo}. Solo una reserva por vehículo y día.`;
  }
  if (estado === "PENDIENTE") {
    return `Ese vehículo ya tiene otra solicitud pendiente el ${etiqueta}${rangoBloqueo}. Revise Pendientes o elija otro vehículo.`;
  }
  return `Ese vehículo ya tiene una solicitud o misión el ${etiqueta}${rangoBloqueo}. Solo una reserva por vehículo y día.`;
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  return { user, role, supabase };
}

async function rechazarSolicitudVencidaPorId(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
): Promise<boolean> {
  const { error } = await admin
    .from(TABLE)
    .update({
      estado: "RECHAZADA",
      comentarios: COMENTARIO_RECHAZO_SOLICITUD_VENCIDA,
      aprobado_por: null,
    })
    .eq("id", id)
    .eq("estado", "PENDIENTE");

  if (error) {
    console.error("rechazarSolicitudVencidaPorId:", error);
    return false;
  }

  return true;
}

async function rechazarSolicitudesPendientesVencidas(): Promise<void> {
  const admin = createAdminClient();
  const ahoraIso = new Date().toISOString();

  const { data, error } = await admin
    .from(TABLE)
    .select("id, fecha_inicio")
    .eq("estado", "PENDIENTE")
    .lt("fecha_inicio", ahoraIso);

  if (error) {
    console.error("rechazarSolicitudesPendientesVencidas:", error);
    return;
  }

  const ids = (data ?? [])
    .filter((row) => horaInicioSolicitudPasada(row.fecha_inicio))
    .map((row) => row.id);

  if (ids.length === 0) return;

  const { error: updateError } = await admin
    .from(TABLE)
    .update({
      estado: "RECHAZADA",
      comentarios: COMENTARIO_RECHAZO_SOLICITUD_VENCIDA,
      aprobado_por: null,
    })
    .in("id", ids)
    .eq("estado", "PENDIENTE");

  if (updateError) {
    console.error("rechazarSolicitudesPendientesVencidas update:", updateError);
    return;
  }

  revalidatePath(REVALIDATE_ROUTE);
  revalidatePath(FLOTA_ROUTE);
}

export async function getSolicitudes(): Promise<SolicitudRow[]> {
  try {
    await rechazarSolicitudesPendientesVencidas();

    const { user, role, supabase } = await requireAuth();

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        solicitante:profiles!solicitante_id(id, nombre, email),
        aprobador:profiles!aprobado_por(id, nombre, email),
        piloto_profile:profiles!piloto(id, nombre, email),
        vehiculo:ot_vehiculos!vehiculo_id(id, placa, marca, modelo, color, kilometraje_actual, estado)
      `)
      .order("created_at", { ascending: false });

    if (!canViewAllSolicitudes(role)) {
      query = query.eq("solicitante_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error getSolicitudes:", error);
      return [];
    }

    return data as SolicitudRow[];
  } catch (error) {
    console.error("Excepción en getSolicitudes:", error);
    return [];
  }
}

export async function createSolicitud(input: SolicitudInput) {
  try {
    const { user } = await requireAuth();

    const parsed = solicitudInputSchema.parse(input);

    const { vehiculo_id, piloto_modo, piloto_id, ...rest } = parsed;

    const pilotoUuid =
      piloto_modo === "otro" && piloto_id?.trim() ? piloto_id.trim() : user.id;

    const fechasHoy = validarFechasMisionNoAnterioresAHoyGt(
      rest.fecha_inicio,
      rest.fecha_fin_estimada,
    );
    if (!fechasHoy.ok) {
      return { success: false, error: fechasHoy.message };
    }

    const supabase = await createClient();

    const bloqueos = await fetchBitacoraPendienteBloqueos(supabase, user.id);
    if (bloqueos.vehiculo) {
      return {
        success: false,
        error: mensajeBloqueoNuevaSolicitudVehiculo(bloqueos.vehiculo),
      };
    }

    const { data: perfilPiloto, error: pilotoError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", pilotoUuid)
      .eq("activo", true)
      .maybeSingle();

    if (pilotoError || !perfilPiloto) {
      return {
        success: false,
        error: "El piloto debe ser un usuario activo registrado en el sistema.",
      };
    }

    if (vehiculo_id) {
      const { data: vehiculo, error: vehiculoError } = await supabase
        .from("ot_vehiculos")
        .select("id, estado")
        .eq("id", vehiculo_id)
        .maybeSingle();

      if (vehiculoError) {
        return { success: false, error: "No se pudo verificar el vehículo seleccionado." };
      }
      if (!vehiculo) {
        return { success: false, error: "El vehículo seleccionado no existe." };
      }
      if (!esVehiculoDisponible(vehiculo)) {
        return {
          success: false,
          error:
            "Solo puede preferir vehículos en estado Libre. Elija otro o deje sin preferencia.",
        };
      }

      const calendario = await fetchSolicitudesCalendario(supabase, vehiculo_id);
      const conflicto = findConflictoDiaVehiculo(
        {
          vehiculo_id,
          fecha_inicio: rest.fecha_inicio,
          fecha_fin_estimada: rest.fecha_fin_estimada,
        },
        calendario,
      );
      if (conflicto) {
        return {
          success: false,
          error: mensajeConflictoDiaVehiculo(conflicto.dia, conflicto.estado, conflicto),
        };
      }
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          solicitante_id: user.id,
          vehiculo_id: vehiculo_id || null,
          fecha_inicio: rest.fecha_inicio,
          fecha_fin_estimada: rest.fecha_fin_estimada,
          destino: rest.destino,
          justificacion: rest.justificacion,
          pasajeros: rest.pasajeros || null,
          piloto: pilotoUuid,
          estado: "PENDIENTE",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error DB createSolicitud:", error);
      if (error.code === "23P01" || error.message?.includes("no_empalmes")) {
        return {
          success: false,
          error: "Ese vehículo ya tiene otra reserva en uno de los días seleccionados.",
        };
      }
      return { success: false, error: error.message };
    }

    if (vehiculo_id) {
      const admin = createAdminClient();
      await sincronizarEstadoFlotaVehiculo(admin, vehiculo_id);
    }

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(FLOTA_ROUTE);
    return { success: true, data };
  } catch (err: unknown) {
    console.error("Error en createSolicitud:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { success: false, error: message };
  }
}

export async function cambiarEstadoSolicitud(
  id: string,
  nuevoEstado: "PENDIENTE" | "APROBADA" | "EN_MISION" | "RECHAZADA" | "FINALIZADA",
  payload?: { vehiculo_id?: string; comentarios?: string }
) {
  try {
    const { user, role } = await requireAuth();
    const esAdmin = canAprobarRechazarSolicitudes(role);
    const esSuper = isSuperRole(role);
    if (nuevoEstado === "FINALIZADA") {
      return {
        success: false,
        error: "La misión solo puede finalizarse registrando una bitácora vinculada.",
      };
    }

    const esTransicionMision = nuevoEstado === "EN_MISION";
    const esTransicionAprobacion =
      nuevoEstado === "APROBADA" || nuevoEstado === "RECHAZADA";

    if (!esTransicionMision && !esTransicionAprobacion) {
      return { success: false, error: "Transición de estado no permitida." };
    }

    if (esTransicionAprobacion && !esAdmin) {
      return { success: false, error: "No tienes permisos para realizar esta acción." };
    }

    const supabase = await createClient();

    const { data: actual, error: actualError } = await supabase
      .from(TABLE)
      .select("id, solicitante_id, vehiculo_id, estado, fecha_inicio, fecha_fin_estimada")
      .eq("id", id)
      .maybeSingle();

    if (actualError || !actual) {
      return { success: false, error: "No se encontró la solicitud." };
    }

    if (
      actual.estado === "PENDIENTE" &&
      horaInicioSolicitudPasada(actual.fecha_inicio)
    ) {
      const adminVencida = createAdminClient();
      await rechazarSolicitudVencidaPorId(adminVencida, actual.id);
      revalidatePath(REVALIDATE_ROUTE);
      revalidatePath(FLOTA_ROUTE);
      return {
        success: false,
        error:
          "La solicitud venció sin respuesta y fue rechazada automáticamente. Actualice la lista.",
      };
    }

    if (esTransicionMision) {
      if (
        !canIniciarMisionSolicitud(role, actual.solicitante_id, user.id)
      ) {
        return {
          success: false,
          error: "No tienes permiso para iniciar esta misión.",
        };
      }

      if (nuevoEstado === "EN_MISION" && actual.estado !== "APROBADA") {
        return {
          success: false,
          error: "La misión solo puede iniciarse cuando la solicitud está aprobada.",
        };
      }

      if (
        !puedeIniciarMisionEnHorarioProgramado(role, actual.fecha_inicio)
      ) {
        return {
          success: false,
          error:
            "La misión solo puede iniciarse desde la fecha y hora de salida programadas en la solicitud.",
        };
      }
    }

    if (esTransicionAprobacion && actual.estado !== "PENDIENTE") {
      return {
        success: false,
        error: `Esta solicitud ya no está pendiente (estado actual: ${formatEstadoLabel(actual.estado as SolicitudRow["estado"])}). Actualice la lista.`,
      };
    }

    const vehiculoAsignado = payload?.vehiculo_id || actual.vehiculo_id;

    if (nuevoEstado === "APROBADA" || nuevoEstado === "EN_MISION") {
      if (!vehiculoAsignado) {
        return {
          success: false,
          error: "Debe asignar un vehículo para confirmar la misión.",
        };
      }

      const { data: vehiculo, error: vehiculoError } = await supabase
        .from("ot_vehiculos")
        .select("id, estado")
        .eq("id", vehiculoAsignado)
        .maybeSingle();

      if (vehiculoError || !vehiculo) {
        return { success: false, error: "No se pudo verificar el vehículo asignado." };
      }

      if (nuevoEstado === "APROBADA") {
        if (!esVehiculoDisponible(vehiculo)) {
          return {
            success: false,
            error: "Solo puede asignar vehículos en estado Libre. Elija otro.",
          };
        }
      } else if (!esVehiculoOperableParaIniciarMision(vehiculo)) {
        return {
          success: false,
          error:
            "El vehículo asignado está en mantenimiento y no puede iniciar la misión.",
        };
      }

      const calendario = await fetchSolicitudesCalendario(supabase, vehiculoAsignado);
      const conflicto = findConflictoDiaVehiculo(
        {
          id: actual.id,
          vehiculo_id: vehiculoAsignado,
          fecha_inicio: actual.fecha_inicio,
          fecha_fin_estimada: actual.fecha_fin_estimada,
        },
        calendario,
        { incluirPendiente: false },
      );
      if (conflicto) {
        return {
          success: false,
          error: mensajeConflictoDiaVehiculo(conflicto.dia, conflicto.estado, conflicto),
        };
      }
    }

    const updateData: {
      estado: typeof nuevoEstado;
      aprobado_por?: string;
      vehiculo_id?: string;
      comentarios?: string | null;
    } = {
      estado: nuevoEstado,
    };

    if (nuevoEstado === "APROBADA" || nuevoEstado === "RECHAZADA") {
      updateData.aprobado_por = user.id;
    }

    if (nuevoEstado === "RECHAZADA") {
      const parsedComentario = rechazoSolicitudComentarioSchema.safeParse(
        payload?.comentarios ?? "",
      );
      if (!parsedComentario.success) {
        return {
          success: false,
          error:
            parsedComentario.error.issues[0]?.message ??
            "Debe indicar el motivo del rechazo.",
        };
      }
      updateData.comentarios = parsedComentario.data;
    }

    if (nuevoEstado === "APROBADA") {
      updateData.comentarios = null;
    }

    if (payload?.vehiculo_id) {
      updateData.vehiculo_id = payload.vehiculo_id;
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from(TABLE)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error cambiarEstadoSolicitud update:", error);
      if (error.code === "23P01" || error.message?.includes("no_empalmes")) {
        return {
          success: false,
          error: "Ese vehículo ya tiene otra reserva en uno de los días seleccionados.",
        };
      }
      if (error.code === "23503") {
        return {
          success: false,
          error: "No se pudo registrar la aprobación (referencia de usuario o vehículo inválida).",
        };
      }
      if (error.code === "42P01" && error.message?.includes("ter_vehiculos")) {
        return {
          success: false,
          error:
            "La base de datos tiene un trigger antiguo (ter_vehiculos). Ejecute en Supabase el script db/migrations/ot_fix_legacy_ter_table_names_in_functions.sql y vuelva a intentar.",
        };
      }
      return { success: false, error: "No se pudo actualizar el estado de la solicitud." };
    }

    const vehiculosAfectados = new Set<string>();
    if (actual.vehiculo_id) vehiculosAfectados.add(actual.vehiculo_id);
    if (data.vehiculo_id) vehiculosAfectados.add(data.vehiculo_id);

    for (const vehiculoId of vehiculosAfectados) {
      await sincronizarEstadoFlotaVehiculo(admin, vehiculoId);
    }

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(FLOTA_ROUTE);
    return { success: true, data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo actualizar el estado de la solicitud.";
    return { success: false, error: message };
  }
}

export async function searchProfiles(query: string, excludeUserId?: string) {
  try {
    const { supabase } = await requireAuth();
    const term = query.trim();
    if (term.length < 3) return [];

    const excluir = excludeUserId?.trim();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nombre, email")
      .eq("activo", true)
      .or(`nombre.ilike.%${term}%,email.ilike.%${term}%`)
      .order("nombre", { ascending: true })
      .limit(excluir ? 11 : 10);

    if (error) {
      console.error("Error searchProfiles:", error);
      return [];
    }

    return (data ?? [])
      .filter(
        (profile): profile is { id: string; nombre: string; email: string } =>
          Boolean(profile.id),
      )
      .filter((profile) => !excluir || profile.id !== excluir)
      .slice(0, 10);
  } catch (err) {
    console.error("Excepción en searchProfiles:", err);
    return [];
  }
}
