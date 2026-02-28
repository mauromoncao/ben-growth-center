// ============================================================
// BEN GROWTH CENTER — Dr. Ben Flow Engine
// Motor de fluxos conversacionais nativo
// Substitui ManyChat com custo ZERO
// Funciona no WhatsApp Business API e Instagram Graph API
// ============================================================

// ─── Tipos base do motor ─────────────────────────────────────
export type StepType =
  | 'message'        // Envia mensagem de texto
  | 'question'       // Pergunta com opções de resposta
  | 'collect'        // Coleta dado livre (nome, telefone etc.)
  | 'condition'      // Bifurcação condicional
  | 'ai_qualify'     // Dr. Ben IA qualifica o lead
  | 'crm_create'     // Cria card no CRM
  | 'notify_human'   // Notifica plantonista humano
  | 'schedule'       // Abre link de agendamento
  | 'end'            // Encerra fluxo

export type ChannelType = 'whatsapp' | 'instagram' | 'site_chat' | 'sms'

export interface FlowButton {
  id: string
  label: string        // texto do botão (máx 20 chars no WhatsApp)
  nextStepId: string
  payload?: string     // dado que será salvo quando clicar
}

export interface FlowStep {
  id: string
  type: StepType
  // Para message / question / collect
  message?: string
  // Para question
  buttons?: FlowButton[]
  // Para collect
  collectKey?: string  // nome da variável a salvar (ex: 'nome', 'telefone')
  collectValidation?: 'phone' | 'email' | 'number' | 'text'
  collectNextStepId?: string
  // Para condition
  conditionVar?: string
  conditionRules?: Array<{ operator: 'eq' | 'gte' | 'lte' | 'contains'; value: string | number; nextStepId: string }>
  conditionDefaultNextStepId?: string
  // Para ai_qualify
  aiNextStepHighScore?: string  // score >= 70 → próximo passo
  aiNextStepLowScore?: string   // score < 70 → nurturing
  // Para crm_create / notify_human / schedule / end
  nextStepId?: string
  // Metadados visuais (para o FlowBuilder)
  label?: string       // nome legível do passo
  x?: number           // posição no canvas
  y?: number
}

export interface Flow {
  id: string
  nome: string
  descricao: string
  canal: ChannelType[]
  ativo: boolean
  gatilho: string      // palavra-chave que dispara o fluxo
  steps: Record<string, FlowStep>
  firstStepId: string
  criadoEm: string
  atualizadoEm: string
  stats?: {
    disparos: number
    conclusoes: number
    leadsGerados: number
    taxaConversao: number
  }
}

// Estado da sessão de um contato em andamento no fluxo
export interface FlowSession {
  id: string
  flowId: string
  contactId: string           // telefone ou ID do Instagram
  canal: ChannelType
  currentStepId: string
  dados: Record<string, string>  // dados coletados: { nome, telefone, area, ... }
  score?: number
  status: 'ativo' | 'concluido' | 'abandonado' | 'repassado'
  iniciadoEm: string
  atualizadoEm: string
  historico: Array<{ role: 'bot' | 'user'; texto: string; hora: string }>
}

// ─── Fluxos pré-configurados ─────────────────────────────────

