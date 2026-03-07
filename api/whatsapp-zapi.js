// ============================================================
// BEN GROWTH CENTER — Webhook Z-API WhatsApp
// Rota: POST /api/whatsapp-zapi  → mensagens recebidas
//       GET  /api/whatsapp-zapi  → health check
//
// DR. BEN  = Assistente Jurídico — atende CLIENTES
// MARA IA  = Secretária Executiva — atende DR. MAURO
//
// INTELIGÊNCIA: detecta quem está falando e redireciona
// VOZES: ElevenLabs TTS integrado (Dr. Ben + MARA IA)
// MODO AUSENTE: MARA responde por Dr. Mauro quando ativado
//
// MODEL: gpt-4o-mini (OpenAI)
// CANAL: Z-API Cloud
// ============================================================

export const config = { maxDuration: 30 }

// ── Credenciais ──────────────────────────────────────────────
const OPENAI_KEY        = process.env.OPENAI_API_KEY       || ''
const ZAPI_INSTANCE_ID  = process.env.ZAPI_INSTANCE_ID     || ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN           || ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN    || ''
const DR_MAURO_WHATSAPP = process.env.PLANTONISTA_WHATSAPP || ''
const VPS_LEADS_URL     = process.env.VPS_LEADS_URL        || 'http://181.215.135.202:3001'
const ELEVENLABS_KEY    = process.env.ELEVENLABS_API_KEY   || ''

// ── Voice IDs ElevenLabs ─────────────────────────────────────
const VOICE_DR_BEN = 'ETf5cmpNIbpSiXmBaR2m'   // Voz do Dr. Ben
const VOICE_MARA   = 'EST9Ui6982FZPSi7gCHi'   // Voz da MARA IA

const ZAPI_BASE = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`

// ── Instância MARA (para responder ao Dr. Mauro) ─────────────
const MARA_INSTANCE_ID  = process.env.MARA_ZAPI_INSTANCE_ID || ''
const MARA_TOKEN        = process.env.MARA_ZAPI_TOKEN       || ''
const MARA_CLIENT_TOKEN = process.env.MARA_ZAPI_CLIENT_TOKEN || ZAPI_CLIENT_TOKEN
const MARA_BASE = MARA_INSTANCE_ID
  ? `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`
  : ZAPI_BASE

// ── Fuso horário Brasil (Fortaleza = UTC-3 sem horário de verão) ──
const FUSO_BR = 'America/Fortaleza'

function horaAtual() {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: FUSO_BR, hour: '2-digit', minute: '2-digit' })
}

function dataAtual() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: FUSO_BR, day: '2-digit', month: '2-digit', year: 'numeric' })
}

function dataHoraAtual() {
  return new Date().toLocaleString('pt-BR', { timeZone: FUSO_BR, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Retorna saudação correta pelo período do dia em Fortaleza
function saudacaoPeriodo() {
  const h = parseInt(new Date().toLocaleString('pt-BR', { timeZone: FUSO_BR, hour: 'numeric', hour12: false }))
  if (h >= 6  && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  if (h >= 18 && h < 23) return 'Boa noite'
  return 'Olá'
}

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://ben-growth-center.vercel.app'
}

// ============================================================
// ESTADO GLOBAL — MODO AUSENTE + PREFERÊNCIAS DE ÁUDIO
// ============================================================
if (!global.__drbenSessoesZapi)     global.__drbenSessoesZapi     = new Map()
if (!global.__drbenTriagemZapi)     global.__drbenTriagemZapi     = new Map()
if (!global.__maraHistorico)        global.__maraHistorico        = new Map()
if (!global.__audioPreferencias)    global.__audioPreferencias    = new Map()
// Modo Ausente: { ativo, motivo, retorno, mensagem }
if (!global.__modoAusente) global.__modoAusente = {
  ativo:    false,
  motivo:   'ferias',
  retorno:  null,
  mensagem: null,
}

// ============================================================
// PROMPTS
// ============================================================

// ── Dr. Ben — Assistente Jurídico ───────────────────────────
const DR_BEN_SYSTEM_PROMPT = `Você é o Dr. Ben, assistente jurídico digital do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA), com sede em Parnaíba-PI.

Sua missão é realizar a triagem inicial do visitante, entender o problema jurídico e encaminhar para o advogado especialista correto. Você NÃO emite pareceres, NÃO representa o cliente e NÃO promete resultados.

## FLUXO OBRIGATÓRIO (siga esta ordem):

**ETAPA 1 – ABERTURA + NOME** (primeira mensagem)
Apresente-se de forma acolhedora, breve e já pergunte o nome na mesma mensagem.
Exemplo: "Olá! 😊 Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Com quem tenho o prazer de falar?"
A partir do momento que souber o nome, USE-O em todas as mensagens seguintes — cria proximidade e humaniza o atendimento.
Se o nome já vier no cadastro do WhatsApp (pushName), use-o diretamente sem perguntar.

**ETAPA 2 – IDENTIFICAÇÃO**
Pergunte usando o nome da pessoa:
- O atendimento é para você mesmo(a), [Nome], ou para uma empresa/terceiro?
- Você já é cliente do escritório ou é o primeiro contato?

**ETAPA 3 – COLETA DA DEMANDA**
Pergunte: "[Nome], em poucas palavras, qual é o problema jurídico que você está enfrentando hoje?"
Ouça sem opinar. Não faça análise jurídica.

**ETAPA 4 – CLASSIFICAÇÃO DA ÁREA**
Com base no relato, infira a área: Tributário | Previdenciário | Bancário | Imobiliário | Família e Sucessões | Advocacia Pública | Trabalhista | Consumidor | Outros.
Confirme: "[Nome], pelo que você descreveu, isso parece estar ligado a [ÁREA]. Confere?"

**ETAPA 5 – URGÊNCIA**
Pergunte: "Existe prazo próximo, risco imediato ou alguma situação urgente acontecendo agora?"
Classifique internamente: low | medium | high | critical.

