import { fechaCalendarioGt } from "@/lib/fechas-gt";
import { generarFolio, generarIdAnonimo, generarCodigoPublico, filtrarInstitucionesJa } from "./helpers";
import { leerStore, mutarStore, reiniciarStore } from "./store";
import {
  acuerdoFormSchema,
  incidenteFormSchema,
  proyectoFormSchema,
  procesoFormSchema,
  reporteCiudadanoFormSchema,
  sesionFormSchema,
  type AcuerdoFormValues,
  type ActionResult,
  type ActionResultConCodigo,
  type IncidenteFormValues,
  type JaStoreState,
  type ProcesoFormValues,
  type ProyectoFormValues,
  type ReporteCiudadanoFormValues,
  type SesionFormValues,
} from "./zod";

function nowIso(): string {
  return new Date().toISOString();
}

export async function getJaState(): Promise<JaStoreState> {
  return leerStore();
}

export async function resetJaState(): Promise<ActionResult> {
  try {
    reiniciarStore();
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function createIncidente(values: IncidenteFormValues): Promise<ActionResult> {
  const parsed = incidenteFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      incidentes: [
        {
          ...parsed.data,
          id: crypto.randomUUID(),
          folio: generarFolio(parsed.data.microcuenca, parsed.data.fecha),
          id_anonimo: parsed.data.confidencial ? generarIdAnonimo() : null,
          created_at: nowIso(),
          updated_at: null,
        },
        ...state.incidentes,
      ],
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DB_ERROR" };
  }
}

export async function updateIncidente(
  id: string,
  values: IncidenteFormValues,
): Promise<ActionResult> {
  const parsed = incidenteFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      incidentes: state.incidentes.map((row) => {
        if (row.id !== id) return row;
        const idAnonimo = parsed.data.confidencial
          ? row.id_anonimo ?? generarIdAnonimo()
          : null;
        return {
          ...row,
          ...parsed.data,
          id_anonimo: idAnonimo,
          updated_at: nowIso(),
        };
      }),
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function createSesion(values: SesionFormValues): Promise<ActionResult> {
  const parsed = sesionFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      sesiones: [
        {
          ...parsed.data,
          id: crypto.randomUUID(),
          created_at: nowIso(),
          updated_at: null,
        },
        ...state.sesiones,
      ],
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DB_ERROR" };
  }
}

export async function updateSesionFase(
  id: string,
  fase: SesionFormValues["fase"],
): Promise<ActionResult> {
  try {
    mutarStore((state) => ({
      ...state,
      sesiones: state.sesiones.map((row) =>
        row.id === id ? { ...row, fase, updated_at: nowIso() } : row,
      ),
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function createAcuerdo(values: AcuerdoFormValues): Promise<ActionResult> {
  const parsed = acuerdoFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      acuerdos: [
        {
          ...parsed.data,
          id: crypto.randomUUID(),
          created_at: nowIso(),
          updated_at: null,
        },
        ...state.acuerdos,
      ],
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DB_ERROR" };
  }
}

export async function updateAcuerdo(
  id: string,
  values: AcuerdoFormValues,
): Promise<ActionResult> {
  const parsed = acuerdoFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      acuerdos: state.acuerdos.map((row) =>
        row.id === id ? { ...row, ...parsed.data, updated_at: nowIso() } : row,
      ),
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function updateProyecto(
  id: string,
  values: ProyectoFormValues,
): Promise<ActionResult> {
  const parsed = proyectoFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      proyectos: state.proyectos.map((row) =>
        row.id === id ? { ...row, ...parsed.data, updated_at: nowIso() } : row,
      ),
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function createProceso(values: ProcesoFormValues): Promise<ActionResult> {
  const parsed = procesoFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT" };

  try {
    mutarStore((state) => ({
      ...state,
      procesos: [
        {
          ...parsed.data,
          id: crypto.randomUUID(),
          created_at: nowIso(),
        },
        ...(state.procesos ?? []),
      ],
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "DB_ERROR" };
  }
}

export async function deleteProceso(id: string): Promise<ActionResult> {
  try {
    mutarStore((state) => ({
      ...state,
      procesos: (state.procesos ?? []).filter((row) => row.id !== id),
    }));
    return { success: true, error: null };
  } catch {
    return { success: false, error: "SAVE_FAILED" };
  }
}

export async function createReporteCiudadano(
  values: ReporteCiudadanoFormValues,
): Promise<ActionResultConCodigo> {
  const parsed = reporteCiudadanoFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, error: "INVALID_INPUT", codigo: null };

  const codigo = generarCodigoPublico();
  const data = parsed.data;
  const instituciones = filtrarInstitucionesJa("OMAS", data.municipio);
  const institucion = instituciones[0] ?? filtrarInstitucionesJa("OMAS")[0];
  const descripcion = data.confidencial
    ? `${data.comunidad}. ${data.descripcion}`
    : `${data.comunidad}. ${data.descripcion} Contacto comunitario registrado en canal reservado.`;

  try {
    mutarStore((state) => ({
      ...state,
      incidentes: [
        {
          fecha: fechaCalendarioGt(),
          microcuenca: data.microcuenca,
          municipio: data.municipio,
          criticidad: "alerta_amarilla",
          tipologia: data.tipologia,
          descripcion,
          poblacion: data.poblacion,
          confidencial: data.confidencial,
          derivacion: "OMAS",
          asignado_usuario_id: institucion?.id ?? null,
          asignado_a: institucion?.nombre ?? "OMAS",
          fotos: [],
          id: crypto.randomUUID(),
          folio: codigo,
          id_anonimo: data.confidencial ? codigo : null,
          created_at: nowIso(),
          updated_at: null,
        },
        ...state.incidentes,
      ],
    }));
    return { success: true, error: null, codigo };
  } catch {
    return { success: false, error: "DB_ERROR", codigo: null };
  }
}

export function fechaHoyJa(): string {
  return fechaCalendarioGt();
}
