import {
  MEMORIA_MAX_IMAGENES,
  normalizeImagenStoragePath,
} from "@/components/(base)/imgs/constants";
import type {
  Beneficiarios,
  FiltroPeriodoMemoria,
  ProyectoAvance,
  ProyectoItem,
  ProyectosMemoria,
  ProyectosMemoriaInput,
} from "./zod";

export const MAX_IMAGENES_PROYECTO = MEMORIA_MAX_IMAGENES;

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export function emptyBeneficiarios(): Beneficiarios {
  return {
    directos: { hombres: 0, mujeres: 0, jovenes: 0 },
    indirectos: { hombres: 0, mujeres: 0, jovenes: 0 },
  };
}

export function emptyProyectoAvance(): ProyectoAvance {
  return {
    descripcion: "",
    logrado: 0,
    meta: 0,
  };
}

export function emptyProyectoItem(): ProyectoItem {
  return {
    nombre: "",
    mes: currentMonth(),
    descripcion: "",
    beneficiarios: emptyBeneficiarios(),
    avances: [emptyProyectoAvance()],
    resultados: [""],
    efectos: [""],
  };
}

function normalizeBeneficiariosFromDb(raw: unknown): Beneficiarios {
  if (!raw || typeof raw !== "object") return emptyBeneficiarios();
  const b = raw as Partial<Beneficiarios>;
  const grupo = (g: Partial<Beneficiarios["directos"]> | undefined) => ({
    hombres:
      typeof g?.hombres === "number" && Number.isFinite(g.hombres)
        ? Math.max(0, g.hombres)
        : 0,
    mujeres:
      typeof g?.mujeres === "number" && Number.isFinite(g.mujeres)
        ? Math.max(0, g.mujeres)
        : 0,
    jovenes:
      typeof g?.jovenes === "number" && Number.isFinite(g.jovenes)
        ? Math.max(0, g.jovenes)
        : 0,
  });
  return {
    directos: grupo(b.directos),
    indirectos: grupo(b.indirectos),
  };
}

export function sumBeneficiariosProyectos(
  proyectos: ProyectoItem[],
): Beneficiarios {
  const total = emptyBeneficiarios();
  for (const p of proyectos) {
    for (const grupo of ["directos", "indirectos"] as const) {
      for (const campo of ["hombres", "mujeres", "jovenes"] as const) {
        total[grupo][campo] += p.beneficiarios[grupo][campo];
      }
    }
  }
  return total;
}

function normalizeAvancesFromDb(avances: unknown): ProyectoAvance[] {
  if (typeof avances === "string" && avances.trim()) {
    return [{ descripcion: avances.trim(), logrado: 0, meta: 0 }];
  }
  if (!Array.isArray(avances) || avances.length === 0) {
    return [emptyProyectoAvance()];
  }
  return avances.map((raw) => {
    const a = raw as Partial<ProyectoAvance>;
    const logrado =
      typeof a.logrado === "number" && Number.isFinite(a.logrado)
        ? Math.max(0, a.logrado)
        : 0;
    const meta =
      typeof a.meta === "number" && Number.isFinite(a.meta) && a.meta >= 0
        ? Math.max(0, a.meta)
        : 0;
    return {
      descripcion: a.descripcion ?? "",
      logrado,
      meta,
    };
  });
}

export function normalizeProyectosFromDb(
  proyectos: unknown,
  legacyBeneficiarios?: Beneficiarios,
): ProyectoItem[] {
  if (!Array.isArray(proyectos) || proyectos.length === 0) {
    const item = emptyProyectoItem();
    if (legacyBeneficiarios) {
      item.beneficiarios = normalizeBeneficiariosFromDb(legacyBeneficiarios);
    }
    return [item];
  }

  return proyectos.map((raw, index) => {
    const p = raw as Partial<ProyectoItem> & { avances?: unknown };
    const beneficiarios =
      p.beneficiarios !== undefined
        ? normalizeBeneficiariosFromDb(p.beneficiarios)
        : index === 0 && legacyBeneficiarios
          ? normalizeBeneficiariosFromDb(legacyBeneficiarios)
          : emptyBeneficiarios();
    return {
      nombre: p.nombre ?? "",
      mes: p.mes || currentMonth(),
      descripcion: p.descripcion ?? "",
      beneficiarios,
      avances: normalizeAvancesFromDb(p.avances),
      resultados: p.resultados?.length ? p.resultados : [""],
      efectos: p.efectos?.length ? p.efectos : [""],
    };
  });
}

