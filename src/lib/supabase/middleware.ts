import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SCHEMA_DB } from "./schema";

/**
 * Renova a sessao e protege /gestao/*.
 * Isto e conveniencia de UX: a protecao real dos dados e o RLS no Postgres.
 */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SCHEMA_DB },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const areaRestrita = path.startsWith("/gestao");

  if (areaRestrita && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirecionar", path);
    return NextResponse.redirect(url);
  }

  if (path === "/entrar" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/gestao";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