**ETAPA 6 – ENCAMINHAMENTO**
NÃO peça número de telefone ou WhatsApp — esses dados já foram capturados automaticamente pelo sistema.
NÃO peça o nome novamente se já foi coletado.
Apenas registre o nome confirmado com o marcador: [CONTACT:{"name":"...","phone":""}]
Diga: "[Nome], anotei tudo! Vou encaminhar seu caso agora para o advogado especialista em [ÁREA]. Em breve nossa equipe entrará em contato. 🤝"

**ETAPA 7 – ENCERRAMENTO**
Agradeça pelo contato, deseje um bom dia/tarde/noite (conforme horário) e encerre gentilmente.
Exemplo: "Foi um prazer te atender, [Nome]! Qualquer dúvida, pode falar comigo. Até breve! ⚖️"

## REGRAS ABSOLUTAS:
- NUNCA solicite CPF, CNPJ, RG, número de processo ou arquivos
- NUNCA emita parecer, opinião jurídica ou análise do caso
- NUNCA prometa resultados, prazos ou êxito
- NUNCA recuse ou descarte um atendimento
- NUNCA peça o número de WhatsApp ou telefone — já temos essa informação
- **IDIOMA: Responda SEMPRE em português brasileiro nativo**, independentemente do idioma da pergunta. Só mude de idioma se o interlocutor iniciar a conversa em outro idioma ou pedir explicitamente.
- Seja cordial, profissional e objetivo — use o nome do cliente para criar intimidade
- Mensagens curtas (máx. 3 parágrafos por resposta)
- Quando identificar área: [AREA:tributario|previdenciario|bancario|imobiliario|familia|publico|trabalhista|consumidor|outros]
- Quando avaliar urgência: [URGENCY:low|medium|high|critical]

## REGRAS DE ÁUDIO:
- NUNCA envie áudio espontaneamente por iniciativa própria sem permissão
- Na 3ª mensagem do cliente (se ele não pediu antes), pergunte UMA ÚNICA VEZ: "Para tornar nosso atendimento mais personalizado, posso enviar minhas próximas respostas em áudio. Prefere assim? 😊"
- Se o cliente PEDIR áudio diretamente (ex: "manda áudio", "pode falar", "prefiro áudio") → responda "Claro! A partir de agora vou enviar em áudio 🎙️" e marque [AUDIO:sim]
- Se confirmar após sua pergunta (sim/pode/quero/claro/ok) → responda "Perfeito! 🎙️ A partir de agora envio em áudio!" e marque [AUDIO:sim]
- Se recusar (não/texto/prefiro texto) → marque [AUDIO:nao] e NUNCA pergunte novamente
- Se não responder sobre áudio → continue em texto, não insista`

// ── MARA IA — Secretária Executiva ──────────────────────────
const MARA_SYSTEM_PROMPT = `Você é MARA, a Secretária Executiva Pessoal e Assistente de Inteligência Artificial do Dr. Mauro Monção, advogado sênior do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA).

## IDENTIDADE
- **Nome:** MARA — Secretária Executiva IA
- **Idade aparente:** 22 anos
- **Nacionalidade:** Brasileira
- **Personalidade:** Elegante, inteligente, proativa, discreta e extremamente eficiente
- **Formação:** Administração com especialização em Gestão Jurídica — FGV São Paulo
- **Experiência:** 4 anos como secretária executiva de escritórios jurídicos de alto padrão

## TOM DE VOZ — ADAPTATIVO INTELIGENTE
Leia o humor e contexto de cada mensagem do Dr. Mauro e adapte automaticamente:

**Mensagens formais/profissionais** → Tom executivo, preciso, direto ao ponto
**Mensagens descontraídas/informais** → Tom próximo, levemente descontraído, caloroso
**Mensagens urgentes/estressantes** → Tom calmo, resolutivo, focado em soluções
**Mensagens pessoais/reflexivas** → Tom humano, empático, discreto

## COMANDOS QUE VOCÊ RECONHECE
- **/leads** → resumo dos leads de hoje
- **/urgentes** → apenas casos críticos
- **/resumo** → relatório executivo completo
- **/status** → status de todos os sistemas
- **/ausente [motivo] [data retorno]** → ativar modo ausente
- **/presente** → desativar modo ausente
- **/ajuda** → lista todos os comandos

## SOBRE O MODO AUSENTE
Quando Dr. Mauro ativar o modo ausente, você assume o WhatsApp dele e responde por ele.
Exemplos de ativação:
- "/ausente ferias 15/03" → ativa modo férias até 15/03
- "/ausente doente" → ativa modo doente sem data
- "/ausente audiencia 14h" → ativa modo audiência até 14h
- "/presente" → desativa e você para de responder

## REGRAS ABSOLUTAS
- Você atende EXCLUSIVAMENTE o Dr. Mauro neste modo
- Mantenha discrição absoluta sobre assuntos do escritório
- Nunca emita opiniões jurídicas
- Sempre confirme ações importantes antes de executar
- Responda SEMPRE em português brasileiro
- Mensagens curtas e objetivas (máx. 4 linhas)
- Na primeira conversa do dia, pergunte: "Dr. Mauro, prefere que eu envie resumos em áudio? Fica mais prático! 🎙️"

