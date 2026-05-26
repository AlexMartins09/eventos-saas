import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { db } from '@/lib/db';

// GET - Listar todos os eventos
export async function GET(req: NextRequest) {
  try {
    const events = await db.getEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error('[API Events List] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao listar eventos.' },
      { status: 500 }
    );
  }
}

// POST - Criar novo evento (Restrito a ADMIN)
export async function POST(req: NextRequest) {
  try {
    // 1. Proteger contra não-administradores
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('eventflow_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas organizadores.' }, { status: 403 });
    }

    // 2. Processar corpo da requisição
    const body = await req.json();
    const { title, description, banner_url, location, event_date, max_participants, is_paid, price, whatsapp_contact } = body;

    // Validações básicas
    if (!title || !description || !location || !event_date || !max_participants) {
      return NextResponse.json(
        { error: 'Título, descrição, local, data e limite de vagas são obrigatórios.' },
        { status: 400 }
      );
    }

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

    // 3. Gerar SLUG Automático seguro
    const slug = title
      .toLowerCase()
      .normalize('NFD') // Decompõe caracteres acentuados (ex: 'á' vira 'a' + '´')
      .replace(/[\u0300-\u036f]/g, '') // Remove marcas de acentos combinadas
      .replace(/[^\w\s-]/g, '') // Remove caracteres não alfanuméricos exceto espaços e hifens
      .replace(/[\s_]+/g, '-') // Substitui múltiplos espaços ou underscores por um único hífen
      .replace(/^-+|-+$/g, ''); // Limpa hifens no início e fim

    // Verificar se slug já existe para evitar colisão
    const existingEvent = await db.getEventBySlug(slug);
    let finalSlug = slug;
    if (existingEvent) {
      // Se houver conflito, adiciona um sufixo aleatório simples
      finalSlug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 4. Inserir evento no banco
    const newEvent = await db.createEvent({
      title,
      slug: finalSlug,
      description,
      banner_url: banner_url || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', // Default purple gradient
      location,
      event_date,
      max_participants: Number(max_participants) || 100,
      is_paid: !!is_paid,
      price: is_paid ? Number(price) : undefined,
      whatsapp_contact: is_paid ? whatsapp_contact : undefined,
      created_by: payload.id
    });

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error: any) {
    console.error('[API Create Event] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao criar evento.' },
      { status: 500 }
    );
  }
}
