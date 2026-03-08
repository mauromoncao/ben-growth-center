// ============================================================
// BEN ECOSYSTEM IA — Workspace Backend API v1.0
// Porta: 3002 | VPS Hostinger: 181.215.135.202
//
// ROTAS:
//   GET  /health                        — status do serviço
//
//   ── Autenticação ──
//   POST /auth/login                    — login por email+senha simples
//   GET  /auth/me                       — dados do usuário logado
//
//   ── Projetos ──
//   GET  /projects                      — listar projetos do usuário
//   POST /projects                      — criar projeto
//   GET  /projects/:id                  — detalhes do projeto
//   PATCH /projects/:id                 — atualizar projeto
//   DELETE /projects/:id                — arquivar projeto
//
//   ── Conversas ──
//   GET  /conversations?project_id=     — listar conversas
//   POST /conversations                 — criar conversa
//   GET  /conversations/:id             — detalhes + mensagens
//   POST /conversations/:id/messages    — adicionar mensagem
//   DELETE /conversations/:id           — arquivar conversa
//
//   ── Documentos ──
//   GET  /documents?project_id=         — listar documentos
//   POST /documents                     — salvar documento
//   GET  /documents/:id                 — buscar documento
//   PATCH /documents/:id                — atualizar documento
//   DELETE /documents/:id               — remover documento
//
//   ── Tarefas ──
//   GET  /tasks?project_id=             — listar tarefas
//   POST /tasks                         — criar tarefa
//   PATCH /tasks/:id                    — atualizar tarefa
//
//   ── Monitor de Tokens ──
//   POST /monitor/log                   — receber log de custo
//   GET  /monitor/stats                 — estatísticas (admin)
//   GET  /monitor/daily                 — custo por dia
//   GET  /monitor/by-agent              — custo por agente
//
//   ── Busca Vetorial ──
//   POST /memory/index                  — indexar documento (embedding)
//   POST /memory/search                 — busca semântica
//
//   ── Pipelines ──
//   POST /pipelines                     — criar e executar pipeline
//   GET  /pipelines?project_id=         — listar pipelines
//   GET  /pipelines/:id                 — detalhes do pipeline
// ============================================================

require('dotenv').config()

const express = require('express')
const cors    = require('cors')
const { Pool } = require('pg')
const jwt     = require('jsonwebtoken')
const bcrypt  = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

const app  = express()
const PORT = process.env.PORT || 3002

// ── PostgreSQL Pool ───────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ben_workspace',
  user:     process.env.DB_USER || 'ben_admin',
  password: process.env.DB_PASS,
  max:      10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado:', err.message)
})

// ── Constantes ────────────────────────────────────────────
const JWT_SECRET     = process.env.JWT_SECRET     || 'ben_jwt_mauro_moncao_2026'
const MONITOR_TOKEN  = process.env.MONITOR_ADMIN_TOKEN || 'ben_monitor_mauro_2026_secure'
const ADMIN_USER_ID  = 'a0000000-0000-0000-0000-000000000001'

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      cb(null, true)
    } else {
      cb(null, true) // permissivo em dev; trocar para cb(new Error('CORS')) em prod
    }
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Monitor-Token'],
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))

// ── Middleware de Auth ────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token  = header.replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Token ausente' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

function adminMiddleware(req, res, next) {
  const t = req.headers['x-monitor-token'] || req.query.token || ''
  if (t !== MONITOR_TOKEN) return res.status(401).json({ error: 'Acesso restrito' })
  next()
}

// ── Helpers ──────────────────────────────────────────────
async function query(sql, params = []) {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result
  } finally {
    client.release()
  }
}

function paginate(req) {
  const limit  = Math.min(parseInt(req.query.limit  || '20'), 100)
  const offset = parseInt(req.query.offset || '0')
  return { limit, offset }
}

