"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { GV_MENU_OPTIONS } from "./lib/menu-options";
import {
  GvTabProvider,
  GV_SUBMODULO_TITLES,
  tabFromPathname,
  type GvSubmoduloId,
} from "./lib/tab-context";

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

function hrefForSubmodulo(id: GvSubmoduloId) {
  return GV_MENU_OPTIONS.find((opt) => opt.id === id)?.href;
}

export function GestionVehiculosShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [tab, setTab] = useState<GvSubmoduloId>(() => tabFromPathname(pathname));
  const [visited, setVisited] = useState<Set<GvSubmoduloId>>(
    () => new Set([tabFromPathname(pathname)]),
  );

  const visit = useCallback((id: GvSubmoduloId) => {
    setTab(id);
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    document.title = GV_SUBMODULO_TITLES[id];
  }, []);

  const selectTab = useCallback(
    (id: GvSubmoduloId) => {
      visit(id);
      const href = hrefForSubmodulo(id);
      if (href && pathname !== href) {
        router.push(href, { scroll: false });
      }
    },
    [visit, pathname, router],
  );

  useEffect(() => {
    visit(tabFromPathname(pathname));
  }, [pathname, visit]);

  return (
    <GvTabProvider tab={tab} selectTab={selectTab}>
      <div className="relative flex w-full min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-y-auto lg:h-full lg:min-h-0 lg:overflow-hidden">
        {PANELS.map(({ id, Panel }) =>
          visited.has(id) ? (
            <div
              key={id}
              className={cn(
                "min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-y-auto lg:h-full lg:min-h-0 lg:overflow-hidden",
                tab === id ? "flex" : "hidden",
              )}
              inert={tab !== id}
            >
              <Panel />
            </div>
          ) : null,
        )}
      </div>
    </GvTabProvider>
  );
}
