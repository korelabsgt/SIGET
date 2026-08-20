import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function safeGetUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export async function safeSupabaseQuery<T>(
  query: () => PromiseLike<{ data: T; error: unknown }>,
): Promise<T | null> {
  try {
    const { data, error } = await query();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
