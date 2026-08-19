"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type FallaMantenimientoFormData,
  FallaMantenimientoSchema,
  type AtenderFallaFormData,
  AtenderFallaSchema,
  type SolventarFallaFormData,
  SolventarFallaSchema,
} from "./zod";

const TABLE = "ter_fallas_mantenimiento";
const REVALIDATE_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/mantenimiento";
const VEHICULOS_ROUTE = "/siget/gestion-territorial/gestion-vehiculos/flota";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  return { supabase, user };
}

export type FallaRow = {
  id: string;
  vehiculo_id: string;
  reportado_por: string;
  mecanico_id: string | null;
  severidad: "BAJA" | "MEDIA" | "ALTA";
  descripcion: string;
  evidencia_url: string | null;
  diagnostico: string | null;
  reparacion_detalle: string | null;
  taller_externo: string | null;
  estado: "PENDIENTE" | "EN_REPARACION" | "SOLVENTADA";
  created_at: string;
  solventado_at: string | null;
  vehiculo: { placa: string; marca: string; modelo: string };
  reportador: { nombre: string };
  mecanico: { nombre: string } | null;
};

export async function getFallasMantenimiento(): Promise<FallaRow[]> {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      vehiculo:ter_vehiculos(placa, marca, modelo),
      reportador:profiles!ter_fallas_mantenimiento_reportado_por_fkey(nombre),
      mecanico:profiles!ter_fallas_mantenimiento_mecanico_id_fkey(nombre)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data as any;
}

export async function getVehiculosParaFallas() {
  const { supabase } = await requireAuth();
  
  const { data, error } = await supabase
    .from("ter_vehiculos")
    .select("id, placa, marca, modelo, estado")
    .order("placa", { ascending: true });

  if (error) throw new Error(error.message);

  return data;
}

export async function getMecanicos() {
  const { supabase } = await requireAuth();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);

  return data;
}

export async function createFalla(input: FallaMantenimientoFormData): Promise<void> {
  const { supabase, user } = await requireAuth();

  const parsed = FallaMantenimientoSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  const { error } = await supabase
    .from(TABLE)
    .insert([{
      ...parsed.data,
      reportado_por: user.id,
      estado: "PENDIENTE"
    }]);

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
  revalidatePath(VEHICULOS_ROUTE);
}

export async function atenderFalla(input: AtenderFallaFormData): Promise<void> {
  const { supabase } = await requireAuth();

  const parsed = AtenderFallaSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  const payload: any = {
    estado: "EN_REPARACION",
  };

  if (parsed.data.mecanico_id) payload.mecanico_id = parsed.data.mecanico_id;
  if (parsed.data.taller_externo) payload.taller_externo = parsed.data.taller_externo;

  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", parsed.data.falla_id);

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
  revalidatePath(VEHICULOS_ROUTE);
}

export async function solventarFalla(input: SolventarFallaFormData): Promise<void> {
  const { supabase } = await requireAuth();

  const parsed = SolventarFallaSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Datos inválidos: " + parsed.error.message);
  }

  const { error } = await supabase
    .from(TABLE)
    .update({
      estado: "SOLVENTADA",
      diagnostico: parsed.data.diagnostico,
      reparacion_detalle: parsed.data.reparacion_detalle,
      solventado_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.falla_id);

  if (error) throw new Error(error.message);

  revalidatePath(REVALIDATE_ROUTE);
  revalidatePath(VEHICULOS_ROUTE);
}