export const FLUXO_QUALIFICACAO_TRIBUTARIO: Flow = {
  id: 'flow_tributario',
  nome: 'Qualificação — Tributário',
  descricao: 'Fluxo para leads com dívidas fiscais, ICMS, IRPJ, parcelamentos e planejamento tributário',
  canal: ['whatsapp', 'instagram'],
  ativo: true,
  gatilho: 'tributario',
  criadoEm: '2026-02-28',
  atualizadoEm: '2026-02-28',
  stats: { disparos: 47, conclusoes: 38, leadsGerados: 31, taxaConversao: 81.6 },
  firstStepId: 's1',
  steps: {
    s1: {
      id: 's1', type: 'message', label: 'Boas-vindas',
      message: `Olá! 👋 Sou o *Dr. Ben*, assistente jurídico do escritório *Mauro Monção Advogados* em Teresina, PI.\n\nEspecialistas em Direito Tributário, Previdenciário e Bancário.\n\nComo posso te ajudar hoje?`,
      nextStepId: 's2',
    },
    s2: {
      id: 's2', type: 'question', label: 'Área de interesse',
      message: 'Sobre qual assunto você precisa de orientação?',
      buttons: [
        { id: 'b1', label: '💼 Dívida com a Receita', nextStepId: 's3', payload: 'tributario_divida' },
        { id: 'b2', label: '📊 Reduzir impostos', nextStepId: 's3', payload: 'tributario_planejamento' },
        { id: 'b3', label: '⚖️ Defesa fiscal/CARF', nextStepId: 's3', payload: 'tributario_defesa' },
        { id: 'b4', label: '🏛️ Outro assunto', nextStepId: 's8', payload: 'outro' },
      ],
    },
    s3: {
      id: 's3', type: 'collect', label: 'Coletar nome',
      message: 'Para te ajudar melhor, pode me dizer seu *nome completo*?',
      collectKey: 'nome',
      collectValidation: 'text',
      collectNextStepId: 's4',
    },
    s4: {
      id: 's4', type: 'collect', label: 'Coletar valor da dívida',
      message: '{{nome}}, qual é o *valor aproximado* da dívida ou economia esperada?\n\n_(Ex: R$ 50.000, R$ 200.000)_',
      collectKey: 'valor_estimado',
      collectValidation: 'text',
      collectNextStepId: 's5',
    },
    s5: {
      id: 's5', type: 'collect', label: 'Coletar telefone',
      message: 'Perfeito! Para o Dr. Mauro entrar em contato, qual seu *número com DDD*?',
      collectKey: 'telefone',
      collectValidation: 'phone',
      collectNextStepId: 's6',
    },
    s6: {
      id: 's6', type: 'ai_qualify', label: 'Dr. Ben qualifica',
      message: '🤖 _Analisando seu caso..._',
      aiNextStepHighScore: 's7_high',
      aiNextStepLowScore: 's7_low',
    },
    s7_high: {
      id: 's7_high', type: 'notify_human', label: 'Score alto → repasse',
      message: `✅ *{{nome}}*, analisei seu caso e identifico que você tem uma situação com *alta prioridade*.\n\nUm especialista do escritório Mauro Monção entrará em contato em até *30 minutos*! 📞\n\nEnquanto isso, já agendamos seu caso como URGENTE.`,
      nextStepId: 's_end',
    },
    s7_low: {
      id: 's7_low', type: 'schedule', label: 'Score médio → agendar',
      message: `Obrigado, *{{nome}}*! 😊\n\nSeu caso é interessante. Gostaria de agendar uma *consulta gratuita* de 30 minutos com o Dr. Mauro?\n\n📅 Clique para escolher o horário:\nhttps://www.mauromoncao.adv.br/agendar\n\nOu responda *SIM* que marcamos para você!`,
      nextStepId: 's_crm',
    },
    s8: {
      id: 's8', type: 'question', label: 'Outras áreas',
      message: 'Sem problema! Em qual área você precisa de ajuda?',
      buttons: [
        { id: 'b5', label: '👴 Aposentadoria/INSS', nextStepId: 's3', payload: 'previdenciario' },
        { id: 'b6', label: '🏦 Juros abusivos banco', nextStepId: 's3', payload: 'bancario' },
        { id: 'b7', label: '📄 Contrato/procuração', nextStepId: 's3', payload: 'contrato' },
        { id: 'b8', label: '❓ Dúvida geral', nextStepId: 's3', payload: 'geral' },
      ],
    },
    s_crm: {
      id: 's_crm', type: 'crm_create', label: 'Criar no CRM',
      message: '',
      nextStepId: 's_end',
    },
    s_end: {
      id: 's_end', type: 'end', label: 'Fim do fluxo',
      message: `Qualquer dúvida, pode me chamar aqui a qualquer momento! 😊\n\nMauro Monção Advogados — Tributário · Previdenciário · Bancário\n📍 Teresina, PI | 🌐 www.mauromoncao.adv.br`,
    },
  },
}

