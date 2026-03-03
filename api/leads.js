// ============================================================
// BEN GROWTH CENTER — API de Leads / CRM
// Rota: GET/POST/PATCH /api/leads
//
// Armazena leads em memória global (persiste enquanto o
// serverless está quente). Para produção real, trocar por
// banco de dados (Vercel KV, Supabase, etc.)
// ============================================================

export const config = { maxDuration: 10 }

// ── Armazenamento em memória global ─────────────────────────
if (!global.__crmLeads) global.__crmLeads = new Map()

function gerarId() {
  return 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
}

function agora() {
  return new Date().toISOString()
}

// ── Helper: lead por número de WhatsApp ─────────────────────
function encontrarLeadPorNumero(numero) {
  const numeroNorm = numero.replace(/\D/g, '')
  for (const [id, lead] of global.__crmLeads) {
    if (lead.telefone && lead.telefone.replace(/\D/g, '').endsWith(numeroNorm.slice(-10))) {
      return lead
    }
    if (lead.numero && lead.numero.replace(/\D/g, '').endsWith(numeroNorm.slice(-10))) {
      return lead
    }
  }
  return null
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { action } = req.query

  // ── GET /api/leads — listar todos os leads ────────────────
  if (req.method === 'GET') {
    const leads = Array.from(global.__crmLeads.values())
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))

    return res.status(200).json({
      ok: true,
      total: leads.length,
      leads,
    })
  }

  // ── POST /api/leads — criar ou atualizar lead ─────────────
  if (req.method === 'POST') {

    // Criar novo lead (chamado pelo webhook do Dr. Ben)
    if (action === 'create' || !action) {
      const {
        nome, telefone, numero, area, urgencia,
        resumo, canal, mensagem, conversa,
      } = body

      // Verificar se lead com mesmo número já existe
      const existing = encontrarLeadPorNumero(telefone || numero || '')

      if (existing) {
        // Atualizar lead existente com novos dados
        if (nome && !existing.nome) existing.nome = nome
        if (area && area !== 'outros') existing.area = area
        if (urgencia) existing.urgencia = urgencia
        if (resumo) existing.resumoIA = resumo

        // Adicionar mensagem ao histórico
        if (mensagem) {
          existing.conversa = existing.conversa || []
          existing.conversa.push({
            role: 'lead',
            texto: mensagem,
            hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' }),
          })
        }

        existing.ultimaInteracao = agora()
        global.__crmLeads.set(existing.id, existing)

        console.log(`[CRM] Lead atualizado: ${existing.id} — ${existing.nome || existing.telefone}`)
        return res.status(200).json({ ok: true, action: 'updated', lead: existing })
      }

      // Criar novo lead
      const id = gerarId()
      const novoLead = {
        id,
        nome:             nome || 'Novo Lead',
        telefone:         telefone || numero || '',
        numero:           numero || telefone || '',
        email:            '',
        area:             area || 'outros',
        origem:           canal || 'whatsapp',
        status:           'novo',
        urgencia:         urgencia || 'media',
        score:            50,
        criadoEm:         agora(),
        ultimaInteracao:  agora(),
        resumoIA:         resumo || '',
        conversa:         conversa || (mensagem ? [{
          role: 'lead',
          texto: mensagem,
          hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' }),
        }] : []),
        plantonista:      null,
        valor:            null,
        tags:             [canal || 'whatsapp'],
        reunioes:         [],
        contratos:        [],
        cobrancas:        [],
        driveLink:        null,
      }

      global.__crmLeads.set(id, novoLead)
      console.log(`[CRM] Novo lead criado: ${id} — ${nome || numero}`)
      return res.status(201).json({ ok: true, action: 'created', lead: novoLead })
    }

    // Adicionar mensagem à conversa de um lead
    if (action === 'mensagem') {
      const { leadId, numero: num, role, texto } = body

      let lead = leadId
        ? global.__crmLeads.get(leadId)
        : encontrarLeadPorNumero(num || '')

      if (!lead) {
        return res.status(404).json({ ok: false, error: 'Lead não encontrado' })
      }

      lead.conversa = lead.conversa || []
      lead.conversa.push({
        role: role || 'lead',
        texto,
        hora: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' }),
      })
      lead.ultimaInteracao = agora()
      global.__crmLeads.set(lead.id, lead)

      return res.status(200).json({ ok: true, lead })
    }
  }

  // ── PATCH /api/leads — atualizar status/dados de um lead ──
  if (req.method === 'PATCH') {
    const { id, ...updates } = body

    if (!id || !global.__crmLeads.has(id)) {
      return res.status(404).json({ ok: false, error: 'Lead não encontrado' })
    }

    const lead = { ...global.__crmLeads.get(id), ...updates, ultimaInteracao: agora() }
    global.__crmLeads.set(id, lead)

    return res.status(200).json({ ok: true, lead })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
