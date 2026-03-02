// ============================================================
// BEN GROWTH CENTER — Secretária IA WhatsApp
// Rota: POST /api/secretaria
// Recebe áudio ou texto do WhatsApp → transcreve → interpreta
// → salva compromisso → confirma + agenda alerta
//
// Fluxo:
//   1. Recebe audioId (WhatsApp media_id) ou texto
//   2. Baixa mídia via Graph API (se áudio)
//   3. Transcreve com OpenAI Whisper
//   4. Gemini interpreta: extrai data/hora/tipo/observação
//   5. Salva em memória (Pinecone) com namespace 'agenda'
//   6. Responde ao Dr. Mauro via WhatsApp com confirmação
//   7. Agenda alerta 30min antes via cron
// ============================================================

export const config = { maxDuration: 60 }

// ── Armazenamento de agenda em memória (dev) ────────────────
// Em produção usar Pinecone ou Supabase via env
const AGENDA = new Map()

// ── Utilitários ─────────────────────────────────────────────
function gerarId() {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function formatarDataHora(iso) {
  if (!iso) return 'data não informada'
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      timeZone: 'America/Fortaleza',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ── Baixar mídia do WhatsApp Business API ───────────────────
async function baixarMidiaWhatsApp(mediaId, token) {
  // 1. Obter URL da mídia
  const urlRes = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!urlRes.ok) throw new Error(`Erro ao obter URL da mídia: ${urlRes.status}`)
  const { url } = await urlRes.json()

  // 2. Baixar o arquivo de áudio
  const audioRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!audioRes.ok) throw new Error(`Erro ao baixar áudio: ${audioRes.status}`)

  const buffer = await audioRes.arrayBuffer()
  return Buffer.from(buffer)
}

// ── Transcrever áudio com OpenAI Whisper ────────────────────
async function transcreverAudio(audioBuffer, mimeType = 'audio/ogg') {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  // Criar FormData com o arquivo de áudio
  const { FormData, Blob } = await import('node-fetch').catch(() => ({
    FormData: global.FormData,
    Blob: global.Blob,
  })).catch(() => ({}))

  // Usar fetch nativo do Node 18+
  const formData = new (global.FormData || (await import('formdata-node')).FormData)()

  const blob = new Blob([audioBuffer], { type: mimeType })
  formData.append('file', blob, 'audio.ogg')
  formData.append('model', 'whisper-1')
  formData.append('language', 'pt')
  formData.append('response_format', 'json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Whisper error: ${err}`)
  }

  const data = await response.json()
  return data.text || ''
}

// ── Interpretar compromisso com Gemini ──────────────────────
async function interpretarCompromisso(texto, dataAtual) {
  const apiKey = process.env.OPENAI_API_KEY // Roteado para Gemini via proxy
  const apiUrl = process.env.OPENAI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

  if (!apiKey) {
    // Fallback: tentar extrair com regex básico
    return extrairCompromissoRegex(texto, dataAtual)
  }

  const prompt = `Você é a Secretária IA do Dr. Mauro Monção, advogado em Teresina/PI.
Data e hora atual: ${dataAtual} (fuso: America/Fortaleza, UTC-3)

Analise a mensagem e extraia as informações do compromisso.
Responda SOMENTE um JSON válido, sem markdown, sem explicações:

{
  "tipo": "audiencia|reuniao|consulta|prazo|ligacao|outro",
  "titulo": "título curto do compromisso",
  "descricao": "descrição completa",
  "dataHora": "ISO 8601 completo (ex: 2026-03-05T14:00:00-03:00)",
  "duracao_min": número em minutos (padrão 60),
  "cliente": "nome do cliente se mencionado ou null",
  "processo": "número do processo se mencionado ou null",
  "local": "local se mencionado ou null",
  "prioridade": "alta|media|baixa",
  "alertas_min": [30, 60] (minutos antes para alertar),
  "confirmado": true
}

Regras:
- Se não houver data explícita, inferir pela contexto ("amanhã", "semana que vem", etc.)
- Se não houver hora, usar 09:00
- Audiências são sempre alta prioridade
- Prazos processuais são sempre alta prioridade`

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: texto },
        ],
        max_tokens: 400,
        temperature: 0.1,
      }),
    })

    if (!response.ok) return extrairCompromissoRegex(texto, dataAtual)

    const data = await response.json()
    const conteudo = data.choices?.[0]?.message?.content || ''
    const jsonMatch = conteudo.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('[Secretaria] Erro Gemini:', e)
  }

  return extrairCompromissoRegex(texto, dataAtual)
}

