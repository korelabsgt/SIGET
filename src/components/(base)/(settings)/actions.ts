"use server";

import { createClient } from "@/utils/supabase/server";
import { AppSettingsUpdate } from "./zod";

export async function getAppSettings(): Promise<AppSettingsUpdate | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("id, require_device_authorization, enable_passkeys, manual_usuario_url")
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function updateAppSettings(settings: AppSettingsUpdate): Promise<void> {
  const supabase = await createClient();

  if (settings.id) {
    const { error } = await supabase
      .from("app_settings")
      .update({
        require_device_authorization: settings.require_device_authorization,
        enable_passkeys: settings.enable_passkeys,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("app_settings")
      .insert({
        require_device_authorization: settings.require_device_authorization,
        enable_passkeys: settings.enable_passkeys,
      });

    if (error) throw new Error(error.message);
  }
}

export async function updateManualUsuarioUrl(url: string | null): Promise<void> {
  const supabase = await createClient();

  const { data: existing, error: selectError } = await supabase
    .from("app_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing?.id) {
    const { error } = await supabase
      .from("app_settings")
      .update({
        manual_usuario_url: url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("app_settings")
      .insert({ manual_usuario_url: url });

    if (error) throw new Error(error.message);
  }
}