export const FLUXO_INSTAGRAM_COMENTARIO: Flow = {
  id: 'flow_instagram_dm',
  nome: 'Instagram — DM Automático',
  descricao: 'Quando alguém comenta ou manda DM no Instagram, Dr. Ben responde e qualifica automaticamente',
  canal: ['instagram'],
  ativo: true,
  gatilho: 'instagram_dm',
  criadoEm: '2026-02-28',
  atualizadoEm: '2026-02-28',
  stats: { disparos: 23, conclusoes: 19, leadsGerados: 15, taxaConversao: 78.9 },
  firstStepId: 'ig1',
  steps: {
    ig1: {
      id: 'ig1', type: 'message', label: 'Resposta automática',
      message: `Oi, {{nome}}! 👋 Vi que você se interessou pelo nosso conteúdo!\n\nSou o Dr. Ben, assistente do escritório *Mauro Monção Advogados*.\n\nPosso te ajudar com uma dúvida jurídica rápida? 😊`,
      nextStepId: 'ig2',
    },
    ig2: {
      id: 'ig2', type: 'question', label: 'Interesse',
      message: 'Sobre qual assunto foi o post que você viu?',
      buttons: [
        { id: 'ig_b1', label: '💼 Tributário/Impostos', nextStepId: 'ig3', payload: 'tributario' },
        { id: 'ig_b2', label: '👴 Previdenciário/INSS', nextStepId: 'ig3', payload: 'previdenciario' },
        { id: 'ig_b3', label: '🏦 Bancário/Juros', nextStepId: 'ig3', payload: 'bancario' },
        { id: 'ig_b4', label: '❓ Outra dúvida', nextStepId: 'ig3', payload: 'geral' },
      ],
    },
    ig3: {
      id: 'ig3', type: 'collect', label: 'Coletar telefone',
      message: 'Qual seu *WhatsApp com DDD* para nosso advogado entrar em contato? 📱',
      collectKey: 'telefone',
      collectValidation: 'phone',
      collectNextStepId: 'ig4',
    },
    ig4: {
      id: 'ig4', type: 'ai_qualify', label: 'Qualificação IA',
      message: '_Verificando seu perfil..._',
      aiNextStepHighScore: 'ig5_high',
      aiNextStepLowScore: 'ig5_low',
    },
    ig5_high: {
      id: 'ig5_high', type: 'notify_human', label: 'Notificar plantonista',
      message: `✅ Perfeito! Já registrei seus dados e o Dr. Mauro vai te ligar em breve!\n\nEnquanto isso, salva nosso número: *(86) 99999-9999*\n\nAté logo! 🤝`,
      nextStepId: 'ig_end',
    },
    ig5_low: {
      id: 'ig5_low', type: 'schedule', label: 'Oferecer consulta',
      message: `Obrigado! 😊 Que tal uma *consulta gratuita* de 30 minutos?\n\nÉ 100% online via Google Meet. Escolha o horário:\n👉 www.mauromoncao.adv.br/agendar`,
      nextStepId: 'ig_end',
    },
    ig_end: {
      id: 'ig_end', type: 'end', label: 'Fim',
      message: '',
    },
  },
}

export const FLUXO_BOAS_VINDAS_SITE: Flow = {
  id: 'flow_site_chat',
  nome: 'Chat do Site — Boas-vindas',
  descricao: 'Fluxo inicial para visitantes do site mauromoncao.adv.br que abrem o chat',
  canal: ['site_chat'],
  ativo: true,
  gatilho: 'chat_aberto',
  criadoEm: '2026-02-28',
  atualizadoEm: '2026-02-28',
  stats: { disparos: 89, conclusoes: 71, leadsGerados: 42, taxaConversao: 59.2 },
  firstStepId: 'sc1',
  steps: {
    sc1: {
      id: 'sc1', type: 'message', label: 'Boas-vindas site',
      message: `Olá! Bem-vindo ao *Mauro Monção Advogados*! 👋\n\nSou o Dr. Ben, assistente virtual do escritório. Posso te ajudar com:\n\n• Direito Tributário\n• Previdenciário (INSS)\n• Bancário e Financeiro`,
      nextStepId: 'sc2',
    },
    sc2: {
      id: 'sc2', type: 'question', label: 'Tipo de atendimento',
      message: 'O que você precisa hoje?',
      buttons: [
        { id: 'sc_b1', label: '💬 Falar com advogado', nextStepId: 'sc3', payload: 'falar_agora' },
        { id: 'sc_b2', label: '📅 Agendar consulta', nextStepId: 'sc_agenda', payload: 'agendar' },
        { id: 'sc_b3', label: '❓ Tirar uma dúvida', nextStepId: 'sc3', payload: 'duvida' },
      ],
    },
    sc3: {
      id: 'sc3', type: 'collect', label: 'Coleta nome',
      message: 'Qual seu nome?',
      collectKey: 'nome',
      collectValidation: 'text',
      collectNextStepId: 'sc4',
    },
    sc4: {
      id: 'sc4', type: 'collect', label: 'Coleta área',
      message: '{{nome}}, qual é o assunto jurídico? (Ex: dívida fiscal, aposentadoria, revisão de contrato)',
      collectKey: 'problema',
      collectValidation: 'text',
      collectNextStepId: 'sc5',
    },
    sc5: {
      id: 'sc5', type: 'collect', label: 'Coleta telefone',
      message: 'E seu WhatsApp para contato?',
      collectKey: 'telefone',
      collectValidation: 'phone',
      collectNextStepId: 'sc6',
    },
    sc6: {
      id: 'sc6', type: 'ai_qualify', label: 'IA qualifica',
      message: 'Um momento...',
      aiNextStepHighScore: 'sc7',
      aiNextStepLowScore: 'sc_agenda',
    },
    sc7: {
      id: 'sc7', type: 'notify_human', label: 'Notifica humano',
      message: `Obrigado, *{{nome}}*! 🎯\n\nJá encaminhei seu caso para o Dr. Mauro. Ele entrará em contato pelo WhatsApp *{{telefone}}* em breve.\n\nCaso urgente, ligue: *(86) 99999-9999*`,
      nextStepId: 'sc_crm',
    },
    sc_agenda: {
      id: 'sc_agenda', type: 'schedule', label: 'Agendar consulta',
      message: `📅 Agende uma consulta gratuita de 30 minutos:\n\nhttps://www.mauromoncao.adv.br/agendar\n\nÉ online, pelo Google Meet, sem compromisso!`,
      nextStepId: 'sc_crm',
    },
    sc_crm: {
      id: 'sc_crm', type: 'crm_create', label: 'Salvar no CRM',
      message: '',
      nextStepId: 'sc_end',
    },
    sc_end: {
      id: 'sc_end', type: 'end', label: 'Fim',
      message: 'Até logo! Qualquer dúvida, estamos aqui. 😊',
    },
  },
}

