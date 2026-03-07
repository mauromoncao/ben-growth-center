// ============================================================
// MARA IA — Modo Ausente / Presente
// Rota: POST /api/mara-ausente  → ativa/desativa modo ausente
//       GET  /api/mara-ausente  → status atual
//
// Estado persistido na VPS (SQLite) — não perde com serverless
// Foto do perfil: SEMPRE a do Dr. Mauro Monção (fixa, nunca alterna)
// ============================================================

export const config = { maxDuration: 30 }

const MARA_INSTANCE_ID = process.env.MARA_ZAPI_INSTANCE_ID || ''
const MARA_TOKEN       = process.env.MARA_ZAPI_TOKEN       || ''
const CLIENT_TOKEN     = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
const DR_MAURO_NUMERO  = process.env.PLANTONISTA_WHATSAPP  || ''
const VPS_URL          = process.env.VPS_LEADS_URL         || 'http://181.215.135.202:3001'

// Foto de perfil do Dr. Mauro hospedada no próprio site (URL pública acessível pela Z-API)
const MAURO_FOTO_URL = 'https://ben-growth-center.vercel.app/mauro-zapi.jpg'

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

// ── Foto de perfil fixa: Dr. Mauro Monção ────────────────
// Usa URL pública hospedada no Vercel — Z-API aceita apenas URL para /profile-picture
async function definirFotoPerfilDrMauro() {
  const r1 = await zapiPut('/profile-picture', { value: MAURO_FOTO_URL })
  console.log('[MARA] Foto perfil Dr. Mauro (URL):', JSON.stringify(r1))
  if (r1?.value === true) return { metodo: 'url', resultado: r1 }

  // Aguarda 2s e tenta novamente
  await new Promise(res => setTimeout(res, 2000))
  const r2 = await zapiPut('/profile-picture', { value: MAURO_FOTO_URL })
  console.log('[MARA] Foto perfil Dr. Mauro (URL retry):', JSON.stringify(r2))
  if (r2?.value === true) return { metodo: 'url_retry', resultado: r2 }

  console.warn('[MARA] ⚠️ Não foi possível definir foto Dr. Mauro — Z-API retornou erro')
  return { metodo: 'falhou', resultado: r2 }
}

// ── Persistência na VPS ───────────────────────────────────
async function lerEstadoVPS() {
  try {
    const r = await fetch(`${VPS_URL}/mara-estado`, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) {
      console.warn('[MARA] VPS retornou status', r.status, '— estado desconhecido')
      return null
    }
    return await r.json()
  } catch (e) {
    console.warn('[MARA] Falha ao ler estado VPS:', e.message)
    return null
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
// Foto NÃO muda — Dr. Mauro permanece no perfil
async function ativarModoAusente(motivo) {
  // Salvar estado persistente na VPS
  await salvarEstadoVPS({
    modo_ausente: true,
    motivo,
    inicio: new Date().toISOString(),
    nome_original: 'Dr. Mauro Monção',
  })

  return {}
}

// ── Desativar modo ausente ────────────────────────────────
// Foto NÃO muda — Dr. Mauro permanece no perfil
async function desativarModoAusente(estadoAtual) {
  // Calcular resumo
  const inicio = estadoAtual?.inicio ? new Date(estadoAtual.inicio) : null
  const minutosAusente = inicio
    ? Math.round((Date.now() - inicio.getTime()) / 60000)
    : 0

  // Salvar estado desativado na VPS
  await salvarEstadoVPS({
    modo_ausente: false,
    motivo: null,
    inicio: null,
    nome_original: 'Dr. Mauro Monção',
  })

  return { minutosAusente }
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
    if (estado === null) {
      return res.json({
        ok: false,
        erro: 'vps_indisponivel',
        modo_ausente: null,
        motivo: null,
        inicio_ausente: null,
        instancia_configurada: !!(MARA_INSTANCE_ID && MARA_TOKEN),
        mensagem: 'VPS indisponível — estado atual desconhecido'
      })
    }
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

    // ── Definir foto do Dr. Mauro (ação manual, quando necessário) ─
    if (action === 'definir_foto') {
      const fotoResult = await definirFotoPerfilDrMauro()
      return res.json({
        ok: fotoResult.metodo !== 'falhou',
        mensagem: fotoResult.metodo !== 'falhou'
          ? '✅ Foto do Dr. Mauro Monção definida no perfil.'
          : '⚠️ Não foi possível definir a foto.',
        metodo: fotoResult.metodo,
        resultado: fotoResult.resultado,
      })
    }

    // ── Ativar ───────────────────────────────────────────────
    if (action === 'ausente' || action === 'ativar') {
      const estadoAtual = await lerEstadoVPS()
      if (estadoAtual !== null && estadoAtual.modo_ausente) {
        return res.json({ ok: true, mensagem: '⚠️ Modo AUSENTE já estava ativo.', inicio_ausente: estadoAtual.inicio })
      }

      const motivo = body?.motivo || 'ausente'
      await ativarModoAusente(motivo)

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
        inicio: new Date().toISOString(),
      })
    }

    // ── Desativar ────────────────────────────────────────────
    if (action === 'presente' || action === 'desativar') {
      const estadoAtual = await lerEstadoVPS()
      if (estadoAtual !== null && !estadoAtual.modo_ausente) {
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
      actions_validas: ['ausente', 'presente', 'definir_foto'],
    })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
