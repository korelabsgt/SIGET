"use client";

import type { ComponentProps } from "react";
import { VerEditar } from "./VerEditar";

type CrearProps = Omit<ComponentProps<typeof VerEditar>, "initialData">;

export function Crear(props: CrearProps) {
  return <VerEditar {...props} initialData={null} />;
}
