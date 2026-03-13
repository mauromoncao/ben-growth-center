// ============================================================
// DR. BEN — API de Leads + Monitor + DB Proxy (VPS Hostinger)
// Porta: 3001
// Banco: SQLite (./leads.db — persistente no disco)
//
// Rotas:
//   GET    /health             — status do serviço
//   GET    /leads              — listar todos os leads
//   POST   /leads              — criar/atualizar lead
//   POST   /leads/mensagem     — adicionar mensagem ao lead
//   PATCH  /leads/:id          — atualizar status/dados
//   DELETE /leads/:id          — remover lead
//   GET    /mara-estado        — ler estado da MARA
//   POST   /mara-estado        — salvar estado da MARA
//   POST   /monitor/log        — registrar custo de chamada de agente
//   GET    /monitor/stats      — resumo de uso e custos por agente
//   POST   /db/query           — proxy SQL autenticado (agent_outputs, processos_contexto)
//   GET    /db/stats           — estatísticas do banco
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

  CREATE TABLE IF NOT EXISTS config (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    atualizado_em TEXT
  );
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
  const { leadId, numero, role, texto, nomeWhatsApp } = req.body || {}

  let lead = null
  if (leadId) {
    const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId)
    if (row) lead = montarLead(row)
  } else if (numero) {
    lead = encontrarLeadPorNumero(numero)
  }

  if (!lead) {
    // Lead não encontrado — criar automaticamente com nome do WhatsApp se disponível
    const id = gerarId()
    const nomeInicial = nomeWhatsApp || 'Novo Lead'
    db.prepare(`
      INSERT INTO leads (id, nome, numero, telefone, criado_em, ultima_interacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, nomeInicial, numero || '', numero || '', agora(), agora())

    db.prepare('INSERT INTO mensagens (lead_id, role, texto, hora, criado_em) VALUES (?, ?, ?, ?, ?)')
      .run(id, role || 'lead', texto, horaFormatada(), agora())

    const novo = montarLead(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
    return res.json({ ok: true, action: 'created', lead: novo })
  }

  // Inserir mensagem no lead existente
  db.prepare('INSERT INTO mensagens (lead_id, role, texto, hora, criado_em) VALUES (?, ?, ?, ?, ?)')
    .run(lead.id, role || 'lead', texto, horaFormatada(), agora())

  // Atualizar nome se vier do WhatsApp e o atual for genérico
  if (nomeWhatsApp && (!lead.nome || lead.nome === 'Novo Lead')) {
    db.prepare('UPDATE leads SET nome = ?, ultima_interacao = ? WHERE id = ?')
      .run(nomeWhatsApp, agora(), lead.id)
  } else {
    db.prepare('UPDATE leads SET ultima_interacao = ? WHERE id = ?').run(agora(), lead.id)
  }

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

// ── DELETE /leads/:id — remover lead ────────────────────
app.delete('/leads/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT id FROM leads WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ ok: false, error: 'Lead não encontrado' })

  db.prepare('DELETE FROM mensagens WHERE lead_id = ?').run(id)
  db.prepare('DELETE FROM leads WHERE id = ?').run(id)
  res.json({ ok: true, action: 'deleted', id })
})

// ── DELETE /leads/limpar/invalidos — remover @lid e testes ─
app.delete('/leads/limpar/invalidos', (req, res) => {
  // Remover leads com @lid (IDs internos do WhatsApp)
  const lidLeads = db.prepare("SELECT id FROM leads WHERE numero LIKE '%@lid%' OR telefone LIKE '%@lid%'").all()
  
  // Remover leads de teste (números fictícios de 13+ dígitos ou padrões de teste)
  const testeLeads = db.prepare(`
    SELECT id FROM leads WHERE 
    numero IN ('5511888886666','5511666664444','5511777776666','5500000000000',
               '5511999990000','5511988880000','5586988887777','5511666665555')
    OR numero LIKE '%131314447605772%'
    OR numero LIKE '%65266507608298%'
  `).all()

  const todosParaRemover = [...lidLeads, ...testeLeads]
  let removidos = 0

  for (const { id } of todosParaRemover) {
    db.prepare('DELETE FROM mensagens WHERE lead_id = ?').run(id)
    db.prepare('DELETE FROM leads WHERE id = ?').run(id)
    removidos++
  }

  const total = db.prepare('SELECT COUNT(*) as n FROM leads').get().n
  res.json({ ok: true, removidos, total_restante: total })
})

// ── GET /mara-estado — ler estado da MARA (modo ausente) ─
app.get('/mara-estado', (req, res) => {
  try {
    const row = db.prepare('SELECT valor FROM config WHERE chave = ?').get('mara_estado')
    if (!row) return res.json({ modo_ausente: false, motivo: null, inicio: null })
    return res.json(JSON.parse(row.valor))
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

// ── POST /mara-estado — salvar estado da MARA (modo ausente) ─
app.post('/mara-estado', express.json(), (req, res) => {
  try {
    const estado = req.body || {}
    const valor  = JSON.stringify({ ...estado, atualizado_em: new Date().toISOString() })
    db.prepare(`
      INSERT INTO config (chave, valor, atualizado_em)
      VALUES ('mara_estado', ?, ?)
      ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em
    `).run(valor, new Date().toISOString())
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

// ════════════════════════════════════════════════════════════
// MONITOR/LOG — Recebe logs de custo dos agentes (Juris + Growth)
// POST /monitor/log  { agentId, modelUsed, inputTokens, outputTokens, costUsd, elapsed_ms, source }
// GET  /monitor/stats — resumo de uso
// ════════════════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS monitor_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id      TEXT,
    model_used    TEXT,
    input_tokens  INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd      REAL    DEFAULT 0,
    elapsed_ms    INTEGER DEFAULT 0,
    source        TEXT    DEFAULT 'juris-center',
    criado_em     TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_ml_agent    ON monitor_logs(agent_id);
  CREATE INDEX IF NOT EXISTS idx_ml_source   ON monitor_logs(source);
  CREATE INDEX IF NOT EXISTS idx_ml_criado   ON monitor_logs(criado_em);
`)

app.post('/monitor/log', (req, res) => {
  try {
    const { agentId, modelUsed, inputTokens, outputTokens, costUsd, elapsed_ms, source, timestamp } = req.body || {}
    db.prepare(`
      INSERT INTO monitor_logs (agent_id, model_used, input_tokens, output_tokens, cost_usd, elapsed_ms, source, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      agentId   || 'unknown',
      modelUsed || 'unknown',
      inputTokens  || 0,
      outputTokens || 0,
      costUsd      || 0,
      elapsed_ms   || 0,
      source    || 'juris-center',
      timestamp || new Date().toISOString(),
    )
    res.json({ ok: true })
  } catch (e) {
    console.warn('[Monitor] log error:', e.message)
    res.json({ ok: false, error: e.message })
  }
})

app.get('/monitor/stats', (req, res) => {
  try {
    const { source, since } = req.query
    let sql = `SELECT agent_id, model_used, COUNT(*) as chamadas,
      SUM(input_tokens+output_tokens) as total_tokens,
      ROUND(SUM(cost_usd),4) as custo_usd,
      ROUND(AVG(elapsed_ms)) as tempo_medio_ms
      FROM monitor_logs`
    const params = []
    const where = []
    if (source) { where.push('source = ?'); params.push(source) }
    if (since)  { where.push('criado_em >= ?'); params.push(since) }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' GROUP BY agent_id, model_used ORDER BY chamadas DESC'
    const rows = db.prepare(sql).all(...params)
    const total = db.prepare('SELECT COUNT(*) as n, ROUND(SUM(cost_usd),4) as custo FROM monitor_logs').get()
    res.json({ ok: true, stats: rows, total_chamadas: total.n, custo_total_usd: total.custo })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ════════════════════════════════════════════════════════════
// DB/QUERY — Proxy SQL autenticado para Vercel Edge Functions
// POST /db/query  { sql, params }  — Header: Authorization: Bearer <DB_TOKEN>
// Executa queries no SQLite local (agent_outputs, processos_contexto)
// ════════════════════════════════════════════════════════════
const DB_TOKEN = process.env.DB_TOKEN || ''

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_outputs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id      TEXT    NOT NULL,
    client_id     TEXT,
    processo_num  TEXT,
    input         TEXT,
    output        TEXT,
    model_used    TEXT,
    input_tokens  INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd      REAL    DEFAULT 0,
    elapsed_ms    INTEGER DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_ao_client   ON agent_outputs(client_id);
  CREATE INDEX IF NOT EXISTS idx_ao_agent    ON agent_outputs(agent_id);
  CREATE INDEX IF NOT EXISTS idx_ao_processo ON agent_outputs(processo_num);
  CREATE INDEX IF NOT EXISTS idx_ao_created  ON agent_outputs(created_at);

  CREATE TABLE IF NOT EXISTS processos_contexto (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_cnj          TEXT    NOT NULL UNIQUE,
    partes              TEXT,
    area                TEXT,
    resumo              TEXT,
    ultima_movimentacao TEXT,
    status              TEXT    DEFAULT 'ativo',
    prazo_proximo       TEXT,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_pc_cnj    ON processos_contexto(numero_cnj);
  CREATE INDEX IF NOT EXISTS idx_pc_status ON processos_contexto(status);
`)

// ── Utilitário: converter SQL PostgreSQL → SQLite ────────────
// db.js envia queries com $1,$2,... e NOW() — convertemos para SQLite
function pgToSqlite(sql) {
  // 1. Substituir NOW() → datetime('now')
  let s = sql.replace(/\bNOW\(\)/gi, "datetime('now')")
  // 2. Substituir $1,$2,... → ? (em ordem)
  s = s.replace(/\$\d+/g, '?')
  // 3. ON CONFLICT (numero_cnj) DO UPDATE SET ... = EXCLUDED.col → SQLite syntax
  // SQLite usa "excluded" (minúsculo) - já é compatível
  return s
}

app.post('/db/query', (req, res) => {
  try {
    // Validar token se configurado
    if (DB_TOKEN) {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace('Bearer ', '').trim()
      if (token !== DB_TOKEN) {
        return res.status(401).json({ ok: false, error: 'Token inválido' })
      }
    }

    const { sql, params = [] } = req.body || {}
    if (!sql) return res.status(400).json({ ok: false, error: 'sql é obrigatório' })

    // Segurança: apenas SELECT, INSERT, UPDATE — sem DROP/ALTER/DELETE em tabelas críticas
    const sqlUpper = sql.trim().toUpperCase()
    if (sqlUpper.startsWith('DROP') || sqlUpper.startsWith('ALTER') ||
        (sqlUpper.startsWith('DELETE') && sqlUpper.includes('leads'))) {
      return res.status(403).json({ ok: false, error: 'Operação não permitida' })
    }

    // Converter sintaxe PostgreSQL → SQLite
    const sqliteSQL = pgToSqlite(sql)
    const stmt = db.prepare(sqliteSQL)
    let result

    if (sqlUpper.startsWith('SELECT')) {
      result = stmt.all(...params)
    } else {
      const info = stmt.run(...params)
      result = [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }]
    }

    res.json(result)
  } catch (e) {
    console.warn('[DB/query] erro:', e.message, '| SQL:', sql?.slice(0, 100))
    res.status(500).json({ ok: false, error: e.message })
  }
})

app.get('/db/stats', (req, res) => {
  try {
    const outputs = db.prepare('SELECT COUNT(*) as n, ROUND(SUM(cost_usd),4) as custo FROM agent_outputs').get()
    const processos = db.prepare('SELECT COUNT(*) as n FROM processos_contexto').get()
    res.json({
      ok: true,
      agent_outputs: outputs.n,
      custo_total_usd: outputs.custo,
      processos_contexto: processos.n,
    })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── Iniciar servidor ─────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Dr. Ben Leads API rodando na porta ${PORT}`)
  console.log(`   SQLite: ${DB_PATH}`)
  console.log(`   Rotas: /health | /leads | /monitor/log | /monitor/stats | /db/query | /db/stats`)
  console.log(`   Health: http://localhost:${PORT}/health`)
})
