import { redirect } from "next/navigation";
import { rutaRepositorioDocumentos } from "@/components/(SIGET)/repositorio/lib/helpers";

export default function RepositorioDocumentosMisLegacyPage() {
  redirect(rutaRepositorioDocumentos());
}
