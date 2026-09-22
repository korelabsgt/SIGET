"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, ExternalLink, Link2 } from "lucide";
import { QrCode, X } from "lucide-react";
import { toast } from "react-toastify";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import QRCodeStyling from "qr-code-styling";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";

const LOGO_TRIFINIO = "/trifinio/logo-vertical.png";

function usePantallaQrSize(open: boolean) {
  const [boxEl, setBoxEl] = useState<HTMLDivElement | null>(null);
  const [titleEl, setTitleEl] = useState<HTMLHeadingElement | null>(null);
  const [size, setSize] = useState(280);

  useEffect(() => {
    if (!open || !boxEl) return;

    const update = () => {
      const { width, height } = boxEl.getBoundingClientRect();
      const tituloAlto = titleEl?.getBoundingClientRect().height ?? 0;
      const lado = Math.min(width, Math.max(0, height - tituloAlto - 16));
      setSize(Math.max(160, Math.floor(lado)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(boxEl);
    if (titleEl) observer.observe(titleEl);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, boxEl, titleEl]);

  return { boxRef: setBoxEl, titleRef: setTitleEl, size };
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
      type: "svg",
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
        "size-full [&_svg]:block [&_svg]:size-full",
        rounded && "overflow-hidden rounded-2xl",
      )}
    />
  );
}

const QR_OVERLAY_EASE = [0.4, 0, 0.2, 1] as const;

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
  const { boxRef, titleRef, size: qrSize } = usePantallaQrSize(open);
  const reduceMotion = useReducedMotion();
  const tituloVisible = titulo.replace(/_/g, " ").trim();

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
  const chromeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: QR_OVERLAY_EASE, delay: 0.06 };

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
          <button
            type="button"
            onClick={onClose}
            className="absolute right-[5%] top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-celeste-trifinio transition-colors hover:bg-zinc-200"
            aria-label="Cerrar"
          >
            <X size={28} strokeWidth={2.5} />
          </button>

          <div
            ref={boxRef}
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-[5%] pt-14 pb-2"
          >
            <h2
              ref={titleRef}
              className="mb-4 w-[90%] shrink-0 text-center text-base font-bold leading-tight break-words text-azul-trifinio sm:text-lg md:text-xl"
            >
              {tituloVisible}
            </h2>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
              transition={contentTransition}
              className="relative shrink-0 bg-white dark:bg-white"
              style={{ width: qrSize, height: qrSize }}
              onClick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <QrCodigoRender url={url} size={qrSize} margin={0} rounded={false} />
            </motion.div>
          </div>

          <motion.footer
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={chromeTransition}
            className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
          >
            <button
              type="button"
              onClick={onClose}
              className="mx-auto flex w-full max-w-xs cursor-pointer items-center justify-center py-3 text-sm font-bold uppercase tracking-[0.2em] text-celeste-trifinio transition-opacity hover:opacity-80"
            >
              Cerrar
            </button>
          </motion.footer>
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
