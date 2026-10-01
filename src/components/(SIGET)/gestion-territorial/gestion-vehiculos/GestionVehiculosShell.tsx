"use client";

import { Suspense, useCallback, useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  GvSectionProvider,
  GV_SUBMODULO_TITLES,
  type GvSubmoduloId,
} from "./lib/tab-context";
import { useRequireFlotaYCombustible } from "./lib/gv-permissions-hook";
import { GvPageChromeProvider } from "./lib/gv-page-chrome";
import { GvSolicitudDetailIntentProvider } from "./lib/gv-solicitud-detail-intent";
import { GvPanelActionIntentProvider } from "./lib/gv-panel-action-intent";
import {
  GV_MODULO_SCROLL_INNER_CLASS,
  GV_MODULO_SCROLL_OUTER_CLASS,
  GV_TABLE_AREA_CLASS,
} from "./lib/page-shell";
import { buildGvSectionHref, gvSectionFromSearchParams } from "./lib/gv-section-url";
import { useGvDetailScrollToTop } from "./lib/scroll-detail-to-top";
import { cn } from "@/lib/utils";
import { GvDemoCleanupPortal } from "./lib/gv-demo-cleanup-tools";

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
  { id: "solicitudes", Panel: Solicitudes },
  { id: "bitacoras", Panel: Bitacoras },
  { id: "flota", Panel: Flota },
  { id: "mantenimiento", Panel: Mantenimiento },
];

function GestionVehiculosShellInner() {
  const allowed = useRequireFlotaYCombustible();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sectionFromUrl = gvSectionFromSearchParams(searchParams);

  const [section, setSection] = useState<GvSubmoduloId>(sectionFromUrl);
  const [visited, setVisited] = useState<Set<GvSubmoduloId>>(() => new Set([sectionFromUrl]));

  const abrirSeccion = useCallback((id: GvSubmoduloId) => {
    setSection(id);
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const sincronizarDesdeHistorial = () => {
      abrirSeccion(
        gvSectionFromSearchParams(new URLSearchParams(window.location.search)),
      );
    };

    window.addEventListener("popstate", sincronizarDesdeHistorial);
    return () => window.removeEventListener("popstate", sincronizarDesdeHistorial);
  }, [abrirSeccion]);

  const selectSection = useCallback(
    (id: GvSubmoduloId) => {
      abrirSeccion(id);
      window.history.replaceState(
        window.history.state,
        "",
        buildGvSectionHref(pathname, id, searchParams),
      );
    },
    [abrirSeccion, pathname, searchParams],
  );

  useEffect(() => {
    if (gvSectionFromSearchParams(searchParams) === section) return;
    window.history.replaceState(
      window.history.state,
      "",
      buildGvSectionHref(pathname, section, searchParams),
    );
  }, [pathname, searchParams, section]);

  useEffect(() => {
    document.title = GV_SUBMODULO_TITLES[section];
  }, [section]);

  useGvDetailScrollToTop(true, section);

  if (!allowed) return null;

  return (
    <GvSectionProvider section={section} selectSection={selectSection}>
      <GvSolicitudDetailIntentProvider>
      <GvPanelActionIntentProvider>
      <GvPageChromeProvider>
        <GvDemoCleanupPortal />
        <div data-gv-scroll-root className={GV_MODULO_SCROLL_OUTER_CLASS}>
          <div data-gv-scroll-root className={GV_MODULO_SCROLL_INNER_CLASS}>
            <div className={cn(GV_TABLE_AREA_CLASS, "relative lg:min-h-0 lg:flex-1")}>
              {PANELS.map(({ id, Panel }) =>
                visited.has(id) ? (
                  <div
                    key={id}
                    className={cn(
                      "flex min-h-0 w-full flex-col",
                      section === id
                        ? "relative z-10 min-h-0 flex-1 lg:absolute lg:inset-0"
                        : "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0",
                    )}
                    aria-hidden={section !== id}
                  >
                    <Panel />
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </GvPageChromeProvider>
      </GvPanelActionIntentProvider>
      </GvSolicitudDetailIntentProvider>
    </GvSectionProvider>
  );
}

export function GestionVehiculosShell() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <GestionVehiculosShellInner />
    </Suspense>
  );
}
