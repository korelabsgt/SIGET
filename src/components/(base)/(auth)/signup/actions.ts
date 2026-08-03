"use server";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { authSchema, INITIAL_USER_PASSWORD } from "./zod";
import { canAssignRole } from "@/components/(base)/(users)/usuarios/lib/permissions";

export async function getOrganizaciones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("obs_organizaciones")
    .select("id, nombre")
    .order("nombre");
  if (error) {
    console.error("[getOrganizaciones]", error);
    return [];
  }
  return data as { id: string; nombre: string }[];
}

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: {
    [key: string]: string[];
  };
} | null;

export async function signup(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawData = {
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    rol: formData.get("rol"),
    organizacion_id: formData.get("organizacion_id") || undefined,
  };

  const validated = authSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, username, rol, organizacion_id } = validated.data;
  const password = INITIAL_USER_PASSWORD;

  const supabase = await createClient();
  const {
    data: { user: actor },
  } = await supabase.auth.getUser();
  const actorRole = actor?.user_metadata?.rol || "user";

  if (!canAssignRole(actorRole, rol)) {
    return {
      errors: {
        rol: ["No tienes permisos para asignar este rol."],
      },
    };
  }

  const fakeEmail = `${username}@app.com`;

  const supabaseAdmin = getAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: fakeEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      name,
      nombre: name,
      username,
      rol,
      organizacion_id: organizacion_id ?? null,
    },
  });

  if (error) {
    console.error("[signup] createUser error:", error);
    if (error.message.includes("already registered") || error.status === 422) {
      return {
        errors: {
          username: ["Usuario ya está registrado, por favor eliga otro"],
        },
      };
    }
    return { message: translateError(error.message) };
  }

  if (data.user) {
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          nombre: name,
          rol: rol,
          organizacion_id: organizacion_id ?? null,
        },
        { onConflict: "id" },
      );

    if (profileError) {
      console.error("[signup] profile upsert error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      return {
        message:
          "No se pudo guardar el perfil del usuario: " +
          translateError(profileError.message),
      };
    }
  }

  return { success: true };
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("duplicate key") && m.includes("unique constraint")) {
    return "Ya existe un registro con esos datos (usuario duplicado).";
  }
  if (m.includes("violates foreign key")) {
    return "Referencia inválida en la base de datos. Contacta al administrador.";
  }
  if (m.includes("violates check constraint")) {
    return "Algún valor no cumple las reglas de la base de datos (revisa el rol).";
  }
  if (m.includes("violates not-null")) {
    return "Falta un campo obligatorio en la base de datos.";
  }
  if (m.includes("row-level security") || m.includes("rls")) {
    return "No tienes permisos para realizar esta acción (RLS).";
  }
  if (m.includes("invalid api key") || m.includes("jwt")) {
    return "Configuración de Supabase inválida (revisa SUPABASE_SERVICE_ROLE_KEY).";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "La contraseña es demasiado débil.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Error de conexión con el servidor. Intenta de nuevo.";
  }
  return "Error al crear el usuario: " + msg;
}
