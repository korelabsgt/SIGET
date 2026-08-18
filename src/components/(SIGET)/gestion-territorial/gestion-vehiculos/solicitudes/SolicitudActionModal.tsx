import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { cambiarEstadoSolicitud } from "./lib/actions";
import { type SolicitudRow } from "./lib/zod";
import { getVehiculos } from "../flota/lib/actions";

export function SolicitudActionModal({
  open,
  onOpenChange,
  solicitud,
  actionType,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitud: SolicitudRow | null;
  actionType: "APROBAR" | "RECHAZAR" | "INICIAR" | "FINALIZAR" | null;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [vehiculosLibres, setVehiculosLibres] = useState<any[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<string>("");
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  useEffect(() => {
    if (open && actionType === "APROBAR") {
      setLoadingVehiculos(true);
      getVehiculos().then((data) => {
        setVehiculosLibres(data.filter((v) => v.estado === "LIBRE"));
        setLoadingVehiculos(false);
      });
    } else {
      setSelectedVehiculo("");
    }
  }, [open, actionType]);

  const handleSubmit = () => {
    if (!solicitud || !actionType) return;

    if (actionType === "APROBAR" && !selectedVehiculo) {
      toast.error("Debe seleccionar un vehículo para aprobar la solicitud");
      return;
    }

    startTransition(async () => {
      let nuevoEstado: any;
      if (actionType === "APROBAR") nuevoEstado = "APROBADA";
      else if (actionType === "RECHAZAR") nuevoEstado = "RECHAZADA";
      else if (actionType === "INICIAR") nuevoEstado = "EN_MISION";
      else if (actionType === "FINALIZAR") nuevoEstado = "FINALIZADA";

      const payload: any = {};
      if (actionType === "APROBAR") payload.vehiculo_id = selectedVehiculo;

      const res = await cambiarEstadoSolicitud(solicitud.id, nuevoEstado, payload);
      if (!res.success) {
        toast.error(res.error || "Error al cambiar estado");
        return;
      }

      toast.success("Estado actualizado correctamente");
      onSaved();
      onOpenChange(false);
    });
  };

  const getTitle = () => {
    switch (actionType) {
      case "APROBAR": return "Aprobar Solicitud";
      case "RECHAZAR": return "Rechazar Solicitud";
      case "INICIAR": return "Iniciar Misión";
      case "FINALIZAR": return "Finalizar Misión";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {actionType === "APROBAR" && "Para aprobar la solicitud, debe asignar un vehículo disponible."}
            {actionType === "RECHAZAR" && "¿Está seguro que desea rechazar esta solicitud?"}
            {actionType === "INICIAR" && "¿Desea cambiar el estado a EN MISIÓN?"}
            {actionType === "FINALIZAR" && "¿El vehículo ha retornado y desea FINALIZAR la misión?"}
          </p>

          {actionType === "APROBAR" && (
            <div className="space-y-2">
              <Label>Vehículo Asignado</Label>
              <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo} disabled={loadingVehiculos}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingVehiculos ? "Cargando vehículos..." : "Seleccione un vehículo"} />
                </SelectTrigger>
                <SelectContent>
                  {vehiculosLibres.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.modelo}
                    </SelectItem>
                  ))}
                  {vehiculosLibres.length === 0 && !loadingVehiculos && (
                    <SelectItem value="none" disabled>No hay vehículos libres</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isPending || (actionType === "APROBAR" && !selectedVehiculo && vehiculosLibres.length > 0)}
            variant={actionType === "RECHAZAR" ? "destructive" : "default"}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
