"use client";

import { useEffect, useState } from "react";
import { Car, CarFront, Loader2, Plus, Trash, Trash2 } from "lucide";
import { toast } from "react-toastify";
import { confirmDestructivo } from "@/lib/confirm-destructivo";
import { GvMorphIcon } from "../lib/morph-icon";
import { GV_DETALLE_NESTED_CLASS } from "../lib/detalle-ui";
import { useGvPermissionRole } from "../lib/gv-permissions-hook";
import { canDeleteVehiculoFotos } from "../lib/permissions";
import { type VehiculoRow } from "./lib/zod";
import { fotosVehiculo, MIN_FOTOS_VEHICULO } from "./lib/helpers";
import { useQuitarImagenVehiculo } from "./lib/hooks";
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
  const gvRole = useGvPermissionRole();
  const canDeleteFoto = canDeleteVehiculoFotos(gvRole);
  const tituloVehiculo = `${vehiculo.marca} ${vehiculo.modelo}`;
  const fotos = fotosVehiculo(vehiculo);
  const { data: signedMap = {}, isLoading: firmandoFotos } = useSignedStorageUrls(fotos);
  const fotosConSrc = fotos
    .map((path) => ({
      path,
      src: resolveStorageDisplaySrc(path, signedMap),
    }))
    .filter((item) => item.src.length > 0);
  const [fotoRota, setFotoRota] = useState(false);
  const [indice, setIndice] = useState(0);
  const fotoActiva = fotosConSrc[indice] ?? fotosConSrc[0] ?? null;
  const mostrarFoto = Boolean(fotoActiva) && !fotoRota && !firmandoFotos;
  const quitarImagen = useQuitarImagenVehiculo();

  useEffect(() => {
    setFotoRota(false);
    setIndice(0);
  }, [vehiculo.id, fotos.join("|")]);

  useEffect(() => {
    if (indice >= fotosConSrc.length) setIndice(0);
  }, [fotosConSrc.length, indice]);

  const handleQuitarFoto = async (path: string) => {
    if (!canDeleteFoto) return;
    if (!vehiculo.id) return;
    if (fotos.length <= MIN_FOTOS_VEHICULO) {
      toast.warn("Debes conservar al menos una fotografía del vehículo.");
      return;
    }
    const res = await confirmDestructivo({
      title: "¿Eliminar fotografía?",
      text: "Se quitará de la galería y del almacenamiento.",
      confirmButtonText: "Sí, eliminar",
    });
    if (!res.isConfirmed) return;
    try {
      await quitarImagen.mutateAsync({ id: vehiculo.id, path });
      toast.success("Fotografía eliminada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar la fotografía.",
      );
    }
  };

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
                aria-label={`Ver fotografía ${index + 1}`}
                aria-pressed={activa}
              >
                <img src={item.src} alt="" className="size-full object-cover" />
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
            <img
              src={fotoActiva?.src ?? ""}
              alt={tituloVehiculo}
              onError={() => setFotoRota(true)}
              className="size-full object-cover object-center"
            />
            {canDeleteFoto ? (
              <button
                type="button"
                disabled={quitarImagen.isPending}
                onClick={() => {
                  if (fotoActiva?.path) void handleQuitarFoto(fotoActiva.path);
                }}
                className="absolute left-2 top-2 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-red-100 text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                aria-label="Eliminar fotografía"
              >
                <GvMorphIcon icon={Trash2} hoverIcon={Trash} size={16} />
              </button>
            ) : null}
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
