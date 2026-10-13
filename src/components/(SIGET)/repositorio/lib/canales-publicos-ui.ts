import type { IconNode } from "lucide";
import {
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  Library,
  Microscope,
  Newspaper,
  Send,
} from "lucide";
import type { PublicCanalSlug } from "./zod";

const AZUL_TRIFINIO = "#2c5f9b";

export type PublicCanalUi = {
  slug: PublicCanalSlug;
  label: string;
  descripcionCatalogo: string;
  href: string;
  iconFrom: IconNode;
  iconTo: IconNode;
  iconColor: string;
  iconBg: string;
};

export const PUBLIC_CANAL_CATALOGO_COPY: Record<PublicCanalSlug, string> = {
  noticias: "Notas y comunicados públicos de Plan Trifinio.",
  documentos:
    "Informes, estudios, guías e infografías aprobados para consulta y descarga pública.",
  educativo:
    "Manuales, guías y recursos educativos abiertos del Plan Trifinio.",
  cientifico:
    "Estudios, artículos e informes técnicos y científicos de la región Trifinio.",
};

export const PUBLIC_CANAL_HOME_TITLES: Record<PublicCanalSlug, string> = {
  noticias: "Noticiero Trinacional",
  educativo: "Cursos y Aprendizaje",
  cientifico: "Artículos Científicos",
  documentos: "Repositorio de Documentos",
};

export const PUBLIC_CANAL_NAV_ORDER: PublicCanalSlug[] = [
  "noticias",
  "educativo",
  "cientifico",
  "documentos",
];

export const PUBLIC_CANALES_UI: PublicCanalUi[] = [
  {
    slug: "noticias",
    label: "Noticias",
    descripcionCatalogo: PUBLIC_CANAL_CATALOGO_COPY.noticias,
    href: "/conocimiento/noticias",
    iconFrom: Newspaper,
    iconTo: Send,
    iconColor: "#fb923c",
    iconBg: "bg-orange-50 dark:bg-orange-400/10",
  },
  {
    slug: "documentos",
    label: "Documentos",
    descripcionCatalogo: PUBLIC_CANAL_CATALOGO_COPY.documentos,
    href: "/conocimiento/documentos",
    iconFrom: FileText,
    iconTo: Library,
    iconColor: AZUL_TRIFINIO,
    iconBg: "bg-sky-50 dark:bg-sky-950/50",
  },
  {
    slug: "educativo",
    label: "Educación",
    descripcionCatalogo: PUBLIC_CANAL_CATALOGO_COPY.educativo,
    href: "/conocimiento/educativo",
    iconFrom: GraduationCap,
    iconTo: BookOpen,
    iconColor: "#1a95d3",
    iconBg: "bg-sky-50 dark:bg-sky-950/50",
  },
  {
    slug: "cientifico",
    label: "Ciencia",
    descripcionCatalogo: PUBLIC_CANAL_CATALOGO_COPY.cientifico,
    href: "/conocimiento/cientifico",
    iconFrom: FlaskConical,
    iconTo: Microscope,
    iconColor: "#6366f1",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
  },
];

export function publicCanalUi(slug: PublicCanalSlug): PublicCanalUi {
  const found = PUBLIC_CANALES_UI.find((c) => c.slug === slug);
  if (!found) throw new Error(`Canal público desconocido: ${slug}`);
  return found;
}
