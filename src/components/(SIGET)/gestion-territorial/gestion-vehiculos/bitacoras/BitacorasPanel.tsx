"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BitacorasList } from "./BitacorasList";
import { BitacoraDetalleView } from "./BitacoraDetalleView";
import { type BitacoraRow } from "./lib/zod";

export function BitacorasPanel({
  bitacoras,
  onDetailViewChange,
  fillHeight,
}: {
  bitacoras: BitacoraRow[];
  onDetailViewChange?: (active: boolean) => void;
  fillHeight?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedBitacora, setSelectedBitacora] = useState<BitacoraRow | null>(null);

  useEffect(() => {
    if (!selectedBitacora?.id) return;
    const updated = bitacoras.find((b) => b.id === selectedBitacora.id);
    if (updated) {
      setSelectedBitacora(updated);
    } else {
      setSelectedBitacora(null);
    }
  }, [bitacoras, selectedBitacora?.id]);

  useEffect(() => {
    onDetailViewChange?.(selectedBitacora !== null);
  }, [selectedBitacora, onDetailViewChange]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fillHeight && "flex h-full min-h-0 flex-1 flex-col",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {selectedBitacora ? (
          <motion.div
            key={`detail-${selectedBitacora.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 32 }}
            transition={transition}
            className="absolute inset-0 flex min-h-0 flex-col overflow-y-auto overscroll-y-contain pt-8 lg:overflow-hidden lg:pt-0"
          >
            <BitacoraDetalleView
              bitacora={selectedBitacora}
              onBack={() => setSelectedBitacora(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
            transition={transition}
          >
            <BitacorasList bitacoras={bitacoras} onDetail={setSelectedBitacora} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
