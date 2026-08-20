"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import { getDatosReporteBitacora } from "./lib/actions";
import { getVehiculos } from "../flota/lib/actions";
import { type VehiculoRow } from "../flota/lib/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExportarReporteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const ANIOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(String);

export function ExportarReporteModal({ open, onOpenChange }: ExportarReporteModalProps) {
  const [mes, setMes] = useState<string>(String(new Date().getMonth() + 1));
  const [anio, setAnio] = useState<string>(String(new Date().getFullYear()));
  const [vehiculoId, setVehiculoId] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
  
  useEffect(() => {
    if (open && vehiculos.length === 0) {
      getVehiculos().then((data) => setVehiculos(data || []));
    }
  }, [open]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await getDatosReporteBitacora(Number(mes), Number(anio), vehiculoId);

      if (!data || data.length === 0) {
        toast.warning("No hay registros en el período seleccionado.");
        return;
      }

      // Preparar metadatos para el encabezado
      const nombreMes = MESES.find((m) => m.value === mes)?.label;
      const vehiculoSeleccionado = vehiculos.find((v) => v.id === vehiculoId);
      const vehiculoHeader = vehiculoSeleccionado
        ? `${vehiculoSeleccionado.placa} - ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`
        : "CONSOLIDADO GENERAL (TODOS LOS VEHÍCULOS)";

      // Construcción de la tabla
      const wb = XLSX.utils.book_new();

      // Configurar filas (AoA - Array of Arrays)
      const rows: any[][] = [];

      // 1. Encabezado Institucional
      rows.push(["COMISIÓN TRINACIONAL DEL PLAN TRIFINIO - SIGET"]);
      rows.push(["CONTROL MENSUAL DE BITÁCORA VEHICULAR Y CONSUMO DE COMBUSTIBLE"]);
      rows.push([]);
      rows.push(["Período:", `${nombreMes} ${anio}`]);
      rows.push(["Vehículo:", vehiculoHeader]);
      rows.push(["Fecha de Emisión:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })]);
      rows.push([]);

      // 2. Cabeceras de la tabla
      const tableHeaders = [
        "Fecha",
        "Vehículo (Placa)",
        "Conductor Responsable",
        "Destino / Comisión",
        "Km Inicial",
        "Km Final",
        "Km Recorrido",
        "No. Vale",
        "Gasto Combustible (Q.)",
      ];
      rows.push(tableHeaders);

      // 3. Filas de datos
      let totalRecorrido = 0;
      let totalCombustible = 0;

      data.forEach((row: any) => {
        totalRecorrido += row.km_recorrido || 0;
        totalCombustible += Number(row.monto_combustible) || 0;

        rows.push([
          format(new Date(row.fecha), "dd/MM/yyyy"),
          row.ter_vehiculos ? `${row.ter_vehiculos.placa}` : "N/A",
          row.profiles ? row.profiles.full_name : "N/A",
          row.destino || "N/A",
          row.km_inicial,
          row.km_final,
          row.km_recorrido,
          row.vale_combustible || "-",
          Number(row.monto_combustible) || 0,
        ]);
      });

      // 4. Totales
      rows.push([]);
      rows.push(["", "", "", "", "", "TOTALES:", totalRecorrido, "", totalCombustible]);
      
      // 5. Espacios para Firmas
      rows.push([]);
      rows.push([]);
      rows.push([]);
      rows.push([
        "",
        "Firma: ___________________________",
        "", "", "",
        "Firma: ___________________________"
      ]);
      rows.push([
        "",
        "Elaborado por: (Conductor / Encargado)",
        "", "", "",
        "Aprobado por: Dirección Técnica / Administración"
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // --- Estilos Básicos usando propiedades de celda (Limitado en versión Free, pero útil para anchos de columna) ---
      ws["!cols"] = [
        { wch: 12 }, // Fecha
        { wch: 15 }, // Vehículo
        { wch: 30 }, // Conductor
        { wch: 40 }, // Destino
        { wch: 12 }, // Km Inicial
        { wch: 12 }, // Km Final
        { wch: 15 }, // Km Recorrido
        { wch: 15 }, // Vale
        { wch: 20 }, // Monto
      ];

      // Formato de Moneda para Gasto de Combustible (Q.)
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:I100");
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const montoCellAddress = XLSX.utils.encode_cell({ r: R, c: 8 }); // Columna I (index 8)
        if (ws[montoCellAddress] && typeof ws[montoCellAddress].v === "number") {
          ws[montoCellAddress].z = '"Q"#,##0.00';
        }
        
        const kmRecorridoCellAddress = XLSX.utils.encode_cell({ r: R, c: 6 }); // Columna G (index 6)
        if (ws[kmRecorridoCellAddress] && typeof ws[kmRecorridoCellAddress].v === "number") {
            ws[kmRecorridoCellAddress].z = '#,##0';
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Reporte");

      const nombreArchivo = vehiculoSeleccionado
        ? `Reporte_Bitacoras_${vehiculoSeleccionado.placa}_${mes}_${anio}.xlsx`
        : `Reporte_Bitacoras_General_${mes}_${anio}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);
      toast.success("Reporte exportado exitosamente");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Hubo un problema al exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Exportar Reporte Mensual
          </DialogTitle>
          <DialogDescription>
            Genera un reporte oficial de bitácoras y combustible en formato Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="bg-white dark:bg-zinc-950">
                  <SelectValue placeholder="Seleccione mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger className="bg-white dark:bg-zinc-950">
                  <SelectValue placeholder="Seleccione año" />
                </SelectTrigger>
                <SelectContent>
                  {ANIOS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vehículo</Label>
            <Select value={vehiculoId} onValueChange={setVehiculoId}>
              <SelectTrigger className="bg-white dark:bg-zinc-950">
                <SelectValue placeholder="Seleccione vehículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-green-700 dark:text-green-500">
                  Consolidado General (Todos)
                </SelectItem>
                {vehiculos.map((v) => (
                  <SelectItem key={v.id} value={v.id || ""}>
                    {v.placa} - {v.marca} {v.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando Excel...
              </>
            ) : (
              "Descargar Excel"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
