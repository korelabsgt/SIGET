"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FallaMantenimientoSchema, type FallaMantenimientoFormData } from "../lib/zod";
import { useCrearFalla, useVehiculosParaFallas } from "../lib/hooks";
import { createClient } from "@/utils/supabase/client";
import {
  GvModalForm,
  GvModalFormBody,
  GvModalShell,
  GV_MODAL_SELECT_CONTENT_CLASS,
  GV_MODAL_SELECT_ITEM_CLASS,
  GV_MODAL_SELECT_TRIGGER_CLASS,
  ModalCancelButton,
  ModalFooter,
  ModalSubmit,
} from "../../lib/gv-modal-shell";
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
import { toast } from "react-toastify";
import { AlertTriangle, UploadCloud, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GV_DANGER_OUTLINE_BUTTON_CLASS } from "../../lib/gv-danger-ui";

export function Crear() {
  const [open, setOpen] = useState(false);
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

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setUploadedEvidenciaPath(null);
    form.setValue("evidencia_url", []);
  };

  useEffect(() => {
    if (!open) {
      submitInFlightRef.current = false;
      setUploadedEvidenciaPath(null);
    }
  }, [open]);

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
      toast.success("Avería reportada exitosamente.");
      form.reset();
      clearFile();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al reportar la avería.");
    } finally {
      setUploading(false);
      submitInFlightRef.current = false;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={GV_DANGER_OUTLINE_BUTTON_CLASS}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="lg:hidden">Avería</span>
        <span className="hidden lg:inline">Reportar avería</span>
      </button>

      <GvModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Reportar Avería o Mantenimiento"
        maxWidth="max-w-lg"
      >
        {open ? (
        <Form {...form}>
          <GvModalForm onSubmit={form.handleSubmit(onSubmit)}>
            <GvModalFormBody className="space-y-4">
            <FormField
              control={form.control}
              name="vehiculo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehículo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Severidad</FormLabel>
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
              <FormLabel>Evidencia Fotográfica (Opcional)</FormLabel>
              {previewUrl ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer">
                  <Input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/jpg"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full mb-3">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium">Haz clic o arrastra una imagen aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG o WEBP (Máx. 500 KB)</p>
                </div>
              )}
            </div>

            </GvModalFormBody>

            <ModalFooter>
              <ModalCancelButton onClick={() => setOpen(false)} disabled={crear.isPending || uploading} />
              <ModalSubmit
                disabled={crear.isPending || uploading}
                label={uploading ? "Subiendo" : crear.isPending ? "Enviando" : "Enviar"}
              />
            </ModalFooter>
          </GvModalForm>
        </Form>
        ) : null}
      </GvModalShell>
    </>
  );
}