// ── Fallback: extração por regex ────────────────────────────
function extrairCompromissoRegex(texto, dataAtual) {
  const textoLower = texto.toLowerCase()

  // Detectar tipo
  let tipo = 'outro'
  if (textoLower.includes('audiência') || textoLower.includes('audiencia')) tipo = 'audiencia'
  else if (textoLower.includes('reunião') || textoLower.includes('reuniao')) tipo = 'reuniao'
  else if (textoLower.includes('consulta')) tipo = 'consulta'
  else if (textoLower.includes('prazo')) tipo = 'prazo'
  else if (textoLower.includes('ligue') || textoLower.includes('ligar') || textoLower.includes('ligação')) tipo = 'ligacao'

  // Detectar hora
  const horaMatch = texto.match(/(\d{1,2})[h:hH](\d{0,2})/i)
  const hora = horaMatch ? `${horaMatch[1].padStart(2, '0')}:${(horaMatch[2] || '00').padStart(2, '0')}` : '09:00'

  // Detectar data relativa
  const agora = new Date(dataAtual)
  let dataEvento = new Date(agora)

  if (textoLower.includes('amanhã') || textoLower.includes('amanha')) {
    dataEvento.setDate(dataEvento.getDate() + 1)
  } else if (textoLower.includes('depois de amanhã')) {
    dataEvento.setDate(dataEvento.getDate() + 2)
  } else if (textoLower.includes('semana que vem') || textoLower.includes('próxima semana')) {
    dataEvento.setDate(dataEvento.getDate() + 7)
  } else {
    // Tentar extrair data DD/MM ou DD/MM/YYYY
    const dataMatch = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
    if (dataMatch) {
      const ano = dataMatch[3] ? (dataMatch[3].length === 2 ? `20${dataMatch[3]}` : dataMatch[3]) : agora.getFullYear()
      dataEvento = new Date(`${ano}-${dataMatch[2].padStart(2, '0')}-${dataMatch[1].padStart(2, '0')}`)
    }
  }

  const [hh, mm] = hora.split(':')
  dataEvento.setHours(parseInt(hh), parseInt(mm), 0, 0)

  return {
    tipo,
    titulo: texto.slice(0, 60),
    descricao: texto,
    dataHora: dataEvento.toISOString(),
    duracao_min: 60,
    cliente: null,
    processo: null,
    local: null,
    prioridade: tipo === 'audiencia' || tipo === 'prazo' ? 'alta' : 'media',
    alertas_min: [30, 60],
    confirmado: true,
  }
}

