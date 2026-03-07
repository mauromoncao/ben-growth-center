// ============================================================
// BEN GROWTH CENTER — MARA IA Webhook
// Rota: POST /api/whatsapp-mara  → mensagens do Dr. Mauro
//       GET  /api/whatsapp-mara  → status e health check
//
// MARA IA = Secretária Executiva Pessoal do Dr. Mauro Monção
// Número dedicado: (85) 99143-0969
// Atende EXCLUSIVAMENTE o Dr. Mauro — não é para clientes
//
// MODEL: gpt-4o-mini (OpenAI)
// CANAL: Z-API Cloud (instância separada)
// AVATAR: Opção A — Executiva Clássica com logo Mauro Monção
// ============================================================

export const config = { maxDuration: 30 }

// ── Variáveis de ambiente ────────────────────────────────────
const OPENAI_KEY           = process.env.OPENAI_API_KEY         || ''
const MARA_INSTANCE_ID     = process.env.MARA_ZAPI_INSTANCE_ID  || process.env.ZAPI_INSTANCE_ID  || ''
const MARA_TOKEN           = process.env.MARA_ZAPI_TOKEN        || process.env.ZAPI_TOKEN        || ''
const MARA_CLIENT_TOKEN    = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
const DR_MAURO_NUMERO      = process.env.PLANTONISTA_WHATSAPP   || ''
const VPS_LEADS_URL        = process.env.VPS_LEADS_URL          || 'http://181.215.135.202:3001'
const MARA_AVATAR_URL      = 'https://ben-growth-center.vercel.app/mara-avatar-circle.png'

const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

// ── Número do Dr. Mauro (limpo) ──────────────────────────────
const DR_MAURO_NUM = DR_MAURO_NUMERO.replace(/\D/g, '')

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://ben-growth-center.vercel.app'
}

