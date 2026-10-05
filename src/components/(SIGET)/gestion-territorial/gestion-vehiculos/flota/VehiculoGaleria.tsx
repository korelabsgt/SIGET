"use client";

import { useEffect, useState } from "react";
import { Car, CarFront, Loader2, Plus } from "lucide";
import { ZoomIn } from "lucide-react";
import { GvImagenAmpliada } from "../lib/gv-imagen-ampliada";
import { GvMorphIcon } from "../lib/morph-icon";
import { GV_DETALLE_NESTED_CLASS } from "../lib/detalle-ui";
import { type VehiculoRow } from "./lib/zod";
import {
  combinarFotosVehiculo,
  esFotoSeguroVehiculo,
  esFotoTarjetaCirculacion,
  separarFotosVehiculo,
} from "./lib/helpers";
import {
  resolveStorageDisplaySrc,
  useSignedStorageUrls,
} from "../lib/storage-hooks";
import { cn } from "@/lib/utils";

export function VehiculoGaleria({
  vehiculo,
  onEdit,
  canManage = false,
  className,
}: {
  vehiculo: VehiculoRow;
  onEdit?: (vehiculo: VehiculoRow) => void;
  canManage?: boolean;
  className?: string;
}) {
  const tituloVehiculo = `${vehiculo.marca} ${vehiculo.modelo}`;
  const { unidad, tarjetasCirculacion, fotoSeguro } = separarFotosVehiculo(vehiculo);
  const fotos = combinarFotosVehiculo(unidad, tarjetasCirculacion, fotoSeguro);
  const { data: signedMap = {}, isLoading: firmandoFotos } = useSignedStorageUrls(fotos);
  const fotosConSrc = fotos
    .map((path) => ({
      path,
      src: resolveStorageDisplaySrc(path, signedMap),
      esTarjeta: esFotoTarjetaCirculacion(path),
      esSeguro: esFotoSeguroVehiculo(path),
    }))
    .filter((item) => item.src.length > 0);
  const [fotoRota, setFotoRota] = useState(false);
  const [indice, setIndice] = useState(0);
  const fotoActiva = fotosConSrc[indice] ?? fotosConSrc[0] ?? null;
  const mostrarFoto = Boolean(fotoActiva) && !fotoRota && !firmandoFotos;
  useEffect(() => {
    setFotoRota(false);
    setIndice(0);
  }, [vehiculo.id, fotos.join("|")]);

  useEffect(() => {
    if (indice >= fotosConSrc.length) setIndice(0);
  }, [fotosConSrc.length, indice]);

  return (
    <div className={cn(GV_DETALLE_NESTED_CLASS, className)} data-morph-hover-scope>
      {fotosConSrc.length > 0 || canManage ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {fotosConSrc.map((item, index) => {
            const activa = index === indice && !fotoRota && mostrarFoto;
            return (
              <button
                key={`${item.path}-${index}`}
                type="button"
                onClick={() => {
                  setFotoRota(false);
                  setIndice(index);
                }}
                className={cn(
                  "relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border-0 p-0",
                  activa ? "ring-2 ring-celeste-trifinio" : "opacity-55 hover:opacity-100",
                )}
                aria-label={
                  item.esSeguro
                    ? "Ver seguro"
                    : item.esTarjeta
                      ? "Ver tarjeta de circulación"
                      : `Ver fotografía ${index + 1}`
                }
                aria-pressed={activa}
              >
                <img src={item.src} alt="" className="size-full object-cover" />
                {item.esSeguro ? (
                  <span className="absolute inset-x-0 bottom-0 bg-emerald-600/90 py-px text-center text-[7px] font-bold uppercase tracking-wide text-white">
                    Seguro
                  </span>
                ) : item.esTarjeta ? (
                  <span className="absolute inset-x-0 bottom-0 bg-celeste-trifinio/90 py-px text-center text-[7px] font-bold uppercase tracking-wide text-white">
                    Circ.
                  </span>
                ) : null}
              </button>
            );
          })}
          {canManage && onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(vehiculo)}
              className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/40 bg-sky-50/60 text-celeste-trifinio hover:bg-sky-100 dark:border-zinc-700 dark:bg-sky-950/20 dark:hover:bg-sky-950/40"
              aria-label="Agregar fotografías"
            >
              <GvMorphIcon icon={Plus} size={20} morphOnHover={false} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sky-50/60 dark:bg-sky-950/20">
        {firmandoFotos && fotos.length > 0 ? (
          <div className="flex size-full items-center justify-center text-celeste-trifinio">
          <span className="inline-flex animate-spin">
            <GvMorphIcon icon={Loader2} size={32} morphOnHover={false} className="text-celeste-trifinio" />
          </span>
          </div>
        ) : mostrarFoto ? (
          <>
            <GvImagenAmpliada
              src={fotoActiva?.src ?? ""}
              alt={
                fotoActiva?.esTarjeta
                  ? `Tarjeta de circulación de ${vehiculo.placa}`
                  : `Fotografía de ${tituloVehiculo}`
              }
              onError={() => setFotoRota(true)}
              fillParent
              thumbClassName="absolute inset-0 size-full hover:opacity-100"
            />
            {fotoActiva?.esTarjeta ? (
              <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-celeste-trifinio px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Tarjeta de circulación
              </span>
            ) : null}
            <span className="pointer-events-none absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              <ZoomIn className="size-3 shrink-0" aria-hidden />
              Ampliar
            </span>
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-celeste-trifinio">
            <GvMorphIcon icon={Car} hoverIcon={CarFront} size={40} />
            <p className="text-sm font-medium text-muted-foreground">Sin fotografía</p>
            {canManage && onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(vehiculo)}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border-0 bg-celeste-trifinio px-4 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                Agregar foto
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
