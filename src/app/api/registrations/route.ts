import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { signJWT } from '@/lib/jwt';
import QRCode from 'qrcode';
import { sendTicketEmail } from '@/lib/email';

// GET - Listar participantes de um evento (ADMIN) ou consultar próprio ingresso (PARTICIPANTE)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');
    const countOnly = searchParams.get('count_only') === 'true';

    if (!eventId) {
      return NextResponse.json({ error: 'O parâmetro event_id é obrigatório.' }, { status: 400 });
    }

    // Se for solicitado apenas a contagem, é uma rota pública e segura
    if (countOnly) {
      const registrations = await db.getRegistrationsByEventId(eventId);
      return NextResponse.json({ count: registrations.length });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('eventflow_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Se o usuário não for ADMIN, ele só pode consultar suas próprias inscrições
    if (payload.role !== 'ADMIN') {
      const myRegs = await db.getRegistrationsByUserId(payload.id);
      const match = myRegs.find(r => r.event_id === eventId);
      if (match) {
        return NextResponse.json({ registered: true, registrationId: match.id });
      }
      return NextResponse.json({ registered: false });
    }

    // Se for ADMIN, lista inscrições completas
    const registrations = await db.getRegistrationsByEventId(eventId);
    return NextResponse.json(registrations);

  } catch (error) {
    console.error('[API Registrations GET] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao listar inscrições.' },
      { status: 500 }
    );
  }
}

// POST - Criar nova inscrição (Usuário Logado ou Cadastro Inline)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, name, email, phone, password } = body;

    if (!event_id) {
      return NextResponse.json({ error: 'O ID do evento é obrigatório.' }, { status: 400 });
    }

    // Verificar se o evento existe e está ativo/com vagas
    const event = await db.getEventById(event_id);
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });
    }

    if (event.status === 'encerrado') {
      return NextResponse.json({ error: 'Este evento já foi encerrado.' }, { status: 400 });
    }

    // Verificar número de vagas
    const currentRegs = await db.getRegistrationsByEventId(event_id);
    if (currentRegs.length >= event.max_participants) {
      return NextResponse.json({ error: 'Desculpe, este evento já está lotado!' }, { status: 400 });
    }

    // Determinar o Usuário
    let userId = '';
    let userEmail = '';
    let userName = '';
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('eventflow_session')?.value;
    const sessionPayload = sessionToken ? await verifyJWT(sessionToken) : null;

    if (sessionPayload) {
      userId = sessionPayload.id;
      userEmail = sessionPayload.email;
      userName = sessionPayload.name;
    } else {
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'Para se inscrever, informe seu nome, e-mail e crie uma senha.' },
          { status: 400 }
        );
      }

      let user = await db.getUserByEmail(email);
      if (user) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado no sistema. Por favor, faça login antes de se inscrever!' },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      user = await db.createUser({
        name,
        email,
        phone: phone || '',
        password_hash: passwordHash,
        role: 'PARTICIPANTE'
      });

      userId = user.id;
      userEmail = user.email;
      userName = user.name;

      const token = await signJWT({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });

      cookieStore.set('eventflow_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 604800,
        path: '/'
      });
    }

    // Validar duplicado
    const userRegistrations = await db.getRegistrationsByUserId(userId);
    const isAlreadyRegistered = userRegistrations.some(r => r.event_id === event_id);
    if (isAlreadyRegistered) {
      const existing = userRegistrations.find(r => r.event_id === event_id);
      return NextResponse.json(
        { error: 'Você já está inscrito neste evento!', registrationId: existing?.id },
        { status: 409 }
      );
    }

    const registrationId = crypto.randomUUID();
    const uniqueToken = crypto.randomUUID();

    // Gerar QR Code Real
    const qrData = JSON.stringify({
      registrationId,
      token: uniqueToken,
      eventId: event_id
    });
    
    const qrCodeBase64 = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#090d16',
        light: '#ffffff'
      }
    });

    const registration = await db.createRegistration({
      event_id,
      user_id: userId,
      qr_code: qrCodeBase64
    });

    const finalReg = await db.getRegistrationById(registration.id);
    
    if (finalReg) {
      const syncQrData = JSON.stringify({
        registrationId: finalReg.id,
        token: finalReg.unique_token,
        eventId: finalReg.event_id
      });
      const syncQrCode = await QRCode.toDataURL(syncQrData, { width: 400, margin: 1.5 });
      
      if (!db.supabase) {
        const localDbPath = require('path').join(process.cwd(), 'database', 'db_store.json');
        const fs = require('fs');
        if (fs.existsSync(localDbPath)) {
          const dbData = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
          const idx = dbData.registrations.findIndex((r: any) => r.id === finalReg.id);
          if (idx !== -1) {
            dbData.registrations[idx].qr_code = syncQrCode;
            fs.writeFileSync(localDbPath, JSON.stringify(dbData, null, 2), 'utf-8');
          }
        }
      } else {
        await db.supabase
          .from('registrations')
          .update({ qr_code: syncQrCode })
          .eq('id', finalReg.id);
      }
    }

    const regToReturn = finalReg || registration;

    try {
      sendTicketEmail({
        recipientEmail: userEmail,
        recipientName: userName,
        eventName: event.title,
        eventDate: event.event_date,
        eventLocation: event.location,
        qrCodeBase64: regToReturn.qr_code,
        ticketCode: regToReturn.unique_token.substring(0, 8).toUpperCase()
      });
    } catch (emailErr) {
      console.error('[API Registrations] Falha no disparo de e-mail:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Inscrição realizada com sucesso!',
      registrationId: regToReturn.id
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API Registrations POST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar inscrição.' },
      { status: 500 }
    );
  }
}