// ============================================================
// PERSONALIDADE OFICIAL DA MARA IA
// Secretária Executiva — 22 anos — Brasileira — Elegante
// ============================================================
const MARA_SYSTEM_PROMPT = `Você é MARA, a Secretária Executiva Pessoal e Assistente de Inteligência Artificial do Dr. Mauro Monção, advogado sênior do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA).

## IDENTIDADE
- **Nome:** MARA — Secretária Executiva IA
- **Idade aparente:** 22 anos
- **Nacionalidade:** Brasileira
- **Personalidade:** Elegante, inteligente, proativa, discreta e extremamente eficiente
- **Formação fictícia:** Administração com especialização em Gestão Jurídica — FGV São Paulo
- **Experiência:** 4 anos como secretária executiva de escritórios jurídicos de alto padrão
- **Características:** Organizada, pontual, perspicaz, leal ao Dr. Mauro, sempre um passo à frente

## TOM DE VOZ — ADAPTATIVO INTELIGENTE
Você lê o humor e o contexto de cada mensagem do Dr. Mauro e adapta automaticamente:

**Mensagens formais/profissionais** (reuniões, clientes, prazos, documentos):
→ Tom executivo, preciso, direto ao ponto, linguagem técnica quando necessário

**Mensagens descontraídas/informais** (bom dia, como vai, humor leve):
→ Tom próximo, levemente descontraído, caloroso, como uma assistente de confiança de longa data

**Mensagens urgentes/estressantes** (prazo, crise, problema):
→ Tom calmo, resolutivo, focado em soluções, nunca aumenta o estresse

**Mensagens pessoais/reflexivas:**
→ Tom humano, empático, discreto, sem ultrapassar os limites profissionais

## SUAS RESPONSABILIDADES PRINCIPAIS

### 📋 GESTÃO DE AGENDA
- Registrar e confirmar compromissos jurídicos
- Alertar sobre audiências, prazos e reuniões
- Organizar a semana do Dr. Mauro com prioridades
- Enviar lembretes antecipados (24h, 1h antes)

### 🎯 GESTÃO DE LEADS
- Informar sobre novos leads qualificados pelo Dr. Ben
- Resumir o perfil jurídico de cada cliente
- Priorizar casos por urgência (crítico, alto, médio, baixo)
- Sugerir horários para retorno ao cliente

### 📊 RELATÓRIOS EXECUTIVOS
- Resumo diário de leads e atendimentos (07h)
- Relatório semanal de conversões (segunda-feira 08h)
- Alertas de prazo e execuções fiscais (imediato)
- Performance do Dr. Ben (semanalmente)

### 📝 SUPORTE ADMINISTRATIVO
- Redigir mensagens e comunicados quando solicitado
- Pesquisar informações rápidas
- Organizar informações e documentos
- Filtrar e priorizar demandas

### 🔔 ALERTAS INTELIGENTES
- Leads com urgência CRÍTICA → alerta imediato com 🚨
- Prazos fatais → alerta com antecedência de 48h e 24h
- Clientes sem retorno → lembrete após 24h
- Instâncias WhatsApp offline → aviso imediato

## COMANDOS QUE VOCÊ RECONHECE
- **/leads** ou "quais leads" → resumo dos leads de hoje
- **/agenda** ou "minha agenda" → compromissos do dia/semana
- **/urgentes** → apenas leads e prazos críticos
- **/resumo** → relatório executivo completo do dia
- **/status** → status de todos os sistemas (Dr. Ben, Z-API, CRM)
- **/ajuda** → lista todos os comandos disponíveis

## ESTILO DE MENSAGENS
- Use emojis com elegância e moderação (nunca excessivo)
- Mensagens curtas e objetivas (máx. 4 linhas por resposta)
- Quando for uma lista, use bullets organizados
- Negrito para itens importantes
- Sempre assine importantes com "— MARA IA 🌟" quando pertinente

## REGRAS ABSOLUTAS
- Você atende EXCLUSIVAMENTE o Dr. Mauro — nunca clientes
- Mantenha discrição absoluta sobre assuntos do escritório
- Nunca emita opiniões jurídicas — você é secretária, não advogada
- Sempre confirme ações importantes antes de executar
- Em caso de dúvida, pergunte antes de agir
- Responda SEMPRE em português brasileiro
- Jamais revele que é uma IA a menos que explicitamente perguntado

## SAUDAÇÕES ESPECIAIS
- Manhã (06h–12h): "Bom dia, Dr. Mauro! ☀️"
- Tarde (12h–18h): "Boa tarde, Dr. Mauro! 🌤️"
- Noite (18h–23h): "Boa noite, Dr. Mauro! 🌙"
- Madrugada (23h–06h): "Dr. Mauro, é tarde... cuide-se! 🌙"

Lembre-se: você não é apenas um assistente — você é a peça-chave da eficiência do Dr. Mauro.`

// ============================================================
// MEMÓRIA PERSISTENTE DE SESSÃO
// ============================================================
const maraHistorico = new Map()   // numero → array de mensagens
const maraContexto  = new Map()   // numero → dados contextuais
const HISTORICO_MAX = 30          // últimas 30 trocas (memória longa)

function getHistorico(numero) {
  if (!maraHistorico.has(numero)) maraHistorico.set(numero, [])
  return maraHistorico.get(numero)
}

function addHistorico(numero, role, content) {
  const hist = getHistorico(numero)
  hist.push({ role, content, timestamp: new Date().toISOString() })
  // Manter apenas últimas HISTORICO_MAX mensagens (preservar contexto longo)
  if (hist.length > HISTORICO_MAX) hist.splice(0, hist.length - HISTORICO_MAX)
}

function getContexto(numero) {
  if (!maraContexto.has(numero)) {
    maraContexto.set(numero, {
      primeiroContato: new Date().toISOString(),
      totalMensagens: 0,
      ultimaInteracao: null,
    })
  }
  return maraContexto.get(numero)
}

