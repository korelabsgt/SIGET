import type { IconNode } from "lucide";
import {
  BookMarked,
  BookOpen,
  CalendarCheck,
  CalendarRange,
  Car,
  CarFront,
  Hammer,
  Wrench,
} from "lucide";
import type { GvSubmoduloId } from "./tab-context";

export const GV_MENU_OPTIONS: {
  id: GvSubmoduloId;
  title: string;
  desc: string;
  icon: IconNode;
  hoverIcon: IconNode;
}[] = [
  {
    id: "flota",
    title: "Flota",
    desc: "Control y asignación de la flota vehicular de la institución.",
    icon: Car,
    hoverIcon: CarFront,
  },
  {
    id: "solicitudes",
    title: "Solicitudes",
    desc: "Reservas de vehículos para misiones.",
    icon: CalendarRange,
    hoverIcon: CalendarCheck,
  },
  {
    id: "bitacoras",
    title: "Bitácoras",
    desc: "Registro digital de viajes y métricas operativas.",
    icon: BookOpen,
    hoverIcon: BookMarked,
  },
  {
    id: "mantenimiento",
    title: "Mantenimiento",
    desc: "Gestión de averías y mantenimiento preventivo.",
    icon: Wrench,
    hoverIcon: Hammer,
  },
];
