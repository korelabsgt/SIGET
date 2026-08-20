import { toast } from "react-toastify";

import { showToast } from "@/lib/notifications";

import { getFleetAlertNotifications } from "./helpers";

import type { VehiculoRow } from "./zod";



const FLEET_ALERT_TOAST_IDS = [

  "flota-docs-error",

  "flota-docs-warn",

  "flota-mant-error",

  "flota-mant-warn",

] as const;



export function syncFleetAlertNotifications(vehiculos: VehiculoRow[]) {

  const notifications = getFleetAlertNotifications(vehiculos);

  const activeIds = new Set(notifications.map((item) => item.id));



  notifications
    .filter((item) => item.severidad === "error")
    .forEach(({ id, mensaje }) => {
      showToast("error", mensaje, {
        toastId: id,
        autoClose: 7000,
      });
    });



  FLEET_ALERT_TOAST_IDS.forEach((id) => {

    if (!activeIds.has(id)) toast.dismiss(id);

  });

}

