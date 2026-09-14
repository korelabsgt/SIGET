"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { canManageCombustibleAdmin } from "../../lib/permissions";
import { COMBUSTIBLE_BASE_ROUTE } from "../../lib/routes";
import type { RequisicionRow } from "../../requisiciones/lib/zod";
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

const SELECT_QUERY = `
  *,
  vehiculo:ot_vehiculos!vehiculo_id(id, placa, marca, modelo),
  solicitante:profiles!solicitante_id(id, nombre, email),
  entregante:profiles!entregante_id(id, nombre, email)
`;

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
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_QUERY)
      .order("fecha_solicitud", { ascending: false });

    if (error) {
      console.error("getSolicitudesCombustible:", error);
      return [];
    }

    return (data ?? []) as SolicitudCombustibleRow[];
  } catch (error) {
    console.error("getSolicitudesCombustible:", error);
    return [];
  }
}

export async function createSolicitudCombustible(
  input: SolicitudCombustibleInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const { user, supabase } = await requireAuth();

    const parsed = solicitudCombustibleInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        vehiculo_id: parsed.data.vehiculo_id,
        solicitante_id: user.id,
        comentarios: parsed.data.comentarios?.trim() || null,
        estado: "PENDIENTE",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return {
        success: false,
        error: "No se pudo crear la solicitud. Verifique que las tablas existan en Supabase.",
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
  requisicion: RequisicionRow,
  cantidad: number,
): { cuponDel: number; cuponAl: number } | { error: string } {
  if (requisicion.disponibles < cantidad) {
    return { error: "No hay cupones suficientes en el lote seleccionado." };
  }

  const cuponDel = (requisicion.ultimo_entregado ?? requisicion.cupon_del - 1) + 1;
  const cuponAl = cuponDel + cantidad - 1;

  if (cuponAl > requisicion.cupon_al) {
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

    if (!canManageCombustibleAdmin(role)) {
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
      requisicion as RequisicionRow,
      parsed.data.cantidad_cupones ?? 0,
    );

    if ("error" in rango) {
      return { success: false, error: rango.error };
    }

    const { error: updateSolicitudError } = await supabase
      .from(TABLE)
      .update({
        estado: "APROBADO",
        cupon_del: rango.cuponDel,
        cupon_al: rango.cuponAl,
        entregante_id: user.id,
        fecha_aprobacion: new Date().toISOString(),
        comentarios: parsed.data.comentarios?.trim() || null,
      })
      .eq("id", solicitudId);

    if (updateSolicitudError) {
      return { success: false, error: "No se pudo aprobar la solicitud." };
    }

    const cantidadEntregada = parsed.data.cantidad_cupones ?? 0;
    const disponiblesActuales = Number((requisicion as RequisicionRow).disponibles);
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
