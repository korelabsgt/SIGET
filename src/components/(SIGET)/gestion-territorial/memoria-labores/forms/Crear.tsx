"use client";

import type { ComponentProps } from "react";
import VerEditar from "./VerEditar";

type CrearProps = Omit<ComponentProps<typeof VerEditar>, "initial">;

export default function Crear(props: CrearProps) {
  return <VerEditar {...props} initial={null} />;
}