// ── Salvar compromisso (memória + Pinecone se disponível) ────
async function salvarCompromisso(compromisso) {
  const id = gerarId()
  const registro = {
    id,
    ...compromisso,
    criadoEm: new Date().toISOString(),
    criadoPor: 'secretaria-ia-whatsapp',
    status: 'agendado',
  }

  // Salvar em memória local
  AGENDA.set(id, registro)

  // Tentar salvar no Pinecone se disponível
  const pineconeKey = process.env.PINECONE_API_KEY
  const pineconeHost = process.env.PINECONE_INDEX_HOST

  if (pineconeKey && pineconeHost) {
    try {
      // Criar embedding simples para o compromisso
      const openaiKey = process.env.OPENAI_API_KEY
      if (openaiKey) {
        const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: `${registro.titulo} ${registro.descricao} ${registro.dataHora}`,
          }),
        })

        if (embedRes.ok) {
          const embedData = await embedRes.json()
          const vector = embedData.data?.[0]?.embedding

          if (vector) {
            await fetch(`${pineconeHost}/vectors/upsert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Api-Key': pineconeKey,
              },
              body: JSON.stringify({
                vectors: [{
                  id,
                  values: vector,
                  metadata: {
                    ...registro,
                    namespace: 'agenda',
                  },
                }],
                namespace: 'agenda',
              }),
            })
          }
        }
      }
    } catch (e) {
      console.error('[Secretaria] Erro Pinecone:', e.message)
      // Continuar mesmo sem Pinecone
    }
  }

  return registro
}

// ── Listar compromissos ──────────────────────────────────────
function listarCompromissos(filtro = {}) {
  const todos = Array.from(AGENDA.values())
  const agora = new Date()

  let lista = todos
    .filter(c => c.status !== 'cancelado')
    .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))

  if (filtro.futuros) {
    lista = lista.filter(c => new Date(c.dataHora) >= agora)
  }

  if (filtro.hoje) {
    const inicio = new Date(agora)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date(agora)
    fim.setHours(23, 59, 59, 999)
    lista = lista.filter(c => {
      const d = new Date(c.dataHora)
      return d >= inicio && d <= fim
    })
  }

  return lista
}

// ── Enviar mensagem WhatsApp ─────────────────────────────────
async function enviarWhatsApp(para, mensagem) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    console.log('[Secretaria] WhatsApp não configurado, log:', mensagem)
    return null
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: para.replace(/\D/g, ''),
          type: 'text',
          text: { body: mensagem },
        }),
      }
    )
    return res.json()
  } catch (e) {
    console.error('[Secretaria] Erro envio WhatsApp:', e)
    return null
  }
}

// ── Formatar mensagem de confirmação ────────────────────────
function montarConfirmacao(c) {
  const icones = {
    audiencia: '⚖️',
    reuniao: '🤝',
    consulta: '📋',
    prazo: '⏰',
    ligacao: '📞',
    outro: '📅',
  }
  const prioridade = { alta: '🔴', media: '🟡', baixa: '🟢' }

  return `✅ *Compromisso Registrado!*\n\n` +
    `${icones[c.tipo] || '📅'} *${c.titulo}*\n` +
    `📆 ${formatarDataHora(c.dataHora)}\n` +
    (c.cliente ? `👤 Cliente: ${c.cliente}\n` : '') +
    (c.processo ? `📂 Processo: ${c.processo}\n` : '') +
    (c.local ? `📍 Local: ${c.local}\n` : '') +
    `${prioridade[c.prioridade] || '🟡'} Prioridade: ${c.prioridade?.toUpperCase()}\n` +
    `🔔 Alertas: ${(c.alertas_min || [30]).map(m => `${m}min antes`).join(', ')}\n\n` +
    `_ID: ${c.id}_\n` +
    `_Para cancelar: responda "CANCELAR ${c.id}"_`
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET: listar agenda ───────────────────────────────────
  if (req.method === 'GET') {
    const { filtro, hoje, futuros } = req.query
    const lista = listarCompromissos({
      hoje: hoje === 'true',
      futuros: futuros !== 'false',
    })

    return res.status(200).json({
      success: true,
      total: lista.length,
      compromissos: lista,
      timestamp: new Date().toISOString(),
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const {
      texto,           // texto direto (já transcrito ou digitado)
      audioId,         // media_id do WhatsApp (áudio a transcrever)
      audioMime,       // mime type do áudio
      telefone,        // número do remetente (para resposta)
      action,          // 'listar' | 'cancelar' | 'agendar' | 'hoje'
      compromissoId,   // para cancelar
    } = req.body

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
    const dataAtual = new Date().toISOString()
    const remetente = telefone || process.env.PLANTONISTA_WHATSAPP

    // ── Ação: listar compromissos ──────────────────────────
    if (action === 'listar' || action === 'hoje') {
      const lista = listarCompromissos({ hoje: action === 'hoje', futuros: true })

      if (lista.length === 0) {
        const msg = action === 'hoje'
          ? '📅 Nenhum compromisso para hoje.'
          : '📅 Agenda vazia.'

        if (remetente) await enviarWhatsApp(remetente, msg)
        return res.status(200).json({ success: true, compromissos: [], mensagem: msg })
      }

      const icones = { audiencia: '⚖️', reuniao: '🤝', consulta: '📋', prazo: '⏰', ligacao: '📞', outro: '📅' }
      const titulo = action === 'hoje' ? '📅 *Agenda de Hoje:*\n\n' : `📅 *Próximos ${lista.length} Compromissos:*\n\n`
      const linhas = lista.slice(0, 10).map((c, i) =>
        `${i + 1}. ${icones[c.tipo] || '📅'} *${c.titulo}*\n   📆 ${formatarDataHora(c.dataHora)}`
      ).join('\n\n')

      const msg = titulo + linhas
      if (remetente) await enviarWhatsApp(remetente, msg)
      return res.status(200).json({ success: true, compromissos: lista, mensagem: msg })
    }

    // ── Ação: cancelar compromisso ─────────────────────────
    if (action === 'cancelar' && compromissoId) {
      const comp = AGENDA.get(compromissoId)
      if (comp) {
        comp.status = 'cancelado'
        AGENDA.set(compromissoId, comp)
        const msg = `✅ Compromisso cancelado:\n*${comp.titulo}*\n📆 ${formatarDataHora(comp.dataHora)}`
        if (remetente) await enviarWhatsApp(remetente, msg)
        return res.status(200).json({ success: true, mensagem: msg })
      }
      return res.status(404).json({ success: false, error: 'Compromisso não encontrado' })
    }

    // ── Transcrever áudio se necessário ───────────────────
    let textoFinal = texto || ''

    if (audioId && WHATSAPP_TOKEN) {
      try {
        console.log('[Secretaria] Transcrevendo áudio:', audioId)
        const audioBuffer = await baixarMidiaWhatsApp(audioId, WHATSAPP_TOKEN)
        textoFinal = await transcreverAudio(audioBuffer, audioMime || 'audio/ogg')
        console.log('[Secretaria] Transcrição:', textoFinal)
      } catch (e) {
        console.error('[Secretaria] Erro transcrição:', e)
        if (remetente) {
          await enviarWhatsApp(remetente,
            '⚠️ Não consegui transcrever o áudio. Pode me enviar como texto?')
        }
        return res.status(200).json({ success: false, error: 'Erro na transcrição', details: e.message })
      }
    }

    if (!textoFinal) {
      return res.status(400).json({ error: 'texto ou audioId é obrigatório' })
    }

    // ── Detectar comando especial na mensagem ──────────────
    const textoLower = textoFinal.toLowerCase().trim()

    // Comando: listar agenda
    if (textoLower.startsWith('agenda') || textoLower === 'minha agenda' || textoLower === 'compromissos') {
      const lista = listarCompromissos({ futuros: true })
      const msg = lista.length === 0
        ? '📅 Agenda vazia por enquanto.'
        : `📅 *Você tem ${lista.length} compromisso(s):*\n\n` +
          lista.slice(0, 5).map((c, i) =>
            `${i + 1}. *${c.titulo}*\n   📆 ${formatarDataHora(c.dataHora)}`
          ).join('\n\n')

      if (remetente) await enviarWhatsApp(remetente, msg)
      return res.status(200).json({ success: true, compromissos: lista, mensagem: msg })
    }

    // Comando: agenda de hoje
    if (textoLower === 'hoje' || textoLower === 'agenda hoje' || textoLower === 'compromissos hoje') {
      const lista = listarCompromissos({ hoje: true })
      const msg = lista.length === 0
        ? '📅 Nenhum compromisso para hoje.'
        : `📅 *Agenda de hoje (${lista.length}):*\n\n` +
          lista.map((c, i) =>
            `${i + 1}. *${c.titulo}*\n   🕐 ${formatarDataHora(c.dataHora)}`
          ).join('\n\n')

      if (remetente) await enviarWhatsApp(remetente, msg)
      return res.status(200).json({ success: true, compromissos: lista, mensagem: msg })
    }

    // Comando: cancelar
    if (textoLower.startsWith('cancelar ')) {
      const id = textoFinal.split(' ')[1]
      const comp = AGENDA.get(id)
      if (comp) {
        comp.status = 'cancelado'
        AGENDA.set(id, comp)
        const msg = `✅ Cancelado: *${comp.titulo}*`
        if (remetente) await enviarWhatsApp(remetente, msg)
        return res.status(200).json({ success: true, cancelado: comp })
      }
    }

    // ── Interpretar e salvar compromisso ──────────────────
    console.log('[Secretaria] Interpretando:', textoFinal)
    const compromisso = await interpretarCompromisso(textoFinal, dataAtual)
    const registrado = await salvarCompromisso(compromisso)

    // ── Enviar confirmação ao Dr. Mauro ───────────────────
    const confirmacao = montarConfirmacao(registrado)
    if (remetente) {
      await enviarWhatsApp(remetente, confirmacao)
    }

    // ── Notificar também no sistema (bridge→Juris) ────────
    try {
      const jurisUrl = process.env.JURIS_URL || 'https://ben-juris-center.vercel.app'
      const jwtToken = process.env.JWT_SECRET || 'ben-ecosystem-2026'

      await fetch(`${jurisUrl}/api/bridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          action: 'enviar_evento',
          evento: {
            tipo: 'COMPROMISSO_AGENDADO',
            origem: 'growth',
            destino: 'juris',
            payload: {
              compromissoId: registrado.id,
              titulo: registrado.titulo,
              dataHora: registrado.dataHora,
              tipo: registrado.tipo,
              cliente: registrado.cliente,
              processo: registrado.processo,
              prioridade: registrado.prioridade,
              criadoPorVoz: !!audioId,
              transcricao: textoFinal,
            },
            agentOrigem: 'secretaria-ia',
          },
        }),
      }).catch(() => {}) // Não bloquear se bridge falhar
    } catch {}

    return res.status(200).json({
      success: true,
      compromisso: registrado,
      transcricao: audioId ? textoFinal : undefined,
      confirmacao,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Secretaria] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno',
    })
  }
}

// ── Exportar agenda para uso interno ────────────────────────
export { AGENDA, listarCompromissos, enviarWhatsApp, formatarDataHora }
