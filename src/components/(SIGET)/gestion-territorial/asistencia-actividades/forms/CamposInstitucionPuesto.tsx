"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TipoInstitucion } from "../lib/zod";
import { REGISTRO_PUBLICO_FIELD_CLASS } from "./modal-field-class";

const inputClass = REGISTRO_PUBLICO_FIELD_CLASS;

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-semibold leading-none text-foreground/70"
    >
      {children}
    </label>
  );
}

export function CamposInstitucionPuesto({
  tipoInstitucion,
  institucionOtra,
  puesto,
  onTipoInstitucionChange,
  onInstitucionOtraChange,
  onPuestoChange,
  selectId = "institucion",
  puestoId = "puesto",
  otraId = "institucion-otra",
}: {
  tipoInstitucion: TipoInstitucion;
  institucionOtra: string;
  puesto: string;
  onTipoInstitucionChange: (value: TipoInstitucion) => void;
  onInstitucionOtraChange: (value: string) => void;
  onPuestoChange: (value: string) => void;
  selectId?: string;
  puestoId?: string;
  otraId?: string;
}) {
  const handleTipo = (value: TipoInstitucion) => {
    onTipoInstitucionChange(value);
    if (value !== "otras") onInstitucionOtraChange("");
  };

  return (
    <>
      <div className="space-y-2">
        <FieldLabel htmlFor={selectId}>Institución</FieldLabel>
        <select
          id={selectId}
          value={tipoInstitucion}
          onChange={(e) => handleTipo(e.target.value as TipoInstitucion)}
          className={inputClass}
        >
          <option value="sin">Sin Institución</option>
          <option value="plan_trifinio">Plan Trifinio</option>
          <option value="otras">Otras Instituciones</option>
        </select>
      </div>

      <AnimatePresence initial={false}>
        {tipoInstitucion === "otras" ? (
          <motion.div
            key="institucion-otra"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-2 overflow-hidden"
          >
            <FieldLabel htmlFor={otraId}>Nombre de la institución</FieldLabel>
            <input
              id={otraId}
              type="text"
              value={institucionOtra}
              onChange={(e) => onInstitucionOtraChange(e.target.value)}
              className={inputClass}
              required
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-2">
        <FieldLabel htmlFor={puestoId}>Puesto (opcional)</FieldLabel>
        <input
          id={puestoId}
          type="text"
          value={puesto}
          onChange={(e) => onPuestoChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </>
  );
}
