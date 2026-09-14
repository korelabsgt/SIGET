"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { canManageCombustibleAdmin } from "../../lib/permissions";
import { COMBUSTIBLE_BASE_ROUTE } from "../../lib/routes";
import { requisicionInputSchema, type RequisicionInput, type RequisicionRow } from "./zod";

const TABLE = "ot_requisicion_combustible";
const REVALIDATE_ROUTE = COMBUSTIBLE_BASE_ROUTE;

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

export async function getRequisicionesCombustible(): Promise<RequisicionRow[]> {
  try {
    const { supabase } = await requireAuth();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getRequisicionesCombustible:", error);
      return [];
    }

    return (data ?? []) as RequisicionRow[];
  } catch (error) {
    console.error("getRequisicionesCombustible:", error);
    return [];
  }
}

export async function createRequisicionCombustible(
  input: RequisicionInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const { role, supabase } = await requireAuth();

    if (!canManageCombustibleAdmin(role)) {
      return { success: false, error: "Solo administradores pueden registrar requisiciones." };
    }

    const parsed = requisicionInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        cantidad: parsed.data.cantidad,
        denominacion: parsed.data.denominacion,
        cupon_del: parsed.data.cupon_del,
        cupon_al: parsed.data.cupon_al,
        disponibles: parsed.data.cantidad,
        ultimo_entregado: null,
        fondo: parsed.data.fondo,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return {
        success: false,
        error: "No se pudo registrar la requisición. Verifique que las tablas existan en Supabase.",
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar la requisición.",
    };
  }
}

export async function deleteRequisicionCombustible(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { role, supabase } = await requireAuth();

    if (!canManageCombustibleAdmin(role)) {
      return { success: false, error: "Solo administradores pueden eliminar requisiciones." };
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "No se pudo eliminar la requisición. Puede tener solicitudes vinculadas.",
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar la requisición.",
    };
  }
}
