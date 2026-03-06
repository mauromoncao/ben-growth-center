// ============================================================
// MARA IA — Modo Ausente / Presente
// Rota: POST /api/mara-ausente  → ativa/desativa modo ausente
//       GET  /api/mara-ausente  → status atual
//
// Quando ativado: MARA assume o número pessoal do Dr. Mauro
// Troca perfil do WhatsApp (nome, status, foto)
// ============================================================

export const config = { maxDuration: 30 }

const MARA_INSTANCE_ID  = process.env.MARA_ZAPI_INSTANCE_ID  || ''
const MARA_TOKEN        = process.env.MARA_ZAPI_TOKEN        || ''
const CLIENT_TOKEN      = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
const DR_MAURO_NUMERO   = process.env.PLANTONISTA_WHATSAPP   || ''
const MARA_AVATAR_URL   = 'https://www.genspark.ai/api/files/s/qiD4oS1k'

const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

// Estado em memória (persiste enquanto a função Vercel estiver quente)
// Para produção robusta, usar Supabase/DB
let modoAusente = false
let perfilOriginal = null
let conversasNoAusente = []
let inicioAusente = null

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (CLIENT_TOKEN) h['Client-Token'] = CLIENT_TOKEN
  return h
}

async function zapiPost(path, body) {
  try {
    const r = await fetch(`${MARA_BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    return await r.json().catch(() => ({ error: 'resposta inválida' }))
  } catch (e) {
    return { error: e.message }
  }
}

async function zapiPut(path, body) {
  try {
    const r = await fetch(`${MARA_BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    return await r.json().catch(() => ({ error: 'resposta inválida' }))
  } catch (e) {
    return { error: e.message }
  }
}

async function zapiGet(path) {
  try {
    const r = await fetch(`${MARA_BASE}${path}`, {
      headers: headers(),
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

async function ativarModoAusente() {
  const resultados = {}

  // 1. Salvar perfil atual (buscar dados atuais)
  const profileName = await zapiGet('/profile-name').catch(() => null)
  const profileStatus = await zapiGet('/profile-status').catch(() => null)

  perfilOriginal = {
    nome: profileName?.name || profileName?.value || 'Dr. Mauro Monção',
    status: profileStatus?.status || profileStatus?.value || 'Advogado | OAB/PI · CE · MA',
    foto: null, // Z-API não permite recuperar a foto atual facilmente
    salvadoEm: new Date().toISOString(),
  }

  // 2. Trocar para perfil MARA
  resultados.nome = await zapiPut('/profile-name', {
    value: 'MARA — Assistente Dr. Mauro'
  })

  resultados.status = await zapiPut('/profile-status', {
    value: '🤖 Assistente do Dr. Mauro Monção | Respondendo por ele'
  })

  // 3. Atualizar foto para avatar MARA
  resultados.foto = await zapiPut('/profile-picture', { value: MARA_AVATAR_URL })

  // 4. Marcar como ativo
  modoAusente = true
  inicioAusente = new Date().toISOString()
  conversasNoAusente = []

  return resultados
}

async function desativarModoAusente() {
  const resultados = {}

  if (!perfilOriginal) {
    perfilOriginal = {
      nome: 'Dr. Mauro Monção',
      status: 'Advogado | OAB/PI · CE · MA',
    }
  }

  // 1. Restaurar nome original
  resultados.nome = await zapiPut('/profile-name', {
    value: perfilOriginal.nome
  })

  // 2. Restaurar status original
  resultados.status = await zapiPut('/profile-status', {
    value: perfilOriginal.status
  })

  // 3. Restaurar foto original (se tiver salvo)
  if (perfilOriginal.foto) {
    resultados.foto = await zapiPut('/profile-picture', { value: perfilOriginal.foto })
  }

  // 3. Calcular resumo do período ausente
  const totalConversas = conversasNoAusente.length
  const minutosAusente = inicioAusente
    ? Math.round((Date.now() - new Date(inicioAusente).getTime()) / 60000)
    : 0

  const resumo = totalConversas > 0
    ? `📋 Enquanto você estava ausente (${minutosAusente} min):\n\n` +
      conversasNoAusente.slice(-5).map((c, i) =>
        `${i + 1}. 📱 ${c.numero}: "${c.ultimaMensagem?.slice(0, 60)}..."`
      ).join('\n') +
      `\n\n_Total: ${totalConversas} conversa(s) atendida(s) por MARA_`
    : `✅ Nenhuma mensagem recebida durante sua ausência (${minutosAusente} min).`

  // 4. Desativar
  modoAusente = false
  const conversasSalvas = [...conversasNoAusente]
  conversasNoAusente = []
  inicioAusente = null

  return { resultados, resumo, totalConversas, minutosAusente, conversasSalvas }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET: Status ───────────────────────────────────────────
  if (req.method === 'GET') {
    return res.json({
      ok: true,
      modo_ausente: modoAusente,
      inicio_ausente: inicioAusente,
      conversas_atendidas: conversasNoAusente.length,
      perfil_original_salvo: !!perfilOriginal,
      instancia_configurada: !!(MARA_INSTANCE_ID && MARA_TOKEN),
      instrucoes: {
        ativar: 'Envie /ausente pelo WhatsApp para MARA',
        desativar: 'Envie /presente pelo WhatsApp para MARA',
        direto: 'POST /api/mara-ausente com {"action": "ausente"} ou {"action": "presente"}',
      },
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

    // ── Registrar conversa no modo ausente ──────────────────
    if (action === 'registrar_conversa') {
      if (modoAusente) {
        conversasNoAusente.push({
          numero: body.numero || 'desconhecido',
          ultimaMensagem: body.mensagem || '',
          horario: new Date().toISOString(),
        })
      }
      return res.json({ ok: true, registrado: modoAusente })
    }

    // ── Ativar modo ausente ──────────────────────────────────
    if (action === 'ausente' || action === 'ativar') {
      if (modoAusente) {
        return res.json({
          ok: true,
          mensagem: '⚠️ Modo AUSENTE já estava ativo.',
          inicio_ausente: inicioAusente,
        })
      }

      const resultado = await ativarModoAusente()

      // Notificar Dr. Mauro
      await enviarMensagem(numero,
        `🤖 *Modo AUSENTE Ativado*\n\n` +
        `Estou no controle agora, Dr. Mauro.\n\n` +
        `✅ Perfil atualizado para MARA\n` +
        `📱 Respondendo como sua assistente\n` +
        `🔄 Para retornar: envie */presente*\n\n` +
        `_— MARA IA 🌟_`
      )

      return res.json({
        ok: true,
        mensagem: '✅ Modo AUSENTE ativado! MARA está no controle.',
        perfil_mara_ativado: resultado,
        inicio: inicioAusente,
      })
    }

    // ── Desativar modo ausente ───────────────────────────────
    if (action === 'presente' || action === 'desativar') {
      if (!modoAusente) {
        return res.json({
          ok: true,
          mensagem: '⚠️ Modo PRESENTE já estava ativo.',
        })
      }

      const resultado = await desativarModoAusente()

      // Notificar Dr. Mauro com resumo
      await enviarMensagem(numero,
        `✅ *Modo PRESENTE Restaurado*\n\n` +
        `Bem-vindo de volta, Dr. Mauro! 👋\n\n` +
        `${resultado.resumo}\n\n` +
        `_— MARA IA 🌟_`
      )

      return res.json({
        ok: true,
        mensagem: '✅ Modo PRESENTE ativado! Perfil original restaurado.',
        resumo: resultado.resumo,
        total_conversas: resultado.totalConversas,
        minutos_ausente: resultado.minutosAusente,
      })
    }

    return res.status(400).json({
      error: 'Action inválida',
      actions_validas: ['ausente', 'presente', 'registrar_conversa'],
    })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