// ─── Biblioteca de fluxos disponíveis ────────────────────────
export const FLUXOS_BIBLIOTECA: Flow[] = [
  FLUXO_QUALIFICACAO_TRIBUTARIO,
  FLUXO_INSTAGRAM_COMENTARIO,
  FLUXO_BOAS_VINDAS_SITE,
]

// ─── Motor de processamento ──────────────────────────────────
export class FlowEngine {
  private sessions: Map<string, FlowSession> = new Map()

  /**
   * Inicia ou continua uma sessão de fluxo para um contato
   */
  processar(params: {
    contactId: string
    canal: ChannelType
    mensagem: string
    flow: Flow
    sessionId?: string
  }): { resposta: string; sessao: FlowSession; encerrado: boolean; notificarHumano: boolean } {
    const { contactId, canal, mensagem, flow } = params

    // Busca ou cria sessão
    let sessao = this.sessions.get(params.sessionId || contactId)
    if (!sessao) {
      sessao = this.criarSessao(contactId, canal, flow)
    }

    // Registra mensagem do usuário no histórico
    sessao.historico.push({
      role: 'user',
      texto: mensagem,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })

    // Processa o passo atual
    const step = flow.steps[sessao.currentStepId]
    if (!step) {
      return { resposta: 'Sessão inválida.', sessao, encerrado: true, notificarHumano: false }
    }

    let resposta = ''
    let notificarHumano = false
    let encerrado = false

    switch (step.type) {
      case 'collect': {
        // Salva o dado coletado
        if (step.collectKey) {
          sessao.dados[step.collectKey] = mensagem.trim()
        }
        const proximo = flow.steps[step.collectNextStepId || '']
        if (proximo) {
          sessao.currentStepId = proximo.id
          resposta = this.interpolar(proximo.message || '', sessao.dados)
          if (proximo.type === 'end') encerrado = true
        }
        break
      }

      case 'question': {
        // Verifica se a mensagem corresponde a algum botão
        const botaoSelecionado = step.buttons?.find(b =>
          mensagem.toLowerCase().includes(b.label.toLowerCase()) ||
          mensagem === b.id ||
          mensagem === b.payload
        )
        if (botaoSelecionado) {
          if (botaoSelecionado.payload) {
            sessao.dados['area'] = botaoSelecionado.payload
          }
          const proximo = flow.steps[botaoSelecionado.nextStepId]
          if (proximo) {
            sessao.currentStepId = proximo.id
            resposta = this.interpolar(proximo.message || '', sessao.dados)
          }
        } else {
          // Mensagem livre — tenta inferir a opção
          resposta = 'Por favor, escolha uma das opções acima. 😊'
        }
        break
      }

      case 'notify_human': {
        notificarHumano = true
        sessao.status = 'repassado'
        resposta = this.interpolar(step.message || '', sessao.dados)
        if (step.nextStepId) {
          const proximo = flow.steps[step.nextStepId]
          if (proximo) sessao.currentStepId = proximo.id
        }
        break
      }

      case 'end': {
        sessao.status = 'concluido'
        resposta = this.interpolar(step.message || '', sessao.dados)
        encerrado = true
        break
      }

      default: {
        resposta = this.interpolar(step.message || '', sessao.dados)
        if (step.nextStepId) {
          const proximo = flow.steps[step.nextStepId]
          if (proximo) sessao.currentStepId = proximo.id
        }
      }
    }

    // Registra resposta do bot
    if (resposta) {
      sessao.historico.push({
        role: 'bot',
        texto: resposta,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    }

    sessao.atualizadoEm = new Date().toISOString()
    this.sessions.set(sessao.id, sessao)

    return { resposta, sessao, encerrado, notificarHumano }
  }

  /**
   * Cria nova sessão para o contato
   */
  criarSessao(contactId: string, canal: ChannelType, flow: Flow): FlowSession {
    const sessao: FlowSession = {
      id: `sess_${Date.now()}_${contactId}`,
      flowId: flow.id,
      contactId,
      canal,
      currentStepId: flow.firstStepId,
      dados: {},
      status: 'ativo',
      iniciadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      historico: [],
    }
    this.sessions.set(sessao.id, sessao)
    return sessao
  }

  /**
   * Interpola variáveis na mensagem: {{nome}} → "Carlos"
   */
  interpolar(texto: string, dados: Record<string, string>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (_, key) => dados[key] || `[${key}]`)
  }

  /**
   * Retorna a primeira mensagem de um fluxo (para iniciar)
   */
  getMensagemInicial(flow: Flow, dados: Record<string, string> = {}): string {
    const firstStep = flow.steps[flow.firstStepId]
    return this.interpolar(firstStep?.message || '', dados)
  }

  /**
   * Retorna botões formatados para WhatsApp
   */
  getButtonsFormatados(flow: Flow, stepId: string): FlowButton[] {
    const step = flow.steps[stepId]
    return step?.buttons || []
  }
}

// ─── Instância global do motor ────────────────────────────────
export const flowEngine = new FlowEngine()

// ─── Funções auxiliares para o FlowBuilder ───────────────────
export function getStepTypeLabel(type: StepType): string {
  const labels: Record<StepType, string> = {
    message: '💬 Mensagem',
    question: '❓ Pergunta',
    collect: '📝 Coletar dado',
    condition: '🔀 Condição',
    ai_qualify: '🤖 IA Qualifica',
    crm_create: '📊 Criar no CRM',
    notify_human: '👤 Notificar Humano',
    schedule: '📅 Agendar',
    end: '🏁 Fim',
  }
  return labels[type] || type
}

export function getStepTypeColor(type: StepType): string {
  const colors: Record<StepType, string> = {
    message: 'bg-blue-100 text-blue-700 border-blue-300',
    question: 'bg-purple-100 text-purple-700 border-purple-300',
    collect: 'bg-amber-100 text-amber-700 border-amber-300',
    condition: 'bg-orange-100 text-orange-700 border-orange-300',
    ai_qualify: 'bg-rose-100 text-rose-700 border-rose-300',
    crm_create: 'bg-primary-100 text-primary border-primary-300',
    notify_human: 'bg-green-100 text-green-700 border-green-300',
    schedule: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    end: 'bg-slate-100 text-slate-600 border-slate-300',
  }
  return colors[type] || 'bg-slate-100 text-slate-600'
}

// ─── Comparativo de custo (para exibir no painel) ────────────
export const COMPARATIVO_MANYCHAT = {
  manychat: {
    nome: 'ManyChat',
    custoMensal: 480,    // R$ (~U$89/mês no Pro)
    custoAnual: 5760,
    limitesLeads: 1000,
    integraCRM: false,
    qualificacaoIA: false,
    customizavel: false,
  },
  drBenFlow: {
    nome: 'Dr. Ben Flow',
    custoMensal: 0,
    custoAnual: 0,
    limitesLeads: -1,    // ilimitado
    integraCRM: true,
    qualificacaoIA: true,
    customizavel: true,
    economiaAnual: 5760,
  },
}
