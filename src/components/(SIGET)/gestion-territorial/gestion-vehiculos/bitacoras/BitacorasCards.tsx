import { BookOpen } from "lucide-react";
import { type BitacoraRow } from "./lib/zod";
import { BitacoraCard } from "./BitacoraCard";
import { GestionVehiculosTableEmpty } from "../lib/table-ui";
import { GvMobileRecordList } from "../lib/gv-mobile-record";

export function BitacorasCards({
  bitacoras,
  onDetail,
}: {
  bitacoras: BitacoraRow[];
  onDetail: (bitacora: BitacoraRow) => void;
}) {
  if (bitacoras.length === 0) {
    return (
      <GestionVehiculosTableEmpty
        icon={<BookOpen className="size-10" />}
        title="Sin bitácoras"
        description="Aún no se ha registrado ningún viaje en la bitácora digital."
      />
    );
  }

  return (
    <GvMobileRecordList>
      {bitacoras.map((bitacora) => (
        <BitacoraCard key={bitacora.id} bitacora={bitacora} onDetail={onDetail} />
      ))}
    </GvMobileRecordList>
  );
}
