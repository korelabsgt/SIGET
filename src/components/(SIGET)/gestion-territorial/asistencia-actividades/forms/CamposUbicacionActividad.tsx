"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ModalInput, ModalLabel } from "@/components/ui/general-modal";
import { BusquedaSelect } from "../BusquedaSelect";
import {
  DEPARTAMENTOS_GT,
  getMunicipiosPorDepartamento,
} from "../lib/guatemala-locations";

const revealTransition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1] as const,
};

export function CamposUbicacionActividad({
  direccion,
  departamento,
  municipio,
  onDireccionChange,
  onDepartamentoChange,
  onMunicipioChange,
  idPrefix,
}: {
  direccion: string;
  departamento: string;
  municipio: string;
  onDireccionChange: (value: string) => void;
  onDepartamentoChange: (value: string) => void;
  onMunicipioChange: (value: string) => void;
  idPrefix: string;
}) {
  const municipios = useMemo(
    () => getMunicipiosPorDepartamento(departamento),
    [departamento],
  );

  const departamentosOpciones = useMemo(
    () => DEPARTAMENTOS_GT.map((d) => d.nombre),
    [],
  );

  const handleDepartamento = (value: string) => {
    onDepartamentoChange(value);
    onMunicipioChange("");
    onDireccionChange("");
  };

  const handleMunicipio = (value: string) => {
    onMunicipioChange(value);
    onDireccionChange("");
  };

  return (
    <>
      <div className="space-y-2">
        <ModalLabel>Departamento</ModalLabel>
        <BusquedaSelect
          value={departamento}
          onChange={handleDepartamento}
          options={departamentosOpciones}
          placeholder="Buscar departamento…"
        />
      </div>

      <AnimatePresence initial={false}>
        {departamento ? (
          <motion.div
            key="municipio"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={revealTransition}
            className="space-y-2 overflow-hidden"
          >
            <ModalLabel>Municipio</ModalLabel>
            <BusquedaSelect
              value={municipio}
              onChange={handleMunicipio}
              options={municipios}
              placeholder="Buscar municipio…"
              emptyMessage="Sin municipios coincidentes"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {municipio ? (
          <motion.div
            key="direccion"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={revealTransition}
            className="space-y-2 overflow-hidden"
          >
            <ModalLabel htmlFor={`${idPrefix}-direccion`}>Dirección</ModalLabel>
            <ModalInput
              id={`${idPrefix}-direccion`}
              value={direccion}
              onChange={(e) => onDireccionChange(e.target.value)}
              required
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
