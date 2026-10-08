"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCw, X } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) return 0;
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

function getTouchCenter(touches: TouchList) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

type TransformState = {
  scale: number;
  panX: number;
  panY: number;
  rotation: number;
};

export function GvImagenZoomViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<TransformState>({
    scale: MIN_SCALE,
    panX: 0,
    panY: 0,
    rotation: 0,
  });
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  const applyTransformToDom = useCallback((t: TransformState) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.transform = `translate(calc(-50% + ${t.panX}px), calc(-50% + ${t.panY}px)) rotate(${t.rotation}deg) scale(${t.scale})`;
  }, []);

  const setTransform = useCallback(
    (patch: Partial<TransformState> | ((prev: TransformState) => TransformState)) => {
      const next =
        typeof patch === "function"
          ? patch(transformRef.current)
          : { ...transformRef.current, ...patch };
      transformRef.current = next;
      applyTransformToDom(next);
      return next;
    },
    [applyTransformToDom],
  );

  const resetView = useCallback(() => {
    setTransform({ scale: MIN_SCALE, panX: 0, panY: 0 });
  }, [setTransform]);

  const zoomAtViewportPoint = useCallback(
    (nextScale: number, focalX: number, focalY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const fx = focalX - rect.left - cx;
      const fy = focalY - rect.top - cy;
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      setTransform((prev) => {
        const oldScale = prev.scale;
        if (clamped === MIN_SCALE && oldScale === MIN_SCALE) {
          return { ...prev, panX: 0, panY: 0 };
        }
        const ix = (fx - prev.panX) / oldScale;
        const iy = (fy - prev.panY) / oldScale;
        const panX = clamped <= MIN_SCALE ? 0 : fx - ix * clamped;
        const panY = clamped <= MIN_SCALE ? 0 : fy - iy * clamped;
        return { ...prev, scale: clamped, panX, panY };
      });
    },
    [setTransform],
  );

  useEffect(() => {
    transformRef.current = { scale: MIN_SCALE, panX: 0, panY: 0, rotation: 0 };
    setReady(false);
    applyTransformToDom(transformRef.current);
  }, [src, applyTransformToDom]);

  const onImageReady = useCallback(() => {
    resetView();
    setReady(true);
  }, [resetView]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !ready) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = 1 - e.deltaY * 0.002;
      zoomAtViewportPoint(transformRef.current.scale * factor, e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        panStart.current = null;
        pinchStart.current = {
          distance: getTouchDistance(e.touches),
          scale: transformRef.current.scale,
        };
        return;
      }
      if (e.touches.length === 1 && transformRef.current.scale > MIN_SCALE + 0.02) {
        pinchStart.current = null;
        panStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          panX: transformRef.current.panX,
          panY: transformRef.current.panY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart.current) {
        e.preventDefault();
        const distance = getTouchDistance(e.touches);
        if (distance <= 0 || pinchStart.current.distance <= 0) return;
        const ratio = distance / pinchStart.current.distance;
        const nextScale = pinchStart.current.scale * ratio;
        const center = getTouchCenter(e.touches);
        zoomAtViewportPoint(nextScale, center.x, center.y);
        return;
      }
      if (e.touches.length === 1 && panStart.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - panStart.current.x;
        const dy = e.touches[0].clientY - panStart.current.y;
        setTransform({
          panX: panStart.current.panX + dx,
          panY: panStart.current.panY + dy,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) return;
      pinchStart.current = null;
      panStart.current = null;
      if (transformRef.current.scale < MIN_SCALE + 0.02) {
        resetView();
      }
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("touchstart", onTouchStart, { passive: false });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ready, zoomAtViewportPoint, setTransform, resetView]);

  const zoomStep = (factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAtViewportPoint(
      transformRef.current.scale * factor,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
  };

  const rotateImage = () => {
    const nextRotation = (transformRef.current.rotation + 90) % 360;
    setTransform({
      rotation: nextRotation,
      scale: MIN_SCALE,
      panX: 0,
      panY: 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex flex-col bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70"
        aria-label="Cerrar"
      >
        <X size={22} strokeWidth={2.25} />
      </button>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 max-w-[90vw] -translate-x-1/2 px-2 text-center text-[11px] font-medium leading-snug text-white/75">
        <span className="md:hidden">
          Pellizca donde quieras acercar · arrastra · girar
        </span>
        <span className="hidden md:inline">
          Rueda o botones para zoom · arrastra si está ampliada
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 md:flex-row md:items-center">
        <button
          type="button"
          onClick={rotateImage}
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70 disabled:opacity-40"
          aria-label="Girar imagen"
          disabled={!ready}
        >
          <RotateCw size={20} strokeWidth={2.25} />
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => zoomStep(1 / 1.25)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70 disabled:opacity-40"
            aria-label="Alejar"
            disabled={!ready}
          >
            <Minus size={20} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => zoomStep(1.25)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70 disabled:opacity-40"
            aria-label="Acercar"
          >
            <Plus size={20} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 max-h-[92dvh] max-w-[min(92vw,64rem)] will-change-transform"
          style={{ transformOrigin: "center center" }}
        >
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={onImageReady}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={() => {
              if (transformRef.current.scale > MIN_SCALE + 0.05) {
                resetView();
                return;
              }
              const viewport = viewportRef.current;
              if (!viewport) return;
              const rect = viewport.getBoundingClientRect();
              zoomAtViewportPoint(
                2.2,
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
              );
            }}
            className="max-h-[92dvh] max-w-[min(92vw,64rem)] select-none object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
