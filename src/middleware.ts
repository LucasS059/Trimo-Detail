import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verificarSessaoLoja, COOKIE_SESSION_NAME } from "@/lib/auth/sessao-loja";

const ROTAS_ADMIN = ["/agenda", "/clientes", "/servicos", "/financeiro", "/configuracoes"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_SESSION_NAME)?.value;
  const lojaLogadaId = await verificarSessaoLoja(token);


  const ehRotaAdmin = ROTAS_ADMIN.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );

  // Se tentar acessar o admin sem autenticação válida
  if (ehRotaAdmin && !lojaLogadaId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o lojista já está autenticado e tentar acessar a tela de login ou cadastro
  if ((pathname === "/login" || pathname === "/cadastro") && lojaLogadaId) {
    return NextResponse.redirect(new URL("/agenda", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/agenda/:path*",
    "/agenda",
    "/clientes/:path*",
    "/clientes",
    "/servicos/:path*",
    "/servicos",
    "/financeiro/:path*",
    "/financeiro",
    "/configuracoes/:path*",
    "/configuracoes",
    "/login",
    "/cadastro",
  ],
};
