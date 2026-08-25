"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, Copy, ExternalLink } from "lucide";
import type { IconNode } from "lucide";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import QRCodeStyling from "qr-code-styling";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";

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

function QrCodigoRender({
  url,
  size,
  margin = 10,
}: {
  url: string;
  size: number;
  margin?: number;
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
      className="size-full [&_svg]:block [&_svg]:size-full"
    />
  );
}

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/50 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <header className="relative shrink-0 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] md:px-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-14 cursor-pointer items-center justify-center rounded-full bg-white/95 text-celeste-trifinio shadow-md transition-colors hover:bg-white dark:bg-zinc-800/95 dark:hover:bg-zinc-800 md:right-6"
          aria-label="Cerrar"
        >
          <X size={40} strokeWidth={2.5} />
        </button>
        <div className="px-16 text-center">
          <h2 className="text-base font-bold leading-snug text-white md:text-lg">
            {titulo}
          </h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
            Código QR de asistencia
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div
          className="relative shrink-0 overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-50"
          style={{ width: qrSize, height: qrSize }}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <QrCodigoRender url={url} size={qrSize} margin={0} />
        </div>
      </div>

      <footer className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={onClose}
          className="mx-auto flex w-full max-w-xs cursor-pointer items-center justify-center py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-80"
        >
          Cerrar
        </button>
      </footer>
    </div>,
    document.body,
  );
}

function UrlAccion({
  label,
  morphFrom,
  morphTo,
  onClick,
  href,
  ariaLabel,
}: {
  label: string;
  morphFrom: IconNode;
  morphTo: IconNode;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const className =
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3.5 text-foreground transition-colors hover:bg-zinc-100 active:scale-[0.99] dark:bg-zinc-800/60 dark:hover:bg-zinc-800";

  const content = (
    <>
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
      <MorphHoverIcon
        from={morphFrom}
        to={morphTo}
        size={16}
        color="#1a95d3"
        strokeWidth={2}
        spring="snappy"
        hovered={hovered}
      />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {content}
    </button>
  );
}

function UrlConCopiar({ url }: { url: string }) {
  const copiarUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }, [url]);

  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <UrlAccion
        label="Abrir enlace"
        href={url}
        morphFrom={ExternalLink}
        morphTo={ArrowUpRight}
      />
      <UrlAccion
        label="Copiar"
        morphFrom={Copy}
        morphTo={Check}
        onClick={copiarUrl}
        ariaLabel="Copiar enlace"
      />
    </div>
  );
}

export function QrActividad({
  actividadSlug,
  nombreActividad,
  size = 220,
  showNombre = true,
}: {
  actividadSlug: string;
  nombreActividad: string;
  size?: number;
  showNombre?: boolean;
}) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const url = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/actividades/${actividadSlug}`;
    }
    return `/actividades/${actividadSlug}`;
  }, [actividadSlug]);

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-5">
        {showNombre ? (
          <p className="max-w-xs text-center text-sm font-black leading-snug text-foreground">
            {nombreActividad}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setPantallaCompleta(true)}
          aria-label="Ampliar código QR"
          className="mx-auto w-fit cursor-pointer rounded-2xl bg-white p-3 transition-opacity hover:opacity-90 active:scale-[0.99] dark:bg-zinc-50"
        >
          <QrCodigoRender url={url} size={size} />
        </button>
        <UrlConCopiar url={url} />
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
