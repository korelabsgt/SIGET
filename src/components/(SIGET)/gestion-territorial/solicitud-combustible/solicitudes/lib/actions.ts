"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { canViewAllSolicitudes } from "../../../gestion-vehiculos/lib/permissions";
import {
  canAprobarRechazarSolicitudCombustible,
} from "../../lib/permissions";
import { COMBUSTIBLE_BASE_ROUTE } from "../../lib/routes";
import type { ValeLoteRow } from "../../vales/lib/zod";
import { esMisionVehiculoActiva } from "./helpers";
import {
  resolverSolicitudCombustibleSchema,
  solicitudCombustibleInputSchema,
  type ResolverSolicitudCombustibleInput,
  type SolicitudCombustibleInput,
  type SolicitudCombustibleRow,
} from "./zod";

const TABLE = "ot_solicitud_combustible";
const REQUISICION_TABLE = "ot_requisicion_combustible";
const REVALIDATE_ROUTE = COMBUSTIBLE_BASE_ROUTE;

const SELECT_QUERY_BASE = `
  *,
  vehiculo:ot_vehiculos!vehiculo_id(id, placa, marca, modelo),
  solicitante:profiles!solicitante_id(id, nombre, email),
  entregante:profiles!entregante_id(id, nombre, email)
`;

const SELECT_QUERY_MISION = `
  ${SELECT_QUERY_BASE},
  solicitud_vehiculo:ot_solicitudes!solicitud_vehiculo_id(
    id,
    destino,
    fecha_inicio,
    fecha_fin_estimada,
    estado,
    vehiculo_id
  )
`;

function esErrorVinculoMisionNoDisponible(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST200" ||
    (error.message?.includes("solicitud_vehiculo_id") ?? false) ||
    (error.message?.includes("ot_solicitudes") ?? false)
  );
}

function mensajeErrorCombustibleDb(error: { code?: string; message?: string }): string {
  if (esErrorVinculoMisionNoDisponible(error)) {
    return "Falta configurar la vinculación con misiones en Supabase. Ejecute el script db/migrations/ot_combustible_solicitud_vehiculo.sql en el SQL Editor.";
  }
  if (error.message?.includes("solicitud_vehiculo_id")) {
    return "La base de datos aún no tiene el campo de misión vinculada. Aplique la migración ot_combustible_solicitud_vehiculo.sql.";
  }
  return "No se pudo completar la operación. Verifique permisos y tablas en Supabase.";
}

const SOLICITUDES_VEHICULO_TABLE = "ot_solicitudes";

