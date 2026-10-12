import { redirect } from "next/navigation";
import { rutaRepositorioNoticias } from "@/components/(SIGET)/repositorio/lib/helpers";

export default function RepositorioNoticiaLegacyPage() {
  redirect(rutaRepositorioNoticias());
}