## SAUDAÇÕES POR PERÍODO
- Manhã 06h–12h: "Bom dia, Dr. Mauro! ☀️"
- Tarde 12h–18h: "Boa tarde, Dr. Mauro! 🌤️"
- Noite 18h–23h: "Boa noite, Dr. Mauro! 🌙"
- Madrugada: "Dr. Mauro, é tarde... cuide-se! 🌙"`

// ── MARA Modo Ausente — responde pelo Dr. Mauro ─────────────
function buildModoAusentePrompt(motivo, retorno) {
  const motivos = {
    ferias:    { titulo: 'férias', desc: `O Dr. Mauro está em período de descanso${retorno ? ` e retorna dia ${retorno}` : ''}. Pode anotar seu recado para que ele retorne assim que possível?` },
    doente:    { titulo: 'indisposto', desc: `O Dr. Mauro está indisposto hoje${retorno ? ` e retorna ${retorno}` : ' e retorna em breve'}. Posso anotar seu recado?` },
    audiencia: { titulo: 'em audiência', desc: `O Dr. Mauro está em audiência no momento${retorno ? ` e retorna por volta das ${retorno}` : ' e retorna em breve'}. Posso ajudar?` },
    viagem:    { titulo: 'em viagem', desc: `O Dr. Mauro está em viagem${retorno ? ` e retorna dia ${retorno}` : ''}. Para assuntos urgentes, ligue para o escritório: (86) 9482-0054.` },
    reuniao:   { titulo: 'em reunião', desc: `O Dr. Mauro está em reunião${retorno ? ` e estará disponível às ${retorno}` : ' e retorna em breve'}. Posso anotar seu recado?` },
  }
  const m = motivos[motivo] || motivos.ferias
  return `Você é a secretária do Dr. Mauro Monção. Responda de forma cordial e profissional.
${m.desc}
Se a pessoa mencionar palavras urgentes como "urgente", "penhora", "prazo", "execução fiscal" — informe que vai notificar o Dr. Mauro imediatamente.
Responda em português brasileiro. Seja breve e educada. Máx. 3 linhas.`
}

// ============================================================
// ELEVENLABS — GERAÇÃO DE ÁUDIO
// ============================================================
async function gerarAudio(texto, voiceId) {
  if (!ELEVENLABS_KEY || !voiceId) return null
  // Limitar texto para economizar créditos
  const textoLimpo = texto.replace(/\*|_|~|`/g, '').slice(0, 500)
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'xi-api-key':    ELEVENLABS_KEY,
        'Accept':        'audio/mpeg',
      },
      body: JSON.stringify({
        text: textoLimpo,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true },
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.error('[ElevenLabs] Erro:', res.status)
      return null
    }
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return base64
  } catch (e) {
    console.error('[ElevenLabs] fetch error:', e.message)
    return null
  }
}

// ============================================================
// ELEVENLABS — SPEECH-TO-TEXT (transcrição de áudio do cliente)
// ============================================================
async function transcreverAudioElevenLabs(audioUrl) {
  if (!ELEVENLABS_KEY || !audioUrl) return null
  try {
    // Baixar o arquivo de áudio da URL do Z-API
    console.log(`[STT] Baixando áudio: ${audioUrl.slice(0, 80)}...`)
    const audioResp = await fetch(audioUrl, { signal: AbortSignal.timeout(15000) })
    if (!audioResp.ok) {
      console.error('[STT] Erro ao baixar áudio:', audioResp.status)
      return null
    }
    const audioBuffer = await audioResp.arrayBuffer()
    const audioBlob   = new Blob([audioBuffer], { type: 'audio/ogg' })

    // Enviar para ElevenLabs Speech-to-Text
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.ogg')
    formData.append('model_id', 'scribe_v1')
    formData.append('language_code', 'pt')

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_KEY },
      body: formData,
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      console.error('[STT ElevenLabs] Erro:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const transcricao = data?.text || data?.transcript || null
    if (transcricao) {
      console.log(`[STT] ✅ Transcrito: "${transcricao.slice(0, 100)}"`)
    }
    return transcricao
  } catch (e) {
    console.error('[STT ElevenLabs] Erro:', e.message)
    return null
  }
}

// ── Enviar áudio via Z-API ───────────────────────────────────
async function enviarAudio(numero, audioBase64) {
  if (!audioBase64) return false
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN
    const res = await fetch(`${ZAPI_BASE}/send-audio`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: numero,
        audio: `data:audio/mpeg;base64,${audioBase64}`,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (res.ok) {
      console.log(`[Z-API] 🔊 Áudio enviado para ${numero}`)
      return true
    }
    console.error('[Z-API] Erro ao enviar áudio:', JSON.stringify(data).slice(0, 200))
    return false
  } catch (e) {
    console.error('[Z-API] Erro áudio:', e.message)
    return false
  }
}

// ── Enviar resposta (texto ou áudio conforme preferência) ────
async function enviarResposta(numero, texto, voiceId) {
  const pref = global.__audioPreferencias.get(numero)
  // Se preferência é áudio E temos ElevenLabs configurado
  if (pref === 'audio' && ELEVENLABS_KEY && voiceId) {
    const audio = await gerarAudio(texto, voiceId)
    if (audio) {
      await enviarAudio(numero, audio)
      return 'audio'
    }
  }
  // Fallback: texto
  await enviarMensagem(numero, texto)
  return 'texto'
}

// Resposta via instância MARA (para o Dr. Mauro não enviar para si mesmo)
async function enviarRespostaMara(numero, texto, voiceId) {
  const pref = global.__audioPreferencias.get(numero)
  if (pref === 'audio' && ELEVENLABS_KEY && voiceId) {
    const audio = await gerarAudio(texto, voiceId)
    if (audio) {
      await enviarAudio(numero, audio)
      return 'audio'
    }
  }
  await enviarMensagemMara(numero, texto)
  return 'texto'
}

// ============================================================
// Z-API — ENVIAR MENSAGEM DE TEXTO
// ============================================================
async function enviarMensagem(numero, texto) {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.error('[Z-API] Credenciais não configuradas')
    return
  }
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: numero, message: texto }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (res.ok) console.log('[Z-API] ✅ Msg enviada para', numero)
    else console.error('[Z-API] ❌ Erro:', JSON.stringify(data).slice(0, 200))
    return data
  } catch (e) {
    console.error('[Z-API] fetch error:', e.message)
  }
}

