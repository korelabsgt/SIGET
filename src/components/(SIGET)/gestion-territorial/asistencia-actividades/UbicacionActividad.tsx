"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, SquarePen } from "lucide";
import { MapPin as MapPinIcon } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { modalActionMessage, toast } from "@/components/ui/general-modal";
import { formatUbicacionActividad, gpsActividadSchema, type ActividadRecord } from "./lib/zod";
import { leerPosicionActual, useGuardarGpsActividad } from "./lib/hooks";
import { cn } from "@/lib/utils";

const MapaUbicacion = dynamic(
  () => import("./MapaUbicacion").then((m) => m.MapaUbicacion),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-56 w-full animate-pulse rounded-2xl border border-border bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
    ),
  },
);

function mensajeGeo(err: unknown): string {
  if (typeof err === "object" && err && "code" in err) {
    const code = Number((err as { code: number }).code);
    if (code === 1) return "Permite el acceso a la ubicación para capturar el punto.";
    if (code === 3) return "Se agotó el tiempo para obtener la ubicación.";
  }
  if (err instanceof Error && err.message === "unsupported") {
    return "Este dispositivo no permite capturar la ubicación.";
  }
  return "No se pudo capturar la ubicación actual.";
}

export function UbicacionActividad({
  actividad,
  onAgregar,
  fill = false,
}: {
  actividad: ActividadRecord;
  onAgregar: () => void;
  fill?: boolean;
}) {
  const texto = formatUbicacionActividad(actividad);
  const guardarGps = useGuardarGpsActividad();
  const [capturando, setCapturando] = useState(false);

  const lat = actividad.latitud;
  const lng = actividad.longitud;
  const tieneGps = lat != null && lng != null;

  const handleCapturar = async () => {
    if (capturando || guardarGps.isPending) return;
    setCapturando(true);
    try {
      const pos = await leerPosicionActual();
      const parsed = gpsActividadSchema.safeParse({
        lat: pos.lat,
        lng: pos.lng,
        precision_m: pos.precision_m,
      });
      if (!parsed.success) {
        toast.error("La posición GPS no es válida.");
        return;
      }
      const res = await guardarGps.mutateAsync({
        id: actividad.id,
        values: parsed.data,
      });
      if (res.success) {
        toast.success("Punto GPS guardado.");
      } else {
        toast.error(
          modalActionMessage(
            res.error ?? undefined,
            "No se pudo guardar el punto GPS.",
          ),
        );
      }
    } catch (err) {
      toast.error(mensajeGeo(err));
    } finally {
      setCapturando(false);
    }
  };

  return (
    <div
      className={cn(
        fill
          ? "flex min-h-0 flex-1 flex-col"
          : "overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900",
      )}
    >
      <div className={cn("flex items-start gap-3", fill ? "pb-3" : "px-4 py-3")}>
        <MapPinIcon className="mt-0.5 size-4 shrink-0 text-celeste-trifinio" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Ubicación
          </p>
          {texto ? (
            <p className="text-sm font-semibold text-foreground">{texto}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dirección descriptiva pendiente
            </p>
          )}
          {tieneGps ? (
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              GPS {lat.toFixed(6)}, {lng.toFixed(6)}
              {actividad.gps_precision_m != null
                ? ` · ±${Math.round(actividad.gps_precision_m)} m`
                : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              El mapa usa el GPS del dispositivo, no la dirección escrita.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <SigetActionButton
            label="Editar"
            accentColor={sigetAccent.editar}
            morphFrom={Pencil}
            morphTo={SquarePen}
            onClick={onAgregar}
            ariaLabel="Editar dirección descriptiva"
            className="w-auto shrink-0"
          />
        </div>
      </div>
      <div className={cn("relative min-h-0", fill ? "min-h-64 flex-1" : "px-4 pb-4")}>
        <MapaUbicacion
          lat={lat}
          lng={lng}
          titulo={actividad.nombre}
          detalle={texto}
          className={fill ? "h-64 min-h-64 md:h-full md:min-h-0" : undefined}
        />
        {!tieneGps ? (
          <button
            type="button"
            onClick={handleCapturar}
            disabled={capturando}
            className={cn(
              "absolute z-10 flex cursor-pointer items-center justify-center rounded-2xl bg-card/80 px-6 text-center dark:bg-zinc-900/80 disabled:cursor-wait disabled:opacity-70",
              fill ? "inset-0" : "inset-x-4 bottom-4 top-0",
            )}
            aria-label="Capturar GPS del dispositivo"
          >
            <span className="text-sm font-semibold text-celeste-trifinio">
              {capturando
                ? "Capturando GPS…"
                : "Clic aquí para capturar el GPS del dispositivo"}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
