"use client";

import { useEffect, useState } from "react";
import { BitacorasList } from "./BitacorasList";
import { BitacorasCards } from "./BitacorasCards";
import { BitacoraDetalleModal } from "./BitacoraDetalleModal";
import { type BitacoraRow } from "./lib/zod";

export function BitacorasPanel({
  bitacoras,
  catalogo,
  detail,
  onDetailChange,
}: {
  bitacoras: BitacoraRow[];
  catalogo?: BitacoraRow[];
  detail?: BitacoraRow | null;
  onDetailChange?: (bitacora: BitacoraRow | null) => void;
}) {
  const [internalDetail, setInternalDetail] = useState<BitacoraRow | null>(null);
  const isControlled = detail !== undefined;
  const selectedBitacora = isControlled ? detail : internalDetail;
  const setSelectedBitacora = isControlled
    ? (bitacora: BitacoraRow | null) => onDetailChange?.(bitacora)
    : setInternalDetail;
  const fuente = catalogo ?? bitacoras;

  useEffect(() => {
    if (!selectedBitacora?.id) return;
    const updated = fuente.find((b) => b.id === selectedBitacora.id);
    if (updated) {
      setSelectedBitacora(updated);
    } else {
      setSelectedBitacora(null);
    }
  }, [fuente, selectedBitacora?.id]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <BitacorasList bitacoras={bitacoras} onDetail={setSelectedBitacora} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <BitacorasCards bitacoras={bitacoras} onDetail={setSelectedBitacora} />
        </div>
      </div>

      <BitacoraDetalleModal
        open={selectedBitacora !== null}
        onClose={() => setSelectedBitacora(null)}
        bitacora={selectedBitacora}
      />
    </>
  );
}
