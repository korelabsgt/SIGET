"use client";

import { createClient } from "@/utils/supabase/client";

import type { BitacoraRow } from "../bitacoras/lib/zod";
import { esVehiculoDisponible, normalizeVehiculoRow } from "../flota/lib/helpers";
import type { VehiculoRow } from "../flota/lib/zod";
import type { FallaRow, MecanicoOption } from "../mantenimiento/lib/zod";
import type { SolicitudRow } from "../solicitudes/lib/zod";

function db() {
  return createClient();
}

export async function fetchVehiculos(): Promise<VehiculoRow[]> {
  const { data, error } = await db()
    .from("ter_vehiculos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeVehiculoRow(row as VehiculoRow));
}

const ESTADOS_SOLICITUD_OCUPAN_VEHICULO = ["APROBADA", "EN_MISION"] as const;

export async function fetchVehiculosDisponibles(): Promise<VehiculoRow[]> {
  const client = db();
  const { data, error } = await client
    .from("ter_vehiculos")
    .select("*")
    .order("placa", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: asignados, error: asignadosError } = await client
    .from("ter_solicitudes")
    .select("vehiculo_id")
    .in("estado", [...ESTADOS_SOLICITUD_OCUPAN_VEHICULO])
    .not("vehiculo_id", "is", null);

  if (asignadosError) throw new Error(asignadosError.message);

  const ocupados = new Set(
    (asignados ?? [])
      .map((row) => row.vehiculo_id)
      .filter((id): id is string => Boolean(id)),
  );

  return (data ?? [])
    .map((row) => normalizeVehiculoRow(row as VehiculoRow))
    .filter((vehiculo) => {
      if (!vehiculo.id || ocupados.has(vehiculo.id)) return false;
      return esVehiculoDisponible(vehiculo);
    });
}

export async function fetchSolicitudes(): Promise<SolicitudRow[]> {
  const { data, error } = await db()
    .from("ter_solicitudes")
    .select(
      `
        *,
        solicitante:profiles!solicitante_id(id, nombre, email),
        aprobador:profiles!aprobado_por(id, nombre, email),
        vehiculo:ter_vehiculos!vehiculo_id(id, placa, marca, modelo, color, kilometraje_actual)
      `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as SolicitudRow[];
}

export async function fetchBitacoras(): Promise<BitacoraRow[]> {
  const { data, error } = await db()
    .from("ter_bitacoras")
    .select(
      `
        *,
        ter_vehiculos (placa, marca, modelo),
        profiles:conductor_id (nombre)
      `,
    )
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BitacoraRow[];
}

export async function fetchFallasMantenimiento(): Promise<FallaRow[]> {
  const { data, error } = await db()
    .from("ter_fallas_mantenimiento")
    .select(
      `
      *,
      vehiculo:ter_vehiculos(placa, marca, modelo),
      reportador:profiles!ter_fallas_mantenimiento_reportado_por_fkey(nombre),
      mecanico:profiles!ter_fallas_mantenimiento_mecanico_id_fkey(nombre)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FallaRow[];
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
  const { data, error } = await db()
    .from("ter_solicitudes")
    .select(
      `
        id,
        destino,
        solicitante_id,
        vehiculo_id,
        vehiculo:ter_vehiculos!vehiculo_id (kilometraje_actual)
      `,
    )
    .eq("estado", "EN_MISION");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => row.id && row.vehiculo_id && row.solicitante_id)
    .map((row) => {
      const vehiculoJoin = row.vehiculo;
      const ter_vehiculos = Array.isArray(vehiculoJoin)
        ? (vehiculoJoin[0] ?? null)
        : (vehiculoJoin ?? null);

      return {
        id: row.id as string,
        destino: row.destino as string,
        conductor_id: row.solicitante_id as string,
        vehiculo_id: row.vehiculo_id as string,
        ter_vehiculos: ter_vehiculos as { kilometraje_actual: number } | null,
      };
    });
}