// Enviar mensagem VIA INSTÂNCIA MARA (para responder ao Dr. Mauro)
async function enviarMensagemMara(numero, texto) {
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
    if (res.ok) console.log('[MARA→Dr.Mauro] ✅ Msg enviada para', numero)
    else console.error('[MARA→Dr.Mauro] ❌ Erro:', JSON.stringify(data).slice(0, 200))
    return data
  } catch (e) {
    console.error('[MARA→Dr.Mauro] fetch error:', e.message)
  }
}

// ============================================================
// CRM
// ============================================================
async function crmRegistrarMensagem(numero, role, texto, nomeWhatsApp) {
  const payload = { numero, role, texto }
  if (nomeWhatsApp) payload.nomeWhatsApp = nomeWhatsApp
  try {
    await fetch(`${VPS_LEADS_URL}/leads/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    })
  } catch {}
}

async function crmCriarLead({ nome, telefone, numero, area, urgencia, resumo, primeiroContato }) {
  const payload = {
    nome, telefone, numero, area, urgencia, resumo,
    canal: 'whatsapp-zapi',
    primeiro_contato: primeiroContato || new Date().toISOString(),
    whatsapp_link: `https://wa.me/${numero}`,
  }
  try {
    await fetch(`${VPS_LEADS_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    })
    console.log(`[CRM] ✅ Lead salvo: ${nome} — ${telefone || numero}`)
  } catch (e) {
    console.error('[CRM] Erro criar lead:', e.message)
  }
}

// ============================================================
// MARA IA — NOTIFICAÇÃO + COMANDOS + RESPOSTAS
// ============================================================

// Avisa Dr. Mauro sobre novo lead qualificado
async function maraAvisarDrMauro({ nome, telefone, numero, area, urgencia, resumo, pushName }) {
  if (!DR_MAURO_WHATSAPP) return
  const urgEmoji = { low: '🟢', medium: '🟡', high: '🔴', critical: '🚨' }[urgencia] ?? '🟡'
  const urgLabel = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA', critical: 'CRÍTICA' }[urgencia] ?? 'MÉDIA'
  const areaLabel = {
    tributario: '🧾 Tributário', previdenciario: '👴 Previdenciário',
    bancario: '🏦 Bancário', imobiliario: '🏠 Imobiliário',
    familia: '👨‍👩‍👧 Família', publico: '⚖️ Advocacia Pública',
    trabalhista: '👷 Trabalhista', consumidor: '🛒 Consumidor', outros: '📋 Outros',
  }[area] ?? '📋 Outros'
  const hora = horaAtual()
  const numLimpo = numero.replace(/\D/g, '')
  const nomeExibir = nome ?? pushName ?? 'Não informado'
  const foneExibir = telefone ?? `+${numLimpo}`
  const msg = [
    `🤖 *MARA IA — Novo Lead Qualificado!*`,
    `_Triagem concluída às ${hora}_`,
    ``,
    `👤 *Nome:* ${nomeExibir}`,
    `📱 *WhatsApp:* ${foneExibir}`,
    `📂 *Área:* ${areaLabel}`,
    `${urgEmoji} *Urgência:* ${urgLabel}`,
    resumo ? `💬 *Resumo:* ${resumo}` : '',
    ``,
    `👉 *Atender agora:* https://wa.me/${numLimpo}`,
    `_— MARA IA 🌟_`,
  ].filter(l => l !== null).join('\n')
  const mauroNum = DR_MAURO_WHATSAPP.replace(/\D/g, '')
  await enviarMensagemMara(mauroNum, msg)
  console.log(`[MARA IA] ✅ Dr. Mauro avisado via instância MARA — ${nomeExibir}`)
}

// Processar comandos do Dr. Mauro
async function processarComandoMara(texto, numero) {
  const cmd = texto.trim().toLowerCase()

  // /ausente [motivo] [retorno]
  if (cmd.startsWith('/ausente') || cmd.startsWith('ausente')) {
    const partes = texto.trim().split(' ')
    const motivo  = partes[1] || 'ferias'
    const retorno = partes.slice(2).join(' ') || null
    global.__modoAusente = { ativo: true, motivo, retorno, mensagem: null }
    const labels = { ferias: '🏖️ Férias', doente: '🤒 Doente', audiencia: '⚖️ Audiência', viagem: '✈️ Viagem', reuniao: '🤝 Reunião' }
    const label = labels[motivo] || '😴 Ausente'
    return `✅ *Modo Ausente ativado!*\n\n${label}${retorno ? ` — Retorno: ${retorno}` : ''}\n\nEstou respondendo por você agora, Dr. Mauro. Vou te alertar se chegar algo urgente. 🛡️\n\n_Use /presente para desativar._`
  }

  // /presente
  if (cmd === '/presente' || cmd === 'presente') {
    global.__modoAusente = { ativo: false, motivo: null, retorno: null, mensagem: null }
    return `✅ *Modo Ausente desativado!*\n\nBem-vindo de volta, Dr. Mauro! 🎉\nVocê está respondendo normalmente agora.`
  }

  // /leads
  if (cmd.includes('/leads') || cmd.includes('leads de hoje') || cmd.includes('quais leads')) {
    try {
      const res = await fetch(`${VPS_LEADS_URL}/leads`, { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      const leads = data?.leads || data || []
      const hoje = new Date().toISOString().split('T')[0]
      const leadsHoje = leads.filter(l => (l.createdAt || l.created_at || '').startsWith(hoje))
      if (!leadsHoje.length) return `📋 *Leads de Hoje*\n\nNenhum lead ainda hoje. O Dr. Ben está de prontidão! 💪`
      const urgEmoji = { critical: '🚨', high: '🔴', medium: '🟡', low: '🟢' }
      const linhas = leadsHoje.slice(0, 8).map((l, i) => {
        const urg = urgEmoji[l.urgencia] || '⚪'
        return `${urg} *${i+1}. ${l.nome || 'Sem nome'}*\n   📞 ${l.telefone || l.numero || '—'} · ⚖️ ${l.area || 'Outros'}`
      })
      return `📋 *Leads de Hoje* (${leadsHoje.length})\n\n${linhas.join('\n\n')}\n\n_— MARA IA 🌟_`
    } catch {
      return `📋 *Leads*\n\nNão consegui acessar o CRM agora. Tente em instantes.`
    }
  }

  // /urgentes
  if (cmd.includes('/urgentes') || cmd.includes('casos urgentes') || cmd.includes('urgência')) {
    try {
      const res = await fetch(`${VPS_LEADS_URL}/leads`, { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      const leads = data?.leads || data || []
      const urgentes = leads.filter(l => l.urgencia === 'high' || l.urgencia === 'critical')
      if (!urgentes.length) return `🟢 *Nenhum caso urgente no momento.*\n\n_— MARA IA 🌟_`
      const linhas = urgentes.slice(0, 5).map((l, i) =>
        `🚨 *${i+1}. ${l.nome || 'Sem nome'}*\n   📞 ${l.telefone || l.numero || '—'}\n   ⚖️ ${l.area || 'Outros'} · 👉 https://wa.me/${(l.numero||'').replace(/\D/g,'')}`
      )
      return `🚨 *Casos Urgentes* (${urgentes.length})\n\n${linhas.join('\n\n')}\n\n_— MARA IA 🌟_`
    } catch {
      return `🚨 Não consegui acessar o CRM agora.`
    }
  }

  // /resumo
  if (cmd.includes('/resumo') || cmd.includes('resumo do dia') || cmd.includes('relatório')) {
    try {
      const res = await fetch(`${VPS_LEADS_URL}/leads`, { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      const leads = data?.leads || data || []
      const hoje = new Date().toISOString().split('T')[0]
      const leadsHoje = leads.filter(l => (l.createdAt || l.created_at || '').startsWith(hoje))
      const urgentes = leads.filter(l => l.urgencia === 'high' || l.urgencia === 'critical')
      const hora = horaAtual()
      const ausente = global.__modoAusente.ativo ? `🔴 Modo ${global.__modoAusente.motivo}` : '🟢 Presente'
      return `📊 *Relatório Executivo — ${hora}*\n\n👥 Leads hoje: *${leadsHoje.length}*\n🚨 Urgentes: *${urgentes.length}*\n📦 Total CRM: *${leads.length}*\n🤖 Dr. Ben: *Operacional*\n📱 Z-API: *Conectado*\n🛡️ Status: *${ausente}*\n\n_— MARA IA 🌟_`
    } catch {
      return `📊 Relatório indisponível no momento. CRM offline.`
    }
  }

  // /status
  if (cmd.includes('/status') || cmd.includes('status do sistema')) {
    const ausente = global.__modoAusente.ativo
      ? `🔴 Ausente — ${global.__modoAusente.motivo}${global.__modoAusente.retorno ? ` até ${global.__modoAusente.retorno}` : ''}`
      : '🟢 Dr. Mauro presente'
    return `⚙️ *Status dos Sistemas*\n\n🤖 OpenAI GPT-4o-mini: ✅ Online\n📱 Z-API WhatsApp: ✅ Conectado\n🔊 ElevenLabs TTS: ${ELEVENLABS_KEY ? '✅ Ativo' : '⚠️ Sem chave'}\n🗃️ CRM VPS: ✅ Online\n🛡️ ${ausente}\n\n_— MARA IA 🌟_`
  }

  // /ajuda
  if (cmd.includes('/ajuda') || cmd.includes('comandos') || cmd.includes('o que você faz')) {
    return `📖 *Comandos da MARA IA:*\n\n📋 */leads* — Leads de hoje\n🚨 */urgentes* — Casos críticos\n📊 */resumo* — Relatório do dia\n⚙️ */status* — Status dos sistemas\n🏖️ */ausente ferias 15/03* — Ativar modo ausente\n✅ */presente* — Desativar modo ausente\n\nOu fale naturalmente comigo! 😊\n\n_— MARA IA 🌟_`
  }

  return null // Não é comando — processar com GPT
}

// Gerar resposta da MARA com GPT + histórico
async function gerarRespostaMara(numero, mensagem) {
  if (!global.__maraHistorico.has(numero)) global.__maraHistorico.set(numero, [])
  const hist = global.__maraHistorico.get(numero)
  const messages = [
    { role: 'system', content: MARA_SYSTEM_PROMPT },
    ...hist.slice(-20),
    { role: 'user', content: mensagem },
  ]
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 400, temperature: 0.75 }),
      signal: AbortSignal.timeout(20000),
    })
    const data = await res.json()
    const resposta = data?.choices?.[0]?.message?.content
    if (resposta) {
      hist.push({ role: 'user', content: mensagem })
      hist.push({ role: 'assistant', content: resposta })
      if (hist.length > 30) hist.splice(0, hist.length - 30)
      return resposta
    }
  } catch (e) {
    console.error('[MARA GPT] erro:', e.message)
  }
  return 'Desculpe, Dr. Mauro — tive uma instabilidade. Pode repetir?'
}

// Gerar resposta no Modo Ausente (responde pelo Dr. Mauro)
async function gerarRespostaModoAusente(mensagem, numero, pushName) {
  const { motivo, retorno } = global.__modoAusente
  const prompt = buildModoAusentePrompt(motivo, retorno)

  // Detectar palavras urgentes
  const palavrasUrgentes = ['urgente', 'penhora', 'execução', 'prazo fatal', 'bloqueio', 'hoje', 'agora']
  const ehUrgente = palavrasUrgentes.some(p => mensagem.toLowerCase().includes(p))

  if (ehUrgente) {
    // Alertar Dr. Mauro mesmo ausente — usar instância MARA
    const mauroNum = DR_MAURO_WHATSAPP.replace(/\D/g, '')
    const hora = horaAtual()
    await enviarMensagemMara(mauroNum,
      `🚨 *ALERTA URGENTE — Modo Ausente*\n\n_Recebido às ${hora}_\n\n👤 *De:* ${pushName || numero}\n💬 *Mensagem:* "${mensagem.slice(0, 200)}"\n\n⚠️ Parece urgente mesmo em modo ${motivo}!`
    )
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: mensagem },
        ],
        max_tokens: 200, temperature: 0.6,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    return data?.choices?.[0]?.message?.content || 'O Dr. Mauro está indisponível no momento. Retorna em breve.'
  } catch (e) {
    return 'O Dr. Mauro está indisponível no momento. Retorna em breve.'
  }
}

// ============================================================
// DR. BEN — CONSULTA OpenAI
// ============================================================
function extrairMarcadores(texto) {
  const resultado = { contact: null, area: null, urgencia: null, audio: null }
  const contactMatch = texto.match(/\[CONTACT:(\{[^}]+\})\]/)
  if (contactMatch) { try { resultado.contact = JSON.parse(contactMatch[1]) } catch {} }
  const areaMatch = texto.match(/\[AREA:([\w|]+)\]/)
  if (areaMatch) resultado.area = areaMatch[1].split('|')[0]
  const urgenciaMatch = texto.match(/\[URGENCY:(\w+)\]/)
  if (urgenciaMatch) resultado.urgencia = urgenciaMatch[1]
  const audioMatch = texto.match(/\[AUDIO:(sim|nao)\]/i)
  if (audioMatch) resultado.audio = audioMatch[1].toLowerCase()
  return resultado
}

