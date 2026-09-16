"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  canDeleteValeCombustible,
  canManageValesCombustible,
  canViewValesCombustible,
} from "../../lib/permissions";
import { COMBUSTIBLE_BASE_ROUTE } from "../../lib/routes";
import { valeLoteInputSchema, type ValeLoteInput, type ValeLoteRow } from "./zod";

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

export async function getValesCombustible(): Promise<ValeLoteRow[]> {
  try {
    const { role, supabase } = await requireAuth();

    if (!canViewValesCombustible(role)) {
      return [];
    }
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getValesCombustible:", error);
      return [];
    }

    return (data ?? []) as ValeLoteRow[];
  } catch (error) {
    console.error("getValesCombustible:", error);
    return [];
  }
}

export async function createValeCombustible(
  input: ValeLoteInput,
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const { role, supabase } = await requireAuth();

    if (!canManageValesCombustible(role)) {
      return { success: false, error: "Solo administradores pueden registrar vales." };
    }

    const parsed = valeLoteInputSchema.safeParse(input);
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
        error: "No se pudo registrar el lote. Verifique que las tablas existan en Supabase.",
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, id: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar el lote de vales.",
    };
  }
}

export async function deleteValeCombustible(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { role, supabase } = await requireAuth();

    if (!canDeleteValeCombustible(role)) {
      return { success: false, error: "Solo el rol super puede eliminar lotes de vales." };
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error: "No se pudo eliminar el lote. Puede tener solicitudes vinculadas.",
      };
    }

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar el lote.",
    };
  }
}
