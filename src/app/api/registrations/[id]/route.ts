import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | any }
) {
  try {
    let id = '';
    if (params && typeof params.then === 'function') {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } else if (params && params.id) {
      id = params.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'O ID da inscrição é obrigatório.' }, { status: 400 });
    }

    const registration = await db.getRegistrationById(id);
    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error('[API Registration Fetch] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar inscrição.' },
      { status: 500 }
    );
  }
}
