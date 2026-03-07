// ============================================================
// MARA IA — Modo Ausente / Presente
// Rota: POST /api/mara-ausente  → ativa/desativa modo ausente
//       GET  /api/mara-ausente  → status atual
//
// Estado persistido na VPS (SQLite) — não perde com serverless
// ============================================================

export const config = { maxDuration: 30 }

const MARA_INSTANCE_ID = process.env.MARA_ZAPI_INSTANCE_ID || ''
const MARA_TOKEN       = process.env.MARA_ZAPI_TOKEN       || ''
const CLIENT_TOKEN     = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
const DR_MAURO_NUMERO  = process.env.PLANTONISTA_WHATSAPP  || ''
const VPS_URL          = process.env.VPS_LEADS_URL         || 'http://181.215.135.202:3001'
const MARA_AVATAR_URL  = 'https://ben-growth-center.vercel.app/mara-avatar-circle.png'

const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

// ── Helpers Z-API ─────────────────────────────────────────
function zapiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (CLIENT_TOKEN) h['Client-Token'] = CLIENT_TOKEN
  return h
}

async function zapiPut(path, body) {
  try {
    const r = await fetch(`${MARA_BASE}${path}`, {
      method: 'PUT',
      headers: zapiHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    return await r.json().catch(() => ({ error: 'resposta inválida' }))
  } catch (e) {
    return { error: e.message }
  }
}

async function zapiPost(path, body) {
  try {
    const r = await fetch(`${MARA_BASE}${path}`, {
      method: 'POST',
      headers: zapiHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    return await r.json().catch(() => ({ error: 'resposta inválida' }))
  } catch (e) {
    return { error: e.message }
  }
}

async function enviarMensagem(phone, message) {
  return zapiPost('/send-text', { phone, message })
}

// ── Persistência na VPS ───────────────────────────────────
async function lerEstadoVPS() {
  try {
    const r = await fetch(`${VPS_URL}/mara-estado`, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) return { modo_ausente: false, motivo: null, inicio: null, nome_original: 'Dr. Mauro Monção' }
    return await r.json()
  } catch {
    return { modo_ausente: false, motivo: null, inicio: null, nome_original: 'Dr. Mauro Monção' }
  }
}

async function salvarEstadoVPS(estado) {
  try {
    await fetch(`${VPS_URL}/mara-estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estado),
      signal: AbortSignal.timeout(5000),
    })
  } catch (e) {
    console.error('[MARA] Falha ao salvar estado na VPS:', e.message)
  }
}

// ── Ativar modo ausente ───────────────────────────────────
async function ativarModoAusente(motivo) {
  const resultados = {}

  // 1. Trocar foto de perfil para MARA
  resultados.foto = await zapiPut('/profile-picture', { value: MARA_AVATAR_URL })
  console.log('[MARA] Foto perfil:', JSON.stringify(resultados.foto))

  // 2. Salvar estado persistente na VPS
  await salvarEstadoVPS({
    modo_ausente: true,
    motivo,
    inicio: new Date().toISOString(),
    nome_original: 'Dr. Mauro Monção',
  })

  return resultados
}

// ── Desativar modo ausente ────────────────────────────────
async function desativarModoAusente(estadoAtual) {
  const resultados = {}

  // 1. Restaurar foto original do Dr. Mauro
  // (Z-API não tem endpoint para restaurar foto — usuário precisa restaurar manualmente)
  // resultados.foto = 'restauração manual necessária'

  // 2. Calcular resumo
  const inicio = estadoAtual?.inicio ? new Date(estadoAtual.inicio) : null
  const minutosAusente = inicio
    ? Math.round((Date.now() - inicio.getTime()) / 60000)
    : 0

  // 3. Salvar estado desativado na VPS
  await salvarEstadoVPS({
    modo_ausente: false,
    motivo: null,
    inicio: null,
    nome_original: 'Dr. Mauro Monção',
  })

  return { resultados, minutosAusente }
}

// ── Handler principal ─────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET: Status (lê da VPS) ───────────────────────────────
  if (req.method === 'GET') {
    const estado = await lerEstadoVPS()
    return res.json({
      ok: true,
      modo_ausente:        estado.modo_ausente || false,
      motivo:              estado.motivo       || null,
      inicio_ausente:      estado.inicio       || null,
      instancia_configurada: !!(MARA_INSTANCE_ID && MARA_TOKEN),
    })
  }

  // ── POST: Ativar/Desativar ────────────────────────────────
  if (req.method === 'POST') {
    let body
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      return res.status(400).json({ error: 'JSON inválido' })
    }

    const action = body?.action || ''
    const numero = DR_MAURO_NUMERO.replace(/\D/g, '')

    // ── Ativar ───────────────────────────────────────────────
    if (action === 'ausente' || action === 'ativar') {
      const estadoAtual = await lerEstadoVPS()
      if (estadoAtual.modo_ausente) {
        return res.json({ ok: true, mensagem: '⚠️ Modo AUSENTE já estava ativo.', inicio_ausente: estadoAtual.inicio })
      }

      const motivo = body?.motivo || 'ausente'
      const resultado = await ativarModoAusente(motivo)

      // Notificar Dr. Mauro no WhatsApp
      if (numero) {
        const labels = { ferias: '🏖️ Férias', doente: '🤒 Indisposto', audiencia: '⚖️ Audiência', viagem: '✈️ Viagem', reuniao: '🤝 Reunião', fora_horario: '😴 Fora do horário' }
        await enviarMensagem(numero,
          `🤖 *MARA Ativada — Modo Ausente*\n\n` +
          `Motivo: ${labels[motivo] || motivo}\n\n` +
          `Estou respondendo pelo seu número agora.\n` +
          `Para retornar: desative no app.\n\n` +
          `_— MARA IA 🌟_`
        )
      }

      return res.json({
        ok: true,
        mensagem: '✅ Modo AUSENTE ativado! MARA está respondendo.',
        foto_resultado: resultado.foto,
        inicio: new Date().toISOString(),
      })
    }

    // ── Desativar ────────────────────────────────────────────
    if (action === 'presente' || action === 'desativar') {
      const estadoAtual = await lerEstadoVPS()
      if (!estadoAtual.modo_ausente) {
        return res.json({ ok: true, mensagem: '⚠️ Modo PRESENTE já estava ativo.' })
      }

      const resultado = await desativarModoAusente(estadoAtual)

      // Notificar Dr. Mauro com resumo
      if (numero) {
        await enviarMensagem(numero,
          `✅ *MARA Desativada — Modo Presente*\n\n` +
          `Bem-vindo de volta, Dr. Mauro! 👋\n\n` +
          `Você ficou ausente por ${resultado.minutosAusente} minuto(s).\n` +
          `Verifique o app para ver as conversas atendidas.\n\n` +
          `_— MARA IA 🌟_`
        )
      }

      return res.json({
        ok: true,
        mensagem: '✅ Modo PRESENTE ativado.',
        minutos_ausente: resultado.minutosAusente,
      })
    }

    return res.status(400).json({
      error: 'Action inválida',
      actions_validas: ['ausente', 'presente'],
    })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
