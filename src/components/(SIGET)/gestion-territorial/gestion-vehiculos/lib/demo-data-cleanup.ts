"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

import { COMBUSTIBLE_BASE_ROUTE } from "../../solicitud-combustible/lib/routes";
import { isSuperRole } from "./permissions";
import { GV_BASE_ROUTE } from "./routes";
import { VEHICULOS_STORAGE_BUCKET } from "./storage";

const DEMO_PLACA_MARKER = "SIM";
const DEMO_JUSTIFICACION_MARKER =
  "Registro generado automáticamente para vista previa del módulo.";
const DEMO_CUPON_DEL_MIN = 88880000;
const DEMO_CUPON_AL_MAX = 88880999;

async function requireSuperCleanupAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "No autenticado." };
  }

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  if (!isSuperRole(role)) {
    return { ok: false as const, error: "Solo super puede quitar datos demo." };
  }

  return { ok: true as const, admin: createAdminClient() };
}

async function demoVehiculosExist(
  admin: ReturnType<typeof createAdminClient>,
): Promise<boolean> {
  const { count } = await admin
    .from("ot_vehiculos")
    .select("id", { count: "exact", head: true })
    .like("placa", `%${DEMO_PLACA_MARKER}`);

  return (count ?? 0) > 0;
}

export async function hasGvDemoData(): Promise<boolean> {
  try {
    const auth = await requireSuperCleanupAuth();
    if (!auth.ok) return false;
    return demoVehiculosExist(auth.admin);
  } catch {
    return false;
  }
}

export type GvDemoCleanupResult = {
  success: boolean;
  error?: string;
  removed?: {
    vehiculos: number;
    solicitudes: number;
    bitacoras: number;
    fallas: number;
    solicitudesCombustible: number;
    requisicionesCombustible: number;
  };
};

async function clearCombustibleDemoData(
  admin: ReturnType<typeof createAdminClient>,
  demoVehiculoIds: string[],
): Promise<{ solicitudesCombustible: number; requisicionesCombustible: number }> {
  let solicitudesCombustible = 0;

  if (demoVehiculoIds.length > 0) {
    const { count } = await admin
      .from("ot_solicitud_combustible")
      .delete({ count: "exact" })
      .in("vehiculo_id", demoVehiculoIds);
    solicitudesCombustible += count ?? 0;
  }

  const { count: porComentario } = await admin
    .from("ot_solicitud_combustible")
    .delete({ count: "exact" })
    .eq("comentarios", DEMO_JUSTIFICACION_MARKER);
  solicitudesCombustible += porComentario ?? 0;

  const { count: requisicionesCombustible } = await admin
    .from("ot_requisicion_combustible")
    .delete({ count: "exact" })
    .gte("cupon_del", DEMO_CUPON_DEL_MIN)
    .lte("cupon_al", DEMO_CUPON_AL_MAX);

  return {
    solicitudesCombustible,
    requisicionesCombustible: requisicionesCombustible ?? 0,
  };
}

export async function clearGvDemoData(): Promise<GvDemoCleanupResult> {
  try {
    const auth = await requireSuperCleanupAuth();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const { admin } = auth;

    const { data: demoVehiculos, error: vehiculosError } = await admin
      .from("ot_vehiculos")
      .select("id, imagen_url")
      .like("placa", `%${DEMO_PLACA_MARKER}`);

    if (vehiculosError) {
      return {
        success: false,
        error: "No se pudieron localizar los vehículos demo.",
      };
    }

    const demoVehiculoIds = (demoVehiculos ?? []).map((row) => row.id);

    const combustible = await clearCombustibleDemoData(admin, demoVehiculoIds);

    let demoSolicitudIds: string[] = [];

    if (demoVehiculoIds.length > 0) {
      const { data: solicitudesPorVehiculo } = await admin
        .from("ot_solicitudes")
        .select("id")
        .in("vehiculo_id", demoVehiculoIds);

      demoSolicitudIds = (solicitudesPorVehiculo ?? []).map((row) => row.id);
    }

    const { data: solicitudesDemo } = await admin
      .from("ot_solicitudes")
      .select("id")
      .eq("justificacion", DEMO_JUSTIFICACION_MARKER);

    demoSolicitudIds = [
      ...new Set([
        ...demoSolicitudIds,
        ...(solicitudesDemo ?? []).map((row) => row.id),
      ]),
    ];

    let bitacorasEliminadas = 0;
    let fallasEliminadas = 0;
    let solicitudesEliminadas = 0;

    if (demoVehiculoIds.length > 0 || demoSolicitudIds.length > 0) {
      const bitacoraFilters: string[] = [];

      if (demoVehiculoIds.length > 0) {
        bitacoraFilters.push(`vehiculo_id.in.(${demoVehiculoIds.join(",")})`);
      }
      if (demoSolicitudIds.length > 0) {
        bitacoraFilters.push(`solicitud_id.in.(${demoSolicitudIds.join(",")})`);
      }

      const { count: bitacorasCount } = await admin
        .from("ot_bitacoras")
        .delete({ count: "exact" })
        .or(bitacoraFilters.join(","));

      bitacorasEliminadas = bitacorasCount ?? 0;
    }

    if (demoVehiculoIds.length > 0) {
      const { count: fallasCount } = await admin
        .from("ot_fallas_mantenimiento")
        .delete({ count: "exact" })
        .in("vehiculo_id", demoVehiculoIds);

      fallasEliminadas = fallasCount ?? 0;
    }

    if (demoSolicitudIds.length > 0) {
      const { count: solicitudesCount } = await admin
        .from("ot_solicitudes")
        .delete({ count: "exact" })
        .in("id", demoSolicitudIds);

      solicitudesEliminadas = solicitudesCount ?? 0;
    }

    const storagePaths = (demoVehiculos ?? []).flatMap((row) => {
      const urls = row.imagen_url;
      if (!Array.isArray(urls)) return [];
      return urls.filter((path): path is string => typeof path === "string");
    });

    if (storagePaths.length > 0) {
      await admin.storage.from(VEHICULOS_STORAGE_BUCKET).remove(storagePaths);
    }

    let vehiculosEliminados = 0;

    if (demoVehiculoIds.length > 0) {
      const { count: vehiculosCount } = await admin
        .from("ot_vehiculos")
        .delete({ count: "exact" })
        .in("id", demoVehiculoIds);

      vehiculosEliminados = vehiculosCount ?? 0;
    }

    revalidatePath(GV_BASE_ROUTE);
    revalidatePath(COMBUSTIBLE_BASE_ROUTE);

    return {
      success: true,
      removed: {
        vehiculos: vehiculosEliminados,
        solicitudes: solicitudesEliminadas,
        bitacoras: bitacorasEliminadas,
        fallas: fallasEliminadas,
        solicitudesCombustible: combustible.solicitudesCombustible,
        requisicionesCombustible: combustible.requisicionesCombustible,
      },
    };
  } catch {
    return {
      success: false,
      error: "No se pudieron quitar los datos demo.",
    };
  }
}
