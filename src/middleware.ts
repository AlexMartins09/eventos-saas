import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Verificar se a rota atual é administrativa
  if (pathname.startsWith('/admin')) {
    const sessionToken = req.cookies.get('eventflow_session')?.value;

    // Se não houver token, redireciona para login com parâmetro de redirecionamento
    if (!sessionToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar token JWT
    const payload = await verifyJWT(sessionToken);
    
    // Se o token for inválido, expira o cookie e manda para login
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('eventflow_session');
      return response;
    }

    // Verificar se a role é ADMIN
    if (payload.role !== 'ADMIN') {
      // Se não for admin, redireciona para a página principal com erro
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  }

  // Deixar a requisição seguir em frente para todas as outras rotas
  return NextResponse.next();
}

// Configurar o matcher para rodar apenas nas rotas administrativas
export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
