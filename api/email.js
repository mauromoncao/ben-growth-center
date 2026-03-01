// ============================================================
// BEN GROWTH CENTER — Resend Email API
// Emails transacionais: confirmação, follow-up, contratos
// Rota: POST /api/email
// Body: { type, to, name, data? }
// ============================================================

export const config = { maxDuration: 15 }

const FROM_EMAIL = 'Dr. Ben <drben@mauromoncao.adv.br>'
const REPLY_TO = 'mauromoncaoadv.escritorio@gmail.com'

// Templates de email
const EMAIL_TEMPLATES = {

  // Confirmação de reunião
  reuniao_confirmada: (data) => ({
    subject: `✅ Reunião Confirmada — ${data.data} às ${data.hora}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#0f2044,#1e3470);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#D4A017;margin:0;font-size:24px;">Mauro Monção Advogados</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Teresina, Piauí</p>
    </div>
    <div style="background:#ffffff;padding:30px;border-radius:0 0 12px 12px;">
      <h2 style="color:#0f2044;margin:0 0 20px;">✅ Sua reunião está confirmada!</h2>
      <p style="color:#374151;">Olá, <strong>${data.nome}</strong>!</p>
      <p style="color:#374151;">Sua reunião com o Dr. Mauro Monção foi confirmada.</p>
      
      <div style="background:#f0f4ff;border-left:4px solid #0f2044;padding:20px;border-radius:8px;margin:20px 0;">
        <p style="margin:5px 0;color:#374151;"><strong>📅 Data:</strong> ${data.data}</p>
        <p style="margin:5px 0;color:#374151;"><strong>⏰ Horário:</strong> ${data.hora}</p>
        <p style="margin:5px 0;color:#374151;"><strong>⏱️ Duração:</strong> ${data.duracao || '45 minutos'}</p>
        <p style="margin:5px 0;color:#374151;"><strong>📍 Local:</strong> ${data.local || 'Google Meet (link abaixo)'}</p>
        ${data.meetLink ? `<p style="margin:5px 0;color:#374151;"><strong>🎥 Meet:</strong> <a href="${data.meetLink}" style="color:#2563eb;">${data.meetLink}</a></p>` : ''}
      </div>

      <p style="color:#374151;">Em caso de dúvidas ou necessidade de reagendamento, entre em contato:</p>
      <p style="color:#374151;">📱 WhatsApp: <a href="https://wa.me/5586999999999" style="color:#25D366;">(86) 99xxx-xxxx</a></p>
      
      <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;">Mauro Monção Advogados Associados | Teresina, PI</p>
        <p style="color:#9ca3af;font-size:12px;">Conteúdo informativo. Consulte um advogado.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  }),

  // Lead qualificado — notificação interna
  lead_qualificado: (data) => ({
    subject: `🎯 Novo Lead Qualificado — Score ${data.score}/100 — ${data.area}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
    <div style="background:#0f2044;padding:20px;text-align:center;">
      <h2 style="color:#D4A017;margin:0;">🎯 Lead Qualificado — Dr. Ben</h2>
    </div>
    <div style="padding:25px;">
      <div style="background:${data.score >= 80 ? '#dcfce7' : '#fef9c3'};border-radius:8px;padding:15px;margin-bottom:20px;">
        <h3 style="margin:0;color:${data.score >= 80 ? '#166534' : '#92400e'};">Score: ${data.score}/100 — ${data.score >= 80 ? '🔴 ALTA PRIORIDADE' : '🟡 MÉDIA PRIORIDADE'}</h3>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;color:#6b7280;width:35%;"><strong>Nome:</strong></td><td style="padding:8px;color:#111827;">${data.nome}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;"><strong>Telefone:</strong></td><td style="padding:8px;color:#111827;">${data.telefone}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;"><strong>Área:</strong></td><td style="padding:8px;color:#111827;">${data.area}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;"><strong>Problema:</strong></td><td style="padding:8px;color:#111827;">${data.resumo}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;"><strong>Origem:</strong></td><td style="padding:8px;color:#111827;">${data.origem || 'WhatsApp'}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;"><strong>Horário:</strong></td><td style="padding:8px;color:#111827;">${data.hora}</td></tr>
      </table>
      <div style="margin-top:20px;text-align:center;">
        <a href="https://ben-growth-center.vercel.app/crm" style="background:#0f2044;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Abrir no CRM →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
  }),

  // Boas-vindas ao cliente
  boas_vindas: (data) => ({
    subject: `Bem-vindo ao escritório Mauro Monção Advogados! 👋`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0f2044,#1e3470);padding:30px;text-align:center;">
      <h1 style="color:#D4A017;margin:0;">Mauro Monção Advogados</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;">Tributário · Previdenciário · Bancário</p>
    </div>
    <div style="padding:30px;">
      <h2 style="color:#0f2044;">Olá, ${data.nome}! 👋</h2>
      <p style="color:#374151;">Seja bem-vindo ao escritório Mauro Monção Advogados Associados. Estamos prontos para auxiliá-lo.</p>
      <p style="color:#374151;">Nossa equipe especializada atua nas áreas de:</p>
      <ul style="color:#374151;">
        <li>⚖️ Direito Tributário — Recuperação de créditos, defesa fiscal</li>
        <li>📋 Direito Previdenciário — Aposentadoria especial, revisão de benefícios</li>
        <li>🏦 Direito Bancário — Revisão de contratos, juros abusivos</li>
      </ul>
      <p style="color:#374151;">Em caso de dúvidas, entre em contato pelo WhatsApp ou aguarde o retorno da nossa equipe.</p>
      <div style="margin-top:25px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;">Conteúdo informativo. Consulte um advogado para orientação específica.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  }),

  // Follow-up 24h
  followup_24h: (data) => ({
    subject: `Acompanhamento — ${data.area} | Mauro Monção Advogados`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;">
    <div style="background:#0f2044;padding:20px;text-align:center;">
      <h2 style="color:#D4A017;margin:0;">Mauro Monção Advogados</h2>
    </div>
    <div style="padding:25px;">
      <p style="color:#374151;">Olá, <strong>${data.nome}</strong>!</p>
      <p style="color:#374151;">Gostaríamos de saber se você tem alguma dúvida ou precisa de mais informações sobre o seu caso de <strong>${data.area}</strong>.</p>
      <p style="color:#374151;">Nossa equipe está disponível para ajudá-lo. Entre em contato quando quiser:</p>
      <p style="color:#374151;">📱 WhatsApp: (86) 99xxx-xxxx<br>📧 Email: contato@mauromoncao.adv.br</p>
      <div style="margin-top:20px;text-align:center;">
        <a href="https://wa.me/5586999999999" style="background:#25D366;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;">
          💬 Falar no WhatsApp
        </a>
      </div>
      <div style="margin-top:25px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;">Conteúdo informativo. Consulte um advogado.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  }),
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const { type, to, name, data = {} } = req.body

    if (!type || !to) {
      return res.status(400).json({ error: 'type e to são obrigatórios' })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        message: 'RESEND_API_KEY não configurada — email não enviado',
      })
    }

    const templateFn = EMAIL_TEMPLATES[type]
    if (!templateFn) {
      return res.status(400).json({ error: `Template '${type}' não encontrado` })
    }

    const emailData = templateFn({ nome: name, ...data })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        reply_to: REPLY_TO,
        to: [to],
        subject: emailData.subject,
        html: emailData.html,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Resend error: ${err}`)
    }

    const result = await response.json()

    return res.status(200).json({
      success: true,
      emailId: result.id,
      type,
      to,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Email API] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao enviar email',
    })
  }
}
