import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('eventflow_session');
    
    return NextResponse.json({ success: true, message: 'Logout efetuado com sucesso.' });
  } catch (error) {
    console.error('[API Logout] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao efetuar logout.' },
      { status: 500 }
    );
  }
}
