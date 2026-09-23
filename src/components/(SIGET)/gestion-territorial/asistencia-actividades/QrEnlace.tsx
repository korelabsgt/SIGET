"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, ExternalLink, Link2 } from "lucide";
import { QrCode } from "lucide-react";
import { toast } from "react-toastify";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import QRCodeStyling from "qr-code-styling";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";

const LOGO_TRIFINIO = "/trifinio/logo-vertical.png";

function usePantallaQrSize(open: boolean) {
  const [boxEl, setBoxEl] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState(280);

  useEffect(() => {
    if (!open || !boxEl) return;

    const update = () => {
      const { width, height } = boxEl.getBoundingClientRect();
      const reservaTituloYCerrar = 168;
      const tope = Math.min(
        width,
        Math.max(0, height - reservaTituloYCerrar),
        window.innerWidth * 0.62,
        window.innerHeight * 0.52,
        440,
      );
      setSize(Math.max(200, Math.floor(tope / 4) * 4));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(boxEl);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, boxEl]);

  return { boxRef: setBoxEl, size };
}

function useQrContainerSize(minSize = 140) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(minSize);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const { width, height } = node.getBoundingClientRect();
      const side = Math.floor(Math.min(width, height));
      setSize(Math.max(minSize, side));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [minSize]);

  return { containerRef, size };
}

function QrCodigoRender({
  url,
  size,
  margin = 10,
  rounded = true,
  conLogo = true,
}: {
  url: string;
  size: number;
  margin?: number;
  rounded?: boolean;
  conLogo?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    node.replaceChildren();

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: "canvas",
      data: url,
      margin,
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: conLogo ? "H" : "M",
      },
      dotsOptions: {
        type: "dots",
        color: "#1a4d7a",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#1a4d7a",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#1a95d3",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      ...(conLogo
        ? {
            image: LOGO_TRIFINIO,
            imageOptions: {
              crossOrigin: "anonymous" as const,
              margin: 8,
              imageSize: 0.38,
              hideBackgroundDots: true,
            },
          }
        : {}),
    });

    qr.append(node);

    return () => {
      node.replaceChildren();
    };
  }, [url, size, margin, conLogo]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "size-full overflow-hidden [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full",
        rounded && "rounded-2xl",
      )}
    />
  );
}

const QR_OVERLAY_EASE = [0.4, 0, 0.2, 1] as const;
const QR_AZUL = "#1a4d7a";

function TituloQrAjustado({
  texto,
  ancho,
}: {
  texto: string;
  ancho: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [fontPx, setFontPx] = useState(18);

  useEffect(() => {
    const el = ref.current;
    if (!el || ancho < 80) return;

    const min = 14;
    const max = Math.min(52, Math.round(ancho / 7));
    let lo = min;
    let hi = max;
    let best = min;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = `${mid}px`;
      const limite = mid * 1.25 * 2 + 2;
      if (el.scrollHeight <= limite) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    el.style.fontSize = `${best}px`;
    setFontPx(best);
  }, [texto, ancho]);

  return (
    <h2
      ref={ref}
      className="mb-5 w-full text-center font-bold leading-[1.25] break-words"
      style={{
        color: QR_AZUL,
        width: ancho,
        fontSize: fontPx,
        maxHeight: fontPx * 1.25 * 2,
        overflow: "hidden",
      }}
    >
      {texto}
    </h2>
  );
}

export function QrPantallaCompleta({
  open,
  onClose,
  url,
  titulo,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  titulo: string;
}) {
  const { boxRef, size: qrSize } = usePantallaQrSize(open);
  const reduceMotion = useReducedMotion();
  const tituloVisible = titulo.trim();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const overlayTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: QR_OVERLAY_EASE };
  const contentTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: QR_OVERLAY_EASE };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="qr-enlace-pantalla"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={overlayTransition}
          className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-white"
          onClick={onClose}
          role="presentation"
        >
          <div
            ref={boxRef}
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-8"
          >
            <div
              className="flex flex-col items-center"
              style={{ width: qrSize }}
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <TituloQrAjustado texto={tituloVisible} ancho={qrSize} />
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
                transition={contentTransition}
                className="relative aspect-square w-full shrink-0 overflow-hidden bg-white dark:bg-white"
                style={{ width: qrSize, height: qrSize }}
                role="presentation"
              >
                <QrCodigoRender url={url} size={qrSize} margin={8} rounded={false} />
              </motion.div>
              <button
                type="button"
                onClick={onClose}
                className="mt-10 w-full cursor-pointer py-3 text-center text-sm font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
                style={{ color: QR_AZUL }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function QrMini({
  onClick,
  ariaLabel,
}: {
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex w-[4.75rem] shrink-0 cursor-pointer items-center justify-center self-stretch rounded-xl border border-slate-200/80 bg-white text-celeste-trifinio transition-opacity hover:opacity-90 active:scale-[0.99] dark:border-zinc-700"
    >
      <QrCode className="size-12" strokeWidth={1.75} />
    </button>
  );
}

export function copiarEnlaceArchivo(url: string) {
  return navigator.clipboard.writeText(url).then(
    () => toast.success("Enlace copiado."),
    () => toast.error("No se pudo copiar el enlace."),
  );
}

export function QrEnlace({
  url,
  titulo,
}: {
  url: string;
  titulo: string;
}) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const { containerRef, size: qrSize } = useQrContainerSize();

  const copiarUrl = useCallback(() => {
    void copiarEnlaceArchivo(url);
  }, [url]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <p className="shrink-0 px-1 text-center text-sm font-bold leading-snug text-azul-trifinio">
          {titulo}
        </p>
        <button
          type="button"
          onClick={() => setPantallaCompleta(true)}
          aria-label="Ampliar código QR"
          className="flex min-h-0 w-full flex-1 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-90 active:scale-[0.99]"
        >
          <div
            ref={containerRef}
            className="aspect-square h-full max-h-full w-full max-w-full min-h-0 overflow-hidden rounded-2xl"
          >
            <QrCodigoRender url={url} size={qrSize} />
          </div>
        </button>
        <div className="grid w-full shrink-0 grid-cols-2 gap-2">
          <SigetActionButton
            label="Abrir"
            accentColor={sigetAccent.abrir}
            morphFrom={ExternalLink}
            morphTo={ArrowUpRight}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            ariaLabel="Abrir enlace público"
          />
          <SigetActionButton
            label="Enlace"
            accentColor={sigetAccent.enlace}
            morphFrom={Link2}
            morphTo={Check}
            onClick={copiarUrl}
            ariaLabel="Copiar enlace"
          />
        </div>
      </div>

      <QrPantallaCompleta
        open={pantallaCompleta}
        onClose={() => setPantallaCompleta(false)}
        url={url}
        titulo={titulo}
      />
    </>
  );
}
