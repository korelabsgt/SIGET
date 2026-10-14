import type { GvSectionId } from "./permissions";
import { defaultGvSectionForRole, isGvSectionAllowedForRole } from "./permissions";
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

export function gvSectionFromSearchParams(
  params: URLSearchParams,
  role?: string | null,
): GvSubmoduloId {
  const fallback = role ? defaultGvSectionForRole(role) : "solicitudes";
  const parsed = parseGvSectionParam(params.get(GV_SECTION_QUERY_KEY));
  if (!parsed) return fallback;
  if (role && !isGvSectionAllowedForRole(role, parsed as GvSectionId)) return fallback;
  return parsed;
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
