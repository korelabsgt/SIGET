"use server";

import { createClient } from "@/utils/supabase/server";
import {
  fetchBitacoraPendienteBloqueos,
  type BitacoraPendienteBloqueos,
} from "./bitacora-pendiente-bloqueo";

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
