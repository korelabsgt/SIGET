"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SolicitudesList } from "./SolicitudesList";
import { SolicitudDetalleView } from "./SolicitudDetalleView";
import { type SolicitudRow } from "./lib/zod";

export function SolicitudesPanel({
  solicitudes,
  canManage,
  onAction,
  onDetailViewChange,
}: {
  solicitudes: SolicitudRow[];
  canManage: boolean;
  onAction: (solicitud: SolicitudRow, action: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR") => void;
  onDetailViewChange?: (active: boolean) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudRow | null>(null);

  useEffect(() => {
    if (!selectedSolicitud?.id) return;
    const updated = solicitudes.find((s) => s.id === selectedSolicitud.id);
    if (updated) {
      setSelectedSolicitud(updated);
    } else {
      setSelectedSolicitud(null);
    }
  }, [solicitudes, selectedSolicitud?.id]);

  useEffect(() => {
    onDetailViewChange?.(selectedSolicitud !== null);
  }, [selectedSolicitud, onDetailViewChange]);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {selectedSolicitud ? (
          <motion.div
            key={`detail-${selectedSolicitud.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 32 }}
            transition={transition}
          >
            <SolicitudDetalleView
              solicitud={selectedSolicitud}
              canManage={canManage}
              onBack={() => setSelectedSolicitud(null)}
              onAction={onAction}
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
            <SolicitudesList solicitudes={solicitudes} onDetail={setSelectedSolicitud} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
