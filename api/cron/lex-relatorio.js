// ============================================================
// BEN GROWTH CENTER — Cron: Lex Relatório Semanal
// Rota: GET /api/cron/lex-relatorio
// Schedule: 09:00 toda segunda (0 9 * * 1)
// Consolida métricas da semana e envia resumo executivo
// ============================================================

export const config = { maxDuration: 60 }

const PLANTONISTA     = process.env.PLANTONISTA_WHATSAPP || ''
const GEMINI_KEY      = process.env.GEMINI_API_KEY || ''
const ZAPI_INSTANCE   = process.env.ZAPI_INSTANCE_ID || ''
const ZAPI_TOKEN      = process.env.ZAPI_TOKEN || ''
const ZAPI_CLIENT_TOK = process.env.ZAPI_CLIENT_TOKEN || ''
const ZAPI_BASE       = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`

// Usa Z-API (instância Dr. Ben) para enviar notificações
async function enviarWhatsApp(numero, mensagem) {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN || !numero) return false
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (ZAPI_CLIENT_TOK) headers['Client-Token'] = ZAPI_CLIENT_TOK
    const tel = numero.replace(/\D/g, '')
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: tel, message: mensagem }),
    })
    return res.ok
  } catch { return false }
}

async function gerarAnalise(metricas) {
  if (!GEMINI_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é o Lex Relatório, analista do escritório Mauro Monção Advogados.
Analise estas métricas da semana e dê 3 insights práticos em até 150 palavras:
${JSON.stringify(metricas, null, 2)}
Foque em: o que funcionou, o que melhorar, ação prioritária para próxima semana.`
            }]
          }],
          generationConfig: { maxOutputTokens: 300 }
        })
      }
    )
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const agora    = new Date()
    const semana   = `${agora.toLocaleDateString('pt-BR')} (${agora.toLocaleString('pt-BR', { weekday: 'long' })})`

    // ── Coletar métricas da semana ───────────────────────────
    const [metaRes, googleRes, keepaliveRes] = await Promise.allSettled([
      fetch('https://ben-growth-center.vercel.app/api/meta-ads?action=insights&days=7'),
      fetch('https://ben-growth-center.vercel.app/api/google-ads?action=insights&account=escritorio&days=7'),
      fetch('https://ben-growth-center.vercel.app/api/whatsapp-keepalive'),
    ])

    const metaData     = metaRes.status === 'fulfilled' && metaRes.value.ok ? await metaRes.value.json() : null
    const googleData   = googleRes.status === 'fulfilled' && googleRes.value.ok ? await googleRes.value.json() : null
    const keepaliveData = keepaliveRes.status === 'fulfilled' && keepaliveRes.value.ok ? await keepaliveRes.value.json() : null

    const metricas = {
      semana,
      meta_ads:    metaData      ? { status: 'ok', dados: metaData }      : { status: 'sem dados' },
      google_ads:  googleData    ? { status: 'ok', dados: googleData }    : { status: 'sem dados' },
      whatsapp:    keepaliveData ? { status: keepaliveData.action }        : { status: 'sem dados' },
    }

    // ── Gerar análise com Gemini ─────────────────────────────
    const analise = await gerarAnalise(metricas)

    // ── Montar mensagem WhatsApp ─────────────────────────────
    let whatsappEnviado = false
    if (PLANTONISTA) {
      const linhas = [
        `📋 *Lex Relatório Semanal*`,
        `📅 Segunda-feira, ${agora.toLocaleDateString('pt-BR')}`,
        ``,
        `*Resumo da semana:*`,
        `• Meta Ads: ${metaData ? '✅ dados coletados' : '⚠️ sem dados'}`,
        `• Google Ads: ${googleData ? '✅ dados coletados' : '⚠️ sem dados'}`,
        `• WhatsApp Dr. Ben (Z-API): ${keepaliveData?.action === 'healthy' ? '✅ online' : '⚠️ verificar'}`,
        ``,
      ]
      if (analise) {
        linhas.push(`*Análise Lex IA:*`)
        linhas.push(analise)
      }
      linhas.push(`\n_Relatório automático — Ben Growth Center_`)
      whatsappEnviado = await enviarWhatsApp(PLANTONISTA, linhas.join('\n'))
    }

    const resultado = {
      success: true,
      semana,
      metricas_coletadas: Object.keys(metricas).length,
      analise_gerada: !!analise,
      whatsapp_enviado: whatsappEnviado,
      timestamp: agora.toISOString(),
    }

    console.log('[LEX-RELATORIO]', JSON.stringify(resultado))
    return res.status(200).json(resultado)
  } catch (e) {
    console.error('[LEX-RELATORIO] Erro:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
