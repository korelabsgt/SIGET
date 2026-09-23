"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface ManualPdfMobileViewerProps {
  url: string;
  onLoadError?: (message: string) => void;
  desktopFitHeight?: boolean;
}

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

export default function ManualPdfMobileViewer({
  url,
  onLoadError,
  desktopFitHeight = false,
}: ManualPdfMobileViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const scaleRef = useRef(1);
  const baseWidthRef = useRef(0);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const isPinching = useRef(false);

  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [scale, setScale] = useState(1);
  const [fitHeight, setFitHeight] = useState(false);

  const baseWidth = pageWidth > 0 ? pageWidth - 16 : 0;
  const baseHeight = pageHeight > 0 ? pageHeight - 96 : 0;

  const syncSizer = useCallback((nextScale: number) => {
    const w = baseWidthRef.current;
    const sizer = sizerRef.current;
    const content = contentRef.current;
    if (!w || !sizer || !content) return;

    content.style.transform = `scale(${nextScale})`;
    content.style.transformOrigin = "top left";
    sizer.style.width = `${w * nextScale}px`;
    sizer.style.height = `${content.offsetHeight * nextScale}px`;
  }, []);

  const applyScale = useCallback(
    (nextScale: number, scrollEl?: HTMLDivElement | null) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      scaleRef.current = clamped;
      setScale(clamped);
      syncSizer(clamped);

      if (clamped === MIN_SCALE && scrollEl) {
        scrollEl.scrollLeft = 0;
      }

      return clamped;
    },
    [syncSizer],
  );


  useEffect(() => {
    baseWidthRef.current = baseWidth;
    syncSizer(scaleRef.current);
  }, [baseWidth, syncSizer]);

  useEffect(() => {
    if (numPages > 0) {
      requestAnimationFrame(() => syncSizer(scaleRef.current));
    }
  }, [numPages, syncSizer]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const desktop =
        desktopFitHeight && window.matchMedia("(min-width: 768px)").matches;
      setFitHeight(desktop);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0) setPageWidth(w);
      if (h > 0) setPageHeight(h);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, [desktopFitHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching.current = true;
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

      el.scrollLeft = contentX * nextScale - offsetX;
      el.scrollTop = contentY * nextScale - offsetY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length >= 2) return;

      isPinching.current = false;
      pinchStart.current = null;

      if (scaleRef.current < 1.02) {
        applyScale(MIN_SCALE, el);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyScale]);

  const scrollToPage = (pageNumber: number) => {
    pageRefs.current.get(pageNumber)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-auto overscroll-contain"
      style={{ touchAction: scale > MIN_SCALE ? "pan-x pan-y" : "pan-y" }}
    >
      <div ref={sizerRef} className="relative mx-auto" style={{ width: baseWidth || undefined }}>
        <div
          ref={contentRef}
          className="inline-block origin-top-left px-2 py-3"
          style={{ width: baseWidth || undefined }}
        >
          <Document
            file={url}
            onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            onLoadError={(error) => {
              const message =
                error?.message ??
                "No se pudo renderizar el PDF en este dispositivo.";
              onLoadError?.(message);
            }}
            onItemClick={({ pageNumber }) => {
              if (!isPinching.current) scrollToPage(pageNumber);
            }}
            loading={
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
              </div>
            }
            error={
              <div className="flex min-h-48 items-center justify-center px-6 text-center">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  No se pudo cargar el manual.
                </p>
              </div>
            }
            className="flex flex-col items-center gap-3"
          >
            {((fitHeight && baseHeight > 0) || (!fitHeight && baseWidth > 0)) &&
              Array.from({ length: numPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <div
                    key={`page-${pageNumber}`}
                    ref={(node) => {
                      if (node) pageRefs.current.set(pageNumber, node);
                      else pageRefs.current.delete(pageNumber);
                    }}
                    className="relative"
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={fitHeight ? undefined : baseWidth}
                      height={fitHeight ? baseHeight : undefined}
                      renderTextLayer={false}
                      renderAnnotationLayer
                      className="bg-white shadow-md"
                      onRenderSuccess={() => syncSizer(scaleRef.current)}
                      loading={
                        <div
                          className="flex items-center justify-center bg-white dark:bg-zinc-800"
                          style={
                            fitHeight
                              ? { height: baseHeight, width: baseHeight / 1.414 }
                              : { width: baseWidth, height: baseWidth * 1.414 }
                          }
                        >
                          <Loader2 className="size-6 animate-spin text-celeste-trifinio" />
                        </div>
                      }
                    />
                  </div>
                );
              })}
          </Document>
        </div>
      </div>
    </div>
  );
}
