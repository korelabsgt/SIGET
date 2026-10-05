"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { GvBackToTerritorial } from "./gv-back-to-territorial";
import { GvModuloPageFrame } from "./gv-modulo-page-frame";
import { GV_MODULO_HEADER_ROW_CLASS } from "./page-shell";
import { GvSectionSelect } from "./gv-section-select";
import { GvCampanaNotificaciones } from "./gv-campana-notificaciones";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

type GvPageChromeDispatch = {
  setHideChrome: (hide: boolean) => void;
};

const GvPageChromeDispatchContext = createContext<GvPageChromeDispatch | null>(null);
export const GvHeaderExtrasContainerContext = createContext<
  RefObject<HTMLDivElement | null> | null
>(null);

export function GvPageChromeProvider({ children }: { children: ReactNode }) {
  const [hideChrome, setHideChromeState] = useState(false);
  const headerExtrasContainerRef = useRef<HTMLDivElement | null>(null);

  const setHideChrome = useCallback((hide: boolean) => {
    setHideChromeState((prev) => (prev === hide ? prev : hide));
  }, []);

  const dispatch = useMemo(() => ({ setHideChrome }), [setHideChrome]);

  return (
    <GvPageChromeDispatchContext.Provider value={dispatch}>
      <GvHeaderExtrasContainerContext.Provider value={headerExtrasContainerRef}>
        <GvPageChromeLayout hideChrome={hideChrome} headerExtrasContainerRef={headerExtrasContainerRef}>
          {children}
        </GvPageChromeLayout>
      </GvHeaderExtrasContainerContext.Provider>
    </GvPageChromeDispatchContext.Provider>
  );
}

function GvPageChromeLayout({
  children,
  hideChrome,
  headerExtrasContainerRef,
}: {
  children: ReactNode;
  hideChrome: boolean;
  headerExtrasContainerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <GvModuloPageFrame className="flex w-full flex-col">
      {!hideChrome ? (
        <div className={GV_MODULO_HEADER_ROW_CLASS}>
          <div className="flex min-w-0 items-center gap-3 max-md:px-2.5 sm:flex-1">
            <GvBackToTerritorial morph className="shrink-0" />
            <h1 className="min-w-0 text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
              Gestión de vehículos
            </h1>
          </div>
          <div
            className="flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center justify-end gap-2 max-md:px-2.5 sm:gap-3 sm:w-auto"
          >
            <GvSectionSelect />
            <GvCampanaNotificaciones />
            <div
              ref={headerExtrasContainerRef}
              className="flex shrink-0 items-center gap-2 empty:hidden"
            />
          </div>
        </div>
      ) : null}
      <div className="flex w-full min-w-0 flex-col">
        {children}
      </div>
    </GvModuloPageFrame>
  );
}

export function GvHeaderExtras({
  panelId,
  children,
}: {
  panelId: GvSubmoduloId;
  children: ReactNode;
}) {
  const section = useGvSection()?.section;
  const containerRef = useContext(GvHeaderExtrasContainerContext);
  const active = section === panelId;
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalTarget(containerRef?.current ?? null);
  });

  if (!active || !children || !portalTarget) return null;

  return createPortal(children, portalTarget);
}

export function useGvPanelChrome(
  panelId: GvSubmoduloId,
  { hideChrome = false }: { hideChrome?: boolean } = {},
) {
  const dispatch = useContext(GvPageChromeDispatchContext);
  const section = useGvSection()?.section;
  const active = section === panelId;
  const setHideChrome = dispatch?.setHideChrome;

  useEffect(() => {
    if (!setHideChrome || !active) return;
    setHideChrome(hideChrome);
  }, [active, hideChrome, setHideChrome]);

  useEffect(() => {
    if (!setHideChrome || !active) return;
    return () => {
      setHideChrome(false);
    };
  }, [active, setHideChrome]);
}
