// api/perfil-drben.js
// Atualizar nome, foto e descrição do perfil Dr. Ben no WhatsApp via Evolution API
// POST /api/perfil-drben

export const config = { maxDuration: 30 }

const EVOLUTION_URL      = process.env.EVOLUTION_API_URL  ?? ''
const EVOLUTION_KEY      = process.env.EVOLUTION_API_KEY  ?? ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'drben'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Dr. Ben — Gerenciador de Perfil',
      evolution: EVOLUTION_URL ? `✅ ${EVOLUTION_URL}` : '❌ não configurado',
      instance: EVOLUTION_INSTANCE,
      endpoints: {
        atualizar_nome: 'POST /api/perfil-drben com {"acao":"nome","valor":"Dr. Ben"}',
        atualizar_foto: 'POST /api/perfil-drben com {"acao":"foto","url":"https://..."}',
        atualizar_status: 'POST /api/perfil-drben com {"acao":"status","valor":"Assistente Jurídico IA"}',
        tudo: 'POST /api/perfil-drben com {"acao":"tudo","nome":"...","url_foto":"...","status":"..."}'
      }
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  // Aceitar Authorization simples para segurança mínima
  const auth = req.headers['authorization'] ?? ''
  if (auth && auth !== `Bearer ${process.env.EVOLUTION_API_KEY}`) {
    return res.status(401).json({ erro: 'Não autorizado' })
  }

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return res.status(500).json({ erro: 'Evolution API não configurada' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { acao, valor, url, nome, url_foto, status: statusText } = body ?? {}

  const resultados = {}

  try {
    // ── Atualizar NOME ──────────────────────────────────────────
    if (acao === 'nome' || acao === 'tudo') {
      const nomeNovo = (acao === 'tudo' ? nome : valor) ?? 'Dr. Ben | Assistente Jurídico'
      const r = await fetch(
        `${EVOLUTION_URL}/chat/updateProfileName/${EVOLUTION_INSTANCE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
          body: JSON.stringify({ name: nomeNovo }),
        }
      )
      const d = await r.json()
      resultados.nome = d?.update === 'success' ? `✅ "${nomeNovo}"` : `⚠️ ${JSON.stringify(d)}`
    }

    // ── Atualizar FOTO ──────────────────────────────────────────
    if (acao === 'foto' || acao === 'tudo') {
      const fotoUrl = (acao === 'tudo' ? url_foto : url)
      if (fotoUrl) {
        // Baixar imagem e converter para base64
        const imgRes = await fetch(fotoUrl)
        const imgBuf = await imgRes.arrayBuffer()
        const base64 = Buffer.from(imgBuf).toString('base64')
        const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`

        const r = await fetch(
          `${EVOLUTION_URL}/chat/updateProfilePicture/${EVOLUTION_INSTANCE}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
            body: JSON.stringify({ picture: dataUrl }),
          }
        )
        const d = await r.json()
        resultados.foto = d?.update === 'success' ? '✅ Foto atualizada' : `⚠️ ${JSON.stringify(d)}`
      } else {
        resultados.foto = '⚠️ URL da foto não fornecida'
      }
    }

    // ── Atualizar STATUS/DESCRIÇÃO ──────────────────────────────
    if (acao === 'status' || acao === 'tudo') {
      const statusNovo = (acao === 'tudo' ? statusText : valor) ?? 'Assistente Jurídico IA — Q.G Advocacia 4.0'
      const r = await fetch(
        `${EVOLUTION_URL}/chat/updateProfileStatus/${EVOLUTION_INSTANCE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
          body: JSON.stringify({ status: statusNovo }),
        }
      )
      const d = await r.json()
      resultados.status = d?.update === 'success' ? `✅ "${statusNovo}"` : `⚠️ ${JSON.stringify(d)}`
    }

    return res.status(200).json({
      ok: true,
      resultados,
      timestamp: new Date().toISOString()
    })

  } catch (e) {
    console.error('[Perfil Dr. Ben] Erro:', e.message)
    return res.status(500).json({ ok: false, erro: e.message })
  }
}
