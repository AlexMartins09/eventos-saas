import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { comparePassword } from '@/lib/password';
import { signJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Comparar senha
    const isPasswordCorrect = await comparePassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. E-mail ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Gerar JWT Token
    const token = await signJWT({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Definir cookie seguro
    const cookieStore = await cookies();
    cookieStore.set('eventflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800, // 7 dias em segundos
      path: '/'
    });

    // Retornar usuário
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    });

  } catch (error: any) {
    console.error('[API Login] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar login.' },
      { status: 500 }
    );
  }
}
