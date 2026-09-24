"use client";

import { createClient } from "@/utils/supabase/client";

import type { BitacoraRow } from "../bitacoras/lib/zod";
import { normalizeBitacoraRow } from "../bitacoras/lib/helpers";
import { loadMisionesVinculablesBitacora } from "../bitacoras/lib/misiones-vinculables";
import {
  esVehiculoSeleccionableParaSolicitud,
  listarVehiculosCatalogoFlota,
  normalizeVehiculoRow,
} from "../flota/lib/helpers";
import type { VehiculoRow } from "../flota/lib/zod";
import type { FallaRow, MecanicoOption } from "../mantenimiento/lib/zod";
import { FALLAS_MANTENIMIENTO_SELECT } from "../mantenimiento/lib/fallas-query";
import { normalizeFallaRow } from "../mantenimiento/lib/helpers";
import { canViewAllFallasMantenimiento, roleFromAuthUser } from "./permissions";
import type { SolicitudRow } from "../solicitudes/lib/zod";
import { canViewAllBitacoras, canViewAllSolicitudes } from "./permissions";

function db() {
  return createClient();
}

export async function fetchVehiculos(): Promise<VehiculoRow[]> {
  const { data, error } = await db()
    .from("ot_vehiculos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((row) => normalizeVehiculoRow(row as VehiculoRow));
  return listarVehiculosCatalogoFlota(rows);
}

export async function fetchVehiculosDisponibles(): Promise<VehiculoRow[]> {
  const client = db();
  const { data, error } = await client
    .from("ot_vehiculos")
    .select("*")
    .order("placa", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((row) => normalizeVehiculoRow(row as VehiculoRow));
  return listarVehiculosCatalogoFlota(rows).filter((vehiculo) =>
    esVehiculoSeleccionableParaSolicitud(vehiculo),
  );
}

export async function fetchSolicitudes(): Promise<SolicitudRow[]> {
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  let query = client
    .from("ot_solicitudes")
    .select(
      `
        *,
        solicitante:profiles!solicitante_id(id, nombre, email),
        aprobador:profiles!aprobado_por(id, nombre, email),
        piloto_profile:profiles!piloto(id, nombre, email),
        vehiculo:ot_vehiculos!vehiculo_id(id, placa, marca, modelo, color, kilometraje_actual, estado)
      `,
    )
    .order("created_at", { ascending: false });

  if (!canViewAllSolicitudes(role)) {
    query = query.eq("solicitante_id", user.id);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []) as SolicitudRow[];
}

export async function fetchBitacoras(): Promise<BitacoraRow[]> {
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const role =
    (user.user_metadata?.rol as string | undefined) || user.role || "user";

  let query = client
    .from("ot_bitacoras")
    .select(
      `
        *,
        ot_vehiculos (placa, marca, modelo),
        profiles:conductor_id (nombre)
      `,
    )
    .order("fecha", { ascending: false });

  if (!canViewAllBitacoras(role)) {
    query = query.eq("conductor_id", user.id);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeBitacoraRow(row as BitacoraRow));
}

export async function fetchFallasMantenimiento(): Promise<FallaRow[]> {
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const role = roleFromAuthUser(user);

  let query = client
    .from("ot_fallas_mantenimiento")
    .select(FALLAS_MANTENIMIENTO_SELECT)
    .order("created_at", { ascending: false });

  if (!canViewAllFallasMantenimiento(role)) {
    query = query.eq("reportado_por", user.id);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeFallaRow(row as FallaRow));
}

export async function fetchPerfilesNombre(): Promise<MecanicoOption[]> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MecanicoOption[];
}

export async function fetchSolicitudesEnMision() {
  const client = db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];

  return loadMisionesVinculablesBitacora(client, user.id);
}
