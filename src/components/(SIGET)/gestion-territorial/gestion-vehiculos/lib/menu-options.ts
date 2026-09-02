import type { GvSubmoduloId } from "./tab-context";

export const GV_MENU_OPTIONS: {
  id: GvSubmoduloId;
  title: string;
  desc: string;
  href: string;
}[] = [
  {
    id: "flota",
    title: "Flota",
    desc: "Control y asignación de la flota vehicular de la institución.",
    href: "/siget/gestion-territorial/gestion-vehiculos/flota",
  },
  {
    id: "solicitudes",
    title: "Solicitudes",
    desc: "Reservas de vehículos para misiones.",
    href: "/siget/gestion-territorial/gestion-vehiculos/solicitudes",
  },
  {
    id: "bitacoras",
    title: "Bitácoras",
    desc: "Registro digital de viajes y métricas operativas.",
    href: "/siget/gestion-territorial/gestion-vehiculos/bitacoras",
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    desc: "Gestión de averías y mantenimiento preventivo.",
    href: "/siget/gestion-territorial/gestion-vehiculos/mantenimiento",
  },
];