export function normalizeImagenesFromDb(
  imagenes: unknown,
  proyectosLength: number,
): string[][] {
  const source = Array.isArray(imagenes) ? imagenes : [];
  const result: string[][] = [];
  for (let i = 0; i < proyectosLength; i += 1) {
    const grupo = source[i];
    const paths = Array.isArray(grupo)
      ? grupo
          .map((p) =>
            typeof p === "string" ? normalizeImagenStoragePath(p) : null,
          )
          .filter((p): p is string => !!p)
          .slice(0, MAX_IMAGENES_PROYECTO)
      : [];
    result.push(paths);
  }
  return result;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodoToInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 7) : currentMonth();
}

export function periodoToISO(mes: string): string {
  return new Date(`${mes}-01T00:00:00Z`).toISOString();
}

export function formatPeriodo(value: string | null | undefined): string {
  if (!value) return "—";
  const [anio, mes] = value.slice(0, 7).split("-");
  return `${MESES[Number(mes) - 1] ?? ""} ${anio}`.trim();
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export function formatReporteRealizadoParts(
  value: string | null | undefined,
) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const dia = DIAS_CORTOS[d.getDay()] ?? "";
  const fecha = [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getFullYear()).slice(-2),
  ].join("/");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) hours = 12;
  const hora = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

  return { dia, fecha, hora };
}

export function formatInformeFechaLinea(parts: {
  dia: string;
  fecha: string;
  hora: string;
}): string {
  return `${parts.dia} ${parts.fecha} a las ${parts.hora}`;
}

export function formatReporteRealizadoText(
  value: string | null | undefined,
): string {
  const parts = formatReporteRealizadoParts(value);
  if (!parts) return "—";
  return `Realizado: ${formatInformeFechaLinea(parts)}`;
}

export function formatUltimaActualizacionParts(
  value: string | null | undefined,
) {
  return formatReporteRealizadoParts(value);
}

export function formatUltimaActualizacionText(
  updatedAt: string | null | undefined,
  createdAt?: string | null,
): string | null {
  if (!updatedAt) return null;
  if (createdAt && updatedAt === createdAt) return null;

  const updatedMs = new Date(updatedAt).getTime();
  const createdMs = createdAt ? new Date(createdAt).getTime() : NaN;
  if (
    Number.isFinite(createdMs) &&
    Number.isFinite(updatedMs) &&
    Math.abs(updatedMs - createdMs) < 1000
  ) {
    return null;
  }

  const parts = formatReporteRealizadoParts(updatedAt);
  if (!parts) return null;
  return `Última actualización: ${formatInformeFechaLinea(parts)}`;
}

export function formatCreatedAt(value: string | null | undefined): string {
  return formatReporteRealizadoText(value);
}

export function mesesInforme(memoria: ProyectosMemoria): string[] {
  const meses = memoria.proyectos.map((p) => p.mes).filter(Boolean).sort();
  if (meses.length > 0) return meses;
  if (memoria.periodo) return [memoria.periodo.slice(0, 7)];
  return [];
}

export function mesOrdenInforme(memoria: ProyectosMemoria): string {
  const meses = mesesInforme(memoria);
  return meses[meses.length - 1] ?? currentMonth();
}

export function sortMemoriasPorMes(
  memorias: ProyectosMemoria[],
): ProyectosMemoria[] {
  return sortMemoriasPorMesDir(memorias, true);
}

export function sortMemoriasPorMesDir(
  memorias: ProyectosMemoria[],
  desc: boolean,
): ProyectosMemoria[] {
  return [...memorias].sort((a, b) => {
    const cmp = mesOrdenInforme(a).localeCompare(mesOrdenInforme(b));
    return desc ? -cmp : cmp;
  });
}

export function filtroPeriodoActual(): FiltroPeriodoMemoria {
  const d = new Date();
  return { anio: d.getFullYear(), mes: null };
}