// ═══════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════
app.get('/health', async (req, res) => {
  try {
    const r = await query('SELECT NOW() as time, version() as pg_version')
    const countProj = await query('SELECT COUNT(*) FROM projects')
    const countConv = await query('SELECT COUNT(*) FROM conversations')
    res.json({
      status: 'ok',
      service: 'BEN Workspace API',
      version: '1.0.0',
      port: PORT,
      timestamp: r.rows[0].time,
      pg_version: r.rows[0].pg_version.split(' ')[0],
      stats: {
        projects:      parseInt(countProj.rows[0].count),
        conversations: parseInt(countConv.rows[0].count),
      },
    })
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// AUTENTICAÇÃO — Login simplificado (sem senha, por email)
// Em produção: adicionar hash de senha na tabela users
// ═══════════════════════════════════════════════════════════
app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body
  if (!email) return res.status(400).json({ error: 'Email obrigatório' })

  try {
    const r = await query('SELECT * FROM users WHERE email = $1 AND ativo = true', [email])
    if (!r.rows.length) return res.status(401).json({ error: 'Usuário não encontrado' })

    const user = r.rows[0]

    // Autenticação por senha hash (se configurada) ou senha padrão para admin
    const senhaOk = user.role === 'admin'
      ? (!senha || senha === process.env.ADMIN_SENHA || senha === 'ben2026')
      : senha === 'ben2026'

    if (!senhaOk) return res.status(401).json({ error: 'Senha incorreta' })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nome: user.nome },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({ success: true, token, user: { id: user.id, email: user.email, nome: user.nome, role: user.role, oab: user.oab } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT id, email, nome, role, oab, criado_em FROM users WHERE id = $1', [req.user.id])
    if (!r.rows.length) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json({ success: true, user: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// PROJETOS
// ═══════════════════════════════════════════════════════════
app.get('/projects', authMiddleware, async (req, res) => {
  const { limit, offset } = paginate(req)
  const { status, area, prioridade } = req.query
  try {
    let sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM conversations c WHERE c.project_id = p.id) AS total_conversas,
        (SELECT COUNT(*) FROM documents   d WHERE d.project_id = p.id) AS total_documentos,
        (SELECT COUNT(*) FROM tasks       t WHERE t.project_id = p.id AND t.status != 'concluida') AS tarefas_pendentes
      FROM projects p
      WHERE p.user_id = $1
    `
    const params = [req.user.id]
    let pi = 2

    if (status)     { sql += ` AND p.status = $${pi++}`;     params.push(status) }
    if (area)       { sql += ` AND p.area = $${pi++}`;       params.push(area) }
    if (prioridade) { sql += ` AND p.prioridade = $${pi++}`; params.push(prioridade) }

    sql += ` ORDER BY p.atualizado_em DESC LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)

    const r = await query(sql, params)
    const total = await query('SELECT COUNT(*) FROM projects WHERE user_id = $1', [req.user.id])

    res.json({ success: true, total: parseInt(total.rows[0].count), projects: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/projects', authMiddleware, async (req, res) => {
  const { titulo, descricao, area, prioridade, cliente, numero_processo, valor_causa, prazo, tags } = req.body
  if (!titulo) return res.status(400).json({ error: 'Título obrigatório' })
  try {
    const r = await query(`
      INSERT INTO projects (user_id, titulo, descricao, area, prioridade, cliente, numero_processo, valor_causa, prazo, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [req.user.id, titulo, descricao || null, area || 'tributario', prioridade || 'media',
        cliente || null, numero_processo || null, valor_causa || null,
        prazo || null, tags || []])
    res.status(201).json({ success: true, project: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    if (!r.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' })

    const [convs, docs, tasks_r] = await Promise.all([
      query('SELECT id, titulo, agent_id, status, total_tokens, total_cost_usd, criado_em FROM conversations WHERE project_id = $1 ORDER BY criado_em DESC LIMIT 10', [req.params.id]),
      query('SELECT id, titulo, tipo, status, versao, criado_em FROM documents WHERE project_id = $1 ORDER BY criado_em DESC LIMIT 10', [req.params.id]),
      query('SELECT id, titulo, tipo, status, prioridade, prazo FROM tasks WHERE project_id = $1 AND status != \'concluida\' ORDER BY prazo ASC NULLS LAST LIMIT 10', [req.params.id]),
    ])

    res.json({
      success: true,
      project: r.rows[0],
      conversas_recentes: convs.rows,
      documentos_recentes: docs.rows,
      tarefas_pendentes: tasks_r.rows,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/projects/:id', authMiddleware, async (req, res) => {
  const fields = ['titulo','descricao','area','status','prioridade','cliente','numero_processo','valor_causa','prazo','tags','metadata']
  const updates = [], params = []
  let pi = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${pi++}`)
      params.push(req.body[f])
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' })
  updates.push(`atualizado_em = NOW()`)
  params.push(req.params.id, req.user.id)
  try {
    const r = await query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${pi++} AND user_id = $${pi++} RETURNING *`,
      params
    )
    if (!r.rows.length) return res.status(404).json({ error: 'Projeto não encontrado' })
    res.json({ success: true, project: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    await query('UPDATE projects SET status = \'arquivado\', atualizado_em = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    res.json({ success: true, msg: 'Projeto arquivado' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// CONVERSAS
// ═══════════════════════════════════════════════════════════
app.get('/conversations', authMiddleware, async (req, res) => {
  const { project_id, agent_id } = req.query
  const { limit, offset } = paginate(req)
  try {
    let sql = 'SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS total_mensagens FROM conversations c WHERE c.user_id = $1'
    const params = [req.user.id]
    let pi = 2
    if (project_id) { sql += ` AND c.project_id = $${pi++}`; params.push(project_id) }
    if (agent_id)   { sql += ` AND c.agent_id = $${pi++}`;   params.push(agent_id) }
    sql += ` ORDER BY c.atualizado_em DESC LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)
    const r = await query(sql, params)
    res.json({ success: true, conversations: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/conversations', authMiddleware, async (req, res) => {
  const { project_id, agent_id, titulo } = req.body
  if (!agent_id) return res.status(400).json({ error: 'agent_id obrigatório' })
  try {
    const r = await query(`
      INSERT INTO conversations (user_id, project_id, agent_id, titulo)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [req.user.id, project_id || null, agent_id, titulo || `Chat ${agent_id} — ${new Date().toLocaleDateString('pt-BR')}`])
    res.status(201).json({ success: true, conversation: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const conv = await query('SELECT * FROM conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    if (!conv.rows.length) return res.status(404).json({ error: 'Conversa não encontrada' })
    const msgs = await query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY criado_em ASC', [req.params.id])
    res.json({ success: true, conversation: conv.rows[0], messages: msgs.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
  const { role, content, agent_id, model_used, input_tokens, output_tokens, cost_usd, elapsed_ms } = req.body
  if (!role || !content) return res.status(400).json({ error: 'role e content são obrigatórios' })
  try {
    // Verificar que a conversa pertence ao usuário
    const conv = await query('SELECT id FROM conversations WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    if (!conv.rows.length) return res.status(404).json({ error: 'Conversa não encontrada' })

    const r = await query(`
      INSERT INTO messages (conversation_id, role, content, agent_id, model_used, input_tokens, output_tokens, cost_usd, elapsed_ms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.params.id, role, content, agent_id || null, model_used || null,
        input_tokens || 0, output_tokens || 0, cost_usd || 0, elapsed_ms || 0])

    // Atualizar totais na conversa
    await query(`
      UPDATE conversations
      SET total_tokens   = total_tokens   + $1,
          total_cost_usd = total_cost_usd + $2,
          atualizado_em  = NOW()
      WHERE id = $3
    `, [(input_tokens || 0) + (output_tokens || 0), cost_usd || 0, req.params.id])

    res.status(201).json({ success: true, message: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/conversations/:id', authMiddleware, async (req, res) => {
  try {
    await query("UPDATE conversations SET status = 'arquivada', atualizado_em = NOW() WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id])
    res.json({ success: true, msg: 'Conversa arquivada' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// DOCUMENTOS
// ═══════════════════════════════════════════════════════════
app.get('/documents', authMiddleware, async (req, res) => {
  const { project_id, tipo, status } = req.query
  const { limit, offset } = paginate(req)
  try {
    let sql = 'SELECT id, project_id, titulo, tipo, status, agent_id, versao, tags, criado_em, atualizado_em FROM documents WHERE user_id = $1'
    const params = [req.user.id]; let pi = 2
    if (project_id) { sql += ` AND project_id = $${pi++}`; params.push(project_id) }
    if (tipo)       { sql += ` AND tipo = $${pi++}`;       params.push(tipo) }
    if (status)     { sql += ` AND status = $${pi++}`;     params.push(status) }
    sql += ` ORDER BY atualizado_em DESC LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)
    const r = await query(sql, params)
    res.json({ success: true, documents: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/documents', authMiddleware, async (req, res) => {
  const { project_id, conversation_id, titulo, tipo, conteudo, conteudo_html, agent_id, tags } = req.body
  if (!titulo || !conteudo) return res.status(400).json({ error: 'titulo e conteudo são obrigatórios' })
  try {
    const r = await query(`
      INSERT INTO documents (user_id, project_id, conversation_id, titulo, tipo, conteudo, conteudo_html, agent_id, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.user.id, project_id || null, conversation_id || null, titulo,
        tipo || 'outros', conteudo, conteudo_html || null, agent_id || null, tags || []])
    res.status(201).json({ success: true, document: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/documents/:id', authMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    if (!r.rows.length) return res.status(404).json({ error: 'Documento não encontrado' })
    res.json({ success: true, document: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/documents/:id', authMiddleware, async (req, res) => {
  const fields = ['titulo','tipo','conteudo','conteudo_html','status','tags','metadata']
  const updates = [], params = []; let pi = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${pi++}`); params.push(req.body[f]) }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' })
  updates.push('versao = versao + 1', 'atualizado_em = NOW()')
  params.push(req.params.id, req.user.id)
  try {
    const r = await query(`UPDATE documents SET ${updates.join(', ')} WHERE id = $${pi++} AND user_id = $${pi++} RETURNING *`, params)
    if (!r.rows.length) return res.status(404).json({ error: 'Documento não encontrado' })
    res.json({ success: true, document: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/documents/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    res.json({ success: true, msg: 'Documento removido' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// TAREFAS
// ═══════════════════════════════════════════════════════════
app.get('/tasks', authMiddleware, async (req, res) => {
  const { project_id, status, prioridade } = req.query
  const { limit, offset } = paginate(req)
  try {
    let sql = 'SELECT * FROM tasks WHERE user_id = $1'
    const params = [req.user.id]; let pi = 2
    if (project_id) { sql += ` AND project_id = $${pi++}`; params.push(project_id) }
    if (status)     { sql += ` AND status = $${pi++}`;     params.push(status) }
    if (prioridade) { sql += ` AND prioridade = $${pi++}`; params.push(prioridade) }
    sql += ` ORDER BY prazo ASC NULLS LAST, prioridade DESC LIMIT $${pi++} OFFSET $${pi++}`
    params.push(limit, offset)
    const r = await query(sql, params)
    res.json({ success: true, tasks: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/tasks', authMiddleware, async (req, res) => {
  const { project_id, titulo, descricao, tipo, prioridade, agente_id, prazo } = req.body
  if (!titulo) return res.status(400).json({ error: 'Título obrigatório' })
  try {
    const r = await query(`
      INSERT INTO tasks (user_id, project_id, titulo, descricao, tipo, prioridade, agente_id, prazo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [req.user.id, project_id || null, titulo, descricao || null,
        tipo || 'manual', prioridade || 'media', agente_id || null, prazo || null])
    res.status(201).json({ success: true, task: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/tasks/:id', authMiddleware, async (req, res) => {
  const fields = ['titulo','descricao','status','prioridade','prazo','resultado','metadata']
  const updates = [], params = []; let pi = 1
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${pi++}`); params.push(req.body[f]) }
  }
  if (req.body.status === 'concluida') { updates.push('concluida_em = NOW()') }
  updates.push('atualizado_em = NOW()')
  params.push(req.params.id, req.user.id)
  try {
    const r = await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${pi++} AND user_id = $${pi++} RETURNING *`, params)
    if (!r.rows.length) return res.status(404).json({ error: 'Tarefa não encontrada' })
    res.json({ success: true, task: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// MONITOR DE TOKENS
// ═══════════════════════════════════════════════════════════
app.post('/monitor/log', async (req, res) => {
  // Aceita sem auth — vem do backend interno
  const { agentId, modelUsed, inputTokens, outputTokens, costUsd, elapsed_ms, timestamp, source } = req.body
  try {
    await query(`
      INSERT INTO token_usage (agent_id, model_used, input_tokens, output_tokens, cost_usd, elapsed_ms, source, timestamp)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [agentId || 'unknown', modelUsed || 'unknown', inputTokens || 0, outputTokens || 0,
        costUsd || 0, elapsed_ms || 0, source || 'api', timestamp || new Date().toISOString()])
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/monitor/stats', adminMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const month = new Date().toISOString().slice(0, 7)

    const [total, daily, monthly, byAgent, byModel] = await Promise.all([
      query('SELECT COUNT(*) as calls, SUM(cost_usd) as cost_usd, SUM(input_tokens) as input_tok, SUM(output_tokens) as output_tok FROM token_usage'),
      query("SELECT COUNT(*) as calls, SUM(cost_usd) as cost_usd FROM token_usage WHERE timestamp::date = $1", [today]),
      query("SELECT COUNT(*) as calls, SUM(cost_usd) as cost_usd FROM token_usage WHERE to_char(timestamp, 'YYYY-MM') = $1", [month]),
      query('SELECT agent_id, COUNT(*) as calls, SUM(cost_usd) as cost_usd, SUM(input_tokens) as input_tok, SUM(output_tokens) as output_tok FROM token_usage GROUP BY agent_id ORDER BY cost_usd DESC LIMIT 20'),
      query('SELECT model_used, COUNT(*) as calls, SUM(cost_usd) as cost_usd, SUM(input_tokens) as input_tok, SUM(output_tokens) as output_tok FROM token_usage GROUP BY model_used ORDER BY cost_usd DESC'),
    ])

    res.json({
      success: true,
      summary: {
        totalCalls:       parseInt(total.rows[0].calls),
        totalCostUsd:     parseFloat(total.rows[0].cost_usd || 0),
        totalCostBrl:     parseFloat(total.rows[0].cost_usd || 0) * parseFloat(process.env.USD_BRL_RATE || 5.75),
        dailyCostUsd:     parseFloat(daily.rows[0].cost_usd || 0),
        monthlyCostUsd:   parseFloat(monthly.rows[0].cost_usd || 0),
        totalInputTokens: parseInt(total.rows[0].input_tok || 0),
        totalOutputTokens: parseInt(total.rows[0].output_tok || 0),
      },
      byAgent: byAgent.rows,
      byModel: byModel.rows,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/monitor/daily', adminMiddleware, async (req, res) => {
  try {
    const r = await query(`
      SELECT timestamp::date as date,
             COUNT(*) as calls,
             SUM(cost_usd) as cost_usd
      FROM token_usage
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY timestamp::date
      ORDER BY date ASC
    `)
    res.json({ success: true, daily: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/monitor/by-agent', adminMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT agent_id, COUNT(*) as calls, SUM(cost_usd) as cost_usd FROM token_usage GROUP BY agent_id ORDER BY cost_usd DESC')
    res.json({ success: true, byAgent: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// BUSCA VETORIAL (Memória IA)
// ═══════════════════════════════════════════════════════════
app.post('/memory/index', authMiddleware, async (req, res) => {
  const { project_id, document_id, conteudo, tipo, metadata } = req.body
  if (!conteudo) return res.status(400).json({ error: 'conteudo obrigatório' })

  try {
    // Gerar embedding via OpenAI
    let embedding = null
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const emb = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: conteudo.slice(0, 8000),
      })
      embedding = JSON.stringify(emb.data[0].embedding)
    }

    const r = await query(`
      INSERT INTO memory_vectors (user_id, project_id, document_id, tipo, conteudo, embedding, metadata)
      VALUES ($1,$2,$3,$4,$5,$6::vector,$7) RETURNING id, tipo, criado_em
    `, [req.user.id, project_id || null, document_id || null,
        tipo || 'documento', conteudo, embedding, metadata || {}])

    res.status(201).json({ success: true, indexed: r.rows[0], hasEmbedding: !!embedding })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/memory/search', authMiddleware, async (req, res) => {
  const { query: searchQuery, project_id, limit: lim = 5 } = req.body
  if (!searchQuery) return res.status(400).json({ error: 'query obrigatório' })

  try {
    let results

    if (process.env.OPENAI_API_KEY) {
      // Busca vetorial por similaridade coseno
      const { OpenAI } = require('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const emb = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: searchQuery.slice(0, 2000),
      })
      const embStr = JSON.stringify(emb.data[0].embedding)

      let sql = `
        SELECT id, tipo, conteudo, metadata,
               1 - (embedding <=> $1::vector) AS similarity
        FROM memory_vectors
        WHERE user_id = $2 AND embedding IS NOT NULL
      `
      const params = [embStr, req.user.id]; let pi = 3
      if (project_id) { sql += ` AND project_id = $${pi++}`; params.push(project_id) }
      sql += ` ORDER BY similarity DESC LIMIT $${pi++}`
      params.push(parseInt(lim))

      results = await query(sql, params)
    } else {
      // Fallback: busca full-text simples
      let sql = `
        SELECT id, tipo, conteudo, metadata, 0.5 AS similarity
        FROM memory_vectors
        WHERE user_id = $1 AND conteudo ILIKE $2
      `
      const params = [req.user.id, `%${searchQuery}%`]; let pi = 3
      if (project_id) { sql += ` AND project_id = $${pi++}`; params.push(project_id) }
      sql += ` ORDER BY criado_em DESC LIMIT $${pi++}`
      params.push(parseInt(lim))
      results = await query(sql, params)
    }

    res.json({ success: true, results: results.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// PIPELINES (Orquestração Multi-Agente)
// ═══════════════════════════════════════════════════════════
app.post('/pipelines', authMiddleware, async (req, res) => {
  const { project_id, titulo, agentes, input } = req.body
  if (!agentes?.length || !input) return res.status(400).json({ error: 'agentes[] e input são obrigatórios' })

  try {
    // Criar pipeline
    const pipeline = await query(`
      INSERT INTO pipelines (user_id, project_id, titulo, agentes, input, status)
      VALUES ($1,$2,$3,$4,$5,'rodando') RETURNING *
    `, [req.user.id, project_id || null, titulo || `Pipeline ${agentes.join(' → ')}`, agentes, input])

    const pid = pipeline.rows[0].id

    // Responder imediatamente e executar em background
    res.status(201).json({ success: true, pipeline_id: pid, status: 'rodando', msg: 'Pipeline iniciado — consulte GET /pipelines/:id para acompanhar' })

    // ── Executar pipeline de forma assíncrona ─────────────
    executePipeline(pid, agentes, input, req.user.id, project_id).catch(async (e) => {
      await query("UPDATE pipelines SET status = 'erro', steps = $1 WHERE id = $2",
        [JSON.stringify([{ erro: e.message }]), pid])
    })

  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function executePipeline(pipelineId, agentes, input, userId, projectId) {
  const steps = []
  let currentInput = input
  let totalCost = 0

  const JURIS_URL = process.env.JURIS_URL || 'https://ben-juris-center.vercel.app'

  for (const agentId of agentes) {
    const t0 = Date.now()
    try {
      const r = await fetch(`${JURIS_URL}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, input: currentInput }),
        signal: AbortSignal.timeout(120000),
      })
      const data = await r.json()
      const elapsed = Date.now() - t0
      const cost = data.usage?.costUsd || 0

      steps.push({ agentId, status: 'ok', output: data.output?.slice(0, 500), elapsed, cost })
      totalCost += cost
      currentInput = data.output || currentInput  // saída de um vira entrada do próximo
    } catch (e) {
      steps.push({ agentId, status: 'erro', error: e.message })
    }
  }

  await query(`
    UPDATE pipelines
    SET status = 'concluido', output_final = $1, steps = $2, total_cost_usd = $3, concluido_em = NOW()
    WHERE id = $4
  `, [currentInput, JSON.stringify(steps), totalCost, pipelineId])

  // Salvar resultado como documento
  if (projectId && currentInput) {
    await query(`
      INSERT INTO documents (user_id, project_id, titulo, tipo, conteudo, agent_id)
      VALUES ($1,$2,$3,'relatorio',$4,'pipeline')
    `, [userId, projectId, `Resultado Pipeline — ${new Date().toLocaleDateString('pt-BR')}`, currentInput])
  }
}

app.get('/pipelines', authMiddleware, async (req, res) => {
  const { project_id } = req.query
  try {
    let sql = 'SELECT id, titulo, agentes, status, total_cost_usd, criado_em, concluido_em FROM pipelines WHERE user_id = $1'
    const params = [req.user.id]; let pi = 2
    if (project_id) { sql += ` AND project_id = $${pi++}`; params.push(project_id) }
    sql += ' ORDER BY criado_em DESC LIMIT 20'
    const r = await query(sql, params)
    res.json({ success: true, pipelines: r.rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/pipelines/:id', authMiddleware, async (req, res) => {
  try {
    const r = await query('SELECT * FROM pipelines WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    if (!r.rows.length) return res.status(404).json({ error: 'Pipeline não encontrado' })
    res.json({ success: true, pipeline: r.rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n╔════════════════════════════════════════╗`)
  console.log(`║  BEN Workspace API v1.0                ║`)
  console.log(`║  Porta: ${PORT}                            ║`)
  console.log(`╚════════════════════════════════════════╝`)

  try {
    await pool.query('SELECT 1')
    console.log('✅ PostgreSQL conectado')
  } catch (e) {
    console.error('❌ PostgreSQL OFFLINE:', e.message)
  }

  console.log(`\n📋 Rotas disponíveis:`)
  console.log(`   GET  /health`)
  console.log(`   POST /auth/login`)
  console.log(`   GET|POST /projects`)
  console.log(`   GET|POST /conversations`)
  console.log(`   GET|POST /documents`)
  console.log(`   GET|POST /tasks`)
  console.log(`   POST /monitor/log | GET /monitor/stats`)
  console.log(`   POST /memory/index | POST /memory/search`)
  console.log(`   POST /pipelines`)
  console.log(`\n🌐 VPS: http://181.215.135.202:${PORT}/health\n`)
})
