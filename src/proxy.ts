import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hostname = request.headers.get("host") || "";
  let pathname = request.nextUrl.pathname;

  if (pathname === "/protected" || pathname.startsWith("/protected/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/siget";
    return NextResponse.redirect(url);
  }

  const isAppRewrite =
    hostname === "app.plantrifiniogt.com" && pathname === "/";

  if (isAppRewrite) {
    pathname = "/siget";
  }

  if (!user && pathname.startsWith("/siget")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("require_device_authorization")
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("ultimo_cambio_password")
      .eq("id", user.id)
      .maybeSingle();

    const requireAuth = settings?.require_device_authorization ?? false;

    const metadata = user.user_metadata || {};
    const realRole = (metadata.rol || user.role || "user") as string;
    const isSuper = realRole === "super";
    const isExactAdmin = realRole === "admin";
    const hasAdminInRole = realRole.includes("admin");
    const isSuperOrAdmin = isSuper || isExactAdmin;
    const canAccessAdminPanel = isSuper || hasAdminInRole;
    const hasFullAdminAccess = isSuperOrAdmin;

    let needsPasswordChange = false;

    if (!isSuper) {
      if (!profile?.ultimo_cambio_password) {
        needsPasswordChange = true;
      } else {
        const lastChange = new Date(profile.ultimo_cambio_password);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (lastChange < threeMonthsAgo) {
          needsPasswordChange = true;
        }
      }
    }

    if (needsPasswordChange) {
      if (
        pathname !== "/siget/cambiar-password" &&
        !pathname.startsWith("/api/auth")
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/siget/cambiar-password";
        return NextResponse.redirect(url);
      }
    } else {
      if (pathname === "/siget/cambiar-password" || pathname === "/login") {
        const url = request.nextUrl.clone();
        url.pathname = "/siget";
        return NextResponse.redirect(url);
      }
    }

    if (pathname === "/esperando-acceso") {
      if (!requireAuth) {
        const url = request.nextUrl.clone();
        url.pathname = "/siget";
        return NextResponse.redirect(url);
      }

      if (isSuperOrAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/siget";
        return NextResponse.redirect(url);
      }

      const userAgent = request.headers.get("user-agent") || "Desconocido";

      const { data: device } = await supabase
        .from("authorized_devices")
        .select("is_authorized")
        .eq("user_id", user.id)
        .eq("browser_fingerprint", userAgent)
        .single();

      if (device && device.is_authorized) {
        const url = request.nextUrl.clone();
        url.pathname = "/siget";
        return NextResponse.redirect(url);
      }
    }

    if (pathname.startsWith("/siget")) {
      if (pathname.startsWith("/siget/admin")) {
        if (!canAccessAdminPanel) {
          const url = request.nextUrl.clone();
          url.pathname = "/sin-acceso";
          return NextResponse.redirect(url);
        }

        if (
          !hasFullAdminAccess &&
          pathname !== "/siget/admin" &&
          !pathname.startsWith("/siget/admin/usuarios")
        ) {
          const url = request.nextUrl.clone();
          url.pathname = "/sin-acceso";
          return NextResponse.redirect(url);
        }
      }

      const canAccessObservatorio =
        isSuperOrAdmin || realRole.includes("observatorio");

      const canAccessPlantillas =
        isSuperOrAdmin || realRole === "admin-observatorio";

      if (pathname.startsWith("/siget/observatorio/plantillas")) {
        if (!canAccessPlantillas) {
          const url = request.nextUrl.clone();
          url.pathname = "/sin-acceso";
          return NextResponse.redirect(url);
        }
      } else if (pathname.startsWith("/siget/observatorio")) {
        if (!canAccessObservatorio) {
          const url = request.nextUrl.clone();
          url.pathname = "/sin-acceso";
          return NextResponse.redirect(url);
        }
      }

      if (requireAuth && !isSuperOrAdmin) {
        const userAgent = request.headers.get("user-agent") || "Desconocido";

        const { data: device } = await supabase
          .from("authorized_devices")
          .select("is_authorized")
          .eq("user_id", user.id)
          .eq("browser_fingerprint", userAgent)
          .single();

        if (!device || !device.is_authorized) {
          const url = request.nextUrl.clone();
          url.pathname = "/esperando-acceso";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  if (isAppRewrite) {
    const url = request.nextUrl.clone();
    url.pathname = "/siget";
    return NextResponse.rewrite(url, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv|xlsx|woff|woff2|tff|otf|js|css)$).*)",
  ],
};
