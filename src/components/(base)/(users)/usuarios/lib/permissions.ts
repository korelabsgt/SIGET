export const ROLE_LABELS: Record<string, string> = {
  user: "Usuario (Estándar)",
  observatorio: "Observatorio",
  "admin-observatorio": "Admin Observatorio",
  comunicacion: "Comunicación",
  admin: "Administrador",
  super: "Super Admin",
};

export const ROLE_ORDER = [
  "super",
  "admin",
  "admin-observatorio",
  "observatorio",
  "comunicacion",
  "user",
] as const;

const ALL_KNOWN_ROLES = [...ROLE_ORDER];
const USER_SORT_KEY = ROLE_ORDER.length;

function getCustomRoleAnchorIndex(role: string): number | null {
  const normalized = role.toLowerCase();
  const matchableKnown = [...ROLE_ORDER]
    .filter((known) => known !== "super" && known !== "user")
    .sort((a, b) => b.length - a.length);

  for (const known of matchableKnown) {
    if (
      normalized === known ||
      normalized.startsWith(`${known}-`) ||
      normalized.endsWith(`-${known}`) ||
      normalized.includes(`-${known}-`) ||
      normalized.startsWith(known)
    ) {
      return ROLE_ORDER.indexOf(known);
    }
  }

  return null;
}

function getRoleSortKey(role: string): number {
  if (role === "user") return USER_SORT_KEY;

  const knownIndex = ROLE_ORDER.indexOf(role as (typeof ROLE_ORDER)[number]);
  if (knownIndex >= 0) return knownIndex;

  const anchor = getCustomRoleAnchorIndex(role);
  if (anchor !== null) return anchor + 0.001;

  return USER_SORT_KEY - 0.001;
}

/** Roles que contienen "observatorio" en su slug */
export function isObservatorioRole(role: string | null | undefined): boolean {
  return (role || "").includes("observatorio");
}

/** Roles que el actor puede ver y gestionar en usuarios */
const KNOWN_ROLE_SET = new Set<string>(ALL_KNOWN_ROLES);

export function getManageableRoles(actorRole: string, customRoles: string[] = []): string[] {
  if (actorRole === "super") {
    const extras = customRoles.filter((r) => !KNOWN_ROLE_SET.has(r));
    return orderRoles([...ALL_KNOWN_ROLES, ...extras]);
  }
  if (actorRole === "admin") {
    return orderRoles(ALL_KNOWN_ROLES.filter((r) => r !== "super"));
  }
  if (actorRole === "admin-observatorio") {
    return orderRoles(ALL_KNOWN_ROLES.filter((r) => isObservatorioRole(r)));
  }
  return [];
}

export function isKnownRole(role: string): boolean {
  return KNOWN_ROLE_SET.has(role);
}

export function canManageUsers(actorRole: string): boolean {
  return getManageableRoles(actorRole).length > 0;
}

export function canCreateUsers(actorRole: string): boolean {
  return canManageUsers(actorRole);
}

export function canAssignRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === "super") return true;
  return getManageableRoles(actorRole).includes(targetRole);
}

export function isUserVisibleToActor(
  targetRole: string | null | undefined,
  actorRole: string,
): boolean {
  if (actorRole === "super") return true;
  const role = targetRole || "user";
  return getManageableRoles(actorRole).includes(role);
}

export function orderRoles(roles: string[]): string[] {
  const uniqueRoles = Array.from(new Set(roles));
  return uniqueRoles.sort((a, b) => {
    if (a === "user") return 1;
    if (b === "user") return -1;

    const keyDiff = getRoleSortKey(a) - getRoleSortKey(b);
    if (keyDiff !== 0) return keyDiff;
    return a.localeCompare(b, "es", { sensitivity: "base" });
  });
}

export function getSimulatableRoles(customRoles: string[] = []): string[] {
  return orderRoles(
    getManageableRoles("super", customRoles).filter((role) => role !== "super"),
  );
}

export function formatSimulatedRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role.replace(/-/g, " ");
}
