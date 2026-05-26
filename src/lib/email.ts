interface SendTicketEmailOptions {
  recipientEmail: string;
  recipientName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  qrCodeBase64: string; // PNG base64 string
  ticketCode: string;
}

/**
 * Envia o e-mail de confirmação de ingresso de forma assíncrona.
 * Utiliza a API REST da Resend se configurada em .env.local,
 * caso contrário, simula de forma elegante no console.
 */
export async function sendTicketEmail(options: SendTicketEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || '';
  
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(options.eventDate);

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 30px; color: #1f2937;">
      <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background-color: #4f46e5; padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Inscrição Confirmada!</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.85; font-size: 14px;">Olá, ${options.recipientName}. Seu ingresso para o evento está aqui.</p>
        </div>

        <!-- Event Details -->
        <div style="padding: 30px; border-b: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px;">${options.eventName}</h2>
          
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #6b7280; width: 80px;">Data:</td>
              <td style="padding: 6px 0; color: #374151;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #6b7280;">Local:</td>
              <td style="padding: 6px 0; color: #374151;">${options.eventLocation}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #6b7280;">Código:</td>
              <td style="padding: 6px 0; color: #4f46e5; font-family: monospace; font-weight: bold; font-size: 16px;">#${options.ticketCode}</td>
            </tr>
          </table>
        </div>

        <!-- Ticket Card & QR Code -->
        <div style="padding: 30px; text-align: center; background-color: #fafafa;">
          <p style="margin: 0 0 15px 0; font-size: 13px; color: #6b7280; font-weight: 500;">
            APRESENTE O QR CODE ABAIXO NA ENTRADA DO EVENTO:
          </p>
          
          <!-- Renderizar o QR Code inline no HTML do E-mail -->
          <div style="display: inline-block; background-color: #ffffff; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb;">
            <img src="${options.qrCodeBase64}" alt="QR Code Ingresso" style="width: 220px; height: 220px; display: block;" />
          </div>
          
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
            Dica: Salve este e-mail ou faça download do ingresso no site para apresentar offline.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; text-align: center; font-size: 11px; color: #9ca3af; border-t: 1px solid #e5e7eb;">
          <p style="margin: 0;">Enviado automaticamente por <strong>EventFlow SaaS</strong>.</p>
          <p style="margin: 5px 0 0 0;">Este e-mail é gerado após inscrições online confirmadas.</p>
        </div>

      </div>
    </div>
  `;

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'EventFlow Ingressos <onboarding@resend.dev>',
          to: [options.recipientEmail],
          subject: `Seu ingresso foi confirmado: ${options.eventName}`,
          html: emailHtml
        })
      });

      if (res.ok) {
        console.log(`[E-mail Resend] E-mail enviado com sucesso para ${options.recipientEmail}`);
        return true;
      } else {
        const err = await res.json();
        console.error('[E-mail Resend] Falha ao enviar e-mail via API da Resend:', err);
        return false;
      }
    } catch (error) {
      console.error('[E-mail Resend] Falha de conexão ao enviar e-mail:', error);
      return false;
    }
  } else {
    // FALLBACK SIMULADOR (Modo Desenvolvimento)
    console.log('\n================================================================');
    console.log('📬 [SIMULADOR DE E-MAIL EVENTFLOW] - INGRESSO CONFIRMADO');
    console.log('----------------------------------------------------------------');
    console.log(`Destinatário : ${options.recipientName} <${options.recipientEmail}>`);
    console.log(`Evento       : ${options.eventName}`);
    console.log(`Data/Horário : ${formattedDate}`);
    console.log(`Local        : ${options.eventLocation}`);
    console.log(`Código       : #${options.ticketCode}`);
    console.log(`QR Code      : [IMAGEM BASE64 PNG EMBUTIDA]`);
    console.log('----------------------------------------------------------------');
    console.log('💡 DICA: Para disparar e-mails reais, configure a chave ');
    console.log('RESEND_API_KEY no arquivo .env.local da raiz.');
    console.log('================================================================\n');
    return true;
  }
}
