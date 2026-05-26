import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { db } from '@/lib/db';

// Helper de validação admin seguro
async function isAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('eventflow_session')?.value;
  if (!sessionToken) return false;

  const payload = await verifyJWT(sessionToken);
  return payload && payload.role === 'ADMIN';
}

// 1. GET - Buscar detalhes de um evento específico
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

    const event = await db.getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('[API Event Fetch] Erro:', error);
    return NextResponse.json({ error: 'Erro ao buscar evento.' }, { status: 500 });
  }
}

// 2. PUT - Atualizar evento (Apenas ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | any }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    let id = '';
    if (params && typeof params.then === 'function') {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } else if (params && params.id) {
      id = params.id;
    }

    const body = await req.json();
    const { title, description, banner_url, location, event_date, max_participants, is_paid, price, whatsapp_contact, status } = body;

    // Validação específica para evento pago
    if (is_paid) {
      if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
        return NextResponse.json(
          { error: 'Para eventos pagos, insira um preço válido maior que zero.' },
          { status: 400 }
        );
      }
      if (!whatsapp_contact || whatsapp_contact.trim() === '') {
        return NextResponse.json(
          { error: 'Para eventos pagos, informe o WhatsApp de contato para o acerto do pagamento.' },
          { status: 400 }
        );
      }
    }

    // Gerar slug caso o título tenha sido alterado
    let slug = undefined;
    if (title) {
      slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updatedEvent = await db.updateEvent(id, {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(description && { description }),
      ...(banner_url && { banner_url }),
      ...(location && { location }),
      ...(event_date && { event_date }),
      ...(max_participants !== undefined && { max_participants: parseInt(max_participants) }),
      ...(is_paid !== undefined && { is_paid }),
      price: is_paid ? Number(price) : undefined,
      whatsapp_contact: is_paid ? whatsapp_contact : undefined,
      ...(status && { status })
    });

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error('[API Event Update] Erro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar evento.' }, { status: 500 });
  }
}

// 3. DELETE - Excluir evento (Apenas ADMIN)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | any }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    let id = '';
    if (params && typeof params.then === 'function') {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } else if (params && params.id) {
      id = params.id;
    }

    const success = await db.deleteEvent(id);
    if (!success) {
      return NextResponse.json({ error: 'Erro ao excluir o evento. Evento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Evento excluído com sucesso.' });
  } catch (error) {
    console.error('[API Event Delete] Erro:', error);
    return NextResponse.json({ error: 'Erro ao excluir evento.' }, { status: 500 });
  }
}
