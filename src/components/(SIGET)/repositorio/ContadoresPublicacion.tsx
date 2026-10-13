"use client";

import { useEffect, useState } from "react";
import { registerViewAction } from "./lib/actions";

function etiqueta(cantidad: number, uno: string, varios: string): string {
  return `${cantidad} ${cantidad === 1 ? uno : varios}`;
}

export function ContadoresPublicacion({
  visitas,
  descargas,
  slug,
  registrar = false,
}: {
  visitas: number;
  descargas: number;
  slug?: string;
  registrar?: boolean;
}) {
  const [vistas, setVistas] = useState(visitas);

  useEffect(() => {
    setVistas(visitas);
  }, [visitas]);

  useEffect(() => {
    if (!registrar || !slug) return;
    let activo = true;
    void registerViewAction(slug).then((res) => {
      if (!activo || res.view_count == null || res.view_count < 1) return;
      setVistas(res.view_count);
    });
    return () => {
      activo = false;
    };
  }, [registrar, slug]);

  return (
    <p className="text-[11px] font-semibold tabular-nums text-muted-foreground">
      {etiqueta(vistas, "visita", "visitas")} · {etiqueta(descargas, "descarga", "descargas")}
    </p>
  );
}
