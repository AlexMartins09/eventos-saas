import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Proteger rota contra não administradores
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('eventflow_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    // 2. Coletar estatísticas unificadas
    const stats = await db.getDashboardStats();
    
    // Obter lista atualizada de eventos detalhados para exibir na tabela do admin
    const events = await db.getEvents();
    
    // Associar contagem de inscritos para cada evento
    const eventsWithCount = await Promise.all(
      events.map(async (ev) => {
        const regs = await db.getRegistrationsByEventId(ev.id);
        const presentCount = regs.filter(r => r.checkin_done).length;
        return {
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          event_date: ev.event_date,
          max_participants: ev.max_participants,
          registered_count: regs.length,
          present_count: presentCount,
          status: ev.status
        };
      })
    );

    return NextResponse.json({
      stats,
      events: eventsWithCount
    });

  } catch (error) {
    console.error('[API Admin Stats] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao compilar estatísticas.' },
      { status: 500 }
    );
  }
}
