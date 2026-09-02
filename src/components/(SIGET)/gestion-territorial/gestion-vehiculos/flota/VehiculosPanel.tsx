"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VehiculosList } from "./VehiculosList";
import { VehiculosCards } from "./VehiculosCards";
import { VehiculoDetalleView } from "./VehiculoDetalleView";
import { type VehiculoRow } from "./lib/zod";

export function VehiculosPanel({
  vehiculos,
  vehiculoParaAbrir,
  onVehiculoParaAbrirHandled,
  onEdit,
  onDelete,
  onDetailViewChange,
  canManage,
}: {
  vehiculos: VehiculoRow[];
  vehiculoParaAbrir?: VehiculoRow | null;
  onVehiculoParaAbrirHandled?: () => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => Promise<boolean>;
  onDetailViewChange?: (active: boolean) => void;
  canManage: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoRow | null>(null);

  useEffect(() => {
    if (!vehiculoParaAbrir) return;
    setSelectedVehiculo(vehiculoParaAbrir);
    onVehiculoParaAbrirHandled?.();
  }, [vehiculoParaAbrir, onVehiculoParaAbrirHandled]);

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
              onBack={() => setSelectedVehiculo(null)}
              onEdit={onEdit}
              onDelete={handleDelete}
              canManage={canManage}
            />
          </motion.div>
        ) : (
          <motion.div
            key="catalog"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
            transition={transition}
          >
            <div className="hidden lg:block">
              <VehiculosList vehiculos={vehiculos} onDetail={setSelectedVehiculo} />
            </div>
            <div className="p-4 lg:hidden">
              <VehiculosCards
                vehiculos={vehiculos}
                onDetail={setSelectedVehiculo}
                onEdit={onEdit}
                onDelete={(vehiculo) => {
                  void onDelete(vehiculo);
                }}
                canManage={canManage}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
