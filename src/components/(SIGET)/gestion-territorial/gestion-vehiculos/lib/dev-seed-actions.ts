"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

import { CIRCULACION_PATH_MARKER } from "../flota/lib/helpers";
import { isSuperRole } from "./permissions";
import { sincronizarEstadoFlotaVehiculo } from "./sincronizar-estado-vehiculo";
import { GV_BASE_ROUTE } from "./routes";
import { VEHICULOS_STORAGE_BUCKET } from "./storage";

const DEMO_PLACA_MARKER = "SIM";
const DEMO_JUSTIFICACION_MARKER =
  "Registro generado automáticamente para vista previa del módulo.";
const REVALIDATE_ROUTE = GV_BASE_ROUTE;

type DemoVehiculo = {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  kilometraje_actual: number;
  estado: "LIBRE" | "RESERVADO" | "EN_MANTENIMIENTO";
};

const DEMO_VEHICULOS: DemoVehiculo[] = [
  {
    placa: "PD001SIM",
    marca: "Toyota",
    modelo: "Hilux",
    color: "Blanco",
    kilometraje_actual: 8200,
    estado: "LIBRE",
  },
  {
    placa: "PD002SIM",
    marca: "Nissan",
    modelo: "Frontier",
    color: "Gris",
    kilometraje_actual: 15400,
    estado: "LIBRE",
  },
  {
    placa: "PD003SIM",
    marca: "Isuzu",
    modelo: "D-Max",
    color: "Azul",
    kilometraje_actual: 22100,
    estado: "RESERVADO",
  },
  {
    placa: "PD004SIM",
    marca: "Mitsubishi",
    modelo: "L200",
    color: "Negro",
    kilometraje_actual: 9800,
    estado: "LIBRE",
  },
  {
    placa: "PD005SIM",
    marca: "Hyundai",
    modelo: "Starex",
    color: "Plata",
    kilometraje_actual: 31200,
    estado: "LIBRE",
  },
];

function demoImagenes(placa: string): string[] {
  const slug = placa.toLowerCase();
  return [
    `sim/${slug}_unidad.jpg`,
    `sim/${slug}${CIRCULACION_PATH_MARKER}tarjeta.jpg`,
  ];
}

function vencimientoDemo(dias: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dias);
  return `${date.toISOString().slice(0, 10)}T12:00:00.000Z`;
}

function fechaIsoRelativa(dias: number, horas = 8): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dias);
  date.setUTCHours(horas, 0, 0, 0);
  return date.toISOString();
}

async function requireSuperSeedAuth() {
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
    return { ok: false as const, error: "Solo super puede generar datos demo." };
  }

  return { ok: true as const, user, admin: createAdminClient() };
}

export type GvDemoSeedResult = {
  success: boolean;
  error?: string;
  mode?: "seeded" | "cleared";
  created?: {
    vehiculos: number;
    solicitudes: number;
    bitacoras: number;
    fallas: number;
  };
  removed?: {
    vehiculos: number;
    solicitudes: number;
    bitacoras: number;
    fallas: number;
  };
};

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
    const auth = await requireSuperSeedAuth();
    if (!auth.ok) return false;
    return demoVehiculosExist(auth.admin);
  } catch {
    return false;
  }
}

export async function toggleGvDemoData(): Promise<GvDemoSeedResult> {
  try {
    const auth = await requireSuperSeedAuth();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (await demoVehiculosExist(auth.admin)) {
      return clearGvDemoData(auth);
    }

    return seedGvDemoDataInternal(auth);
  } catch {
    return {
      success: false,
      error: "No se pudo alternar los datos demo.",
    };
  }
}

async function clearGvDemoData(
  auth: Extract<
    Awaited<ReturnType<typeof requireSuperSeedAuth>>,
    { ok: true }
  >,
): Promise<GvDemoSeedResult> {
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

  revalidatePath(REVALIDATE_ROUTE);

  return {
    success: true,
    mode: "cleared",
    removed: {
      vehiculos: vehiculosEliminados,
      solicitudes: solicitudesEliminadas,
      bitacoras: bitacorasEliminadas,
      fallas: fallasEliminadas,
    },
  };
}

export async function seedGvDemoData(): Promise<GvDemoSeedResult> {
  try {
    const auth = await requireSuperSeedAuth();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    return seedGvDemoDataInternal(auth);
  } catch {
    return {
      success: false,
      error: "No se pudieron generar los datos demo.",
    };
  }
}

