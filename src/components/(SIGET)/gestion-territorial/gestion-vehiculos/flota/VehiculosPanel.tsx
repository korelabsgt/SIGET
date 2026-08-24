"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VehiculosList } from "./VehiculosList";
import { VehiculosCards } from "./VehiculosCards";
import { VehiculoDetalleView } from "./VehiculoDetalleView";
import { type VehiculoRow } from "./lib/zod";
import { cn } from "@/lib/utils";

export function VehiculosPanel({
  vehiculos,
  vehiculoParaAbrir,
  onVehiculoParaAbrirHandled,
  onEdit,
  onDelete,
  onDetailViewChange,
  fillHeight,
}: {
  vehiculos: VehiculoRow[];
  vehiculoParaAbrir?: VehiculoRow | null;
  onVehiculoParaAbrirHandled?: () => void;
  onEdit: (vehiculo: VehiculoRow) => void;
  onDelete: (vehiculo: VehiculoRow) => Promise<boolean>;
  onDetailViewChange?: (active: boolean) => void;
  fillHeight?: boolean;
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
    <div
      className={cn(
        "relative overflow-hidden",
        fillHeight && "flex h-full min-h-0 flex-1 flex-col",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {selectedVehiculo ? (
          <motion.div
            key={`detail-${selectedVehiculo.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: 32 }}
            transition={transition}
            className="absolute inset-0 flex min-h-0 flex-col overflow-y-auto overscroll-y-contain pt-8 lg:overflow-hidden lg:pt-0"
          >
            <VehiculoDetalleView
              vehiculo={selectedVehiculo}
              onBack={handleBack}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="catalog"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={transition}
          >
            <div className="hidden lg:block">
              <VehiculosList vehiculos={vehiculos} onDetail={handleDetail} />
            </div>
            <div className="p-4 lg:hidden">
              <VehiculosCards
                vehiculos={vehiculos}
                onDetail={handleDetail}
                onEdit={onEdit}
                onDelete={(vehiculo) => {
                  void onDelete(vehiculo);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
