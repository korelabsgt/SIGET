"use client";

import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type VehiculoRow } from "./lib/zod";

function CampoLectura({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className="cursor-default bg-muted/30"
      />
    </div>
  );
}

function formatFechaVencimiento(fecha: string | null | undefined) {
  if (!fecha) return "Sin registrar";
  const formatted = format(new Date(fecha), "dd MMM yyyy", { locale: es });
  const days = differenceInDays(new Date(fecha), new Date());
  if (days < 0) return `${formatted} (Vencido)`;
  if (days <= 30) return `${formatted} (Próximo)`;
  return formatted;
}

export function VehiculoDetalleModal({
  open,
  onOpenChange,
  vehiculo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculo: VehiculoRow | null;
}) {
  if (!vehiculo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalle del vehículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <CampoLectura id="det-placa" label="Placa" value={vehiculo.placa} />
            <CampoLectura
              id="det-estado"
              label="Estado"
              value={vehiculo.estado.replace("_", " ")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CampoLectura id="det-marca" label="Marca" value={vehiculo.marca} />
            <CampoLectura id="det-modelo" label="Modelo" value={vehiculo.modelo} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <CampoLectura id="det-color" label="Color" value={vehiculo.color} />
            <CampoLectura
              id="det-anio"
              label="Año"
              value={vehiculo.anio ? String(vehiculo.anio) : "N/A"}
            />
            <CampoLectura
              id="det-km"
              label="Kilometraje"
              value={vehiculo.kilometraje_actual.toLocaleString()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CampoLectura
              id="det-seguro"
              label="Vencimiento Seguro"
              value={formatFechaVencimiento(vehiculo.vencimiento_seguro)}
            />
            <CampoLectura
              id="det-circulacion"
              label="Vencimiento Circulación"
              value={formatFechaVencimiento(vehiculo.vencimiento_circulacion)}
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
