import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { getPendingDevicesCount } from "@/components/(base)/admin/lib/actions";
import { canManageUsers } from "@/components/(base)/(users)/usuarios/lib/permissions";
import { isSuperOrAdminRole } from "@/components/(base)/dashboard/modules";
import { AdminCards } from "./AdminCards";

export async function AdminPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const metadata = user.user_metadata || {};
  const role = metadata.rol || user.role || "user";

  if (!canManageUsers(role)) {
    redirect("/siget");
  }

  const isSuperOrAdmin = isSuperOrAdminRole(role);
  const pendingDevices = isSuperOrAdmin
    ? ((await getPendingDevicesCount()) ?? 0)
    : 0;

  return (
    <div className="relative w-full px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />

      <div className="relative z-10 mx-auto w-full max-w-[min(100%,1600px)] space-y-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex size-20 md:size-24 shrink-0 items-center justify-center rounded-2xl border border-celeste-trifinio/25 bg-celeste-trifinio/10 dark:rounded-2xl dark:bg-white">
            <AnimatedIcon iconKey="plusmrxr" size={64} speed={1.5} />
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio">
              Panel administrativo
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Administración
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              {isSuperOrAdmin
                ? "Gestione dispositivos, usuarios y configuraciones del sistema desde un solo lugar."
                : "Gestione usuarios del sistema."}
            </p>
          </div>
        </div>

        {isSuperOrAdmin && pendingDevices > 0 && (
          <div className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/8 dark:bg-amber-500/10 px-5 py-4 shadow-sm">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15">
              <AnimatedIcon iconKey="qvyppzqz" size={28} speed={1.5} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Solicitudes pendientes
              </p>
              <p className="text-sm text-amber-900/80 dark:text-amber-200/90 leading-snug">
                Hay <span className="font-black">{pendingDevices}</span>{" "}
                solicitud{pendingDevices !== 1 && "es"} de dispositivo
                {pendingDevices !== 1 && "s"} esperando aprobación.
              </p>
            </div>
          </div>
        )}

        <AdminCards pendingDevices={pendingDevices} role={role} />
      </div>
    </div>
  );
}
