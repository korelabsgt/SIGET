"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, RotateCw, Undo2 } from "lucide";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import {
  ModalShell,
  ModalFooter,
  ModalCancelButton,
  modalAccentClass,
  toast,
} from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cropImage, type PixelCrop } from "@/components/(base)/imgs/cropImage";
import { cn } from "@/lib/utils";
import {
  NOTICIA_ASPECT_OPTIONS,
  NOTICIA_MAX_IMAGEN_BYTES,
  compressNoticiaImagen,
  noticiaAspectValue,
  noticiaCropBoxClass,
  type NoticiaAspectId,
} from "../lib/noticia-imagen";

const ZOOM_MAX = 3;
const ZOOM_FLOOR = 0.2;

export function NoticiaFotoCropper({
  open,
  imageSrc,
  onClose,
  onApply,
  lockedAspectId = null,
}: {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (file: File, aspectId: NoticiaAspectId) => Promise<void> | void;
  lockedAspectId?: NoticiaAspectId | null;
}) {
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(ZOOM_FLOOR);
  const [rotation, setRotation] = useState(0);
  const [aspectId, setAspectId] = useState<NoticiaAspectId>("seccion");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [pending, setPending] = useState(false);

  const activeAspectId = lockedAspectId ?? aspectId;
  const aspect = useMemo(() => noticiaAspectValue(activeAspectId), [activeAspectId]);
  const cropBoxClass = noticiaCropBoxClass(activeAspectId);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspectId(lockedAspectId ?? "seccion");
    setCroppedAreaPixels(null);
  }, [open, imageSrc, lockedAspectId]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleMediaLoaded = useCallback(
    (mediaSize: {
      width: number;
      height: number;
      naturalWidth: number;
      naturalHeight: number;
    }) => {
      const el = cropContainerRef.current;
      if (!el) return;
      const { width: containerWidth, height: containerHeight } = el.getBoundingClientRect();
      if (!containerWidth || !containerHeight) return;
      const fitZoom = Math.min(
        containerWidth / mediaSize.width,
        containerHeight / mediaSize.height,
      );
      const computedMin = Math.max(ZOOM_FLOOR, fitZoom * 0.45);
      setMinZoom(computedMin);
      setZoom(Math.min(1, Math.max(computedMin, fitZoom * 0.98)));
      setCrop({ x: 0, y: 0 });
    },
    [],
  );

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setPending(true);
    try {
      const blob = await cropImage(imageSrc, croppedAreaPixels, rotation, {
        fillWhite: false,
      });
      let file = new File([blob], "noticia.png", {
        type: blob.type || "image/png",
      });
      file = await compressNoticiaImagen(file);
      if (file.size > NOTICIA_MAX_IMAGEN_BYTES) {
        toast.error("La foto supera los 200 KB. Prueba otra o recorta más cerca.");
        return;
      }
      await onApply(file, activeAspectId);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo recortar la foto.");
    } finally {
      setPending(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={() => {
        if (!pending) onClose();
      }}
      title="Recortar"
      maxWidth="max-w-2xl"
      contentClassName="space-y-4 p-4 md:p-6"
    >
      <p className={`text-xs font-bold uppercase tracking-wider ${modalAccentClass}`}>
        Proporción
      </p>
      {lockedAspectId ? (
        <p className="text-xs text-muted-foreground">
          Misma proporción que las demás fotos de esta sección (
          {NOTICIA_ASPECT_OPTIONS.find((item) => item.id === lockedAspectId)?.label ??
            lockedAspectId}
          ).
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {NOTICIA_ASPECT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setAspectId(option.id);
                setCrop({ x: 0, y: 0 });
              }}
              className={cn(
                "h-9 cursor-pointer rounded-lg border-2 px-2.5 text-xs font-bold",
                aspectId === option.id
                  ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                  : "border-border text-muted-foreground hover:border-celeste-trifinio/50 dark:border-zinc-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      <div ref={cropContainerRef} className={cropBoxClass}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={ZOOM_MAX}
          rotation={rotation}
          aspect={aspect}
          objectFit="contain"
          restrictPosition={false}
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onMediaLoaded={handleMediaLoaded}
          style={{
            containerStyle: { background: "transparent" },
            mediaStyle: { background: "transparent" },
            cropAreaStyle: { border: "2px solid #1a95d3" },
          }}
        />
      </div>
      <div className="flex w-full items-stretch gap-2">
        <SigetActionButton
          label="Reset"
          accentColor={sigetAccent.cancelar}
          morphFrom={Undo2}
          morphTo={Undo2}
          onClick={() => {
            setRotation(0);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          }}
          disabled={pending}
          className="w-auto shrink-0"
        />
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border-2 border-border bg-white px-2.5 dark:border-zinc-700 dark:bg-card">
          <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={minZoom}
            max={ZOOM_MAX}
            step={0.05}
            value={Math.max(minZoom, Math.min(ZOOM_MAX, zoom))}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="min-w-0 flex-1 accent-celeste-trifinio"
          />
          <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <SigetActionButton
          label="Rotar"
          accentColor={sigetAccent.editar}
          morphFrom={RotateCw}
          morphTo={RotateCw}
          onClick={() => {
            setRotation((r) => r + 90);
            setCrop({ x: 0, y: 0 });
          }}
          disabled={pending}
          className="w-auto shrink-0"
        />
      </div>
      {pending ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-celeste-trifinio" />
          Optimizando a WebP (máx. 200 KB)…
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Mueve y recorta. Se guarda en WebP, máximo 200 KB.
        </p>
      )}
      <ModalFooter>
        <ModalCancelButton onClick={onClose} disabled={pending} />
        <SigetActionButton
          label="Guardar"
          accentColor={sigetAccent.guardar}
          morphFrom={Check}
          morphTo={Check}
          morphOnHover={false}
          disabled={pending || !croppedAreaPixels}
          onClick={() => void handleApply()}
          className="w-auto shrink-0"
        />
      </ModalFooter>
    </ModalShell>
  );
}
