import { redirect } from "next/navigation";
import { rutaNuevaNoticia } from "@/components/(SIGET)/repositorio/lib/helpers";

export default function RepositorioNoticiaNuevoLegacyPage() {
  redirect(rutaNuevaNoticia());
}