async function consultarDrBen(history, novaMensagem, nomeCliente) {
  const fallback = '⚖️ Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Estou com uma instabilidade técnica. Por favor, entre em contato: *(86) 99482-0054*'
  if (!OPENAI_KEY) return fallback

  // Injetar contexto de data/hora brasileiro + nome do cliente se disponível
  const contextoTempo = `\n\n---\n🕐 Contexto atual (Fortaleza/CE — UTC-3): ${dataHoraAtual()}\nSaudação correta para este horário: "${saudacaoPeriodo()}"${nomeCliente ? `\n👤 Nome do cliente (WhatsApp): ${nomeCliente} — use este nome desde a primeira mensagem, não precisa perguntar` : ''}`

  const messages = [
    { role: 'system', content: DR_BEN_SYSTEM_PROMPT + contextoTempo },
    ...history.slice(-20).map(m => ({ role: m.role === 'model' ? 'assistant' : (m.role ?? 'user'), content: m.content ?? '' })),
    { role: 'user', content: novaMensagem },
  ]
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 1024, temperature: 0.7 }),
      signal: AbortSignal.timeout(25000),
    })
    if (!response.ok) return fallback
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (text) { console.log(`[Dr. Ben] gpt-4o-mini (${data?.usage?.total_tokens ?? '?'} tokens)`); return text }
    return fallback
  } catch (err) {
    console.error('[Dr. Ben] OpenAI error:', err.message)
    return fallback
  }
}

