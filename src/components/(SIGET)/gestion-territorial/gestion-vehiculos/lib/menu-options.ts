import { GESTION_TERRITORIAL_MENU_OPTIONS } from "@/components/(base)/dashboard/modules";
import type { GvSubmoduloId } from "./tab-context";

const GV_SUBMODULO_IDS: GvSubmoduloId[] = [
  "flota",
  "solicitudes",
  "bitacoras",
  "mantenimiento",
];

export const GV_MENU_OPTIONS = GESTION_TERRITORIAL_MENU_OPTIONS.filter((opt) =>
  GV_SUBMODULO_IDS.includes(opt.id as GvSubmoduloId),
);
