"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MantenimientoList } from "./MantenimientoList";
import { MantenimientoCards } from "./MantenimientoCards";
import { FallaDetalleView } from "./FallaDetalleView";
import { type FallaRow, type MecanicoOption } from "./lib/zod";

export function MantenimientoPanel({
  fallas,
  mecanicos,
  isAuthorized,
  filtro,
  onDetailViewChange,
}: {
  fallas: FallaRow[];
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
  filtro: "ACTIVAS" | "CRITICAS" | "SOLVENTADAS";
  onDetailViewChange?: (active: boolean) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedFalla, setSelectedFalla] = useState<FallaRow | null>(null);

  const filtradas = fallas.filter((falla) => {
    if (filtro === "ACTIVAS") {
      return falla.estado === "PENDIENTE" || falla.estado === "EN_REPARACION";
    }
    if (filtro === "CRITICAS") {
      return falla.severidad === "ALTA" && falla.estado !== "SOLVENTADA";
    }
    if (filtro === "SOLVENTADAS") {
      return falla.estado === "SOLVENTADA";
    }
    return true;
  });

  useEffect(() => {
    if (!selectedFalla?.id) return;
    const updated = fallas.find((item) => item.id === selectedFalla.id);
    if (updated) {
      setSelectedFalla(updated);
    } else {
      setSelectedFalla(null);
    }
  }, [fallas, selectedFalla?.id]);

  useEffect(() => {
    onDetailViewChange?.(selectedFalla !== null);
  }, [selectedFalla, onDetailViewChange]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {selectedFalla ? (
          <motion.div
            key={`detail-${selectedFalla.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 32 }}
            transition={transition}
          >
            <FallaDetalleView
              falla={selectedFalla}
              mecanicos={mecanicos}
              isAuthorized={isAuthorized}
              onBack={() => setSelectedFalla(null)}
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
              <MantenimientoList fallas={filtradas} onDetail={setSelectedFalla} />
            </div>
            <div className="p-4 lg:hidden">
              <MantenimientoCards fallas={filtradas} onDetail={setSelectedFalla} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