async function seedGvDemoDataInternal(
  auth: Extract<
    Awaited<ReturnType<typeof requireSuperSeedAuth>>,
    { ok: true }
  >,
): Promise<GvDemoSeedResult> {
  try {
    const { user, admin } = auth;

    const vehiculoIds: string[] = [];

    for (const demo of DEMO_VEHICULOS) {
      const { data, error } = await admin
        .from("ot_vehiculos")
        .insert({
          placa: demo.placa,
          marca: demo.marca,
          modelo: demo.modelo,
          color: demo.color,
          anio: new Date().getFullYear() - 3,
          kilometraje_actual: demo.kilometraje_actual,
          estado: demo.estado,
          vencimiento_seguro: vencimientoDemo(120),
          vencimiento_circulacion: vencimientoDemo(180),
          imagen_url: demoImagenes(demo.placa),
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        return {
          success: false,
          error: "No se pudieron crear los vehículos demo.",
        };
      }

      vehiculoIds.push(data.id);
    }

    let solicitudesCreadas = 0;

    const solicitudesDemo = [
      {
        vehiculo_id: vehiculoIds[0],
        destino: "Quetzaltenango · reunión técnica",
        estado: "PENDIENTE" as const,
        inicio: fechaIsoRelativa(2, 9),
        fin: fechaIsoRelativa(2, 18),
      },
      {
        vehiculo_id: vehiculoIds[1],
        destino: "San Marcos · supervisión de campo",
        estado: "APROBADA" as const,
        inicio: fechaIsoRelativa(1, 8),
        fin: fechaIsoRelativa(1, 17),
      },
      {
        vehiculo_id: null,
        destino: "Ciudad de Guatemala · capacitación",
        estado: "RECHAZADA" as const,
        inicio: fechaIsoRelativa(3, 10),
        fin: fechaIsoRelativa(3, 16),
      },
      {
        vehiculo_id: vehiculoIds[3],
        destino: "Huehuetenango · levantamiento",
        estado: "FINALIZADA" as const,
        inicio: fechaIsoRelativa(-5, 7),
        fin: fechaIsoRelativa(-5, 19),
      },
    ];

    const solicitudIds: string[] = [];

    for (const item of solicitudesDemo) {
      const { data, error } = await admin
        .from("ot_solicitudes")
        .insert({
          solicitante_id: user.id,
          vehiculo_id: item.vehiculo_id,
          fecha_inicio: item.inicio,
          fecha_fin_estimada: item.fin,
          destino: item.destino,
          ruta_planificada: "Ruta demo CA-1",
          justificacion: DEMO_JUSTIFICACION_MARKER,
          pasajeros: null,
          estado: item.estado,
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        return {
          success: false,
          error: "No se pudieron crear las solicitudes demo.",
        };
      }

      solicitudIds.push(data.id);
      solicitudesCreadas += 1;
    }

    let bitacorasCreadas = 0;

    const bitacorasDemo = [
      {
        vehiculo_id: vehiculoIds[0],
        solicitud_id: solicitudIds[3] ?? null,
        destino: "Huehuetenango · levantamiento",
        km_inicial: 9400,
        km_final: 9520,
        dias: -4,
      },
      {
        vehiculo_id: vehiculoIds[1],
        solicitud_id: null,
        destino: "Retalhuleu · visita de seguimiento",
        km_inicial: 15000,
        km_final: 15085,
        dias: -2,
      },
      {
        vehiculo_id: vehiculoIds[4],
        solicitud_id: null,
        destino: "Escuintla · entrega de insumos",
        km_inicial: 30800,
        km_final: 30940,
        dias: -1,
      },
    ];

    for (const item of bitacorasDemo) {
      const fecha = fechaIsoRelativa(item.dias, 14);
      const { error } = await admin.from("ot_bitacoras").insert({
        solicitud_id: item.solicitud_id,
        vehiculo_id: item.vehiculo_id,
        conductor_id: user.id,
        destino: item.destino,
        km_inicial: item.km_inicial,
        km_final: item.km_final,
        vale_combustible: "VALE-DEMO",
        monto_combustible: 420,
        comentarios: [
          {
            id: crypto.randomUUID(),
            texto: "Bitácora demo generada automáticamente.",
            fecha,
          },
        ],
        fecha,
      });

      if (error) {
        return {
          success: false,
          error: "No se pudieron crear las bitácoras demo.",
        };
      }

      await admin
        .from("ot_vehiculos")
        .update({ kilometraje_actual: item.km_final })
        .eq("id", item.vehiculo_id);

      bitacorasCreadas += 1;
    }

    let fallasCreadas = 0;

    const fallasDemo = [
      {
        vehiculo_id: vehiculoIds[2],
        severidad: "ALTA" as const,
        descripcion: "Falla demo: sobrecalentamiento intermitente en ruta montañosa.",
        estado: "PENDIENTE" as const,
      },
      {
        vehiculo_id: vehiculoIds[3],
        severidad: "MEDIA" as const,
        descripcion: "Falla demo: desgaste de pastillas delanteras.",
        estado: "EN_REPARACION" as const,
      },
      {
        vehiculo_id: vehiculoIds[4],
        severidad: "BAJA" as const,
        descripcion: "Falla demo: luz de tablero intermitente.",
        estado: "SOLVENTADA" as const,
      },
    ];

    for (const item of fallasDemo) {
      const createdAt = fechaIsoRelativa(-3, 11);
      const solventadoAt =
        item.estado === "SOLVENTADA" ? fechaIsoRelativa(-1, 16) : null;

      const { error } = await admin.from("ot_fallas_mantenimiento").insert({
        vehiculo_id: item.vehiculo_id,
        reportado_por: user.id,
        severidad: item.severidad,
        descripcion: item.descripcion,
        evidencia_url: [],
        estado: item.estado,
        diagnostico:
          item.estado === "SOLVENTADA" ? "Sensor de tablero reemplazado." : null,
        reparacion_detalle:
          item.estado === "SOLVENTADA"
            ? "Se cambió el módulo de advertencia y se verificó el arnés."
            : null,
        taller_externo: item.estado === "EN_REPARACION" ? "Taller demo Trifinio" : null,
        created_at: createdAt,
        solventado_at: solventadoAt,
      });

      if (error) {
        return {
          success: false,
          error: "No se pudieron crear las averías demo.",
        };
      }

      await sincronizarEstadoFlotaVehiculo(admin, item.vehiculo_id);
      fallasCreadas += 1;
    }

    revalidatePath(REVALIDATE_ROUTE);

    return {
      success: true,
      mode: "seeded",
      created: {
        vehiculos: vehiculoIds.length,
        solicitudes: solicitudesCreadas,
        bitacoras: bitacorasCreadas,
        fallas: fallasCreadas,
      },
    };
  } catch {
    return {
      success: false,
      error: "No se pudieron generar los datos demo.",
    };
  }
}
