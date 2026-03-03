// ============================================================
// BEN GROWTH CENTER — Cron: Lex Monitor (Saúde do Sistema)
// Rota: GET /api/cron/lex-monitor
// Schedule: a cada 2 horas (0 */2 * * *)
// Monitora todos os serviços e alerta se algo cair
// ============================================================

export const config = { maxDuration: 30 }

const PLANTONISTA   = process.env.PLANTONISTA_WHATSAPP || ''
const EVOLUTION_URL = process.env.EVOLUTION_URL || ''
const EVOLUTION_KEY = process.env.EVOLUTION_KEY || ''
const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'drben'

async function enviarWhatsApp(numero, mensagem) {
  if (!EVOLUTION_URL || !numero) return false
  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({ number: numero, text: mensagem }),
    })
    return res.ok
  } catch { return false }
}

async function checar(nome, url, validarFn) {
  const inicio = Date.now()
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const json = res.ok ? await res.json() : null
    const ok   = res.ok && (validarFn ? validarFn(json) : true)
    return { nome, ok, latencia: Date.now() - inicio, status: res.status }
  } catch (e) {
    return { nome, ok: false, latencia: Date.now() - inicio, erro: e.message }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const agora = new Date()
    const BASE  = 'https://ben-growth-center.vercel.app'

    // ── Verificar todos os serviços em paralelo ──────────────
    const checks = await Promise.all([
      checar('WhatsApp Dr. Ben',  `${BASE}/api/whatsapp-evolution?action=status`,
        d => d?.state === 'open'),
      checar('Dr. Ben IA',        `${BASE}/api/whatsapp-evolution?action=status`,
        d => !!d?.status),
      checar('MARA IA Config',    `${BASE}/api/mara-config?action=get`,
        d => d?.success === true),
      checar('Secretaria',        `${BASE}/api/secretaria?action=status`,
        d => d?.success === true),
      checar('Bridge v2.0',       `${BASE}/api/bridge?action=status`,
        d => d?.success === true),
      checar('Meta Ads API',      `${BASE}/api/meta-ads?action=teste`,
        d => !!d?.id),
      checar('Google Ads API',    `${BASE}/api/google-ads?action=teste&account=escritorio`,
        d => d?.status === 'ok'),
    ])

    const falhas   = checks.filter(c => !c.ok)
    const ok       = checks.filter(c => c.ok)
    const sistemaOk = falhas.length === 0

    // ── Alertar só se houver falhas críticas ─────────────────
    let whatsappEnviado = false
    const falhasCriticas = falhas.filter(f =>
      ['WhatsApp Dr. Ben', 'Dr. Ben IA', 'MARA IA Config'].includes(f.nome)
    )

    if (falhasCriticas.length > 0 && PLANTONISTA) {
      const linhas = [
        `⚠️ *Lex Monitor — ALERTA*`,
        `🕐 ${agora.toLocaleString('pt-BR')}`,
        ``,
        `*Serviços com problema:*`,
        ...falhasCriticas.map(f => `🔴 ${f.nome} — ${f.erro || 'sem resposta'} (${f.latencia}ms)`),
        ``,
        `*Serviços OK: ${ok.length}/${checks.length}*`,
        ``,
        `_Verificar painel Ben Growth Center_`,
      ]
      whatsappEnviado = await enviarWhatsApp(PLANTONISTA, linhas.join('\n'))
    }

    const resultado = {
      success: true,
      sistema_ok: sistemaOk,
      total: checks.length,
      online: ok.length,
      offline: falhas.length,
      services: checks.map(c => ({
        nome: c.nome,
        ok: c.ok,
        latencia_ms: c.latencia,
        erro: c.erro || null,
      })),
      alerta_enviado: whatsappEnviado,
      timestamp: agora.toISOString(),
    }

    console.log('[LEX-MONITOR]', JSON.stringify({
      ok: ok.length, falhas: falhas.length, alerta: whatsappEnviado
    }))

    return res.status(200).json(resultado)
  } catch (e) {
    console.error('[LEX-MONITOR] Erro:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
