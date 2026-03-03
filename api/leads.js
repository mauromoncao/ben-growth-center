// ============================================================
// BEN GROWTH CENTER — API de Leads / CRM
// Rota: GET/POST/PATCH /api/leads
//
// BANCO: VPS Hostinger (SQLite via dr-ben-leads API na porta 3001)
// FALLBACK: memória global (se VPS indisponível)
// ============================================================

export const config = { maxDuration: 10 }

// ── URL da API de Leads na VPS ───────────────────────────────
const VPS_LEADS_URL = process.env.VPS_LEADS_URL || 'http://181.215.135.202:3001'

// ── Fallback em memória (se VPS indisponível) ────────────────
if (!global.__crmLeads) global.__crmLeads = new Map()

function gerarId() {
  return 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function agora() {
  return new Date().toISOString()
}

function horaFormatada() {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit', minute: '2-digit',
  })
}

function encontrarLeadMemoriaPorNumero(numero) {
  const numeroNorm = (numero || '').replace(/\D/g, '').slice(-11)
  for (const [, lead] of global.__crmLeads) {
    const t = (lead.telefone || '').replace(/\D/g, '').slice(-11)
    const n = (lead.numero   || '').replace(/\D/g, '').slice(-11)
    if ((t && t === numeroNorm) || (n && n === numeroNorm)) return lead
  }
  return null
}

// ── Tentar VPS, fallback em memória ─────────────────────────
async function vpsRequest(path, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    }
    if (body) opts.body = JSON.stringify(body)
    const res  = await fetch(`${VPS_LEADS_URL}${path}`, opts)
    const data = await res.json()
    return { ok: true, data, status: res.status }
  } catch (e) {
    console.warn(`[Leads] VPS indisponível (${e.message}) — usando memória`)
    return { ok: false, error: e.message }
  }
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const body    = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { action } = req.query

  // ── GET /api/leads — listar todos ────────────────────────
  if (req.method === 'GET') {
    const vps = await vpsRequest('/leads')
    if (vps.ok) return res.status(200).json(vps.data)

    // Fallback memória
    const leads = Array.from(global.__crmLeads.values())
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    return res.status(200).json({ ok: true, total: leads.length, leads, fonte: 'memoria' })
  }

  // ── POST /api/leads — criar/atualizar lead ────────────────
  if (req.method === 'POST') {

    if (!action || action === 'create') {
      // Tentar VPS primeiro
      const vps = await vpsRequest('/leads', 'POST', body)
      if (vps.ok) return res.status(vps.status).json(vps.data)

      // Fallback memória
      const { nome, telefone, numero, area, urgencia, resumo, canal, mensagem } = body
      const existing = encontrarLeadMemoriaPorNumero(telefone || numero || '')

      if (existing) {
        if (nome && existing.nome === 'Novo Lead') existing.nome = nome
        if (area && area !== 'outros') existing.area = area
        if (urgencia) existing.urgencia = urgencia
        if (resumo)   existing.resumoIA  = resumo
        if (mensagem) {
          existing.conversa = existing.conversa || []
          existing.conversa.push({ role: 'lead', texto: mensagem, hora: horaFormatada() })
        }
        existing.ultimaInteracao = agora()
        global.__crmLeads.set(existing.id, existing)
        return res.status(200).json({ ok: true, action: 'updated', lead: existing, fonte: 'memoria' })
      }

      const id = gerarId()
      const lead = {
        id, nome: nome || 'Novo Lead',
        telefone: telefone || numero || '',
        numero:   numero || telefone || '',
        email: '', area: area || 'outros',
        origem: canal || 'whatsapp', status: 'novo',
        urgencia: urgencia || 'media', score: 50,
        criadoEm: agora(), ultimaInteracao: agora(),
        resumoIA: resumo || '',
        tags: [canal || 'whatsapp'],
        conversa: mensagem ? [{ role: 'lead', texto: mensagem, hora: horaFormatada() }] : [],
        reunioes: [], contratos: [], cobrancas: [],
      }
      global.__crmLeads.set(id, lead)
      return res.status(201).json({ ok: true, action: 'created', lead, fonte: 'memoria' })
    }

    if (action === 'mensagem') {
      // Tentar VPS
      const vps = await vpsRequest('/leads/mensagem', 'POST', body)
      if (vps.ok) return res.status(200).json(vps.data)

      // Fallback memória
      const { numero, role, texto } = body
      const lead = encontrarLeadMemoriaPorNumero(numero || '')
      if (!lead) return res.status(404).json({ ok: false, error: 'Lead não encontrado' })

      lead.conversa = lead.conversa || []
      lead.conversa.push({ role: role || 'lead', texto, hora: horaFormatada() })
      lead.ultimaInteracao = agora()
      global.__crmLeads.set(lead.id, lead)
      return res.status(200).json({ ok: true, lead, fonte: 'memoria' })
    }
  }

  // ── PATCH /api/leads — atualizar lead ────────────────────
  if (req.method === 'PATCH') {
    const { id, ...updates } = body
    // Tentar VPS
    const vps = await vpsRequest(`/leads/${id}`, 'PATCH', updates)
    if (vps.ok) return res.status(200).json(vps.data)

    // Fallback memória
    if (!id || !global.__crmLeads.has(id)) {
      return res.status(404).json({ ok: false, error: 'Lead não encontrado' })
    }
    const lead = { ...global.__crmLeads.get(id), ...updates, ultimaInteracao: agora() }
    global.__crmLeads.set(id, lead)
    return res.status(200).json({ ok: true, lead, fonte: 'memoria' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