async function resolveSolicitudVehiculoVinculo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: string,
  vehiculoId: string,
  solicitudVehiculoId: string | null | undefined,
): Promise<{ id: string | null } | { error: string }> {
  const raw = solicitudVehiculoId?.trim();
  if (!raw) {
    return { id: null };
  }

  const { data: solicitudVehiculo, error } = await supabase
    .from(SOLICITUDES_VEHICULO_TABLE)
    .select("id, solicitante_id, vehiculo_id, estado, fecha_fin_estimada")
    .eq("id", raw)
    .maybeSingle();

  if (error || !solicitudVehiculo) {
    return { error: "La solicitud de vehículo seleccionada no existe." };
  }

  if (
    !esMisionVehiculoActiva({
      estado: solicitudVehiculo.estado,
      fecha_fin_estimada: solicitudVehiculo.fecha_fin_estimada,
    })
  ) {
    return {
      error: "Solo se puede vincular una misión activa (no finalizada ni vencida).",
    };
  }

  if (!canViewAllSolicitudes(role) && solicitudVehiculo.solicitante_id !== userId) {
    return { error: "No tiene permiso para vincular esa solicitud de vehículo." };
  }

  if (solicitudVehiculo.vehiculo_id && solicitudVehiculo.vehiculo_id !== vehiculoId) {
    return {
      error: "El vehículo de la solicitud de combustible debe coincidir con el de la misión.",
    };
  }

  return { id: solicitudVehiculo.id };
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

export async function getSolicitudesCombustible(): Promise<SolicitudCombustibleRow[]> {
  try {
    const { supabase } = await requireAuth();
    const withMision = await supabase
      .from(TABLE)
      .select(SELECT_QUERY_MISION)
      .order("fecha_solicitud", { ascending: false });
    if (!withMision.error) {
      return (withMision.data ?? []) as SolicitudCombustibleRow[];
    }

    if (!esErrorVinculoMisionNoDisponible(withMision.error)) {
      console.error("getSolicitudesCombustible:", withMision.error);
      return [];
    }

    const base = await supabase
      .from(TABLE)
      .select(SELECT_QUERY_BASE)
      .order("fecha_solicitud", { ascending: false });

    if (base.error) {
      console.error("getSolicitudesCombustible:", base.error);
      return [];
    }

    return (base.data ?? []) as SolicitudCombustibleRow[];
  } catch (error) {
    console.error("getSolicitudesCombustible:", error);
    return [];
  }
}

export async function createSolicitudCombustible(
  input: SolicitudCombustibleInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const { user, role, supabase } = await requireAuth();

    const parsed = solicitudCombustibleInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const vinculo = await resolveSolicitudVehiculoVinculo(
      supabase,
      user.id,
      role,
      parsed.data.vehiculo_id,
      parsed.data.solicitud_vehiculo_id,
    );

    if ("error" in vinculo) {
      return { success: false, error: vinculo.error };
    }

    if (vinculo.id) {
      const { error: probeError } = await supabase
        .from(TABLE)
        .select("solicitud_vehiculo_id")
        .limit(0);

      if (probeError && esErrorVinculoMisionNoDisponible(probeError)) {
        return { success: false, error: mensajeErrorCombustibleDb(probeError) };
      }
      if (probeError && probeError.message?.includes("solicitud_vehiculo_id")) {
        return {
          success: false,
          error:
            "No se puede vincular la misión hasta aplicar la migración ot_combustible_solicitud_vehiculo.sql en Supabase.",
        };
      }
    }

    const insertPayload: {
      vehiculo_id: string;
      solicitante_id: string;
      comentarios: string | null;
      estado: "PENDIENTE";
      solicitud_vehiculo_id?: string;
    } = {
      vehiculo_id: parsed.data.vehiculo_id,
      solicitante_id: user.id,
      comentarios: parsed.data.comentarios?.trim() || null,
      estado: "PENDIENTE",
    };

    if (vinculo.id) {
      insertPayload.solicitud_vehiculo_id = vinculo.id;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert(insertPayload)
      .select("id")
      .single();

    if (error || !data?.id) {
      return {
        success: false,
        error: error ? mensajeErrorCombustibleDb(error) : mensajeErrorCombustibleDb({}),
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la solicitud.",
    };
  }
}

function calcularRangoCupones(
  lote: ValeLoteRow,
  cantidad: number,
): { cuponDel: number; cuponAl: number } | { error: string } {
  if (lote.disponibles < cantidad) {
    return { error: "No hay cupones suficientes en el lote seleccionado." };
  }

  const cuponDel = (lote.ultimo_entregado ?? lote.cupon_del - 1) + 1;
  const cuponAl = cuponDel + cantidad - 1;

  if (cuponAl > lote.cupon_al) {
    return { error: "El rango solicitado excede la numeración del lote." };
  }

  return { cuponDel, cuponAl };
}

export async function resolverSolicitudCombustible(
  solicitudId: string,
  input: ResolverSolicitudCombustibleInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { user, role, supabase } = await requireAuth();

    if (!canAprobarRechazarSolicitudCombustible(role)) {
      return { success: false, error: "Solo administradores pueden resolver solicitudes." };
    }

    const parsed = resolverSolicitudCombustibleSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const { data: solicitud, error: solicitudError } = await supabase
      .from(TABLE)
      .select("id, estado")
      .eq("id", solicitudId)
      .maybeSingle();

    if (solicitudError || !solicitud) {
      return { success: false, error: "Solicitud no encontrada." };
    }

    if (solicitud.estado !== "PENDIENTE") {
      return { success: false, error: "Esta solicitud ya fue resuelta." };
    }

    if (parsed.data.accion === "RECHAZAR") {
      const { error } = await supabase
        .from(TABLE)
        .update({
          estado: "RECHAZADO",
          comentarios: parsed.data.comentarios?.trim() || null,
          fecha_aprobacion: new Date().toISOString(),
          entregante_id: user.id,
        })
        .eq("id", solicitudId);

      if (error) {
        return { success: false, error: "No se pudo rechazar la solicitud." };
      }

      revalidatePath(REVALIDATE_ROUTE);
      return { success: true };
    }

    const { data: requisicion, error: requisicionError } = await supabase
      .from(REQUISICION_TABLE)
      .select("*")
      .eq("id", parsed.data.requisicion_id ?? "")
      .maybeSingle();

    if (requisicionError || !requisicion) {
      return { success: false, error: "Lote de cupones no encontrado." };
    }

    const rango = calcularRangoCupones(
      requisicion as ValeLoteRow,
      parsed.data.cantidad_cupones ?? 0,
    );

    if ("error" in rango) {
      return { success: false, error: rango.error };
    }

    const denominacionCupon = Number((requisicion as ValeLoteRow).denominacion);

    const aprobacionBase = {
      estado: "APROBADO" as const,
      cupon_del: rango.cuponDel,
      cupon_al: rango.cuponAl,
      entregante_id: user.id,
      fecha_aprobacion: new Date().toISOString(),
      comentarios: parsed.data.comentarios?.trim() || null,
    };

    let updateSolicitudError = (
      await supabase
        .from(TABLE)
        .update({
          ...aprobacionBase,
          denominacion_cupon: Number.isFinite(denominacionCupon) ? denominacionCupon : null,
        })
        .eq("id", solicitudId)
    ).error;

    if (updateSolicitudError?.message?.includes("denominacion_cupon")) {
      updateSolicitudError = (await supabase.from(TABLE).update(aprobacionBase).eq("id", solicitudId))
        .error;
    }

    if (updateSolicitudError) {
      return { success: false, error: "No se pudo aprobar la solicitud." };
    }

    const cantidadEntregada = parsed.data.cantidad_cupones ?? 0;
    const disponiblesActuales = Number((requisicion as ValeLoteRow).disponibles);
    const nuevosDisponibles = disponiblesActuales - cantidadEntregada;

    const admin = createAdminClient();
    const { data: requisicionActualizada, error: updateRequisicionError } = await admin
      .from(REQUISICION_TABLE)
      .update({
        disponibles: nuevosDisponibles,
        ultimo_entregado: rango.cuponAl,
      })
      .eq("id", requisicion.id)
      .select("id, disponibles, ultimo_entregado")
      .maybeSingle();

    if (updateRequisicionError || !requisicionActualizada) {
      await supabase
        .from(TABLE)
        .update({
          estado: "PENDIENTE",
          cupon_del: null,
          cupon_al: null,
          denominacion_cupon: null,
          entregante_id: null,
          fecha_aprobacion: null,
        })
        .eq("id", solicitudId);

      return {
        success: false,
        error: "No se pudo descontar el inventario de cupones. La solicitud quedó pendiente otra vez.",
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al resolver la solicitud.",
    };
  }
}