export function formatFiltroPeriodoLabel(filtro: FiltroPeriodoMemoria): string {
  if (filtro.mes === null) return `Año ${filtro.anio}`;
  const ym = `${filtro.anio}-${String(filtro.mes).padStart(2, "0")}`;
  return formatPeriodo(ym);
}

export function memoriaCoincidePeriodo(
  memoria: ProyectosMemoria,
  filtro: FiltroPeriodoMemoria,
): boolean {
  const meses = mesesInforme(memoria);
  const candidatos =
    meses.length > 0
      ? meses
      : memoria.periodo
        ? [memoria.periodo.slice(0, 7)]
        : [];
  return candidatos.some((ym) => {
    const [anioStr, mesStr] = ym.split("-");
    const anio = Number(anioStr);
    const mes = Number(mesStr);
    if (anio !== filtro.anio) return false;
    if (filtro.mes === null) return true;
    return mes === filtro.mes;
  });
}

export function avanzarFiltroPeriodo(
  filtro: FiltroPeriodoMemoria,
  delta: -1 | 1,
): FiltroPeriodoMemoria {
  if (filtro.mes === null) {
    return { anio: filtro.anio + delta, mes: null };
  }
  let mes = filtro.mes + delta;
  let anio = filtro.anio;
  if (mes < 1) {
    mes = 12;
    anio -= 1;
  } else if (mes > 12) {
    mes = 1;
    anio += 1;
  }
  return { anio, mes };
}

export function formatoOrdinalCortoEs(n: number): string {
  if (!Number.isFinite(n) || n < 1) return String(n);
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${n}vo`;
  switch (n % 10) {
    case 1:
      return `${n}er`;
    case 2:
      return `${n}do`;
    case 3:
      return `${n}er`;
    case 4:
    case 5:
    case 6:
      return `${n}to`;
    case 7:
      return `${n}mo`;
    case 8:
      return `${n}vo`;
    case 9:
      return `${n}no`;
    default:
      return `${n}vo`;
  }
}

export function formatMemoriaPeriodo(memoria: ProyectosMemoria): string {
  const meses = mesesInforme(memoria);
  if (meses.length === 0) return formatPeriodo(memoria.periodo);
  if (meses.length === 1) return formatPeriodo(meses[0]);
  return `${formatPeriodo(meses[0])} – ${formatPeriodo(meses[meses.length - 1])}`;
}

export function periodoFromProyectos(proyectos: ProyectoItem[]): string {
  const meses = proyectos.map((p) => p.mes).filter(Boolean).sort();
  return periodoToISO(meses[0] ?? currentMonth());
}

export function emptyProyectoMemoria(): ProyectosMemoriaInput {
  return {
    proyectos: [emptyProyectoItem()],
    imagenes: [[]],
  };
}

export function rellenoPruebaMemoriaLabores(
  base: ProyectosMemoriaInput,
): ProyectosMemoriaInput {
  return {
    proyectos: [
      {
        nombre: "Fortalecimiento comunitario en la frontera",
        mes: currentMonth(),
        descripcion:
          "Actividades de capacitación y acompañamiento técnico a comunidades del área trifinio durante el período reportado.",
        avances: [
          {
            descripcion: "Talleres de capacitación realizados",
            logrado: 7,
            meta: 10,
          },
          {
            descripcion: "Familias beneficiadas con kits productivos",
            logrado: 45,
            meta: 60,
          },
          {
            descripcion: "Instituciones locales fortalecidas",
            logrado: 3,
            meta: 5,
          },
        ],
        resultados: [
          "Se capacitaron 120 personas en gestión comunitaria.",
          "Se entregaron insumos a 45 familias productoras.",
          "Se formalizaron acuerdos de cooperación con tres municipios.",
        ],
        efectos: [
          "Mayor participación de jóvenes en actividades locales.",
          "Réplica de prácticas aprendidas en dos comunidades vecinas.",
          "Fortalecimiento de redes comunitarias de apoyo mutuo.",
        ],
        beneficiarios: {
          directos: { hombres: 55, mujeres: 65, jovenes: 30 },
          indirectos: { hombres: 120, mujeres: 140, jovenes: 45 },
        },
      },
    ],
    imagenes: [[]],
  };
}
