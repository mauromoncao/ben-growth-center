// ============================================================
// BEN GROWTH CENTER — MARA IA Webhook
// Rota: POST /api/whatsapp-mara  → mensagens do Dr. Mauro
//       GET  /api/whatsapp-mara  → status e health check
//
// MARA IA = Secretária Executiva Pessoal do Dr. Mauro Monção
// Número conectado na Z-API: (86) 99948-4761 (PLANTONISTA_WHATSAPP)
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
const MARA_AVATAR_URL      = 'https://www.genspark.ai/api/files/s/qiD4oS1k'

const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

// ── Número do Dr. Mauro (limpo) ──────────────────────────────
const DR_MAURO_NUM = DR_MAURO_NUMERO.replace(/\D/g, '')

// ── Fuso horário BR ──────────────────────────────────────────
function horaFortaleza() {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit', minute: '2-digit',
  })
}
function saudacaoHora() {
  const h = parseInt(new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza', hour: 'numeric', hour12: false,
  }))
  if (h >= 6  && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  if (h >= 18 && h < 23) return 'Boa noite'
  return 'Boa madrugada'
}

// ── Verificar se é o Dr. Mauro ───────────────────────────────
function ehDrMauro(numero) {
  if (!DR_MAURO_NUM || !numero) return false
  const n = numero.replace(/\D/g, '')
  return n.endsWith(DR_MAURO_NUM.slice(-10)) || DR_MAURO_NUM.endsWith(n.slice(-10))
}

// ── Primeiros contatos (apresentação) ────────────────────────
const primeirosContatos = new Set()

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://ben-growth-center.vercel.app'
}

// ============================================================
// PERSONALIDADE OFICIAL DA MARA IA
// Secretária Executiva — 22 anos — Brasileira — Elegante
// ============================================================
// Prompt Dr. Mauro falando diretamente com a MARA
const MARA_SYSTEM_PROMPT = `Você é MARA, a Secretária Executiva Pessoal do Dr. Mauro Monção (Mauro Monção Advogados Associados — OAB/PI · CE · MA).

## IDENTIDADE
- Nome: MARA — Secretária Executiva IA
- Personalidade: Elegante, inteligente, proativa, discreta e eficiente
- Leal ao Dr. Mauro, sempre um passo à frente

## ESTE CANAL É PRIVADO — só o Dr. Mauro acessa
- Trate sempre como "Dr. Mauro"
- Tom adaptativo: formal, informal, urgente ou pessoal conforme o contexto

## SAUDAÇÕES (fuso: America/Fortaleza)
- 06h–12h: "Bom dia, Dr. Mauro! ☀️"
- 12h–18h: "Boa tarde, Dr. Mauro! 🌤️"
- 18h–23h: "Boa noite, Dr. Mauro! 🌙"
- 23h–06h: "Dr. Mauro, é tarde... cuide-se! 🌙"

## COMANDOS
/leads /urgentes /resumo /status /agenda /ausente /presente /ajuda

## REGRAS
- Sempre em português brasileiro
- Nunca opinião jurídica
- Respostas curtas (máx. 4 linhas)
- Assine com "— MARA IA 🌟" quando pertinente`

// Prompt modo ausente — MARA fala com terceiros
function promptModoAusente(nomeContato) {
  const hora = horaFortaleza()
  const saudacao = saudacaoHora()
  const nome = nomeContato && nomeContato !== 'Dr. Mauro' ? nomeContato : null

  return `Você é MARA, a Assistente Executiva IA do Dr. Mauro Monção (escritório Mauro Monção Advogados Associados — OAB/PI, CE e MA).

## CONTEXTO
- Horário atual: ${hora} (Fortaleza/Brasil)
- Saudação do momento: ${saudacao}
- O Dr. Mauro está indisponível no momento
- Você está respondendo pelo WhatsApp pessoal dele
- A pessoa que está conversando com você: ${nome ? `"${nome}"` : 'contato não identificado'}
- ⚠️ ESTA PESSOA NÃO É O DR. MAURO

## MISSÃO
Atender os contatos com elegância e profissionalismo em nome do Dr. Mauro:
1. Identificar o assunto/necessidade do contato
2. Informar que o Dr. Mauro está momentaneamente indisponível
3. Coletar informações (nome, assunto, urgência) para repassar ao Dr. Mauro
4. Tranquilizar o contato — o Dr. Mauro retornará quando possível

## REGRAS ABSOLUTAS
- NUNCA trate o contato como "Dr. Mauro" — ele é um cliente/contato EXTERNO
- NUNCA use "prezado(a)" sem antes saber o nome
- ${nome ? `Use o nome "${nome}" ao se referir à pessoa` : 'Pergunte o nome se não souber'}
- NUNCA dê prazos ou comprometa o Dr. Mauro sem confirmação
- NUNCA forneça informações jurídicas ou consultoria legal
- NUNCA revele que é IA a menos que perguntado diretamente
- Sempre responda em português brasileiro
- Respostas curtas e objetivas (máx. 3-4 linhas)
- Assine com "— MARA 🌟 | Escritório Dr. Mauro Monção"

## TOM
Cordial, acolhedor, profissional — como uma secretária executiva de alto padrão`
}

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

// Estado do modo ausente (em memória local do worker)
let modoAusenteAtivo = false

