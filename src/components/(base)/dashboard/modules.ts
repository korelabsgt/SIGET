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
    id: "memoria-labores",
    title: "Memoria de",
    subtitle: "Labores",
    desc: "Formularios institucionales del Plan Trifinio para la memoria de labores semestral.",
    animatedIcon: "wvhscmei",
    href: "/siget/memoria-labores",
    allowedRoles: ["super", "admin", "comunicacion"],
  },
  {
    id: "asistencia-actividades",
    title: "Registro de Asistencia-",
    subtitle: "--de actividades",
    desc: "Actividades con código QR y estadísticas de asistencia.",
    animatedIcon: "unfvchvi",
    href: "/siget/asistencia-actividades",
  },
  {
    id: "perfil",
    title: "Gestión de",
    subtitle: "Mi Perfil",
    desc: "Actualización de credenciales y datos personales del usuario.",
    animatedIcon: "btgcyfug",
    href: "/siget/perfil",
  },
  {
    id: "admin",
    title: "Ajustes",
    subtitle: "Admin",
    desc: "Panel de administración del sistema SIGET.",
    animatedIcon: "plusmrxr",
    href: "/siget/admin",
    requiresAdmin: true,
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
