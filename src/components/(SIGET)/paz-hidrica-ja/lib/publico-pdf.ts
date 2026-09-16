import jsPDF from "jspdf";
import { formatFechaCalendarioGt } from "@/lib/fechas-gt";
import { AMBITO_CUENCA, ESTADO_ACUERDO_LABEL, GESTION_RECURSOS_HIDRICOS } from "./catalogos";
import type { AcuerdoRecord } from "./zod";
import type { InformePublico, SaberPublico } from "./publico-mock";

function encabezado(pdf: jsPDF, titulo: string) {
  pdf.setFillColor(0, 56, 130);
  pdf.rect(0, 0, 210, 28, "F");
  pdf.setTextColor(197, 155, 39);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text(GESTION_RECURSOS_HIDRICOS, 14, 11);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(13);
  pdf.text(titulo, 14, 20);
  pdf.setTextColor(80, 80, 80);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(AMBITO_CUENCA, 14, 36);
}

function pie(pdf: jsPDF) {
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    "Documento público de transparencia. No incluye nombres de personas ni coordenadas de denuncias.",
    14,
    287,
  );
}

export function descargarActaPublica(acuerdo: AcuerdoRecord) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  encabezado(pdf, "Acta pública de acuerdo comunitario");
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  const cuerpo = [
    `Asunto: ${acuerdo.descripcion}`,
    `Fecha pactada: ${formatFechaCalendarioGt(acuerdo.fecha_limite)}`,
    `Entidad responsable: ${acuerdo.institucion_responsable}`,
    `Estado: ${ESTADO_ACUERDO_LABEL[acuerdo.estado]}`,
    `Efectividad ciudadana: ${acuerdo.efectividad} de 5`,
    `Medio de verificación: ${acuerdo.medio_verificacion}`,
  ];
  let y = 46;
  cuerpo.forEach((linea) => {
    const lines = pdf.splitTextToSize(linea, 182);
    pdf.text(lines, 14, y);
    y += lines.length * 7 + 3;
  });
  pie(pdf);
  pdf.save(`acta-publica-${acuerdo.id}.pdf`);
}

export function descargarSaber(recurso: SaberPublico) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  encabezado(pdf, recurso.titulo);
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text(`Autoría: ${recurso.autor}`, 14, 46);
  pdf.text(`Año: ${recurso.anio}  ·  Peso de referencia: ${recurso.pesoKb} KB`, 14, 54);
  const resumen = pdf.splitTextToSize(recurso.resumen, 182);
  pdf.text(resumen, 14, 66);
  pdf.setFontSize(10);
  pdf.text(
    "Versión pública resumida para redes móviles. El archivo institucional completo se entrega en mesa de concertación.",
    14,
    90,
  );
  pie(pdf);
  pdf.save(`${recurso.id}.pdf`);
}

export function descargarInforme(informe: InformePublico) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  encabezado(pdf, informe.titulo);
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  pdf.text(`Periodo: ${informe.periodo}`, 14, 46);
  pdf.text(`Peso de referencia: ${informe.pesoKb} KB`, 14, 54);
  const resumen = pdf.splitTextToSize(informe.resumen, 182);
  pdf.text(resumen, 14, 66);
  pie(pdf);
  pdf.save(`${informe.id}.pdf`);
}

export function descargarTicketReporte(codigo: string, derivacion: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  encabezado(pdf, "Comprobante de reporte ciudadano");
  pdf.setFontSize(12);
  pdf.setTextColor(20, 20, 20);
  pdf.text("Código de seguimiento anónimo", 14, 50);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 56, 130);
  pdf.text(codigo, 14, 64);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(20, 20, 20);
  const aviso = pdf.splitTextToSize(
    `La alerta será canalizada a ${derivacion}. Conserve este código. No se publican nombres ni puntos de denuncia en el visor territorial abierto.`,
    182,
  );
  pdf.text(aviso, 14, 80);
  pie(pdf);
  pdf.save(`${codigo}.pdf`);
}
