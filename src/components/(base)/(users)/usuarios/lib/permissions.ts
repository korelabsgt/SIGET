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

/** Roles que contienen "observatorio" en su slug */
export function isObservatorioRole(role: string | null | undefined): boolean {
  return (role || "").includes("observatorio");
}

/** Roles que el actor puede ver y gestionar en usuarios */
const KNOWN_ROLE_SET = new Set<string>(ALL_KNOWN_ROLES);

export function getManageableRoles(actorRole: string, customRoles: string[] = []): string[] {
  if (actorRole === "super") {
    const extras = customRoles.filter((r) => !KNOWN_ROLE_SET.has(r));
    return [...ALL_KNOWN_ROLES, ...extras];
  }
  if (actorRole === "admin") return ALL_KNOWN_ROLES.filter((r) => r !== "super");
  if (actorRole === "admin-observatorio") {
    return ALL_KNOWN_ROLES.filter((r) => isObservatorioRole(r));
  }
  return [];
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
  const set = new Set(roles);
  const ordered = ROLE_ORDER.filter((r) => set.has(r));
  const extras = roles.filter((r) => !KNOWN_ROLE_SET.has(r));
  return [...ordered, ...extras];
}
