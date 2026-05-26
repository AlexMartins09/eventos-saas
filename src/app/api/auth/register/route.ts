import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signJWT } from '@/lib/jwt';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body;

    // Validação de inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const validatedRole: UserRole = role === 'ADMIN' ? 'ADMIN' : 'PARTICIPANTE';

    // Verificar se usuário já existe
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário cadastrado com este e-mail.' },
        { status: 409 }
      );
    }

    // Criar senha hash
    const passwordHash = await hashPassword(password);

    // Criar usuário no banco de dados
    const user = await db.createUser({
      name,
      email,
      phone: phone || '',
      password_hash: passwordHash,
      role: validatedRole
    });

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

    // Retornar dados do usuário (excluindo hash da senha)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API Register] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao registrar usuário.' },
      { status: 500 }
    );
  }
}
