"use client";

import { ConocimientoBuscador } from "./ConocimientoBuscador";
import { ConocimientoPublicHome } from "./ConocimientoPublicHome";
import { publicCanalUi } from "./lib/canales-publicos-ui";
import { esCanalPublico } from "./lib/helpers";
import type { PublicCanalSlug } from "./lib/zod";

const VOLVER_CENTRO = {
  href: "/conocimiento",
  label: "Volver al centro de conocimiento",
} as const;

function CatalogoCanalInstitucional({ canal }: { canal: PublicCanalSlug }) {
  const meta = publicCanalUi(canal);
  return (
    <ConocimientoBuscador
      canal={canal}
      mostrarCanales={false}
      cardLayout={canal === "noticias" ? "cuadrado" : "default"}
      volver={VOLVER_CENTRO}
      presentacion="institucional"
      encabezado={{
        kicker: meta.label,
        descripcion: meta.descripcionCatalogo,
      }}
    />
  );
}

export function ConocimientoCatalogo({ canal }: { canal?: string }) {
  if (!canal) {
    return <ConocimientoPublicHome />;
  }
  if (!esCanalPublico(canal)) {
    return null;
  }
  return <CatalogoCanalInstitucional canal={canal} />;
}
