// ============================================================
// BEN GROWTH CENTER — Webhook ManyChat
// Rota: /api/webhooks/manychat
// Método: POST
// Recebe leads capturados pelo ManyChat (Instagram/WhatsApp)
// e os passa para Dr. Ben qualificar e inserir no CRM
// ============================================================

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const payload = req.body

    // ── 1. Identificar tipo de evento ManyChat ────────────────
    const evento = payload.event_type || payload.type || 'lead_captured'
    const contato = payload.subscriber || payload.contact || {}

    // ── 2. Normalizar dados do lead ───────────────────────────
    const lead = {
      id: `mc_${contato.id || Date.now()}`,
      nome: contato.name || contato.full_name || payload.nome || 'Lead ManyChat',
      telefone: contato.phone || payload.telefone || '',
      email: contato.email || payload.email || '',
      origem: payload.channel === 'instagram' ? 'Instagram' : 'ManyChat',
      canal: payload.channel || 'whatsapp',
      // Dados coletados pelo fluxo ManyChat
      area: payload.custom_fields?.area_juridica || payload.area || '',
      problema: payload.custom_fields?.problema || payload.mensagem || '',
      valor_estimado: payload.custom_fields?.valor_estimado || '',
      // Metadados
      manychat_subscriber_id: contato.id,
      manychat_flow: payload.flow_name || 'unknown',
      criadoEm: new Date().toISOString(),
    }

    // ── 3. Calcular score inicial baseado nos dados coletados ─
    let score = 30 // base
    if (lead.telefone) score += 15
    if (lead.email) score += 10
    if (lead.area) score += 15
    if (lead.problema && lead.problema.length > 20) score += 10
    if (lead.valor_estimado && parseFloat(lead.valor_estimado.replace(/\D/g, '')) > 5000) score += 20
    // Palavras-chave de urgência
    const urgencyWords = ['urgente', 'prazo', 'multa', 'executado', 'penhora', 'bloqueio', 'divida', 'dívida']
    if (urgencyWords.some(w => (lead.problema || '').toLowerCase().includes(w))) score += 10
    score = Math.min(score, 95)

    // ── 4. Determinar urgência ─────────────────────────────────
    const urgencia = score >= 80 ? 'alta' : score >= 60 ? 'media' : 'baixa'

    // ── 5. Determinar status inicial no CRM ───────────────────
    const status = score >= 70 ? 'qualificado' : 'novo'

    // ── 6. Payload normalizado para o CRM ─────────────────────
    const crmPayload = {
      ...lead,
      score,
      urgencia,
      status,
      resumoIA: `Lead captado via ManyChat ${lead.canal === 'instagram' ? 'Instagram' : 'WhatsApp'}. ${
        lead.area ? `Área: ${lead.area}. ` : ''
      }${lead.problema ? `Problema: ${lead.problema}. ` : ''}Score automático: ${score}/100.`,
      tags: ['manychat', lead.canal, ...(lead.area ? [lead.area.toLowerCase()] : [])],
    }

    // ── 7. Chamar Dr. Ben para qualificação (se tiver dados suficientes) ──
    let analiseIa = null
    if (lead.problema && lead.area) {
      try {
        const GEMINI_API_KEY = process.env.OPENAI_API_KEY
        const GEMINI_API_URL = process.env.OPENAI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

        const iaResponse = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gemini-2.0-flash',
            messages: [
              {
                role: 'system',
                content: `Você é o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados em Teresina, PI.
Analise o lead recebido e gere: 1) Resumo em 2 linhas, 2) Score de 0-100, 3) Urgência (alta/media/baixa), 4) Próxima ação recomendada.
Responda em JSON: { "resumo": "...", "score": N, "urgencia": "...", "proxima_acao": "..." }`,
              },
              {
                role: 'user',
                content: `Lead: ${lead.nome}. Área: ${lead.area}. Problema: ${lead.problema}. Valor estimado: ${lead.valor_estimado || 'não informado'}.`,
              },
            ],
            max_tokens: 200,
            temperature: 0.3,
          }),
        })

        if (iaResponse.ok) {
          const iaData = await iaResponse.json()
          const iaText = iaData.choices?.[0]?.message?.content || ''
          // Tentar parsear JSON da resposta
          const jsonMatch = iaText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            analiseIa = JSON.parse(jsonMatch[0])
            crmPayload.score = analiseIa.score || score
            crmPayload.urgencia = analiseIa.urgencia || urgencia
            crmPayload.resumoIA = analiseIa.resumo || crmPayload.resumoIA
          }
        }
      } catch (iaError) {
        console.error('Erro ao chamar Dr. Ben:', iaError)
        // Continua sem análise IA
      }
    }

    // ── 8. Notificar via sistema interno (log / DB) ────────────
    console.log('ManyChat Lead:', JSON.stringify(crmPayload, null, 2))

    // ── 8b. Notificar Plantonista se lead urgente (score >= 70) ──
    const PLANTONISTA = process.env.PLANTONISTA_WHATSAPP  // +5586999484761
    const WTOKEN     = process.env.WHATSAPP_TOKEN
    const WID        = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (PLANTONISTA && WTOKEN && WID && crmPayload.score >= 70) {
      try {
        const urgEmoji = crmPayload.urgencia === 'alta' ? '🔴' : '🟡'
        const alerta =
          `${urgEmoji} LEAD URGENTE — MANYCHAT / BEN GROWTH\n\n` +
          `👤 Nome: ${crmPayload.nome || 'N/A'}\n` +
          `📱 Telefone: ${crmPayload.telefone || 'N/A'}\n` +
          `📧 E-mail: ${crmPayload.email || 'N/A'}\n` +
          `📋 Área: ${crmPayload.area || 'N/A'}\n` +
          `💬 Problema: ${crmPayload.problema || 'N/A'}\n` +
          `🌐 Canal: ${crmPayload.canal || 'N/A'}\n` +
          `⭐ Score Dr. Ben: ${crmPayload.score}/100\n` +
          `🚨 Urgência: ${(crmPayload.urgencia || 'media').toUpperCase()}\n\n` +
          `📊 Análise IA: ${crmPayload.resumoIA || 'N/A'}\n\n` +
          `⚡ Ação recomendada: contato imediato!`
        await fetch(
          `https://graph.facebook.com/v21.0/${WID}/messages`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${WTOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: PLANTONISTA.replace(/\D/g, ''),
              type: 'text',
              text: { body: alerta },
            }),
          }
        )
        console.log('Plantonista notificado (ManyChat lead urgente):', PLANTONISTA)
      } catch (e) {
        console.error('Erro ao notificar plantonista (ManyChat):', e.message)
      }
    }

    // ── 9. Retornar resposta para o ManyChat ──────────────────
    // ManyChat usa isso para personalizar o fluxo de resposta
    return res.status(200).json({
      success: true,
      lead_id: crmPayload.id,
      score: crmPayload.score,
      urgencia: crmPayload.urgencia,
      status: crmPayload.status,
      analise: analiseIa,
      // Dados para o ManyChat personalizar a próxima mensagem
      dynamic_data: {
        score: crmPayload.score,
        area_detectada: crmPayload.area || 'não informada',
        proxima_acao: score >= 70
          ? 'Nosso especialista entrará em contato em breve!'
          : 'Obrigado! Vou verificar melhor sua situação.',
        encaminhar_humano: score >= 70,
      },
    })

  } catch (error) {
    console.error('Erro webhook ManyChat:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    })
  }
}
