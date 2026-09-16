"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import {
  GvModalForm,
  GvModalFormBody,
  GvModalFooter,
  GvModalShell,
  GV_MODAL_SELECT_CONTENT_CLASS,
  GV_MODAL_SELECT_ITEM_CLASS,
  GV_MODAL_SELECT_TRIGGER_CLASS,
  ModalCancelButton,
  ModalSubmit,
} from "../../lib/gv-modal-shell";
import { FallaMantenimientoSchema, type FallaMantenimientoFormData } from "../lib/zod";
import { useCrearFalla, useVehiculosParaFallas } from "../lib/hooks";

export type VehiculoAveriaFijo = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
};

export function ReportarAveriaModal({
  open,
  onOpenChange,
  vehiculoIdInicial,
  vehiculoFijo,
  bloquearVehiculo = false,
  obligatorio = false,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculoIdInicial?: string;
  vehiculoFijo?: VehiculoAveriaFijo | null;
  bloquearVehiculo?: boolean;
  obligatorio?: boolean;
  onSaved?: () => void;
}) {
  const crear = useCrearFalla();
  const { data: vehiculos = [] } = useVehiculosParaFallas(open);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedEvidenciaPath, setUploadedEvidenciaPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const submitInFlightRef = useRef(false);

  const form = useForm<FallaMantenimientoFormData>({
    resolver: zodResolver(FallaMantenimientoSchema) as never,
    defaultValues: {
      vehiculo_id: "",
      severidad: "MEDIA",
      descripcion: "",
      evidencia_url: [],
    },
  });

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setUploadedEvidenciaPath(null);
    form.setValue("evidencia_url", []);
  }

  useEffect(() => {
    if (!open) {
      submitInFlightRef.current = false;
      setUploadedEvidenciaPath(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      form.reset({
        vehiculo_id: "",
        severidad: "MEDIA",
        descripcion: "",
        evidencia_url: [],
      });
      return;
    }

    const vehiculoId = vehiculoFijo?.id ?? vehiculoIdInicial ?? "";
    form.reset({
      vehiculo_id: vehiculoId,
      severidad: "MEDIA",
      descripcion: "",
      evidencia_url: [],
    });
  }, [open, vehiculoIdInicial, vehiculoFijo, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";
    if (selectedFile) {
      if (selectedFile.size > 512000) {
        toast.error("La imagen no debe superar los 500 KB");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setUploadedEvidenciaPath(null);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleClose = () => {
    if (obligatorio) {
      toast.warn("Debe completar el reporte de avería en mantenimiento.");
      return;
    }
    onOpenChange(false);
  };

  async function onSubmit(data: FallaMantenimientoFormData) {
    if (submitInFlightRef.current) return;

    submitInFlightRef.current = true;
    setUploading(true);
    try {
      let evidenciaPaths = data.evidencia_url;

      if (file && !uploadedEvidenciaPath) {
        const supabase = createClient();
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${data.vehiculo_id}_${crypto.randomUUID()}.${fileExt}`;
        const filePath = `fallas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("vehiculos")
          .upload(filePath, file, { upsert: false });

        if (uploadError) {
          throw new Error("Error subiendo la imagen: " + uploadError.message);
        }

        evidenciaPaths = [filePath];
        setUploadedEvidenciaPath(filePath);
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      } else if (uploadedEvidenciaPath) {
        evidenciaPaths = [uploadedEvidenciaPath];
      }

      await crear.mutateAsync({ ...data, evidencia_url: evidenciaPaths });
      toast.success(
        obligatorio
          ? "Se agregó el vehículo a mantenimiento."
          : "Avería reportada exitosamente.",
      );
      form.reset();
      clearFile();
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al reportar la avería.");
    } finally {
      setUploading(false);
      submitInFlightRef.current = false;
    }
  }

  return (
    <GvModalShell
      open={open}
      onClose={handleClose}
      title="Reportar avería o mantenimiento"
      subtitle={
        obligatorio
          ? "Obligatorio: describa la avería detectada durante el viaje."
          : "Registre el fallo o mantenimiento requerido del vehículo."
      }
      maxWidth="max-w-lg"
      hideCloseButton={obligatorio}
    >
      {open ? (
        <Form {...form}>
          <GvModalForm onSubmit={form.handleSubmit(onSubmit)}>
            <GvModalFormBody className="space-y-4">
              {obligatorio ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                    Indicó avería en la bitácora. Debe registrar el reporte en mantenimiento para
                    continuar.
                  </p>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="vehiculo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{vehiculoFijo ? "Vehículo del viaje" : "Vehículo"}</FormLabel>
                    {vehiculoFijo ? (
                      <>
                        <input type="hidden" {...field} />
                        <div className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-border bg-zinc-50 px-3 dark:border-zinc-700 dark:bg-zinc-950">
                          <span className="shrink-0 rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-foreground dark:bg-zinc-700">
                            {vehiculoFijo.placa}
                          </span>
                          <span className="truncate text-sm font-semibold capitalize text-foreground">
                            {vehiculoFijo.marca} {vehiculoFijo.modelo}
                          </span>
                        </div>
                      </>
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={bloquearVehiculo}
                      >
                        <FormControl>
                          <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                            <SelectValue placeholder="Seleccione un vehículo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                          {vehiculos.map((v) => (
                            <SelectItem key={v.id} value={v.id} className={GV_MODAL_SELECT_ITEM_CLASS}>
                              {v.placa} - {v.marca} {v.modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de severidad</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={GV_MODAL_SELECT_TRIGGER_CLASS}>
                          <SelectValue placeholder="Seleccione severidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className={GV_MODAL_SELECT_CONTENT_CLASS}>
                        <SelectItem value="BAJA" className={GV_MODAL_SELECT_ITEM_CLASS}>
                          Baja (Mantenimiento menor)
                        </SelectItem>
                        <SelectItem value="MEDIA" className={GV_MODAL_SELECT_ITEM_CLASS}>
                          Media (Revisión necesaria)
                        </SelectItem>
                        <SelectItem value="ALTA" className={GV_MODAL_SELECT_ITEM_CLASS}>
                          Alta (Inmovilizar vehículo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del problema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa el fallo, ruido anómalo o tipo de mantenimiento requerido..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Evidencia fotográfica (Opcional)</FormLabel>
                {previewUrl ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border">
                    <img src={previewUrl} alt="Preview" className="size-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 size-7 rounded-full"
                      onClick={clearFile}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-muted/50">
                    <Input
                      type="file"
                      accept="image/jpeg, image/png, image/webp, image/jpg"
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                      onChange={handleFileChange}
                    />
                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                      <UploadCloud className="size-5" />
                    </div>
                    <p className="text-sm font-medium">Haz clic o arrastra una imagen aquí</p>
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG o WEBP (Máx. 500 KB)</p>
                  </div>
                )}
              </div>
            </GvModalFormBody>

            <GvModalFooter>
              {!obligatorio ? (
                <ModalCancelButton onClick={handleClose} disabled={crear.isPending || uploading} />
              ) : null}
              <ModalSubmit
                disabled={crear.isPending || uploading}
                label={uploading ? "Subiendo" : crear.isPending ? "Enviando" : "Enviar"}
              />
            </GvModalFooter>
          </GvModalForm>
        </Form>
      ) : null}
    </GvModalShell>
  );
}
