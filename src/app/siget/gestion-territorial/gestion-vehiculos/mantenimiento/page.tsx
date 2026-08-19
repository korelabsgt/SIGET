import { createClient } from "@/utils/supabase/server";
import {
  getFallasMantenimiento,
  getVehiculosParaFallas,
  getMecanicos,
} from "@/components/(SIGET)/gestion-territorial/mantenimiento/lib/actions";
import { MantenimientoPanel } from "@/components/(SIGET)/gestion-territorial/mantenimiento/MantenimientoPanel";

export default async function MantenimientoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>No autorizado</div>;
  }

  // Example role check: you can adjust this according to your actual role schema
  const role = user.user_metadata?.rol || "";
  const isAuthorized = ["super", "admin", "taller", "mecanico"].includes(role);

  const [fallas, vehiculos, mecanicos] = await Promise.all([
    getFallasMantenimiento(),
    getVehiculosParaFallas(),
    getMecanicos(),
  ]);

  return (
    <>
      <MantenimientoPanel
        fallas={fallas}
        vehiculos={vehiculos}
        mecanicos={mecanicos}
        isAuthorized={isAuthorized}
      />
    </>
  );
}
