import { canManageUsers } from "@/components/(base)/(users)/usuarios/lib/permissions";

export type DashboardModule = {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  animatedIcon: string;
  href: string;
  requiresAdmin?: boolean;
  allowedRoles?: string[];
};

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "observatorio",
    title: "Observatorio",
    subtitle: "Web",
    desc: "Plataforma web de visualización de datos regionales.",
    animatedIcon: "qqvpjphn",
    href: "/siget/observatorio",
    allowedRoles: ["super", "admin", "observatorio"],
  },

  {
    id: "gestion-territorial",
    title: "Gestión",
    subtitle: "Territorial",
    desc: "Módulo de Gestión Territorial.",
    animatedIcon: "giblkgwf",
    href: "/siget/gestion-territorial",
    allowedRoles: ["super", "admin"],
  },

];

export const OBSERVATORIO_MENU_OPTIONS = [
  {
    id: "movilidad-humana",
    title: "Movilidad Humana",
    desc: "Visualización de datos y estadísticas regionales del SIGET.",
    href: "/siget/observatorio",
    animatedIcon: "qqvpjphn",
  },
] as const;

export const GESTION_TERRITORIAL_MENU_OPTIONS = [
  {
    id: "memoria-labores",
    title: "Memoria de Labores",
    desc: "Formularios institucionales del Plan Trifinio para la memoria de labores semestral.",
    href: "/siget/gestion-territorial/memoria-labores",
    animatedIcon: "wvhscmei",
  },
  {
    id: "asistencia-actividades",
    title: "Registro de Asistencia",
    desc: "Actividades con código QR y estadísticas de asistencia.",
    href: "/siget/gestion-territorial/asistencia-actividades",
    animatedIcon: "unfvchvi",
  },
  {
    id: "flota",
    title: "Flota",
    desc: "Control y asignación de la flota vehicular de la institución.",
    href: "/siget/gestion-territorial/gestion-vehiculos/flota",
    animatedIcon: "cdxxgczv",
  },
  {
    id: "solicitudes",
    title: "Solicitudes",
    desc: "Reservas de vehículos para misiones.",
    href: "/siget/gestion-territorial/gestion-vehiculos/solicitudes",
    animatedIcon: "abwrkdvl",
  },
  {
    id: "bitacoras",
    title: "Bitácoras",
    desc: "Registro digital de viajes y métricas operativas.",
    href: "/siget/gestion-territorial/gestion-vehiculos/bitacoras",
    animatedIcon: "wyqtxzlg", // Or any other suitable icon if known, using a placeholder for now
  },
] as const;

export const PERFIL_MENU_OPTIONS = [
  {
    id: "mi-perfil",
    title: "Mi Perfil",
    desc: "Ver y editar perfil",
    animatedIcon: "btgcyfug",
  },
  {
    id: "ingreso-seguro",
    title: "Ingreso Seguro",
    desc: "Administrar dispositivos",
    animatedIcons: ["vxfekxur", "ilgzgiqi"] as const,
  },
] as const;

export function getPerfilMenuOptions(enablePasskeys: boolean) {
  return PERFIL_MENU_OPTIONS.filter(
    (option) => option.id !== "ingreso-seguro" || enablePasskeys,
  );
}

export const ADMIN_MENU_OPTIONS = [
  {
    id: "organizacion-administrativa",
    title: "Organización Administrativa",
    desc: "Estructura jerárquica institucional.",
    href: "/siget/admin/organizacion-administrativa",
    animatedIcon: "giblkgwf",
  },
  {
    id: "dispositivos",
    title: "Dispositivos",
    desc: "Autorizar o rechazar acceso por dispositivo.",
    href: "/siget/admin/dispositivos",
    animatedIcon: "gzqipvbr",
  },
  {
    id: "usuarios",
    title: "Usuarios",
    desc: "Cuentas, roles y permisos.",
    href: "/siget/admin/usuarios",
    animatedIcon: "vxfekxur",
  },
  {
    id: "configuraciones",
    title: "Configuraciones",
    desc: "Ajustes generales y seguridad.",
    href: "/siget/admin/configuraciones",
    animatedIcon: "plusmrxr",
  },
] as const;

export function isSuperOrAdminRole(role: string): boolean {
  return role === "super" || role === "admin";
}

export function getVisibleAdminOptions<T extends { id: string }>(
  options: readonly T[],
  role: string,
): T[] {
  if (isSuperOrAdminRole(role)) return [...options];
  return options.filter((opt) => opt.id === "usuarios");
}

export function getVisibleDashboardModules(effectiveRole: string) {
  const isSuperOrAdmin = isSuperOrAdminRole(effectiveRole);
  return DASHBOARD_MODULES.filter((mod) => {
    if (mod.id === "admin") {
      return canManageUsers(effectiveRole);
    }
    if (mod.requiresAdmin && !isSuperOrAdmin) return false;
    if (mod.allowedRoles) {
      const isAllowed =
        mod.allowedRoles.includes(effectiveRole) ||
        (mod.allowedRoles.includes("observatorio") &&
          effectiveRole.includes("observatorio"));
      if (!isAllowed) return false;
    }
    return true;
  });
}
