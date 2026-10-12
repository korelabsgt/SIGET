import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  RepositorioLista,
  type RepositorioListaModo,
} from "./RepositorioLista";

export async function RepositorioBandeja({ modo }: { modo: RepositorioListaModo }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">
        <RepositorioLista modo={modo} />
      </div>
    </div>
  );
}
