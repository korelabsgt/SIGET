import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { RegistroAsistenciaRecord } from "./zod";
import { formatoTelefonoVisible } from "./zod";

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "actividad"
  );
}

function formatFechaExcel(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function celdaOpcional(value: string | null): string {
  return value?.trim() ? value : "";
}

export function buildAsistenciaExcelRows(
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
): unknown[][] {
  const rows: unknown[][] = [
    ["Registros de asistencia"],
    ["Actividad", nombreActividad],
    [],
    [
      "Fecha y hora",
      "DPI",
      "Nombre",
      "Correo electrónico",
      "Teléfono",
      "Institución",
      "Puesto",
      "Género",
      "Fecha de nacimiento",
    ],
  ];

  for (const r of registros) {
    rows.push([
      formatFechaExcel(r.created_at),
      r.dpi,
      r.nombre,
      celdaOpcional(r.email),
      r.telefono ? formatoTelefonoVisible(r.telefono) : "",
      celdaOpcional(r.institucion),
      celdaOpcional(r.puesto),
      r.genero === "masculino" ? "Masculino" : "Femenino",
      r.fecha_nacimiento,
    ]);
  }

  return rows;
}

export function downloadAsistenciaExcel(
  registros: RegistroAsistenciaRecord[],
  nombreActividad: string,
) {
  const rows = buildAsistenciaExcelRows(registros, nombreActividad);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const fecha = new Date().toISOString().slice(0, 10);
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `asistencia-${safeFilename(nombreActividad)}-${fecha}.xlsx`,
  );
}
