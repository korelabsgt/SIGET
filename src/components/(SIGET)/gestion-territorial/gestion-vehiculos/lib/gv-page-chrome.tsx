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
import { GvSectionSelect } from "./gv-section-select";
import { GV_MODULO_PAGE_CLASS } from "./page-shell";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

type GvPageChromeDispatch = {
  setHideChrome: (hide: boolean) => void;
};

const GvPageChromeDispatchContext = createContext<GvPageChromeDispatch | null>(null);
const GvHeaderExtrasContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(
  null,
);

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
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)]" />
      {!hideChrome ? (
        <div className="mb-6 flex shrink-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <GvBackToTerritorial morph className="self-auto" />
            <h1 className="min-w-0 text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
              Gestión de vehículos
            </h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div ref={headerExtrasContainerRef} className="flex shrink-0 items-center gap-2" />
            <GvSectionSelect />
          </div>
        </div>
      ) : null}
      {children}
    </div>
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
