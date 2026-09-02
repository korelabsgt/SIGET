"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BitacorasList } from "./BitacorasList";
import { BitacorasCards } from "./BitacorasCards";
import { BitacoraDetalleView } from "./BitacoraDetalleView";
import { type BitacoraRow } from "./lib/zod";
import { useGvDetailScrollToTop } from "../lib/scroll-detail-to-top";

export function BitacorasPanel({
  bitacoras,
  catalogo,
  onDetailViewChange,
}: {
  bitacoras: BitacoraRow[];
  catalogo?: BitacoraRow[];
  onDetailViewChange?: (active: boolean) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedBitacora, setSelectedBitacora] = useState<BitacoraRow | null>(null);
  const fuente = catalogo ?? bitacoras;

  useGvDetailScrollToTop(selectedBitacora !== null, selectedBitacora?.id);

  useEffect(() => {
    if (!selectedBitacora?.id) return;
    const updated = fuente.find((b) => b.id === selectedBitacora.id);
    if (updated) {
      setSelectedBitacora(updated);
    } else {
      setSelectedBitacora(null);
    }
  }, [fuente, selectedBitacora?.id]);

  useEffect(() => {
    onDetailViewChange?.(selectedBitacora !== null);
  }, [selectedBitacora, onDetailViewChange]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {selectedBitacora ? (
          <motion.div
            key={`detail-${selectedBitacora.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 32 }}
            transition={transition}
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
            <div className="hidden lg:block">
              <BitacorasList bitacoras={bitacoras} onDetail={setSelectedBitacora} />
            </div>
            <div className="p-4 lg:hidden">
              <BitacorasCards bitacoras={bitacoras} onDetail={setSelectedBitacora} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
