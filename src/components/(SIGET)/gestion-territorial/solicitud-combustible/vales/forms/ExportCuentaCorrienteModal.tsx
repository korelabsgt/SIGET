"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  GvModalFooter,
  GvModalForm,
  GvModalFormBody,
  GvModalShell,
  GV_MODAL_SELECT_CONTENT_CLASS,
  GV_MODAL_SELECT_ITEM_CLASS,
  GV_MODAL_SELECT_TRIGGER_CLASS,
  ModalCancelButton,
  ModalSubmit,
} from "../../../gestion-vehiculos/lib/gv-modal-shell";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SolicitudCombustibleRow } from "../../solicitudes/lib/zod";
import { formatValeLoteOpcionExport } from "../lib/helpers";
import type { FondoCombustible, ValeLoteRow } from "../lib/zod";

export function ExportCuentaCorrienteModal({
  open,
  onOpenChange,
  fondo,
  lotes,
  valesInventario,
  solicitudes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fondo: FondoCombustible;
  lotes: ValeLoteRow[];
  valesInventario: ValeLoteRow[];
  solicitudes: SolicitudCombustibleRow[];
}) {
  const [loteId, setLoteId] = useState("");
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoteId(lotes[0]?.id ?? "");
  }, [open, lotes]);

  const onClose = () => onOpenChange(false);

  const handleExport = async () => {
    const lote = lotes.find((row) => row.id === loteId);
    if (!lote) {
      toast.warn("Seleccione un lote.");
      return;
    }

    setExportando(true);
    try {
      const { exportCuentaCorrienteCuponesExcel } = await import(
        "../lib/cuenta-corriente-cupones-excel"
      );
      const result = await exportCuentaCorrienteCuponesExcel(lote, valesInventario, solicitudes);
      if (!result.ok) {
        if (result.reason === "no_data") {
          toast.warn("No hay movimientos para exportar en ese lote.");
        } else {
          toast.error("No se pudo generar el Excel.");
        }
        return;
      }
      toast.success("Cuenta corriente descargada.");
      onClose();
    } catch {
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <GvModalShell
      open={open}
      onClose={onClose}
      title="Exportar cuenta corriente"
      subtitle={`Fondo ${fondo}: el reporte incluye todo el historial del lote, agrupado por mes.`}
      maxWidth="max-w-lg"
    >
      {open ? (
        <GvModalForm
          onSubmit={(event) => {
            event.preventDefault();
            void handleExport();
          }}
        >
          <GvModalFormBody className="space-y-4">
            <div className="space-y-2">
              <Label>Lote (rango de cupones)</Label>
              {lotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay lotes registrados en este fondo.
                </p>
              ) : (
                <Select value={loteId} onValueChange={setLoteId}>
                  <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                    <SelectValue placeholder="Seleccione lote" />
                  </SelectTrigger>
                  <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                    {lotes.map((row) => (
                      <SelectItem
                        key={row.id}
                        value={row.id}
                        className={GV_MODAL_SELECT_ITEM_CLASS}
                        textValue={formatValeLoteOpcionExport(row)}
                      >
                        {formatValeLoteOpcionExport(row)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </GvModalFormBody>

          <GvModalFooter>
            <ModalCancelButton onClick={onClose} disabled={exportando} />
            <ModalSubmit
              disabled={exportando || lotes.length === 0 || !loteId}
              label="Exportar"
            />
          </GvModalFooter>
        </GvModalForm>
      ) : null}
    </GvModalShell>
  );
}
