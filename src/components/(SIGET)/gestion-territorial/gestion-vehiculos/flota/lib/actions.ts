"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { type VehiculoInput, vehiculoInputSchema, type VehiculoRow } from "./zod";

const TABLE = "ter_vehiculos";
const REVALIDATE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/flota";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  return { supabase, user };
}

export async function getVehiculos(
  searchQuery?: string,
  estadoFilter?: string
): Promise<VehiculoRow[]> {
  const { supabase } = await requireAuth();

  let query = supabase.from(TABLE).select("*").order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(`placa.ilike.%${searchQuery}%,marca.ilike.%${searchQuery}%,modelo.ilike.%${searchQuery}%`);
  }

  if (estadoFilter && estadoFilter !== "TODOS") {
    query = query.eq("estado", estadoFilter);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data as VehiculoRow[];
}

export async function getVehiculo(id: string): Promise<VehiculoRow | null> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as VehiculoRow;
}

export async function createVehiculo(input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase } = await requireAuth();

  const parsed = vehiculoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  // Verificar si la placa ya existe
  const { data: existingPlaca } = await supabase
    .from(TABLE)
    .select("id")
    .eq("placa", parsed.data.placa)
    .maybeSingle();

  if (existingPlaca) {
    throw new Error(`La placa ${parsed.data.placa} ya está registrada.`);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([parsed.data])
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
  return data as VehiculoRow;
}

export async function updateVehiculo(id: string, input: VehiculoInput): Promise<VehiculoRow> {
  const { supabase } = await requireAuth();

  const parsed = vehiculoInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  // Verificar si la placa ya existe en otro vehículo
  const { data: existingPlaca } = await supabase
    .from(TABLE)
    .select("id")
    .eq("placa", parsed.data.placa)
    .neq("id", id)
    .maybeSingle();

  if (existingPlaca) {
    throw new Error(`La placa ${parsed.data.placa} ya está registrada por otro vehículo.`);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
  return data as VehiculoRow;
}

export async function deleteVehiculo(id: string): Promise<void> {
  const { supabase } = await requireAuth();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
}