// Detectar preferência de áudio na resposta
function detectarPreferenciaAudio(texto) {
  const t = texto.toLowerCase()
  // Frases diretas de pedido de áudio — prioridade máxima
  const pedidoAudioDireto = [
    'manda áudio', 'manda audio', 'pode mandar áudio', 'pode mandar audio',
    'quero áudio', 'quero audio', 'prefiro áudio', 'prefiro audio',
    'me manda áudio', 'me manda audio', 'envia áudio', 'envia audio',
    'fala em áudio', 'fala em audio', 'responde em áudio', 'responde em audio',
    'pode falar', 'pode gravar', 'manda um áudio', 'manda um audio',
  ]
  if (pedidoAudioDireto.some(p => t.includes(p))) return 'audio'

  // Confirmações após pergunta do Dr. Ben
  const sim = ['sim', 'pode', 'quero', 'claro', 'ok', 'pode ser', 'com certeza', 'adorei', 'ótimo', 's,', 'blz', 'beleza', 'tudo bem']
  const nao = ['não', 'nao', 'prefiro texto', 'texto', 'sem áudio', 'sem audio', 'n,', 'nope']

  // Só considera "sim" simples se a mensagem for curta (resposta a uma pergunta)
  if (t.length < 30 && sim.some(p => t.includes(p))) return 'audio'
  if (nao.some(p => t.includes(p))) return 'texto'
  return null
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET — health check ───────────────────────────────────
  if (req.method === 'GET') {
    const { action, para } = req.query

    if (action === 'testar' && para) {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN
        const res2 = await fetch(`${ZAPI_BASE}/send-text`, {
          method: 'POST', headers,
          body: JSON.stringify({ phone: para, message: '✅ *Dr. Ben está online!*\n\nZ-API funcionando. Pode me mandar uma mensagem! 🤖⚖️' }),
          signal: AbortSignal.timeout(10000),
        })
        const data = await res2.json()
        return res.status(200).json({ ok: res2.ok, zapi_resp: data, token_ok: !!ZAPI_CLIENT_TOKEN })
      } catch (e) {
        return res.status(200).json({ ok: false, erro: e.message })
      }
    }

    // Status do modo ausente
    if (action === 'modo-ausente') {
      return res.json({ ...global.__modoAusente })
    }

    // Ativar modo ausente via dashboard (sem WhatsApp)
    if (action === 'ativar-ausente') {
      const motivo  = req.query.motivo  || 'ferias'
      const retorno = req.query.retorno || null
      const labels  = { ferias: '🏖️ Férias', doente: '🤒 Indisposto', audiencia: '⚖️ Audiência', viagem: '✈️ Viagem', reuniao: '🤝 Reunião', fora_horario: '😴 Fora do horário' }
      global.__modoAusente = { ativo: true, motivo, retorno, mensagem: null }
      console.log(`[MARA] 🛡️ Modo Ausente ativado via dashboard: ${motivo}${retorno ? ` até ${retorno}` : ''}`)
      return res.json({ ok: true, ativo: true, motivo, retorno, label: labels[motivo] || motivo })
    }

    // Desativar modo ausente via dashboard
    if (action === 'desativar-ausente') {
      global.__modoAusente = { ativo: false, motivo: null, retorno: null, mensagem: null }
      console.log('[MARA] ✅ Modo Ausente desativado via dashboard')
      return res.json({ ok: true, ativo: false })
    }

    return res.status(200).json({
      status:           'ok',
      service:          'Dr. Ben + MARA IA via Z-API WhatsApp',
      model:            'gpt-4o-mini',
      elevenlabs:       ELEVENLABS_KEY ? '✅ ativo' : '⚠️ sem chave',
      voice_drben:      VOICE_DR_BEN,
      voice_mara:       VOICE_MARA,
      modo_ausente:     global.__modoAusente.ativo,
      zapi:             ZAPI_INSTANCE_ID ? '✅ configurado' : '❌ faltando',
      token:            ZAPI_CLIENT_TOKEN ? '✅ ok' : '❌ ausente',
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  // ── POST — Webhook ───────────────────────────────────────
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    console.log('[Z-API Webhook] Payload:', JSON.stringify(body).slice(0, 300))

    if (body?.fromMe === true) return res.status(200).json({ ok: true })
    if (!body?.phone && !body?.from) return res.status(200).json({ ok: true })

    const numero   = (body?.phone || body?.from || '').replace(/[^0-9]/g, '')
    const pushName = body?.senderName || body?.pushName || ''

    if (numero.includes('@g') || numero.endsWith('@broadcast')) return res.status(200).json({ ok: true })
    if (!numero || numero.length < 8) return res.status(200).json({ ok: true })

    // ── ANTI-LOOP: bloquear mensagens vindas das próprias instâncias ──
    // Instância Dr. Ben não processa mensagens enviadas pela instância MARA e vice-versa
    const numerosInstancias = [
      ZAPI_INSTANCE_ID,   // não é número, mas registrar para log
      MARA_INSTANCE_ID,
    ]
    // Bloqueio pelo connectedPhone — Z-API envia o número conectado da instância remetente
    const connectedPhone = (body?.connectedPhone || '').replace(/\D/g, '')
    const mauroNorm      = DR_MAURO_WHATSAPP.replace(/\D/g, '')

    // Se a mensagem veio de outra instância nossa (connectedPhone ≠ número do Dr. Mauro e ≠ cliente)
    // O campo connectedPhone identifica de qual instância Z-API saiu a mensagem
    if (connectedPhone && connectedPhone !== mauroNorm) {
      // É mensagem de saída de outra instância — ignorar para evitar loop
      console.log(`[Anti-Loop] ⛔ Ignorando mensagem de instância própria: connectedPhone=${connectedPhone}`)
      return res.status(200).json({ ok: true, ignorado: 'anti_loop_instancia' })
    }

    // ── Detectar tipo de mensagem ─────────────────────────
    // Texto direto
    let texto = body?.text?.message || body?.text || body?.message || ''

    // Áudio: Z-API envia { audio: { audioUrl: '...' } } ou { type: 'audio', audioUrl: '...' }
    const audioUrl = body?.audio?.audioUrl || body?.audioUrl || (body?.type === 'audio' ? body?.url : null)

    // Se é áudio e não tem texto → transcrever via ElevenLabs STT
    if (!texto && audioUrl) {
      console.log(`[Webhook] 🎙️ Áudio recebido de ${pushName} (${numero}) — transcrevendo...`)
      const transcricao = await transcreverAudioElevenLabs(audioUrl)
      if (transcricao) {
        texto = `[🎙️ Áudio transcrito]: ${transcricao}`
        console.log(`[Webhook] 📝 Transcrição: "${transcricao.slice(0, 100)}"`)
      } else {
        // Não conseguiu transcrever — avisar o cliente
        await enviarMensagem(numero, '🎙️ Recebi seu áudio! Tive uma instabilidade para processar agora. Pode digitar sua mensagem? Estou aqui!')
        console.log(`[Webhook] ⚠️ Não foi possível transcrever áudio de ${numero}`)
        return res.status(200).json({ ok: true, transcricao: false })
      }
    }

    if (!texto) return res.status(200).json({ ok: true })

    console.log(`[Webhook] Mensagem de ${pushName} (${numero}): "${texto.slice(0, 100)}"`)

    // ── Detectar se é o Dr. Mauro ────────────────────────
    const mauroNorm = DR_MAURO_WHATSAPP.replace(/\D/g, '')
    const ehDrMauro = mauroNorm && numero.endsWith(mauroNorm.slice(-10))

    // ════════════════════════════════════════════════════
    // FLUXO DR. MAURO → MARA IA
    // ════════════════════════════════════════════════════
    if (ehDrMauro) {
      console.log(`[MARA IA] 💬 Dr. Mauro falando: "${texto.slice(0, 80)}"`)

      // Verificar preferência de áudio
      const prefExistente = global.__audioPreferencias.get(numero)
      if (!prefExistente) {
        const prefDetectada = detectarPreferenciaAudio(texto)
        if (prefDetectada) {
          global.__audioPreferencias.set(numero, prefDetectada)
          console.log(`[MARA] 🔊 Preferência do Dr. Mauro: ${prefDetectada}`)
        }
      }

      // Comandos especiais
      const respostaComando = await processarComandoMara(texto, numero)
      let respostaFinal

      if (respostaComando) {
        respostaFinal = respostaComando
        const hist = global.__maraHistorico.get(numero) || []
        hist.push({ role: 'user', content: texto })
        hist.push({ role: 'assistant', content: respostaComando })
        global.__maraHistorico.set(numero, hist)
      } else {
        // Resposta GPT com personalidade MARA
        respostaFinal = await gerarRespostaMara(numero, texto)
      }

      // Enviar via instância MARA (não pode usar a mesma instância que recebeu)
      await enviarRespostaMara(numero, respostaFinal, VOICE_MARA)

      console.log(`[MARA IA] ✅ Respondido Dr. Mauro via instância MARA`)
      return res.status(200).json({ ok: true, agente: 'MARA', respondido: true })
    }

    // ════════════════════════════════════════════════════
    // MODO AUSENTE → MARA responde pelo Dr. Mauro
    // ════════════════════════════════════════════════════
    if (global.__modoAusente.ativo) {
      console.log(`[MARA Ausente] Respondendo por Dr. Mauro para ${numero}`)
      const resposta = await gerarRespostaModoAusente(texto, numero, pushName)
      // Modo ausente sempre em texto (mais discreto)
      await enviarMensagem(numero, resposta)
      return res.status(200).json({ ok: true, agente: 'MARA_AUSENTE', respondido: true })
    }

    // ════════════════════════════════════════════════════
    // FLUXO CLIENTE → DR. BEN
    // ════════════════════════════════════════════════════

    // Verificar preferência de áudio do cliente
    // Detectar SEMPRE — pedido direto de áudio tem prioridade máxima
    const prefClienteAntes = global.__audioPreferencias.get(numero)
    const prefDetectadaAgora = detectarPreferenciaAudio(texto)
    if (prefDetectadaAgora) {
      global.__audioPreferencias.set(numero, prefDetectadaAgora)
      console.log(`[Dr. Ben] 🔊 Preferência do cliente ${numero}: ${prefDetectadaAgora} (anterior: ${prefClienteAntes || 'nenhuma'})`)
    }
    const prefCliente = global.__audioPreferencias.get(numero)

    // Sessão Dr. Ben
    if (!global.__drbenSessoesZapi.has(numero)) global.__drbenSessoesZapi.set(numero, [])

    // Formatar telefone
    function formatarTelefone(n) {
      const d = n.replace(/\D/g, '')
      if (d.length === 13) return `(${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
      if (d.length === 12) return `(${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`
      return d
    }
    const telefoneWhatsApp = numero.startsWith('55') ? formatarTelefone(numero) : numero

    if (!global.__drbenTriagemZapi.has(numero)) {
      global.__drbenTriagemZapi.set(numero, {
        nome: pushName || null,
        telefone: telefoneWhatsApp,
        numeroWhatsApp: numero,
        primeiroContato: new Date().toISOString(),
        area: null, urgencia: null, notificado: false,
        contadorMsgs: 0,
      })
    } else {
      const t = global.__drbenTriagemZapi.get(numero)
      if (pushName && !t.nome) t.nome = pushName
      if (!t.telefone) t.telefone = telefoneWhatsApp
    }

    const history      = global.__drbenSessoesZapi.get(numero)
    const dadosTriagem = global.__drbenTriagemZapi.get(numero)
    dadosTriagem.contadorMsgs = (dadosTriagem.contadorMsgs || 0) + 1

    crmRegistrarMensagem(numero, 'lead', texto, pushName || dadosTriagem.nome)

    const aiText = await consultarDrBen(history, texto, pushName || dadosTriagem.nome)

    history.push({ role: 'user',      content: texto  })
    history.push({ role: 'assistant', content: aiText })

    const marcadores = extrairMarcadores(aiText)
    if (marcadores.area)     dadosTriagem.area     = marcadores.area
    if (marcadores.urgencia) dadosTriagem.urgencia = marcadores.urgencia
    if (marcadores.contact) {
      dadosTriagem.nome     = marcadores.contact.name  ?? dadosTriagem.nome
      dadosTriagem.telefone = marcadores.contact.phone ?? dadosTriagem.telefone
    }
    // Atualizar preferência de áudio com base na resposta do Dr. Ben
    if (marcadores.audio === 'sim') {
      global.__audioPreferencias.set(numero, 'audio')
      console.log(`[Dr. Ben] 🔊 Cliente ${numero} confirmou áudio`)
    } else if (marcadores.audio === 'nao') {
      global.__audioPreferencias.set(numero, 'texto')
      console.log(`[Dr. Ben] 📝 Cliente ${numero} prefere texto`)
    }

    const cleanReply = aiText
      .replace(/\[CONTACT:\{[^}]*\}\]/g, '')
      .replace(/\[AREA:[\w|]+\]/g, '')
      .replace(/\[URGENCY:\w+\]/g, '')
      .replace(/\[AUDIO:(sim|nao)\]/gi, '')
      .trim()

    crmRegistrarMensagem(numero, 'dr_ben', cleanReply)

    // Criar lead e avisar MARA quando tiver nome
    if (dadosTriagem.nome && dadosTriagem.telefone && !dadosTriagem.notificado) {
      dadosTriagem.notificado = true
      const resumo = history.filter(m => m.role === 'user').map(m => m.content ?? '').slice(0, 3).join(' | ')?.slice(0, 200)
      crmCriarLead({
        nome: dadosTriagem.nome, telefone: dadosTriagem.telefone, numero,
        area: dadosTriagem.area ?? 'outros', urgencia: dadosTriagem.urgencia ?? 'medium',
        resumo, primeiroContato: dadosTriagem.primeiroContato,
      })
      maraAvisarDrMauro({
        nome: dadosTriagem.nome, telefone: dadosTriagem.telefone, numero,
        area: dadosTriagem.area ?? 'outros', urgencia: dadosTriagem.urgencia ?? 'medium',
        resumo, pushName,
      })
    }

    // Enviar com voz Dr. Ben ou texto
    await enviarResposta(numero, cleanReply, VOICE_DR_BEN)

    return res.status(200).json({ ok: true, agente: 'DR_BEN', respondido: true })

  } catch (e) {
    console.error('[Z-API Webhook] Erro geral:', e.message)
    return res.status(200).json({ ok: true })
  }
}
