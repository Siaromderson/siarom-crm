import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: CookieToSet[]) => toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = req.nextUrl;
  const isLogin = url.pathname.startsWith("/login");
  const isPublic = isLogin || url.pathname === "/";

  if (!user && !isPublic) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }
  if (user && isLogin) {
    const r = url.clone();
    r.pathname = "/";
    return NextResponse.redirect(r);
  }

  // Restringe não-admin a /tarefas
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from("siarom_crm_profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();
    const isAdmin = profile?.role === "admin";
    const allowed = url.pathname.startsWith("/tarefas");
    if (!isAdmin && !allowed) {
      const r = url.clone();
      r.pathname = "/tarefas";
      return NextResponse.redirect(r);
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
