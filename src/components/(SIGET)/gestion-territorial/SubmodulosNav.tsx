"use client";

import { usePathname } from "next/navigation";
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
import type { IconNode } from "lucide";
import { GESTION_VEHICULOS_MENU_OPTIONS } from "@/components/(base)/dashboard/modules";
import { GvMorphIcon } from "./gestion-vehiculos/lib/morph-icon";
import { GvSwitchGroup, GvSwitchItem } from "./gestion-vehiculos/lib/switch-ui";
import {
  useGvSubmoduloTab,
  type GvSubmoduloId,
} from "./gestion-vehiculos/lib/tab-context";

const SUBMODULO_ICON: Record<string, { icon: IconNode; hoverIcon: IconNode }> = {
  flota: { icon: Car, hoverIcon: CarFront },
  solicitudes: { icon: CalendarRange, hoverIcon: CalendarCheck },
  bitacoras: { icon: BookOpen, hoverIcon: BookMarked },
  mantenimiento: { icon: Wrench, hoverIcon: Hammer },
};

export function SubmodulosNav() {
  const pathname = usePathname();
  const gvTab = useGvSubmoduloTab();

  if (!pathname.includes("/gestion-vehiculos")) return null;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-2 px-3 pb-1 sm:px-0">
      <GvSwitchGroup layoutId="gv-submodulos-nav">
        {GESTION_VEHICULOS_MENU_OPTIONS.map((opt) => {
          const isActive = gvTab
            ? gvTab.tab === opt.id
            : pathname.startsWith(opt.href);
          const icons = SUBMODULO_ICON[opt.id];

          return (
            <GvSwitchItem
              key={opt.id}
              active={isActive}
              onClick={() => {
                gvTab?.selectTab(opt.id as GvSubmoduloId);
              }}
            >
              {icons ? (
                <GvMorphIcon icon={icons.icon} hoverIcon={icons.hoverIcon} size={16} />
              ) : null}
              {opt.title}
            </GvSwitchItem>
          );
        })}
      </GvSwitchGroup>
    </div>
  );
}
