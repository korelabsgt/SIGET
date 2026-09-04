"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import {
  GvSectionProvider,
  GV_SUBMODULO_TITLES,
  type GvSubmoduloId,
} from "./lib/tab-context";
import { GvPageChromeLayout, GvPageChromeProvider } from "./lib/gv-page-chrome";
import { GV_PANEL_STACK_CLASS, GV_TABLE_AREA_CLASS } from "./lib/page-shell";
import { cn } from "@/lib/utils";

function PanelFallback() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center">
      <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
    </div>
  );
}

const Flota = dynamic(() => import("./flota/Flota").then((m) => m.Flota), {
  loading: PanelFallback,
});
const Solicitudes = dynamic(
  () => import("./solicitudes/Solicitudes").then((m) => m.Solicitudes),
  { loading: PanelFallback },
);
const Bitacoras = dynamic(
  () => import("./bitacoras/Bitacoras").then((m) => m.Bitacoras),
  { loading: PanelFallback },
);
const Mantenimiento = dynamic(
  () => import("./mantenimiento/Mantenimiento").then((m) => m.Mantenimiento),
  { loading: PanelFallback },
);

const PANELS: { id: GvSubmoduloId; Panel: ComponentType }[] = [
  { id: "flota", Panel: Flota },
  { id: "solicitudes", Panel: Solicitudes },
  { id: "bitacoras", Panel: Bitacoras },
  { id: "mantenimiento", Panel: Mantenimiento },
];

const SCROLL_ROOT_CLASS =
  "min-h-[calc(100vh-4rem)] flex flex-1 flex-col overflow-y-auto lg:h-full lg:min-h-0 lg:overflow-hidden";

export function GestionVehiculosShell() {
  const [section, setSection] = useState<GvSubmoduloId>("flota");
  const [visited, setVisited] = useState<Set<GvSubmoduloId>>(() => new Set(["flota"]));

  const selectSection = useCallback((id: GvSubmoduloId) => {
    setSection(id);
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    document.title = GV_SUBMODULO_TITLES[section];
  }, [section]);

  return (
    <GvSectionProvider section={section} selectSection={selectSection}>
      <GvPageChromeProvider>
        <div
          data-gv-scroll-root
          className="relative flex min-h-[calc(100vh-4rem)] w-full flex-1 flex-col overflow-hidden lg:h-full lg:min-h-0"
        >
          <div data-gv-scroll-root className={SCROLL_ROOT_CLASS}>
            <GvPageChromeLayout>
              <div className={GV_TABLE_AREA_CLASS}>
                {PANELS.map(({ id, Panel }) =>
                  visited.has(id) ? (
                    <div
                      key={id}
                      className={cn(
                        GV_PANEL_STACK_CLASS,
                        section !== id && "h-0 overflow-hidden pointer-events-none",
                      )}
                      aria-hidden={section !== id}
                    >
                      <Panel />
                    </div>
                  ) : null,
                )}
              </div>
            </GvPageChromeLayout>
          </div>
        </div>
      </GvPageChromeProvider>
    </GvSectionProvider>
  );
}