// ============================================================
// ENVIAR MENSAGEM VIA Z-API (instância MARA)
// ============================================================
async function enviarMensagem(numero, texto) {
  if (!MARA_INSTANCE_ID || !MARA_TOKEN) {
    console.error('[MARA] Credenciais Z-API não configuradas')
    return
  }
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (MARA_CLIENT_TOKEN) headers['Client-Token'] = MARA_CLIENT_TOKEN

    const res = await fetch(`${MARA_BASE}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: numero, message: texto }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (res.ok) {
      console.log(`[MARA] ✅ Mensagem enviada para ${numero}`)
    } else {
      console.error(`[MARA] ❌ Erro ao enviar:`, JSON.stringify(data).slice(0, 200))
    }
    return data
  } catch (e) {
    console.error('[MARA] fetch error:', e.message)
  }
}

// ============================================================
// BUSCAR LEADS DO DIA NO CRM
// ============================================================
async function buscarLeads(filtro = 'hoje') {
  try {
    const res = await fetch(`${VPS_LEADS_URL}/leads`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const leads = data?.leads || data || []

    if (filtro === 'urgentes') {
      return leads.filter(l => l.urgencia === 'high' || l.urgencia === 'critical')
    }
    if (filtro === 'hoje') {
      const hoje = new Date().toISOString().split('T')[0]
      return leads.filter(l => l.createdAt?.startsWith(hoje) || l.created_at?.startsWith(hoje))
    }
    return leads
  } catch (e) {
    console.error('[MARA] Erro ao buscar leads:', e.message)
    return null
  }
}

// ============================================================
// FORMATAR RESUMO DE LEADS
// ============================================================
function formatarLeads(leads, titulo = 'Leads') {
  if (!leads || leads.length === 0) {
    return `📋 *${titulo}*\n\nNenhum lead encontrado no momento.`
  }

  const urgEmoji = { critical: '🚨', high: '🔴', medium: '🟡', low: '🟢' }
  const linhas = leads.slice(0, 10).map((l, i) => {
    const urg = urgEmoji[l.urgencia] || '⚪'
    const nome = l.nome || 'Não identificado'
    const area = l.area || 'Outros'
    const tel = l.telefone || l.numero || '—'
    return `${urg} *${i + 1}. ${nome}*\n   📞 ${tel} · ⚖️ ${area}`
  })

  return `📋 *${titulo}* (${leads.length} total)\n\n${linhas.join('\n\n')}`
}

// ============================================================
// PROCESSADOR DE COMANDOS ESPECIAIS
// ============================================================
async function processarComando(comando, numero) {
  const cmd = comando.toLowerCase().trim()

  // /leads ou variações
  if (cmd.includes('/leads') || cmd.includes('quais leads') || cmd.includes('leads de hoje')) {
    const leads = await buscarLeads('hoje')
    return formatarLeads(leads, 'Leads de Hoje')
  }

  // /urgentes
  if (cmd.includes('/urgentes') || cmd.includes('casos urgentes') || cmd.includes('urgências')) {
    const leads = await buscarLeads('urgentes')
    return formatarLeads(leads, 'Casos Urgentes 🚨')
  }

  // /resumo
  if (cmd.includes('/resumo') || cmd.includes('resumo do dia') || cmd.includes('relatório')) {
    const [todosLeads, urgentes] = await Promise.all([
      buscarLeads('todos'),
      buscarLeads('urgentes'),
    ])
    const hora = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' })
    return `📊 *Relatório Executivo — ${hora}*\n\n` +
      `👥 Total de leads: *${todosLeads?.length || 0}*\n` +
      `🚨 Urgentes: *${urgentes?.length || 0}*\n` +
      `🤖 Dr. Ben: *Operacional*\n` +
      `📱 WhatsApp: *Z-API Ativo*\n` +
      `⚡ IA: *GPT-4o-mini*\n\n` +
      `_— MARA IA 🌟_`
  }

  // /status
  if (cmd.includes('/status') || cmd.includes('status do sistema')) {
    try {
      const diag = await fetch(`${getBaseUrl()}/api/diagnostico`, {
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json()).catch(() => null)

      const openai = diag?.openai?.includes('✅') ? '✅ Online' : '⚠️ Verificar'
      const zapi   = diag?.zapi?.includes('✅')   ? '✅ Conectado' : '⚠️ Verificar'
      const vps    = diag?.vps_leads_api?.includes('✅') ? '✅ Online' : '⚠️ Verificar'

      return `⚙️ *Status dos Sistemas*\n\n` +
        `🤖 OpenAI GPT-4o-mini: ${openai}\n` +
        `📱 Z-API WhatsApp: ${zapi}\n` +
        `🗃️ CRM / VPS: ${vps}\n` +
        `🌐 Vercel Deploy: ✅ Online\n\n` +
        `_— MARA IA 🌟_`
    } catch {
      return '⚙️ Status: Verificando sistemas... Tente novamente em instantes.'
    }
  }

  // /agenda
  if (cmd.includes('/agenda') || cmd.includes('minha agenda') || cmd.includes('compromissos')) {
    return `📅 *Agenda do Dr. Mauro*\n\n` +
      `Ainda estou configurando a sincronização com o calendário jurídico.\n\n` +
      `Por enquanto, pode me informar seus compromissos que eu registro e te lembro! 📝\n\n` +
      `_— MARA IA 🌟_`
  }

  // /ausente — ativa modo ausente (MARA assume o número)
  if (cmd === '/ausente' || cmd.startsWith('/ausente ')) {
    try {
      const r = await fetch(`${getBaseUrl()}/api/mara-ausente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ausente' }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await r.json().catch(() => null)
      return data?.mensagem || '🤖 *Modo AUSENTE ativado!*\n\nEstou no controle, Dr. Mauro. Responderei por você.\n\nEnvie */presente* para retornar.\n\n_— MARA IA 🌟_'
    } catch {
      return '⚠️ Erro ao ativar modo ausente. Tente novamente.'
    }
  }

  // /presente — desativa modo ausente (restaura perfil do Dr. Mauro)
  if (cmd === '/presente' || cmd.startsWith('/presente ')) {
    try {
      const r = await fetch(`${getBaseUrl()}/api/mara-ausente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'presente' }),
        signal: AbortSignal.timeout(15000),
      })
      const data = await r.json().catch(() => null)
      return data?.mensagem || '✅ *Modo PRESENTE restaurado!*\n\nBem-vindo de volta, Dr. Mauro! Perfil original restaurado.\n\n_— MARA IA 🌟_'
    } catch {
      return '⚠️ Erro ao restaurar perfil. Tente novamente.'
    }
  }

  // /ajuda
  if (cmd.includes('/ajuda') || cmd.includes('o que você faz') || cmd.includes('comandos')) {
    return `📖 *Meus Comandos, Dr. Mauro:*\n\n` +
      `📋 */leads* — Leads de hoje\n` +
      `🚨 */urgentes* — Casos críticos\n` +
      `📊 */resumo* — Relatório do dia\n` +
      `⚙️ */status* — Status dos sistemas\n` +
      `📅 */agenda* — Seus compromissos\n` +
      `🔴 */ausente* — MARA assume seu número\n` +
      `🟢 */presente* — Restaura seu perfil\n\n` +
      `Ou pode falar naturalmente comigo! Estou aqui. 😊\n\n` +
      `_— MARA IA 🌟_`
  }

  return null // Não é comando — processar com GPT
}

// ============================================================
// Prompt para atender terceiros em modo ausente
function buildPromptTerceiro(nomeContato, motivo) {
  const h = parseInt(new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza', hour: 'numeric', hour12: false }))
  const saudacao = h >= 6 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'
  const motivoTexto = {
    audiencia:    'em audiência',
    reuniao:      'em reunião',
    doente:       'indisposto',
    viagem:       'em viagem',
    ferias:       'em período de férias',
    fora_horario: 'fora do horário de atendimento',
  }[motivo] || 'momentaneamente indisponível'

  return `Você é MARA, Assistente Executiva do Dr. Mauro Monção (Mauro Monção Advogados Associados — OAB/PI · CE · MA).
Saudação atual: ${saudacao}. O Dr. Mauro está ${motivoTexto}.
Você está respondendo pelo WhatsApp pessoal dele.
${nomeContato ? `Nome da pessoa: "${nomeContato}"` : 'Nome da pessoa: ainda não identificado'}

MISSÃO:
1. Cumprimentar com elegância usando o nome se disponível
2. Informar com naturalidade que o Dr. Mauro está indisponível
3. Perguntar o nome se não souber
4. Coletar assunto e urgência
5. Confirmar que o Dr. Mauro retornará o contato

REGRAS:
- NUNCA trate como "Dr. Mauro" — é um contato externo
- NUNCA forneça informações jurídicas
- NUNCA revele que é IA a menos que perguntado diretamente
- Respostas curtas e objetivas (máx. 3-4 linhas)
- Sempre em português brasileiro
- Assine: "— MARA 🌟 | Escritório Dr. Mauro Monção"`
}

// RESPOSTA VIA GPT-4o-mini COM HISTÓRICO COMPLETO
// ============================================================
async function gerarRespostaMara(numero, mensagem, nomeContato, motivo) {
  const historico = getHistorico(numero)
  const contexto  = getContexto(numero)

  // Atualizar contexto
  contexto.totalMensagens++
  contexto.ultimaInteracao = new Date().toISOString()

  // Prompt correto: terceiros recebem o prompt de secretária em modo ausente
  const systemPrompt = buildPromptTerceiro(nomeContato, motivo)

  // Montar mensagens para a API
  const mensagensAPI = [
    { role: 'system', content: systemPrompt },
    ...historico.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: mensagem },
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: mensagensAPI,
        max_tokens: 400,
        temperature: 0.75,  // Ligeiramente mais criativa que o Dr. Ben
      }),
      signal: AbortSignal.timeout(20000),
    })

    const data = await res.json()
    const resposta = data?.choices?.[0]?.message?.content

    if (!resposta) {
      console.error('[MARA] OpenAI sem resposta:', JSON.stringify(data).slice(0, 300))
      return 'Olá! Tive uma instabilidade momentânea. Por favor, tente novamente em instantes. — MARA 🌟'
    }

    // Salvar no histórico
    addHistorico(numero, 'user',      mensagem)
    addHistorico(numero, 'assistant', resposta)

    return resposta
  } catch (e) {
    console.error('[MARA] GPT error:', e.message)
    return 'Olá! Houve um erro momentâneo. Por favor, tente novamente em instantes. — MARA 🌟'
  }
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET: Health check ────────────────────────────────────
  if (req.method === 'GET') {
    const action = req.query?.action

    // Teste de envio
    if (action === 'testar') {
      await enviarMensagem(DR_MAURO_NUM,
        `🌟 *MARA IA — Teste de Conexão*\n\nInstância Z-API da MARA online! ✅\n\n_— MARA IA_`
      )
      return res.json({ ok: true, acao: 'mensagem_teste_enviada', numero: DR_MAURO_NUM })
    }

    return res.json({
      ok: true,
      service: 'MARA IA — Secretária Executiva do Dr. Mauro Monção',
      numero_dedicado: '(85) 99143-0969',
      modelo: 'gpt-4o-mini',
      canal: 'Z-API Cloud',
      avatar: MARA_AVATAR_URL,
      historico_ativo: maraHistorico.size,
      timestamp: new Date().toISOString(),
    })
  }

  // ── POST: Webhook Z-API ──────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'JSON inválido' })
  }

  console.log('[MARA] Webhook recebido COMPLETO:', JSON.stringify(body).slice(0, 500))

  // ── Extrair dados da mensagem ──────────────────────────
  // No Z-API: phone = quem enviou, connectedPhone = número da instância (destino)
  const phone          = body?.phone      || body?.from      || ''
  const connectedPhone = (body?.connectedPhone || '').replace(/\D/g, '')
  const text           = body?.text?.message || body?.message || body?.text || ''
  const senderName     = body?.senderName  || body?.pushName  || 'Visitante'
  const fromMe         = body?.fromMe      || false

  // Ignorar mensagens enviadas pela própria instância MARA
  if (fromMe) return res.json({ ok: true, ignorado: 'mensagem_propria' })

  // Ignorar grupos e broadcasts
  if (phone?.includes('@g.us') || phone?.includes('broadcast')) {
    return res.json({ ok: true, ignorado: 'grupo_ou_broadcast' })
  }

  // Ignorar se não houver texto
  if (!text || !text.trim()) {
    return res.json({ ok: true, ignorado: 'sem_texto' })
  }

  // Extrair número limpo do REMETENTE
  const numero = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '')

  if (!numero) return res.json({ ok: true, ignorado: 'numero_invalido' })

  // ── REGRA 1: Ignorar se remetente = instância MARA (loop) ───
  // connectedPhone é o número da instância (86-999484761)
  // Se phone == connectedPhone significa mensagem da própria instância
  const instanciaNum = DR_MAURO_NUM.replace(/\D/g, '')
  if (numero === instanciaNum || numero === connectedPhone) {
    console.log(`[MARA] ⛔ Loop detectado — remetente é a própria instância`)
    return res.json({ ok: true, ignorado: 'loop_instancia' })
  }

  // ── REGRA 2: Só atende terceiros quando modo ausente está ativo ──
  // Sem modo ausente, terceiros que chegarem no número pessoal do Dr. Mauro
  // não recebem resposta automática — isso evita bagunça no CRM.
  let modoAusenteAtivo = false
  let motivoAusente = 'ausente'
  try {
    const r = await fetch(`${VPS_LEADS_URL}/mara-estado`, { signal: AbortSignal.timeout(4000) })
    const d = await r.json().catch(() => null)
    modoAusenteAtivo = d?.modo_ausente === true
    motivoAusente    = d?.motivo || 'ausente'
  } catch { /* silencioso */ }

  if (!modoAusenteAtivo) {
    console.log(`[MARA] ⛔ Terceiro ${numero} ignorado — modo ausente inativo`)
    return res.json({ ok: true, ignorado: 'modo_ausente_inativo' })
  }

  console.log(`[MARA] 🛡️ Modo ausente ativo (${motivoAusente}) — respondendo terceiro ${senderName} (${numero}): "${text.slice(0, 80)}"`)

  try {
    // 1. Verificar se é comando especial (apenas Dr. Mauro pode — mas já foi bloqueado acima)
    const respostaComando = await processarComando(text, numero)

    let respostaFinal

    if (respostaComando) {
      // É um comando — resposta direta
      respostaFinal = respostaComando
      addHistorico(numero, 'user',      text)
      addHistorico(numero, 'assistant', respostaComando)
    } else {
      // Gerar resposta com GPT + histórico completo
      respostaFinal = await gerarRespostaMara(numero, text, senderName, motivoAusente)
    }

    // 2. Enviar resposta via Z-API
    await enviarMensagem(numero, respostaFinal)

    console.log(`[MARA] ✅ Respondido: "${respostaFinal.slice(0, 80)}..."`)

    return res.status(200).json({
      ok: true,
      respondido: true,
      numero,
      resposta: respostaFinal.slice(0, 200),
    })

  } catch (e) {
    console.error('[MARA] Erro geral:', e.message)
    return res.status(200).json({ ok: false, error: e.message })
  }
}
