import { redirect } from "next/navigation";
import { rutaNuevoDocumento } from "@/components/(SIGET)/repositorio/lib/helpers";

export default function RepositorioDocumentoNuevoLegacyPage() {
  redirect(rutaNuevoDocumento());
}