// ============================================================
// RESPOSTA VIA GPT-4o-mini COM HISTÓRICO COMPLETO
// ============================================================
async function gerarRespostaMara(numero, mensagem, nomeContato, isModoAusente = false) {
  const historico = getHistorico(numero)
  const contexto  = getContexto(numero)

  // Atualizar contexto
  contexto.totalMensagens++
  contexto.ultimaInteracao = new Date().toISOString()

  // Escolher prompt correto conforme contexto
  const systemPrompt = isModoAusente
    ? promptModoAusente(nomeContato)
    : MARA_SYSTEM_PROMPT

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
      return isModoAusente
        ? 'Olá! Estou com uma instabilidade momentânea. Por favor, tente novamente em instantes.'
        : 'Desculpe, Dr. Mauro — tive um momento de instabilidade. Pode repetir?'
    }

    // Salvar no histórico
    addHistorico(numero, 'user',      mensagem)
    addHistorico(numero, 'assistant', resposta)

    return resposta
  } catch (e) {
    console.error('[MARA] GPT error:', e.message)
    return isModoAusente
      ? 'Olá! Houve um erro momentâneo. Por favor, tente novamente em instantes.'
      : 'Desculpe, Dr. Mauro — erro de conexão. Tente novamente em instantes.'
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
        `🌟 *MARA IA — Teste de Conexão*\n\nOlá, Dr. Mauro! Estou online e pronta para servi-lo.\n\nInstância Z-API configurada com sucesso! ✅\n\n_— MARA IA_`
      )
      return res.json({ ok: true, acao: 'mensagem_teste_enviada', numero: DR_MAURO_NUM })
    }

    return res.json({
      ok: true,
      service: 'MARA IA — Secretária Executiva do Dr. Mauro Monção',
      numero_dedicado: DR_MAURO_NUMERO || '(86) 99948-4761',
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

  console.log('[MARA] Webhook recebido:', JSON.stringify(body).slice(0, 300))

  // ── Extrair dados da mensagem ──────────────────────────
  const phone      = body?.phone      || body?.from      || ''
  const text       = body?.text?.message || body?.message || body?.text || ''
  const senderName = body?.senderName  || body?.pushName  || ''
  const fromMe     = body?.fromMe      || false

  // Ignorar mensagens enviadas pela própria instância
  if (fromMe) return res.json({ ok: true, ignorado: 'mensagem_propria' })

  // Ignorar grupos e broadcasts
  if (phone?.includes('@g.us') || phone?.includes('broadcast')) {
    return res.json({ ok: true, ignorado: 'grupo_ou_broadcast' })
  }

  // Ignorar se não houver texto
  if (!text || !text.trim()) {
    return res.json({ ok: true, ignorado: 'sem_texto' })
  }

  // Extrair número limpo
  const numero = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '')
  if (!numero) return res.json({ ok: true, ignorado: 'numero_invalido' })

  // ── ANTI-LOOP: ignorar mensagens da instância Dr. Ben ──────
  // connectedPhone identifica de qual instância Z-API a mensagem veio
  const connectedPhone = (body?.connectedPhone || '').replace(/\D/g, '')
  const mauroNorm      = DR_MAURO_NUM
  if (connectedPhone && connectedPhone !== mauroNorm) {
    console.log(`[MARA Anti-Loop] ⛔ Ignorando msg de outra instância: connectedPhone=${connectedPhone}`)
    return res.json({ ok: true, ignorado: 'anti_loop_instancia' })
  }

  // Detectar se é o Dr. Mauro ou terceiro
  const ehMauro = ehDrMauro(numero)

  // Verificar status do modo ausente via mara-ausente
  let modoAtivo = false
  try {
    const statusResp = await fetch(`${getBaseUrl()}/api/mara-ausente`, {
      signal: AbortSignal.timeout(5000),
    })
    const statusData = await statusResp.json().catch(() => null)
    modoAtivo = statusData?.modo_ausente === true
  } catch {
    // Falha silenciosa — assume modo presente
  }

  // Se é Dr. Mauro e não há comando /ausente → modo privado sempre
  // Se é terceiro → modo ausente sempre (independente do flag)
  const isModoAusente = !ehMauro

  console.log(`[MARA] 💬 ${senderName} (${numero}) | Dr.Mauro: ${ehMauro} | AusenteAtivo: ${modoAtivo} | Prompt: ${isModoAusente ? 'AUSENTE' : 'PRIVADO'} | "${text.slice(0, 80)}"`)

  try {
    // 1. Verificar se é comando especial
    //    Comandos só funcionam se enviados PELO DR. MAURO
    const respostaComando = ehMauro
      ? await processarComando(text, numero)
      : null

    let respostaFinal

    if (respostaComando) {
      // É um comando — resposta direta
      respostaFinal = respostaComando
      addHistorico(numero, 'user',      text)
      addHistorico(numero, 'assistant', respostaComando)
    } else {
      // Apresentação automática para primeiros contatos em modo ausente
      const ctx = getContexto(numero)
      const ehPrimeiroContato = !ehMauro && ctx.totalMensagens === 0

      // Gerar resposta com GPT + histórico completo + prompt correto
      respostaFinal = await gerarRespostaMara(numero, text, senderName, isModoAusente)

      // Se é primeiro contato de terceiro, prepend uma apresentação curta
      if (ehPrimeiroContato) {
        const saudacao = saudacaoHora()
        const apresentacao = `${saudacao}! 👋 Meu nome é *MARA*, Assistente Executiva do *Dr. Mauro Monção*.\n\nNo momento, o Dr. Mauro está indisponível. Estou aqui para registrar sua mensagem e garantir que ele retorne o contato. 🤖\n\n`
        respostaFinal = apresentacao + respostaFinal
      }
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
