"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, ExternalLink, Link2, Lock, LockOpen } from "lucide";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import QRCodeStyling from "qr-code-styling";
import {
  SigetActionButton,
  SigetActionIcon,
  sigetAccent,
  sigetBtnSurface,
} from "@/components/ui/siget-action-button";
import { RippleButton } from "@/components/ui/ripple-button";
import { cn } from "@/lib/utils";

const LOGO_TRIFINIO = "/trifinio/logo-vertical.png";

function usePantallaQrSize(open: boolean) {
  const [size, setSize] = useState(300);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const side = Math.min(
        window.innerWidth - 32,
        window.innerHeight - 168,
      );
      setSize(Math.max(200, Math.floor(side)));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  return size;
}

function useQrContainerSize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(200);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const { width, height } = node.getBoundingClientRect();
      const side = Math.floor(Math.min(width, height));
      setSize(Math.max(140, side));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
}

function QrCodigoRender({
  url,
  size,
  margin = 10,
  rounded = true,
}: {
  url: string;
  size: number;
  margin?: number;
  rounded?: boolean;
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
        errorCorrectionLevel: "H",
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
      image: LOGO_TRIFINIO,
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: 0.38,
        hideBackgroundDots: true,
      },
    });

    qr.append(node);

    return () => {
      node.replaceChildren();
    };
  }, [url, size, margin]);

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

function QrPantallaCompleta({
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
  const qrSize = usePantallaQrSize(open);
  const reduceMotion = useReducedMotion();

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
          key="qr-pantalla-completa"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={overlayTransition}
          className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-white"
          onClick={onClose}
          role="presentation"
        >
          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={chromeTransition}
            className="relative shrink-0 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-6"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-14 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-celeste-trifinio transition-colors hover:bg-zinc-200 md:right-6"
              aria-label="Cerrar"
            >
              <X size={40} strokeWidth={2.5} />
            </button>
            <div className="px-16 text-center">
              <h2 className="text-base font-bold leading-snug text-zinc-900 md:text-lg">
                {titulo}
              </h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                Código QR de asistencia
              </p>
            </div>
          </motion.header>

          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            <motion.div
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.88 }
              }
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

const qrAccent = sigetAccent;

function QrFrameEstado({
  checked,
  pending,
  onCheckedChange,
}: {
  checked: boolean;
  pending: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const label = checked ? "Activa" : "Inactiva";
  const accentColor = checked ? qrAccent.activa : qrAccent.inactiva;
  const stateTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeInOut" as const };

  return (
    <RippleButton
      rippleColor="#E5E7EB"
      onClick={() => onCheckedChange(!checked)}
      aria-label={label}
      role="switch"
      aria-checked={checked}
      aria-busy={pending || undefined}
      disabled={pending}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(sigetBtnSurface, "w-full", pending && "pointer-events-none opacity-60")}
    >
      <span className="inline-flex w-full max-w-full items-center justify-center gap-1 leading-none">
        <span className="relative inline-grid shrink-0 leading-none">
          <span className="invisible col-start-1 row-start-1 truncate" aria-hidden>
            Inactiva
          </span>
          <span className="relative col-start-1 row-start-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={label}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1, color: accentColor }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={stateTransition}
                className="block truncate leading-none"
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
        <motion.span
          animate={{ color: accentColor }}
          transition={stateTransition}
          className="inline-flex shrink-0"
        >
          <SigetActionIcon
            from={checked ? LockOpen : Lock}
            to={checked ? Lock : LockOpen}
            color={accentColor}
            hovered={hovered}
          />
        </motion.span>
      </span>
    </RippleButton>
  );
}

function QrAcciones({
  url,
  activo,
  activoPending,
  onActivoChange,
}: {
  url: string;
  activo: boolean;
  activoPending: boolean;
  onActivoChange: (checked: boolean) => void;
}) {
  const copiarUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }, [url]);

  return (
    <div className="grid w-full grid-cols-3 gap-2">
      <SigetActionButton
        label="Abrir"
        accentColor={qrAccent.abrir}
        morphFrom={ExternalLink}
        morphTo={ArrowUpRight}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        ariaLabel="Abrir enlace de asistencia"
      />
      <SigetActionButton
        label="Enlace"
        accentColor={qrAccent.enlace}
        morphFrom={Link2}
        morphTo={Check}
        onClick={copiarUrl}
        ariaLabel="Copiar enlace"
      />
      <QrFrameEstado
        checked={activo}
        pending={activoPending}
        onCheckedChange={onActivoChange}
      />
    </div>
  );
}

export function QrActividad({
  actividadSlug,
  nombreActividad,
  showNombre = true,
  activo,
  activoPending = false,
  onActivoChange,
}: {
  actividadSlug: string;
  nombreActividad: string;
  showNombre?: boolean;
  activo: boolean;
  activoPending?: boolean;
  onActivoChange: (checked: boolean) => void;
}) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const { containerRef, size: qrSize } = useQrContainerSize();

  const url = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/actividades/${actividadSlug}`;
    }
    return `/actividades/${actividadSlug}`;
  }, [actividadSlug]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {showNombre ? (
          <p className="shrink-0 px-1 text-center text-sm font-bold leading-snug text-azul-trifinio">
            {nombreActividad}
          </p>
        ) : null}
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
        <div className="shrink-0">
          <QrAcciones
            url={url}
            activo={activo}
            activoPending={activoPending}
            onActivoChange={onActivoChange}
          />
        </div>
      </div>

      <QrPantallaCompleta
        open={pantallaCompleta}
        onClose={() => setPantallaCompleta(false)}
        url={url}
        titulo={nombreActividad}
      />
    </>
  );
}
