import { redirect } from "next/navigation";
import { rutaRepositorioInicio } from "@/components/(SIGET)/repositorio/lib/helpers";

export default function RepositorioNuevoLegacyPage() {
  redirect(rutaRepositorioInicio());
}
