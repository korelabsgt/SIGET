"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

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

export function GvImagenZoomViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const scaleRef = useRef(1);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const baseSizeRef = useRef({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  const syncSizer = useCallback((nextScale: number) => {
    const { w, h } = baseSizeRef.current;
    const content = contentRef.current;
    const sizer = sizerRef.current;
    if (!w || !h || !content || !sizer) return;
    content.style.transform = `scale(${nextScale})`;
    content.style.transformOrigin = "center center";
    sizer.style.width = `${w * nextScale}px`;
    sizer.style.height = `${h * nextScale}px`;
  }, []);

  const applyScale = useCallback(
    (nextScale: number, scrollEl?: HTMLDivElement | null) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      scaleRef.current = clamped;
      syncSizer(clamped);
      if (clamped === MIN_SCALE && scrollEl) {
        scrollEl.scrollLeft = 0;
        scrollEl.scrollTop = 0;
      }
      return clamped;
    },
    [syncSizer],
  );

  const measureBase = useCallback(() => {
    const img = imgRef.current;
    if (!img || img.offsetWidth <= 0 || img.offsetHeight <= 0) return;
    baseSizeRef.current = { w: img.offsetWidth, h: img.offsetHeight };
    syncSizer(scaleRef.current);
    setReady(true);
  }, [syncSizer]);

  useEffect(() => {
    scaleRef.current = MIN_SCALE;
    baseSizeRef.current = { w: 0, h: 0 };
    setReady(false);
  }, [src]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !ready) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = 1 - e.deltaY * 0.002;
      const next = scaleRef.current * factor;
      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const oldScale = scaleRef.current;
      const contentX = (el.scrollLeft + offsetX) / oldScale;
      const contentY = (el.scrollTop + offsetY) / oldScale;
      applyScale(next, el);
      el.scrollLeft = contentX * scaleRef.current - offsetX;
      el.scrollTop = contentY * scaleRef.current - offsetY;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart.current = {
          distance: getTouchDistance(e.touches),
          scale: scaleRef.current,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchStart.current) return;
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (distance <= 0 || pinchStart.current.distance <= 0) return;
      const ratio = distance / pinchStart.current.distance;
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchStart.current.scale * ratio),
      );
      const rect = el.getBoundingClientRect();
      const center = getTouchCenter(e.touches);
      const offsetX = center.x - rect.left;
      const offsetY = center.y - rect.top;
      const oldScale = scaleRef.current;
      const contentX = (el.scrollLeft + offsetX) / oldScale;
      const contentY = (el.scrollTop + offsetY) / oldScale;
      applyScale(nextScale, el);
      el.scrollLeft = contentX * scaleRef.current - offsetX;
      el.scrollTop = contentY * scaleRef.current - offsetY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) return;
      pinchStart.current = null;
      if (scaleRef.current < 1.02) {
        applyScale(MIN_SCALE, el);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [ready, applyScale]);

  const zoomStep = (factor: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = rect.width / 2;
    const offsetY = rect.height / 2;
    const oldScale = scaleRef.current;
    const contentX = (el.scrollLeft + offsetX) / oldScale;
    const contentY = (el.scrollTop + offsetY) / oldScale;
    applyScale(oldScale * factor, el);
    el.scrollLeft = contentX * scaleRef.current - offsetX;
    el.scrollTop = contentY * scaleRef.current - offsetY;
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

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 max-w-[90vw] -translate-x-1/2 text-center text-[11px] font-medium text-white/75">
        Pellizca o usa la rueda para acercar · arrastra si está ampliada
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button
          type="button"
          onClick={() => zoomStep(1 / 1.2)}
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70 disabled:opacity-40"
          aria-label="Alejar"
          disabled={!ready}
        >
          <Minus size={20} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => zoomStep(1.2)}
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/50 text-white hover:bg-black/70 disabled:opacity-40"
          aria-label="Acercar"
          disabled={!ready}
        >
          <Plus size={20} strokeWidth={2.25} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain touch-pan-x touch-pan-y [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="flex min-h-full min-w-full items-center justify-center p-4">
          <div ref={sizerRef} className="relative shrink-0">
            <div ref={contentRef} className="flex items-center justify-center">
              <img
                ref={imgRef}
                src={src}
                alt={alt}
                onLoad={measureBase}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={() => {
                  const el = scrollRef.current;
                  if (!el) return;
                  if (scaleRef.current > 1.05) {
                    applyScale(MIN_SCALE, el);
                    return;
                  }
                  zoomStep(2.2);
                }}
                className="max-h-[92dvh] max-w-[min(92vw,64rem)] select-none object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
