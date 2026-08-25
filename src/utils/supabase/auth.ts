import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export type AuthCheckResult =
  | { ok: true; user: User }
  | { ok: false; reason: "missing" | "network" };

function isTransientAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const name =
    "name" in error && typeof error.name === "string" ? error.name.toLowerCase() : "";
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  const status =
    "status" in error && typeof error.status === "number" ? error.status : null;

  if (status === 0) return true;

  const combined = `${name} ${message}`;
  return (
    combined.includes("fetch") ||
    combined.includes("network") ||
    combined.includes("timeout") ||
    combined.includes("connect") ||
    combined.includes("econnrefused") ||
    combined.includes("enotfound") ||
    combined.includes("socket") ||
    combined.includes("aborterror") ||
    combined.includes("retryable")
  );
}

export function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
}

export async function checkAuth(
  supabase: SupabaseClient,
): Promise<AuthCheckResult> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        ok: false,
        reason: isTransientAuthError(error) ? "network" : "missing",
      };
    }

    if (!user) return { ok: false, reason: "missing" };
    return { ok: true, user };
  } catch (error) {
    return {
      ok: false,
      reason: isTransientAuthError(error) ? "network" : "missing",
    };
  }
}

export async function safeGetUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const result = await checkAuth(supabase);
  return result.ok ? result.user : null;
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
