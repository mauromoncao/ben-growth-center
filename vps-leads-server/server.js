// ============================================================
// DR. BEN — API de Leads (VPS Hostinger)
// Porta: 3001
// Banco: SQLite (./leads.db — persistente no disco)
//
// Rotas:
//   GET    /leads              — listar todos os leads
//   POST   /leads              — criar/atualizar lead
//   POST   /leads/mensagem     — adicionar mensagem ao lead
//   PATCH  /leads/:id          — atualizar status/dados
//   GET    /health             — status do serviço
// ============================================================

const express = require('express')
const cors    = require('cors')
const path    = require('path')
const fs      = require('fs')

// ── SQLite ────────────────────────────────────────────────
const Database = require('better-sqlite3')
const DB_PATH  = path.join(__dirname, 'leads.db')
const db       = new Database(DB_PATH)

// ── Criar tabelas se não existirem ───────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id              TEXT PRIMARY KEY,
    nome            TEXT,
    telefone        TEXT,
    numero          TEXT,
    email           TEXT DEFAULT '',
    area            TEXT DEFAULT 'outros',
    origem          TEXT DEFAULT 'whatsapp',
    status          TEXT DEFAULT 'novo',
    urgencia        TEXT DEFAULT 'media',
    score           INTEGER DEFAULT 50,
    resumo_ia       TEXT DEFAULT '',
    plantonista     TEXT,
    valor           REAL,
    tags            TEXT DEFAULT '[]',
    criado_em       TEXT,
    ultima_interacao TEXT
  );

  CREATE TABLE IF NOT EXISTS mensagens (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id   TEXT NOT NULL,
    role      TEXT NOT NULL,
    texto     TEXT NOT NULL,
    hora      TEXT,
    criado_em TEXT,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  CREATE INDEX IF NOT EXISTS idx_mensagens_lead ON mensagens(lead_id);
  CREATE INDEX IF NOT EXISTS idx_leads_telefone  ON leads(telefone);
  CREATE INDEX IF NOT EXISTS idx_leads_numero    ON leads(numero);
  CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads(status);
`)

console.log(`[DB] SQLite pronto: ${DB_PATH}`)

// ── Helpers ───────────────────────────────────────────────
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

function normalizarNumero(numero) {
  return (numero || '').replace(/\D/g, '').slice(-11)
}

function encontrarLeadPorNumero(numero) {
  const norm = normalizarNumero(numero)
  if (!norm) return null

  // Buscar por telefone ou numero (últimos 11 dígitos)
  const row = db.prepare(`
    SELECT * FROM leads
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone,'+',''),'-',''),' ',''),'(','') LIKE ?
       OR REPLACE(REPLACE(REPLACE(REPLACE(numero,'+',''),'-',''),' ',''),'(','') LIKE ?
    LIMIT 1
  `).get(`%${norm}`, `%${norm}`)

  return row ? montarLead(row) : null
}

function buscarMensagens(leadId) {
  return db.prepare(`
    SELECT role, texto, hora FROM mensagens
    WHERE lead_id = ?
    ORDER BY id ASC
  `).all(leadId)
}

function montarLead(row) {
  const mensagens = buscarMensagens(row.id)
  return {
    id:              row.id,
    nome:            row.nome || 'Novo Lead',
    telefone:        row.telefone || '',
    numero:          row.numero   || '',
    email:           row.email    || '',
    area:            row.area     || 'outros',
    origem:          row.origem   || 'whatsapp',
    status:          row.status   || 'novo',
    urgencia:        row.urgencia || 'media',
    score:           row.score    || 50,
    resumoIA:        row.resumo_ia || '',
    plantonista:     row.plantonista || null,
    valor:           row.valor || null,
    tags:            JSON.parse(row.tags || '[]'),
    criadoEm:        row.criado_em,
    ultimaInteracao: row.ultima_interacao,
    conversa:        mensagens.map(m => ({
      role:  m.role,
      texto: m.texto,
      hora:  m.hora,
    })),
    reunioes:  [],
    contratos: [],
    cobrancas: [],
  }
}

// ── Express ───────────────────────────────────────────────
const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// ── GET /health ──────────────────────────────────────────
app.get('/health', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM leads').get()
  res.json({
    status:  'ok',
    service: 'Dr. Ben Leads API (SQLite)',
    leads:   count.n,
    db:      DB_PATH,
    uptime:  Math.floor(process.uptime()) + 's',
  })
})

// ── GET /leads ───────────────────────────────────────────
app.get('/leads', (req, res) => {
  const rows  = db.prepare('SELECT * FROM leads ORDER BY criado_em DESC').all()
  const leads = rows.map(montarLead)
  res.json({ ok: true, total: leads.length, leads })
})

// ── POST /leads — criar ou atualizar lead ────────────────
app.post('/leads', (req, res) => {
  const { nome, telefone, numero, area, urgencia, resumo, canal, mensagem } = req.body || {}

  // Verificar se já existe lead com este número
  const existing = encontrarLeadPorNumero(telefone || numero || '')

  if (existing) {
    // Atualizar campos se tiver novos dados
    const updates = []
    const params  = []

    if (nome && (!existing.nome || existing.nome === 'Novo Lead')) {
      updates.push('nome = ?'); params.push(nome)
    }
    if (area && area !== 'outros') {
      updates.push('area = ?'); params.push(area)
    }
    if (urgencia) {
      updates.push('urgencia = ?'); params.push(urgencia)
    }
    if (resumo) {
      updates.push('resumo_ia = ?'); params.push(resumo)
    }
    updates.push('ultima_interacao = ?'); params.push(agora())
    params.push(existing.id)

    db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    // Adicionar mensagem se fornecida
    if (mensagem) {
      db.prepare('INSERT INTO mensagens (lead_id, role, texto, hora, criado_em) VALUES (?, ?, ?, ?, ?)')
        .run(existing.id, 'lead', mensagem, horaFormatada(), agora())
    }

    const updated = montarLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(existing.id))
    console.log(`[Leads] Atualizado: ${updated.id} — ${updated.nome}`)
    return res.json({ ok: true, action: 'updated', lead: updated })
  }

  // Criar novo lead
  const id = gerarId()
  db.prepare(`
    INSERT INTO leads (id, nome, telefone, numero, area, origem, urgencia, resumo_ia, tags, criado_em, ultima_interacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    nome || 'Novo Lead',
    telefone || numero || '',
    numero || telefone || '',
    area || 'outros',
    canal || 'whatsapp',
    urgencia || 'media',
    resumo || '',
    JSON.stringify([canal || 'whatsapp']),
    agora(),
    agora(),
  )

  if (mensagem) {
    db.prepare('INSERT INTO mensagens (lead_id, role, texto, hora, criado_em) VALUES (?, ?, ?, ?, ?)')
      .run(id, 'lead', mensagem, horaFormatada(), agora())
  }

  const lead = montarLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
  console.log(`[Leads] Novo lead: ${id} — ${nome || numero}`)
  res.status(201).json({ ok: true, action: 'created', lead })
})

