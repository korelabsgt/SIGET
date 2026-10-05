import type { GvSubmoduloId } from "./tab-context";

export const GV_SECTION_QUERY_KEY = "seccion";

const GV_SECTION_IDS: GvSubmoduloId[] = [
  "solicitudes",
  "bitacoras",
  "flota",
  "mantenimiento",
];

export function parseGvSectionParam(value: string | null | undefined): GvSubmoduloId | null {
  if (!value) return null;
  return GV_SECTION_IDS.includes(value as GvSubmoduloId) ? (value as GvSubmoduloId) : null;
}

export function gvSectionFromSearchParams(params: URLSearchParams): GvSubmoduloId {
  return parseGvSectionParam(params.get(GV_SECTION_QUERY_KEY)) ?? "solicitudes";
}

export function buildGvSectionHref(
  pathname: string,
  section: GvSubmoduloId,
  currentParams?: URLSearchParams,
): string {
  const params = new URLSearchParams(currentParams?.toString() ?? "");
  if (section === "solicitudes") {
    params.delete(GV_SECTION_QUERY_KEY);
  } else {
    params.set(GV_SECTION_QUERY_KEY, section);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
