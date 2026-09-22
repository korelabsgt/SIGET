"use client";

import { useRef, useState } from "react";
import {
  ModalShell,
  ModalInput,
  ModalLabel,
  ModalTextarea,
  ModalSubmit,
  ModalFooter,
  ModalCancelButton,
  ModalForm,
  ModalField,
  modalAccentClass,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/utils/supabase/client";
import { useRegistrarArchivo } from "../lib/hooks";
import {
  ACT_ARCHIVOS_MAX_BYTES,
  bucketArchivos,
  rutaStorageArchivo,
} from "../lib/archivos";
import { esEnlaceValido, normalizarEnlace } from "../lib/minuta";
import { registrarArchivoSchema } from "../lib/zod";
import { cn } from "@/lib/utils";

function nombreSinExtension(nombre: string): string {
  return nombre.replace(/\.[^.]+$/, "") || nombre;
}

export function SubirArchivo({
  open,
  onClose,
  actividadId,
  fechaRealizacion,
  visibilidad,
  parentId,
}: {
  open: boolean;
  onClose: () => void;
  actividadId: string;
  fechaRealizacion: string;
  visibilidad: "privado" | "publico";
  parentId: string | null;
}) {
  const registrar = useRegistrarArchivo(actividadId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [modo, setModo] = useState<"storage" | "enlace">("storage");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enlace, setEnlace] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const pending = subiendo || registrar.isPending;

  const resetForm = () => {
    setModo("storage");
    setArchivo(null);
    setEnlace("");
    setNombre("");
    setDescripcion("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    if (pending) return;
    resetForm();
    onClose();
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > ACT_ARCHIVOS_MAX_BYTES) {
      toast.warn("Máximo 10 MB. Si pesa más, pega un enlace de Drive.");
      setModo("enlace");
      return;
    }
    setArchivo(file);
    setNombre((prev) => prev.trim() || nombreSinExtension(file.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modo === "enlace") {
      const url = normalizarEnlace(enlace);
      if (!esEnlaceValido(url)) {
        toast.warn("Escribe un enlace válido.");
        return;
      }
      const parsed = registrarArchivoSchema.safeParse({
        origen: "enlace",
        id: crypto.randomUUID(),
        actividadId,
        visibilidad,
        parentId,
        nombre: nombre.trim() || url,
        descripcion,
        url,
      });
      if (!parsed.success) {
        toast.warn("Revisa el nombre y el enlace.");
        return;
      }
      const res = await registrar.mutateAsync(parsed.data);
      if (!res.success) {
        toast.error(
          modalActionMessage(res.error ?? undefined, "No se pudo guardar el enlace."),
        );
        return;
      }
      toast.success("Enlace guardado.");
      resetForm();
      onClose();
      return;
    }

    if (!archivo) {
      toast.warn("Selecciona un archivo.");
      return;
    }

    const nodoId = crypto.randomUUID();
    const bucket = bucketArchivos(visibilidad);
    const path = rutaStorageArchivo({
      fecha: fechaRealizacion,
      actividadId,
      nodoId,
      nombreArchivo: archivo.name,
    });

    const parsed = registrarArchivoSchema.safeParse({
      origen: "storage",
      id: nodoId,
      actividadId,
      visibilidad,
      parentId,
      nombre,
      descripcion,
      bucket,
      path,
      nombreArchivo: archivo.name,
      mime: archivo.type || "",
      tamano: archivo.size,
    });
    if (!parsed.success) {
      toast.warn("Revisa el nombre y el archivo.");
      return;
    }

    setSubiendo(true);
    const supabase = createClient();
    const { error: errorUpload } = await supabase.storage
      .from(bucket)
      .upload(path, archivo, {
        cacheControl: "3600",
        upsert: false,
        contentType: archivo.type || undefined,
      });

    if (errorUpload) {
      setSubiendo(false);
      toast.error(errorUpload.message || "No se pudo subir el archivo.");
      return;
    }

    const res = await registrar.mutateAsync(parsed.data);
    if (!res.success) {
      await supabase.storage.from(bucket).remove([path]);
      setSubiendo(false);
      toast.error(
        modalActionMessage(res.error ?? undefined, "No se pudo guardar el archivo."),
      );
      return;
    }

    setSubiendo(false);
    toast.success("Archivo subido.");
    resetForm();
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Subir archivo"
      maxWidth="max-w-lg"
      contentClassName="p-4 pt-3 md:px-6 md:pb-6 md:pt-4"
      headerClassName="md:py-3"
    >
      <ModalForm onSubmit={handleSubmit}>
        <div className="flex h-9 items-center justify-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => setModo("storage")}
            className={cn(
              "w-20 cursor-pointer text-center text-sm",
              modo === "storage"
                ? modalAccentClass
                : "font-semibold text-muted-foreground",
            )}
          >
            Archivo
          </button>
          <Switch
            checked={modo === "enlace"}
            onCheckedChange={(checked) =>
              setModo(checked ? "enlace" : "storage")
            }
            disabled={pending}
            aria-label={
              modo === "enlace"
                ? "Modo enlace. Cambiar a archivo"
                : "Modo archivo. Cambiar a enlace"
            }
            className="data-[state=checked]:bg-[#2c5f9b] dark:data-[state=checked]:bg-[#6f9fd4]"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => setModo("enlace")}
            className={cn(
              "w-20 cursor-pointer text-center text-sm",
              modo === "enlace"
                ? modalAccentClass
                : "font-semibold text-muted-foreground",
            )}
          >
            Enlace
          </button>
        </div>

        <div className="grid">
          <ModalField
            className={cn(
              "col-start-1 row-start-1",
              modo !== "storage" && "pointer-events-none invisible",
            )}
          >
            <ModalLabel htmlFor="arch-file">Archivo (máximo 10 MB)</ModalLabel>
            <input
              ref={inputRef}
              id="arch-file"
              type="file"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
              }}
              className="block h-10 w-full cursor-pointer text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-zinc-200 file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#2c5f9b] dark:file:border-zinc-700 dark:file:text-[#6f9fd4]"
            />
            <p className="truncate text-xs text-muted-foreground">
              {archivo
                ? archivo.name
                : "Si pesa más de 10 MB, usa un enlace."}
            </p>
          </ModalField>
          <ModalField
            className={cn(
              "col-start-1 row-start-1",
              modo !== "enlace" && "pointer-events-none invisible",
            )}
          >
            <ModalLabel htmlFor="arch-url">
              Drive, Dropbox, Mega u otro
            </ModalLabel>
            <ModalInput
              id="arch-url"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              tabIndex={modo === "enlace" ? 0 : -1}
            />
            <p className="truncate text-xs text-muted-foreground">
              Pega el enlace de Drive, Dropbox, Mega u otro.
            </p>
          </ModalField>
        </div>

        <ModalField>
          <ModalLabel htmlFor="arch-file-nombre">Nombre</ModalLabel>
          <ModalInput
            id="arch-file-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required={modo === "storage"}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="arch-file-desc">Descripción (opcional)</ModalLabel>
          <ModalTextarea
            id="arch-file-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </ModalField>
        <ModalFooter>
          <ModalCancelButton onClick={handleClose} disabled={pending} />
          <ModalSubmit disabled={pending} />
        </ModalFooter>
      </ModalForm>
    </ModalShell>
  );
}
