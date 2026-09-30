"use server";

import { createClient } from "@/utils/supabase/server";
import {
  fetchBitacoraPendienteBloqueos,
  type BitacoraPendienteBloqueos,
} from "./bitacora-pendiente-bloqueo";
import {
  canElegirSolicitanteAlCrearSolicitudVehiculo,
  roleFromAuthUser,
} from "./permissions";

export async function getBitacoraPendienteBloqueos(): Promise<BitacoraPendienteBloqueos> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { vehiculo: null, combustible: null };
  }

  try {
    return await fetchBitacoraPendienteBloqueos(supabase, user.id);
  } catch (error) {
    console.error("getBitacoraPendienteBloqueos:", error);
    return { vehiculo: null, combustible: null };
  }
}

export async function getBitacoraPendienteBloqueosParaUsuario(
  profileId: string,
): Promise<BitacoraPendienteBloqueos> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { vehiculo: null, combustible: null };
  }

  const objetivo = profileId.trim();
  if (!objetivo) {
    return { vehiculo: null, combustible: null };
  }

  const role = roleFromAuthUser(user);
  const puedeConsultarOtro =
    canElegirSolicitanteAlCrearSolicitudVehiculo(role) && objetivo !== user.id;
  const usuarioBloqueo = puedeConsultarOtro || objetivo === user.id ? objetivo : user.id;

  try {
    return await fetchBitacoraPendienteBloqueos(supabase, usuarioBloqueo);
  } catch (error) {
    console.error("getBitacoraPendienteBloqueosParaUsuario:", error);
    return { vehiculo: null, combustible: null };
  }
}
