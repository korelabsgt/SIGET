import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AsistenciaActividadesList from "./AsistenciaActividadesList";

export async function AsistenciaActividades() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10">
        <AsistenciaActividadesList />
      </div>
    </div>
  );
}
