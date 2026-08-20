import { differenceInDays } from "date-fns";

import { type AlertStatus, type VehiculoRow } from "./zod";



export function getDocumentAlertStatus(vencimientoSeguro?: string | null, vencimientoCirculacion?: string | null): AlertStatus {

  if (!vencimientoSeguro || !vencimientoCirculacion) return "ROJO";



  const diasSeguro = differenceInDays(new Date(vencimientoSeguro), new Date());

  const diasCirculacion = differenceInDays(new Date(vencimientoCirculacion), new Date());



  const diasMinimos = Math.min(diasSeguro, diasCirculacion);



  if (diasMinimos <= 0) return "ROJO";

  if (diasMinimos <= 30) return "AMARILLO";

  return "VERDE";

}



export type VencimientoEtiqueta = "Al día" | "Próximo" | "Vencido" | "Sin registrar";

export function getVencimientoDocumentoStatus(fecha: string | null | undefined): {
  estado: AlertStatus;
  etiqueta: VencimientoEtiqueta;
  diasRestantes: number | null;
} {
  if (!fecha) {
    return { estado: "ROJO", etiqueta: "Sin registrar", diasRestantes: null };
  }

  const diasRestantes = differenceInDays(new Date(fecha), new Date());

  if (diasRestantes <= 0) {
    return { estado: "ROJO", etiqueta: "Vencido", diasRestantes };
  }

  if (diasRestantes <= 30) {
    return { estado: "AMARILLO", etiqueta: "Próximo", diasRestantes };
  }

  return { estado: "VERDE", etiqueta: "Al día", diasRestantes };
}

export function getAlertStatusClasses(estado: AlertStatus) {
  switch (estado) {
    case "VERDE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
    case "AMARILLO":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "ROJO":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  }
}

export function getMantenimientoAlertStatus(kmActual: number): { estado: AlertStatus; kmFaltantes: number; siguienteServicio: number } {

  const siguienteServicio = Math.ceil((kmActual + 1) / 5000) * 5000;

  const kmFaltantes = siguienteServicio - kmActual;



  let estado: AlertStatus = "VERDE";



  if (kmFaltantes <= 0) {

    estado = "ROJO";

  } else if (kmFaltantes <= 500) {

    estado = "AMARILLO";

  }



  return { estado, kmFaltantes, siguienteServicio };

}



export type FleetAlertNotification = {

  id: string;

  severidad: "error" | "warn";

  mensaje: string;

};



const MAX_PLACAS_EN_TOAST = 4;



function formatPlacaLine(placa: string, detalle: string) {

  return `• ${placa} — ${detalle}`;

}



function formatPlacaList(lines: string[]) {

  if (lines.length <= MAX_PLACAS_EN_TOAST) return lines.join("\n");

  const visibles = lines.slice(0, MAX_PLACAS_EN_TOAST);

  return `${visibles.join("\n")}\n• y ${lines.length - MAX_PLACAS_EN_TOAST} más…`;

}



export function getFleetAlertNotifications(

  vehiculos: VehiculoRow[],

): FleetAlertNotification[] {

  const docsError: string[] = [];

  const docsWarn: string[] = [];

  const mantError: string[] = [];

  const mantWarn: string[] = [];



  for (const vehiculo of vehiculos) {

    const docStatus = getDocumentAlertStatus(

      vehiculo.vencimiento_seguro,

      vehiculo.vencimiento_circulacion,

    );

    if (docStatus === "ROJO") {

      docsError.push(formatPlacaLine(vehiculo.placa, "vencidos o faltantes"));

    } else if (docStatus === "AMARILLO") {

      docsWarn.push(formatPlacaLine(vehiculo.placa, "próximos a vencer"));

    }



    const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);

    if (mantenimiento.estado === "ROJO") {

      mantError.push(formatPlacaLine(vehiculo.placa, "mantenimiento vencido"));

    } else if (mantenimiento.estado === "AMARILLO") {

      mantWarn.push(

        formatPlacaLine(

          vehiculo.placa,

          `servicio en ${mantenimiento.kmFaltantes.toLocaleString()} km`,

        ),

      );

    }

  }



  const notifications: FleetAlertNotification[] = [];



  if (docsError.length > 0) {

    notifications.push({

      id: "flota-docs-error",

      severidad: "error",

      mensaje: `Documentos críticos (${docsError.length})\n${formatPlacaList(docsError)}`,

    });

  }



  if (docsWarn.length > 0) {

    notifications.push({

      id: "flota-docs-warn",

      severidad: "warn",

      mensaje: `Documentos por vencer (${docsWarn.length})\n${formatPlacaList(docsWarn)}`,

    });

  }



  if (mantError.length > 0) {

    notifications.push({

      id: "flota-mant-error",

      severidad: "error",

      mensaje: `Mantenimiento vencido (${mantError.length})\n${formatPlacaList(mantError)}`,

    });

  }



  if (mantWarn.length > 0) {

    notifications.push({

      id: "flota-mant-warn",

      severidad: "warn",

      mensaje: `Mantenimiento próximo (${mantWarn.length})\n${formatPlacaList(mantWarn)}`,

    });

  }



  return notifications;

}

export type FleetAlertItem = {
  id: string;
  placa: string;
  titulo: string;
  detalle: string;
  severidad: "error" | "warn";
};

export function getFleetAllAlerts(vehiculos: VehiculoRow[]): FleetAlertItem[] {
  const alerts: FleetAlertItem[] = [];

  for (const vehiculo of vehiculos) {
    const docStatus = getDocumentAlertStatus(
      vehiculo.vencimiento_seguro,
      vehiculo.vencimiento_circulacion,
    );

    if (docStatus === "ROJO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-docs-crit`,
        placa: vehiculo.placa,
        titulo: "Documentos críticos",
        detalle: "Seguro o circulación vencidos o sin registrar",
        severidad: "error",
      });
    } else if (docStatus === "AMARILLO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-docs-warn`,
        placa: vehiculo.placa,
        titulo: "Documentos por vencer",
        detalle: "Seguro o circulación vence en los próximos 30 días",
        severidad: "warn",
      });
    }

    const mantenimiento = getMantenimientoAlertStatus(vehiculo.kilometraje_actual);

    if (mantenimiento.estado === "ROJO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-mant-crit`,
        placa: vehiculo.placa,
        titulo: "Mantenimiento vencido",
        detalle: `Servicio debió realizarse a los ${mantenimiento.siguienteServicio.toLocaleString()} km`,
        severidad: "error",
      });
    } else if (mantenimiento.estado === "AMARILLO") {
      alerts.push({
        id: `${vehiculo.id ?? vehiculo.placa}-mant-warn`,
        placa: vehiculo.placa,
        titulo: "Mantenimiento próximo",
        detalle: `Servicio programado en ${mantenimiento.kmFaltantes.toLocaleString()} km`,
        severidad: "warn",
      });
    }
  }

  return alerts;
}

export type FleetMediumAlert = FleetAlertItem;

export function getFleetMediumAlerts(vehiculos: VehiculoRow[]): FleetMediumAlert[] {
  return getFleetAllAlerts(vehiculos).filter((alerta) => alerta.severidad === "warn");
}

