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
      <div className="hidden lg:block">
        <BitacorasList bitacoras={bitacoras} onDetail={setSelectedBitacora} />
      </div>
      <div className="lg:hidden">
        <BitacorasCards bitacoras={bitacoras} onDetail={setSelectedBitacora} />
      </div>

      <BitacoraDetalleModal
        open={selectedBitacora !== null}
        onClose={() => setSelectedBitacora(null)}
        bitacora={selectedBitacora}
      />
    </>
  );
}
