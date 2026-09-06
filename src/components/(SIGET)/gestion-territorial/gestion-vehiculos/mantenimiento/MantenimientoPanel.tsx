"use client";

import { useEffect, useState } from "react";
import { MantenimientoList } from "./MantenimientoList";
import { MantenimientoCards } from "./MantenimientoCards";
import { FallaDetalleModal } from "./FallaDetalleModal";
import { type FallaRow, type MecanicoOption } from "./lib/zod";

export function MantenimientoPanel({
  fallas,
  catalogo,
  mecanicos,
  isAuthorized,
  detail,
  onDetailChange,
}: {
  fallas: FallaRow[];
  catalogo?: FallaRow[];
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
  detail?: FallaRow | null;
  onDetailChange?: (falla: FallaRow | null) => void;
}) {
  const [internalDetail, setInternalDetail] = useState<FallaRow | null>(null);
  const isControlled = detail !== undefined;
  const selectedFalla = isControlled ? detail : internalDetail;
  const setSelectedFalla = isControlled
    ? (falla: FallaRow | null) => onDetailChange?.(falla)
    : setInternalDetail;
  const fuente = catalogo ?? fallas;

  useEffect(() => {
    if (!selectedFalla?.id) return;
    const updated = fuente.find((item) => item.id === selectedFalla.id);
    if (updated) {
      setSelectedFalla(updated);
    } else {
      setSelectedFalla(null);
    }
  }, [fuente, selectedFalla?.id]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <MantenimientoList fallas={fallas} onDetail={setSelectedFalla} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <MantenimientoCards fallas={fallas} onDetail={setSelectedFalla} />
        </div>
      </div>

      <FallaDetalleModal
        open={selectedFalla !== null}
        onClose={() => setSelectedFalla(null)}
        falla={selectedFalla}
        mecanicos={mecanicos}
        isAuthorized={isAuthorized}
      />
    </>
  );
}
