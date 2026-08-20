"use client";

import { UploadCloud, X } from "lucide-react";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 512_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export function ImagenVehiculoDropzone({
  previewUrl,
  onFileSelect,
  onClear,
  disabled,
}: {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast.error("Formato no válido. Use JPG, PNG o WEBP.");
      return;
    }

    if (selectedFile.size > MAX_BYTES) {
      toast.error("La imagen no debe superar los 500 KB");
      return;
    }

    onFileSelect(selectedFile);
  };

  return (
    <div className="space-y-2">
      <Label>Fotografía del vehículo (opcional)</Label>
      {previewUrl ? (
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-border">
          <img src={previewUrl} alt="Vista previa del vehículo" className="size-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            disabled={disabled}
            className="absolute right-2 top-2 size-7 rounded-full"
            onClick={onClear}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-muted/50">
          <Input
            type="file"
            accept={ACCEPT_ATTR}
            disabled={disabled}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            onChange={handleFileChange}
          />
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-sky-100 text-celeste-trifinio dark:bg-sky-950/60">
            <UploadCloud className="size-5" />
          </div>
          <p className="text-sm font-medium">Haz clic o arrastra una imagen aquí</p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WEBP (máx. 500 KB)</p>
        </div>
      )}
    </div>
  );
}

export async function uploadImagenVehiculo(file: File, placa: string): Promise<string> {
  const { createClient } = await import("@/utils/supabase/client");
  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const placaSegment = placa.trim().toUpperCase() || String(Date.now());
  const filePath = `flota/${placaSegment}_${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("vehiculos").upload(filePath, file);

  if (uploadError) {
    throw new Error("Error subiendo la imagen: " + uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from("vehiculos").getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}
