import {
  normalizarFechaCalendario,
  normalizarMesCalendario,
  timestamptzToMesCalendario,
} from "@/lib/fechas-gt";
import {
  CRITICIDAD_META,
  ESTADO_ACUERDO_LABEL,
  FASE_DIALOGO_LABEL,
  MICROCUENCA_MUNICIPIO,
  INSTITUCIONES_ASIGNABLES_JA,
  type Criticidad,
  type DerivacionInstitucional,
  type EstadoAcuerdo,
  type FaseDialogo,
  type InstitucionAsignableJa,
  type Microcuenca,
  type Municipio,
} from "./catalogos";
import type { IncidenteFormValues, IncidenteRecord, JaStoreState } from "./zod";

export function generarFolio(microcuenca: Microcuenca, fecha: string): string {
  const codigo = microcuenca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const stamp = fecha.replace(/-/g, "");
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JA-${codigo}-${stamp}-${sufijo}`;
}

export function generarIdAnonimo(): string {
  const sufijo = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `JA-CONF-${sufijo}`;
}

export function generarCodigoPublico(fecha = new Date()): string {
  const anio = fecha.getFullYear();
  const n = String(Math.floor(80 + Math.random() * 820)).padStart(3, "0");
  return `JA-${anio}-${n}`;
}

export function emptyIncidenteForm(
  fecha: string,
  microcuenca: Microcuenca = "Muyurco",
): IncidenteFormValues {
  return {
    fecha,
    microcuenca,
    municipio: MICROCUENCA_MUNICIPIO[microcuenca],
    criticidad: "alerta_verde",
    tipologia: "Déficit por canículas prolongadas",
    descripcion: "",
    poblacion: {
      hombres: 0,
      mujeres: 0,
      juventudes: 0,
      pueblo_maya_chorti: 0,
    },
    confidencial: false,
    derivacion: "OMAS",
    asignado_usuario_id: "",
    asignado_a: "",
    fotos: [],
  };
}

export function totalPoblacion(incidente: IncidenteRecord): number {
  const p = incidente.poblacion;
  return p.hombres + p.mujeres + p.juventudes + p.pueblo_maya_chorti;
}

export function etiquetaCriticidad(criticidad: Criticidad): string {
  return CRITICIDAD_META[criticidad].label;
}

export function etiquetaFase(fase: FaseDialogo): string {
  return FASE_DIALOGO_LABEL[fase];
}

export function etiquetaAcuerdo(estado: EstadoAcuerdo): string {
  return ESTADO_ACUERDO_LABEL[estado];
}

export function municipioDeMicrocuenca(microcuenca: Microcuenca): Municipio {
  return MICROCUENCA_MUNICIPIO[microcuenca];
}

export function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

export function registroEnMesCalendario(fecha: string, mes: string): boolean {
  const fechaNorm = normalizarFechaCalendario(fecha);
  const mesNorm = normalizarMesCalendario(mes);
  if (fechaNorm && mesNorm) return fechaNorm.startsWith(mesNorm);
  return timestamptzToMesCalendario(fecha) === mesNorm;
}

export function enRangoFecha(fecha: string, desde: string, hasta: string): boolean {
  const mes = normalizarMesCalendario(fecha);
  if (!mes) return !desde && !hasta;
  const desdeMes = normalizarMesCalendario(desde);
  const hastaMes = normalizarMesCalendario(hasta);
  if (desdeMes && mes < desdeMes) return false;
  if (hastaMes && mes > hastaMes) return false;
  return true;
}

export function filtrarEstadoObservatorio(
  state: JaStoreState,
  micro: Microcuenca | "todas",
  desde: string,
  hasta: string,
): JaStoreState {
  const microOk = (valor: Microcuenca | null | undefined) =>
    micro === "todas" || valor === micro || valor == null;

  const incidentes = state.incidentes.filter(
    (row) => microOk(row.microcuenca) && enRangoFecha(row.fecha, desde, hasta),
  );
  const sesiones = state.sesiones.filter(
    (row) => microOk(row.microcuenca) && enRangoFecha(row.fecha, desde, hasta),
  );
  const acuerdos = state.acuerdos.filter((row) => {
    const incidente = state.incidentes.find((item) => item.id === row.incidente_id);
    const territorio = incidente ? microOk(incidente.microcuenca) : micro === "todas";
    return territorio && enRangoFecha(row.fecha_limite, desde, hasta);
  });
  const proyectos = state.proyectos.filter(
    (row) => microOk(row.microcuenca) && enRangoFecha(row.created_at, desde, hasta),
  );
  const procesos = (state.procesos ?? []).filter(
    (row) => microOk(row.microcuenca) && enRangoFecha(row.fecha, desde, hasta),
  );
  const evidencias = state.evidencias.filter((row) => enRangoFecha(row.fecha, desde, hasta));
  const metodologias = state.metodologias.filter((row) => microOk(row.microcuenca));
  const municipio = micro === "todas" ? null : MICROCUENCA_MUNICIPIO[micro];
  const organizaciones = state.organizaciones.filter(
    (row) => !municipio || row.municipio === municipio,
  );

  return {
    incidentes,
    sesiones,
    acuerdos,
    proyectos,
    metodologias,
    organizaciones,
    evidencias,
    procesos,
  };
}

export function formatoQ(valor: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function filtroTexto(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

function normalizarBusquedaJa(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function institucionAsignablePorId(
  id: string,
): InstitucionAsignableJa | undefined {
  return INSTITUCIONES_ASIGNABLES_JA.find((institucion) => institucion.id === id);
}

export function buscarInstitucionesJa(
  query: string,
  actor?: DerivacionInstitucional,
): InstitucionAsignableJa[] {
  const q = normalizarBusquedaJa(query);
  if (q.length < 3) return [];

  return filtrarInstitucionesJa(actor, query);
}

export function filtrarInstitucionesJa(
  actor: DerivacionInstitucional | undefined,
  query = "",
): InstitucionAsignableJa[] {
  const q = normalizarBusquedaJa(query);

  return INSTITUCIONES_ASIGNABLES_JA.filter((institucion) => {
    if (actor && institucion.actor !== actor) return false;
    if (!q) return true;
    const texto = normalizarBusquedaJa(
      `${institucion.nombre} ${institucion.municipio}`,
    );
    return texto.includes(q);
  });
}
