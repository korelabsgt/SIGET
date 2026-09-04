"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { GvBackToTerritorial } from "./gv-back-to-territorial";
import { GvSectionSelect } from "./gv-section-select";
import { GV_MODULO_PAGE_CLASS } from "./page-shell";
import { useGvSection, type GvSubmoduloId } from "./tab-context";

type GvPageChromeContextValue = {
  hideChrome: boolean;
  setHideChrome: (hide: boolean) => void;
  headerExtras: ReactNode;
  setHeaderExtras: (extras: ReactNode) => void;
};

const GvPageChromeContext = createContext<GvPageChromeContextValue | null>(null);

export function GvPageChromeProvider({ children }: { children: ReactNode }) {
  const [hideChrome, setHideChromeState] = useState(false);
  const [headerExtras, setHeaderExtrasState] = useState<ReactNode>(null);

  const setHideChrome = useCallback((hide: boolean) => {
    setHideChromeState(hide);
  }, []);

  const setHeaderExtras = useCallback((extras: ReactNode) => {
    setHeaderExtrasState(extras);
  }, []);

  const value = useMemo(
    () => ({
      hideChrome,
      setHideChrome,
      headerExtras,
      setHeaderExtras,
    }),
    [hideChrome, setHideChrome, headerExtras, setHeaderExtras],
  );

  return (
    <GvPageChromeContext.Provider value={value}>{children}</GvPageChromeContext.Provider>
  );
}

export function useGvPageChrome() {
  return useContext(GvPageChromeContext);
}

export function GvPageChromeLayout({ children }: { children: ReactNode }) {
  const chrome = useGvPageChrome();
  const hideChrome = chrome?.hideChrome ?? false;
  const headerExtras = chrome?.headerExtras ?? null;

  return (
    <div className={GV_MODULO_PAGE_CLASS}>
      <div className="pointer-events-none fixed inset-0 z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:bg-[radial-gradient(oklch(50%_0_0)_1px,transparent_1px)]" />
      {!hideChrome ? (
        <div className="mb-6 flex shrink-0 items-start gap-3">
          <GvBackToTerritorial morph />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 text-2xl font-black uppercase leading-tight tracking-tight text-foreground md:text-3xl">
                Gestión de vehículos
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                {headerExtras}
                <GvSectionSelect />
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function useGvPanelChrome(
  panelId: GvSubmoduloId,
  {
    hideChrome = false,
    headerExtras = null,
  }: {
    hideChrome?: boolean;
    headerExtras?: ReactNode;
  } = {},
) {
  const chrome = useGvPageChrome();
  const section = useGvSection()?.section;
  const active = section === panelId;

  useEffect(() => {
    if (!chrome || !active) return;
    chrome.setHideChrome(hideChrome);
    chrome.setHeaderExtras(headerExtras);
    return () => {
      chrome.setHideChrome(false);
      chrome.setHeaderExtras(null);
    };
  }, [chrome, active, hideChrome, headerExtras]);
}
