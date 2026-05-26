import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 1. Validar se é administrador
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('eventflow_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas organizadores.' }, { status: 403 });
    }

    // 2. Processar parâmetros da requisição
    const body = await req.json();
    const { token, registration_id, undo } = body;

    // --- SUPORTE A DESFAZER CHECK-IN (UNDO) ---
    if (undo && registration_id) {
      const reg = await db.getRegistrationById(registration_id);
      if (!reg) {
        return NextResponse.json({ error: 'Inscrição não encontrada.' }, { status: 404 });
      }

      await db.updateRegistrationCheckin(registration_id, false, null);
      return NextResponse.json({
        success: true,
        message: 'Check-in desfeito com sucesso.',
        registration: {
          id: reg.id,
          checkin_done: false,
          checkin_at: null
        }
      });
    }

    // --- MODO 1: CHECK-IN MANUAL VIA DASHBOARD (REGISTRATION_ID) ---
    if (registration_id) {
      const reg = await db.getRegistrationById(registration_id);
      if (!reg) {
        return NextResponse.json({ error: 'Inscrição não encontrada.' }, { status: 404 });
      }

      if (reg.checkin_done) {
        return NextResponse.json(
          { error: 'Check-in já realizado anteriormente.', already_done: true },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const updated = await db.updateRegistrationCheckin(registration_id, true, now);

      return NextResponse.json({
        success: true,
        message: 'Entrada Liberada!',
        registration: updated
      });
    }

    // --- MODO 2: LEITOR DE QR CODE DA CÂMERA (TOKEN) ---
    if (token) {
      // Buscar inscrição pelo token UUID único
      const reg = await db.getRegistrationByToken(token);
      
      if (!reg) {
        return NextResponse.json(
          { success: false, status_code: 'INVALIDO', message: 'Ingresso inválido!' },
          { status: 200 } // Retorna 200 para facilitar o processamento do leitor de câmera
        );
      }

      if (reg.checkin_done) {
        return NextResponse.json({
          success: false,
          status_code: 'UTILIZADO',
          message: 'QR Code já utilizado!',
          checkin_at: reg.checkin_at,
          participant_name: reg.user?.name
        }, { status: 200 });
      }

      // Marcar check-in como concluído
      const now = new Date().toISOString();
      const updated = await db.updateRegistrationCheckin(reg.id, true, now);

      return NextResponse.json({
        success: true,
        status_code: 'LIBERADO',
        message: 'Entrada Liberada!',
        participant_name: reg.user?.name,
        event_title: reg.event?.title,
        registration: updated
      });
    }

    return NextResponse.json(
      { error: 'Forneça o unique_token do QR Code ou o registration_id.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[API Checkin POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar check-in.' },
      { status: 500 }
    );
  }
}
