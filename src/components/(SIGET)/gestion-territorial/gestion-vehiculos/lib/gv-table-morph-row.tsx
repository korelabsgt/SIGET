"use client";

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { gvTableRowClass, gvTableRowMorphProps } from "./table-ui";

const GvTableRowMorphContext = createContext<boolean | null>(null);

export function useGvTableRowMorphHover(): boolean | null {
  return useContext(GvTableRowMorphContext);
}

export function GvTableMorphRow({
  children,
  className,
  style,
  as = "tr",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "tr" | "div";
}) {
  const [hovered, setHovered] = useState(false);
  const pointerHandlers = {
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  };

  return (
    <GvTableRowMorphContext.Provider value={hovered}>
      {as === "div" ? (
        <div
          className={cn(
            "transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20",
            className,
          )}
          data-morph-hover-scope
          {...pointerHandlers}
        >
          {children}
        </div>
      ) : (
        <tr
          className={cn(gvTableRowClass, className)}
          style={style}
          {...gvTableRowMorphProps}
          {...pointerHandlers}
        >
          {children}
        </tr>
      )}
    </GvTableRowMorphContext.Provider>
  );
}
