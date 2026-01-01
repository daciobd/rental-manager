import type { PaymentWithContract } from '@shared/schema';

export interface EmailConfig {
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
}

export async function sendOverduePaymentNotification(
  payment: PaymentWithContract,
  config?: EmailConfig
): Promise<EmailResult> {
  const tenantEmail = payment.contract?.tenantEmail;
  
  if (!tenantEmail) {
    return { success: false, message: 'Email do inquilino não cadastrado' };
  }
  
  const apiKey = config?.apiKey || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.log('[Email] Simulando envio de email (nenhuma API key configurada)');
    console.log('[Email] Para:', tenantEmail);
    console.log('[Email] Assunto: Lembrete de Pagamento - Aluguel Vencido');
    console.log('[Email] Conteúdo:', generateEmailContent(payment));
    return { 
      success: true, 
      message: 'Email simulado (configurar SendGrid ou Resend para envio real)' 
    };
  }

  try {
    const emailContent = generateEmailContent(payment);
    const fromEmail = config?.fromEmail || 'noreply@gestaoalugueis.com';
    const fromName = config?.fromName || 'Sistema de Gestão de Aluguéis';

    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [tenantEmail],
          subject: 'Lembrete de Pagamento - Aluguel Vencido',
          html: emailContent,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: `Erro ao enviar email: ${error}` };
      }

      const result = await response.json();
      return { success: true, message: 'Email enviado com sucesso', emailId: result.id };
    }

    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: tenantEmail }] }],
          from: { email: fromEmail, name: fromName },
          subject: 'Lembrete de Pagamento - Aluguel Vencido',
          content: [{ type: 'text/html', value: emailContent }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: `Erro ao enviar email: ${error}` };
      }

      return { success: true, message: 'Email enviado com sucesso' };
    }

    return { success: false, message: 'Nenhum serviço de email configurado' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: `Erro ao enviar email: ${error}` };
  }
}

export async function sendPaymentDueSoonNotification(
  payment: PaymentWithContract,
  daysUntilDue: number,
  config?: EmailConfig
): Promise<EmailResult> {
  const tenantEmail = payment.contract?.tenantEmail;
  
  if (!tenantEmail) {
    return { success: false, message: 'Email do inquilino não cadastrado' };
  }

  const apiKey = config?.apiKey || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.log('[Email] Simulando envio de email (nenhuma API key configurada)');
    console.log('[Email] Para:', tenantEmail);
    console.log('[Email] Assunto: Lembrete de Pagamento - Vencimento Próximo');
    return { 
      success: true, 
      message: 'Email simulado (configurar SendGrid ou Resend para envio real)' 
    };
  }

  const emailContent = generateDueSoonEmailContent(payment, daysUntilDue);
  const fromEmail = config?.fromEmail || 'noreply@gestaoalugueis.com';
  const fromName = config?.fromName || 'Sistema de Gestão de Aluguéis';

  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [tenantEmail],
          subject: `Lembrete de Pagamento - Vencimento em ${daysUntilDue} dias`,
          html: emailContent,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: `Erro ao enviar email: ${error}` };
      }

      const result = await response.json();
      return { success: true, message: 'Email enviado com sucesso', emailId: result.id };
    }

    return { success: false, message: 'Serviço de email não configurado' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: `Erro ao enviar email: ${error}` };
  }
}

function generateEmailContent(payment: PaymentWithContract): string {
  const propertyAddress = payment.property?.address || 'N/A';
  const value = parseFloat(payment.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const dueDate = formatDate(payment.dueDate);
  const [year, month] = (payment.referenceMonth || '').split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = monthNames[parseInt(month, 10) - 1] || month;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .info { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Aluguel Vencido</h1>
    </div>
    <div class="content">
      <p>Prezado(a) <strong>${payment.contract?.tenant || 'Inquilino'}</strong>,</p>
      
      <p>Identificamos que o pagamento do aluguel referente ao mês de <strong>${monthName}/${year}</strong> encontra-se vencido.</p>
      
      <div class="info">
        <p><strong>Imóvel:</strong> ${propertyAddress}</p>
        <p><strong>Vencimento:</strong> ${dueDate}</p>
        <p><strong>Valor:</strong> <span class="amount">R$ ${value}</span></p>
      </div>
      
      <p>Por favor, efetue o pagamento o mais breve possível para evitar multas e juros.</p>
      
      <p>Em caso de dúvidas ou se o pagamento já foi realizado, entre em contato conosco.</p>
      
      <p>Atenciosamente,<br>Administração do Imóvel</p>
    </div>
    <div class="footer">
      <p>Este é um email automático. Por favor, não responda diretamente.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateDueSoonEmailContent(payment: PaymentWithContract, daysUntilDue: number): string {
  const propertyAddress = payment.property?.address || 'N/A';
  const value = parseFloat(payment.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const dueDate = formatDate(payment.dueDate);
  const [year, month] = (payment.referenceMonth || '').split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthName = monthNames[parseInt(month, 10) - 1] || month;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .info { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Lembrete de Pagamento</h1>
    </div>
    <div class="content">
      <p>Prezado(a) <strong>${payment.contract?.tenant || 'Inquilino'}</strong>,</p>
      
      <p>Este é um lembrete de que o pagamento do aluguel referente ao mês de <strong>${monthName}/${year}</strong> vence em <strong>${daysUntilDue} dia(s)</strong>.</p>
      
      <div class="info">
        <p><strong>Imóvel:</strong> ${propertyAddress}</p>
        <p><strong>Vencimento:</strong> ${dueDate}</p>
        <p><strong>Valor:</strong> <span class="amount">R$ ${value}</span></p>
      </div>
      
      <p>Organize-se para efetuar o pagamento até a data de vencimento.</p>
      
      <p>Atenciosamente,<br>Administração do Imóvel</p>
    </div>
    <div class="footer">
      <p>Este é um email automático. Por favor, não responda diretamente.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
