"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VehiculosList } from "./VehiculosList";
import { VehiculosCards } from "./VehiculosCards";
import { VehiculoDetalleView } from "./VehiculoDetalleView";
import { type VehiculoRow } from "./lib/zod";

export function VehiculosPanel({
  vehiculos,
  viewMode,
  onEdit,
  onDelete,
  onDetailViewChange,
}: {
  vehiculos: VehiculoRow[];
  viewMode: "list" | "cards";
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => Promise<boolean>;
  onDetailViewChange?: (active: boolean) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoRow | null>(null);

  useEffect(() => {
    if (!selectedVehiculo?.id) return;
    const updated = vehiculos.find((v) => v.id === selectedVehiculo.id);
    if (updated) {
      setSelectedVehiculo(updated);
    } else {
      setSelectedVehiculo(null);
    }
  }, [vehiculos, selectedVehiculo?.id]);

  useEffect(() => {
    onDetailViewChange?.(selectedVehiculo !== null);
  }, [selectedVehiculo, onDetailViewChange]);

  const handleDetail = (vehiculo: VehiculoRow) => {
    setSelectedVehiculo(vehiculo);
  };

  const handleBack = () => {
    setSelectedVehiculo(null);
  };

  const handleDelete = async (vehiculo: VehiculoRow) => {
    const deleted = await onDelete(vehiculo);
    if (deleted) {
      setSelectedVehiculo(null);
    }
  };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {selectedVehiculo ? (
          <motion.div
            key={`detail-${selectedVehiculo.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 32 }}
            transition={transition}
          >
            <VehiculoDetalleView
              vehiculo={selectedVehiculo}
              onBack={handleBack}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          </motion.div>
        ) : viewMode === "list" ? (
          <motion.div
            key="list"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
            transition={transition}
          >
            <VehiculosList vehiculos={vehiculos} onDetail={handleDetail} />
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            transition={transition}
            className="p-4"
          >
            <VehiculosCards
              vehiculos={vehiculos}
              onEdit={onEdit}
              onDelete={(vehiculo) => {
                void onDelete(vehiculo);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
