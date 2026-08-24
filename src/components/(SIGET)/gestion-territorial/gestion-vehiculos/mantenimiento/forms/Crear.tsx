"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FallaMantenimientoSchema, type FallaMantenimientoFormData } from "../lib/zod";
import { useCrearFalla, useVehiculosParaFallas } from "../lib/hooks";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function Crear() {
  const [open, setOpen] = useState(false);
  const crear = useCrearFalla();
  const { data: vehiculos = [] } = useVehiculosParaFallas(open);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FallaMantenimientoFormData>({
    resolver: zodResolver(FallaMantenimientoSchema),
    defaultValues: {
      vehiculo_id: "",
      severidad: "MEDIA",
      descripcion: "",
      evidencia_url: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 512000) {
        toast.error("La imagen no debe superar los 500 KB");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    form.setValue("evidencia_url", "");
  };

  async function onSubmit(data: FallaMantenimientoFormData) {
    setUploading(true);
    try {
      let finalEvidenciaUrl = data.evidencia_url;

      if (file) {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `${data.vehiculo_id}_${Date.now()}.${fileExt}`;
        const filePath = `fallas/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("vehiculos")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error("Error subiendo la imagen: " + uploadError.message);
        }

        finalEvidenciaUrl = filePath;
      }

      await crear.mutateAsync({ ...data, evidencia_url: finalEvidenciaUrl });
      toast.success("Avería reportada exitosamente.");
      form.reset();
      clearFile();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al reportar la avería.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
          <AlertTriangle className="w-4 h-4" />
          Reportar Avería
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reportar Avería o Mantenimiento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="vehiculo_id"
              render={({ field }) => (
                <FormItem className="relative z-[100]">
                  <FormLabel>Vehículo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-950">
                        <SelectValue placeholder="Seleccione un vehículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="bg-white dark:bg-zinc-950 border border-border shadow-md z-[100]">
                      {vehiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
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
                <FormItem className="relative z-[90]">
                  <FormLabel>Nivel de Severidad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-950">
                        <SelectValue placeholder="Seleccione severidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="bg-white dark:bg-zinc-950 border border-border shadow-md z-[100]">
                      <SelectItem value="BAJA">Baja (Mantenimiento menor)</SelectItem>
                      <SelectItem value="MEDIA">Media (Revisión necesaria)</SelectItem>
                      <SelectItem value="ALTA">Alta (Inmovilizar vehículo)</SelectItem>
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
                <FormItem className="relative z-[80]">
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

            <div className="relative z-[70] space-y-2">
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

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={crear.isPending || uploading} className="min-w-[140px]">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : crear.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Reporte"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
