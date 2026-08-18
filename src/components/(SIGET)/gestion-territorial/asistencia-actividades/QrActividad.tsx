"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Copy } from "lucide-react";
import { toast } from "react-toastify";
import QRCodeStyling from "qr-code-styling";
import { ModalShell } from "@/components/ui/general-modal";

const LOGO_TRIFINIO = "/trifinio/logo-vertical.png";

function useQrSize(
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const [size, setSize] = useState(280);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const available = Math.min(width, height);
      setSize(Math.max(160, Math.floor(available)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

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
    <div className="flex w-full max-w-md items-center gap-2">
      <button
        type="button"
        onClick={copiarUrl}
        aria-label="Copiar enlace"
        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-sky-100 text-azul-trifinio transition-colors hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900"
      >
        <Copy className="size-4" />
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-xs font-semibold text-azul-trifinio hover:underline"
      >
        {url}
      </a>
    </div>
  );
}

export function QrActividad({
  actividadId,
  nombreActividad,
  size = 220,
}: {
  actividadId: string;
  nombreActividad: string;
  size?: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const modalQrZoneRef = useRef<HTMLDivElement>(null);
  const modalQrSize = useQrSize(modalQrZoneRef);

  const url = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/actividades/${actividadId}`;
    }
    return `/actividades/${actividadId}`;
  }, [actividadId]);

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <p className="max-w-xs text-center text-sm font-black leading-snug text-foreground">
          {nombreActividad}
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Ampliar código QR"
          className="cursor-pointer rounded-2xl bg-white p-2 transition-opacity hover:opacity-90 active:scale-[0.99] dark:bg-zinc-50"
        >
          <QrCodigoRender url={url} size={size} />
        </button>
        <UrlConCopiar url={url} />
      </div>

      <ModalShell
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={nombreActividad}
        subtitle="Código QR de asistencia"
        maxWidth="max-w-xl"
      >
        <div className="flex h-[calc(100dvh-10rem)] flex-col gap-3">
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <div
              ref={modalQrZoneRef}
              className="aspect-square h-full max-h-full w-full max-w-full overflow-hidden rounded-2xl bg-white dark:bg-zinc-50"
            >
              <QrCodigoRender url={url} size={modalQrSize} margin={0} />
            </div>
          </div>
          <UrlConCopiar url={url} />
          <p className="shrink-0 text-center text-xs text-muted-foreground">
            Escanea para abrir el formulario público de registro.
          </p>
        </div>
      </ModalShell>
    </>
  );
}
