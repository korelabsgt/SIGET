"use client";

import { useRef, useState } from "react";
import { fechaCalendarioGt } from "@/lib/fechas-gt";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalTextarea,
  ModalFechaInput,
  ModalForm,
  ModalField,
  ModalSubmit,
  ModalFooter,
  ModalCancelButton,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { FilePlus, FileText } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import type { Microcuenca } from "../lib/catalogos";
import { useCrearProceso } from "../lib/hooks";
import { procesoFormSchema } from "../lib/zod";

const MAX_PDF_BYTES = 2_000_000;

function leerPdf(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("READ_FAILED"));
    reader.readAsDataURL(archivo);
  });
}

function CrearProcesoBody({
  microcuenca,
  onClose,
}: {
  microcuenca: Microcuenca;
  onClose: () => void;
}) {
  const crear = useCrearProceso();
  const inputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [resumen, setResumen] = useState("");
  const [fecha, setFecha] = useState(fechaCalendarioGt());
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [pdfData, setPdfData] = useState("");

  const handlePdf = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (archivo.type !== "application/pdf" && !archivo.name.toLowerCase().endsWith(".pdf")) {
      toast.warn("Solo se aceptan archivos PDF.");
      return;
    }
    if (archivo.size > MAX_PDF_BYTES) {
      toast.warn("El PDF debe pesar menos de 2 MB.");
      return;
    }
    try {
      const data = await leerPdf(archivo);
      setPdfData(data);
      setNombreArchivo(archivo.name);
    } catch {
      toast.error("No se pudo leer el PDF.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = procesoFormSchema.safeParse({
      microcuenca,
      titulo,
      resumen,
      fecha,
      nombre_archivo: nombreArchivo,
      pdf_data: pdfData,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }
    const res = await crear.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Proceso documentado.");
      onClose();
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
  };

  return (
    <ModalForm onSubmit={handleSubmit}>
      <ModalField>
        <ModalLabel htmlFor="ja-prc-tit">Título</ModalLabel>
        <ModalInput
          id="ja-prc-tit"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          autoFocus
        />
      </ModalField>
      <ModalField>
        <ModalLabel htmlFor="ja-prc-fecha">Fecha</ModalLabel>
        <ModalFechaInput id="ja-prc-fecha" value={fecha} onChange={setFecha} required />
      </ModalField>
      <ModalField>
        <ModalLabel htmlFor="ja-prc-res">Qué sucedió y cómo se resolvió</ModalLabel>
        <ModalTextarea
          id="ja-prc-res"
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          rows={4}
          required
        />
      </ModalField>
      <ModalField>
        <ModalLabel>PDF del proceso</ModalLabel>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Acta, bitácora o informe de lo ocurrido. Máximo 2 MB.
        </p>
        {nombreArchivo ? (
          <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {nombreArchivo}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Aún no hay PDF adjunto.</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            void handlePdf(archivo);
          }}
        />
        <SigetActionButton
          label="Adjuntar"
          accentColor={sigetAccent.crear}
          morphFrom={FilePlus}
          morphTo={FileText}
          onClick={() => inputRef.current?.click()}
          ariaLabel="Adjuntar PDF del proceso"
          className="w-auto shrink-0"
        />
      </ModalField>
      <ModalFooter>
        <ModalCancelButton onClick={onClose} disabled={crear.isPending} />
        <ModalSubmit disabled={crear.isPending} />
      </ModalFooter>
    </ModalForm>
  );
}

export function CrearProceso({
  open,
  onOpenChange,
  microcuenca,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  microcuenca: Microcuenca;
}) {
  const onClose = () => onOpenChange(false);
  return (
    <ModalShell open={open} onClose={onClose} title="Documentar proceso" maxWidth="max-w-xl">
      {open ? <CrearProcesoBody microcuenca={microcuenca} onClose={onClose} /> : null}
    </ModalShell>
  );
}
