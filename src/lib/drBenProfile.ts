// ============================================================
// DR. BEN — Perfil Oficial WhatsApp Business
// Escritório Mauro Monção Advogados Associados
// ============================================================

export const DR_BEN_PROFILE = {
  // ── Identidade ─────────────────────────────────────────────
  nome:        'Dr. Ben',
  nomeCompleto:'Dr. Ben — Assistente Jurídico',
  descricao:   'Central de Atendimento Jurídico 24h · Mauro Monção Advogados Associados · Parnaíba - PI',
  sobre:       'Assistente jurídico inteligente do escritório Mauro Monção Advogados Associados. Atendimento 24 horas para triagem, qualificação de casos e orientação jurídica inicial nas áreas Tributária, Previdenciária e Bancária.',
  avatar:      '/dr-ben-avatar.jpg',

  // ── Contato & Localização ──────────────────────────────────
  email:       'contato@mauromoncao.adv.br',
  site:        'https://mauromoncao.adv.br',
  endereco:    'Parnaíba - PI, Brasil',
  cidade:      'Parnaíba',
  estado:      'PI',
  pais:        'BR',

  // ── WhatsApp Business ──────────────────────────────────────
  whatsappId:  '888304720788200',     // WABA ID Meta confirmado
  telefone:    '+55 86 99482-0054',
  horario:     '24 horas — 7 dias por semana',
  categoria:   'LEGAL',              // categoria Meta Business

  // ── Áreas de atuação ──────────────────────────────────────
  areas: [
    'Direito Tributário',
    'Direito Previdenciário',
    'Direito Bancário',
    'Planejamento Patrimonial',
    'Recuperação de Créditos',
  ],

  // ── Mensagem de saudação automática ───────────────────────
  saudacao: `Olá! 👋 Sou o *Dr. Ben*, assistente jurídico do escritório *Mauro Monção Advogados Associados*.

Estou disponível *24 horas* para te ajudar com:

🔱 Dívidas com a Receita Federal
🏦 Revisão de contratos bancários
🏛️ Aposentadorias e benefícios INSS
💼 Planejamento tributário

Como posso te ajudar hoje?`,

  // ── Mensagem de ausência ──────────────────────────────────
  ausencia: `Olá! Sou o *Dr. Ben* 🤖

Recebi sua mensagem e já estou analisando seu caso. Nossa equipe entrará em contato em breve.

📍 *Mauro Monção Advogados* — Parnaíba/PI
🌐 mauromoncao.adv.br`,

  // ── Templates de mensagem ─────────────────────────────────
  templates: {
    boas_vindas: {
      nome: 'boas_vindas_dr_ben',
      idioma: 'pt_BR',
      texto: 'Olá, *{{nome}}*! 👋\n\nSou o Dr. Ben, assistente jurídico do escritório Mauro Monção.\n\nPara te ajudar melhor, pode me contar qual é a sua situação jurídica?',
    },
    link_assinatura: {
      nome: 'link_assinatura_contrato',
      idioma: 'pt_BR',
      texto: 'Olá, *{{nome}}*! ✍️\n\nSeu contrato *{{tipo_contrato}}* está pronto para assinatura digital.\n\n🔗 *Clique para assinar:*\n{{link}}\n\n⏰ *Prazo:* {{prazo}}\n\n_Mauro Monção Advogados — Parnaíba/PI_',
    },
    cobranca_pix: {
      nome: 'cobranca_pix',
      idioma: 'pt_BR',
      texto: 'Olá, *{{nome}}*! 💳\n\nSua cobrança de *R$ {{valor}}* está disponível.\n\n*PIX:* {{chave_pix}}\n\n_Mauro Monção Advogados — Parnaíba/PI_',
    },
    lembrete_reuniao: {
      nome: 'lembrete_reuniao',
      idioma: 'pt_BR',
      texto: 'Olá, *{{nome}}*! 📅\n\nLembrete: sua reunião com o Dr. Mauro é *hoje às {{horario}}*.\n\n🔗 Link Meet: {{link_meet}}\n\n_Mauro Monção Advogados — Parnaíba/PI_',
    },
    qualificacao_alta: {
      nome: 'qualificacao_alta_prioridade',
      idioma: 'pt_BR',
      texto: '✅ *{{nome}}*, seu caso foi qualificado como *ALTA PRIORIDADE*!\n\nÁrea: *{{area}}*\nScore: *{{score}}/100*\n\nUm especialista entrará em contato em até *30 minutos*. 🚀',
    },
  },
} as const

// ── API Helper: atualizar perfil no WhatsApp Business (Meta) ──
export async function atualizarPerfilWhatsApp(token: string): Promise<{
  ok: boolean
  resultado?: unknown
  erro?: string
}> {
  const WABA_ID  = DR_BEN_PROFILE.whatsappId
  const BASE_URL = `https://graph.facebook.com/v19.0/${WABA_ID}`

  try {
    // 1) Atualizar informações do perfil
    const perfilRes = await fetch(`${BASE_URL}/whatsapp_business_profile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        address:           DR_BEN_PROFILE.endereco,
        description:       DR_BEN_PROFILE.sobre,
        email:             DR_BEN_PROFILE.email,
        websites:          [DR_BEN_PROFILE.site],
        vertical:          DR_BEN_PROFILE.categoria,
      }),
    })

    if (!perfilRes.ok) {
      const err = await perfilRes.text()
      return { ok: false, erro: `Perfil: ${err}` }
    }

    return { ok: true, resultado: await perfilRes.json() }
  } catch (e: any) {
    return { ok: false, erro: e.message }
  }
}

// ── Enviar mensagem de texto simples ──────────────────────────
export async function enviarMensagemWhatsApp(
  token: string,
  para: string,
  mensagem: string
): Promise<{ ok: boolean; messageId?: string; erro?: string }> {
  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'enviar',
        para,
        mensagem,
      }),
    })
    if (!res.ok) return { ok: false, erro: await res.text() }
    const data = await res.json()
    return { ok: true, messageId: data.messages?.[0]?.id }
  } catch (e: any) {
    return { ok: false, erro: e.message }
  }
}