// ── POST /leads/mensagem — registrar mensagem na conversa ─
app.post('/leads/mensagem', (req, res) => {
  const { leadId, numero, role, texto } = req.body || {}

  let lead = null
  if (leadId) {
    const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId)
    if (row) lead = montarLead(row)
  } else if (numero) {
    lead = encontrarLeadPorNumero(numero)
  }

  if (!lead) {
    // Lead não encontrado — criar automaticamente
    const id = gerarId()
    db.prepare(`
      INSERT INTO leads (id, nome, numero, telefone, criado_em, ultima_interacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, 'Novo Lead', numero || '', numero || '', agora(), agora())

    db.prepare('INSERT INTO mensagens (lead_id, role, texto, hora, criado_em) VALUES (?, ?, ?, ?, ?)')
      .run(id, role || 'lead', texto, horaFormatada(), agora())

    const novo = montarLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
    return res.json({ ok: true, action: 'created', lead: novo })
  }

  // Inserir mensagem no lead existente
  db.prepare('INSERT INTO mensagens (lead_id, role, texto, hora, criado_em) VALUES (?, ?, ?, ?, ?)')
    .run(lead.id, role || 'lead', texto, horaFormatada(), agora())

  db.prepare('UPDATE leads SET ultima_interacao = ? WHERE id = ?').run(agora(), lead.id)

  const updated = montarLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id))
  res.json({ ok: true, lead: updated })
})

// ── PATCH /leads/:id — atualizar status/dados ────────────
app.patch('/leads/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ ok: false, error: 'Lead não encontrado' })

  const allowed = ['nome', 'email', 'area', 'status', 'urgencia', 'score', 'plantonista', 'valor', 'resumo_ia']
  const updates = []
  const params  = []

  for (const field of allowed) {
    const bodyField = field === 'resumo_ia' ? 'resumoIA' : field
    if (req.body[bodyField] !== undefined) {
      updates.push(`${field} = ?`)
      params.push(req.body[bodyField])
    }
  }

  if (req.body.tags) {
    updates.push('tags = ?')
    params.push(JSON.stringify(req.body.tags))
  }

  if (updates.length === 0) {
    return res.status(400).json({ ok: false, error: 'Nenhum campo para atualizar' })
  }

  updates.push('ultima_interacao = ?')
  params.push(agora())
  params.push(id)

  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  const updated = montarLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
  res.json({ ok: true, lead: updated })
})

// ── Iniciar servidor ─────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Dr. Ben Leads API rodando na porta ${PORT}`)
  console.log(`   SQLite: ${DB_PATH}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
})
