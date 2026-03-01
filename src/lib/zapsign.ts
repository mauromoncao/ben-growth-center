// ============================================================
// BEN GROWTH CENTER — ZapSign Integration
// Token: 426e787a-3446-4341-bbd2-2b88e544ad39
// API: https://api.zapsign.com.br/api/v1
// ============================================================

export const ZAPSIGN_TOKEN = '426e787a-3446-4341-bbd2-2b88e544ad39'
export const ZAPSIGN_BASE_URL = 'https://api.zapsign.com.br/api/v1'

// ─── Tipos ────────────────────────────────────────────────────
export interface ZapSignSigner {
  name: string
  email: string
  phone?: string                // formato: 5586999999999
  sendAutomaticEmail?: boolean
  sendAutomaticWhatsapp?: boolean
  authMode?: 'assinaturaTela' | 'tokenEmail' | 'tokenWhatsapp' | 'selfie'
  lockEmail?: boolean
  lockPhone?: boolean
}

export interface ZapSignDocument {
  name: string
  urlPdf?: string
  base64Pdf?: string
  signers: ZapSignSigner[]
  lang?: 'pt' | 'en' | 'es'
  signDeadlineDays?: number
  message?: string
  externalId?: string           // leadId do CRM
  sendAutomaticEmail?: boolean
  disableSignerEmails?: boolean
}

export interface ZapSignDocumentResponse {
  token: string
  name: string
  status: 'pending' | 'signed' | 'refused'
  createdAt: string
  lastUpdateDate: string
  signDeadline: string
  signers: Array<{
    token: string
    name: string
    email: string
    phone?: string
    status: 'pending' | 'signed' | 'refused'
    signUrl: string
    signedAt?: string
    authMode?: string
  }>
  signedFileUrl?: string
  originalFileUrl: string
  externalId?: string
  folder?: string
}

export interface ZapSignListResponse {
  count: number
  next: string | null
  previous: string | null
  results: ZapSignDocumentResponse[]
}

export type TipoContrato =
  | 'honorarios_tributario'
  | 'honorarios_previdenciario'
  | 'honorarios_bancario'
  | 'procuracao_geral'
  | 'procuracao_especifica'
  | 'termo_consulta'

export const ZapSignTemplates: Record<TipoContrato, {
  nome: string
  descricao: string
  campos: string[]
  signatarios: number
  cor: string
  emoji: string
}> = {
  honorarios_tributario: {
    nome: 'Contrato de Honorários — Tributário',
    descricao: 'Recuperação tributária, defesa fiscal e planejamento',
    campos: ['nomeCliente', 'cpfCnpj', 'enderecoCliente', 'objetoContrato', 'honorariosValor', 'honorariosSucesso'],
    signatarios: 2,
    cor: '#059669',
    emoji: '🟢',
  },
  honorarios_previdenciario: {
    nome: 'Contrato de Honorários — Previdenciário',
    descricao: 'Aposentadorias, revisões de benefícios e recursos INSS',
    campos: ['nomeCliente', 'cpfCliente', 'enderecoCliente', 'tipoAposentadoria', 'honorariosSucesso'],
    signatarios: 2,
    cor: '#3b82f6',
    emoji: '🔵',
  },
  honorarios_bancario: {
    nome: 'Contrato de Honorários — Bancário',
    descricao: 'Revisão contratual, juros abusivos e superendividamento',
    campos: ['nomeCliente', 'cpfCnpj', 'enderecoCliente', 'bancoReu', 'valorDebito', 'honorariosFixo'],
    signatarios: 2,
    cor: '#f59e0b',
    emoji: '🟡',
  },
  procuracao_geral: {
    nome: 'Procuração Ad Judicia et Extra — Geral',
    descricao: 'Representação judicial e extrajudicial em geral',
    campos: ['nomeOutorgante', 'cpfOutorgante', 'enderecoOutorgante', 'estadoCivil'],
    signatarios: 2,
    cor: '#8b5cf6',
    emoji: '🟣',
  },
  procuracao_especifica: {
    nome: 'Procuração Ad Judicia — Específica',
    descricao: 'Procuração específica para processo determinado',
    campos: ['nomeOutorgante', 'cpfOutorgante', 'enderecoOutorgante', 'finalidade', 'processo'],
    signatarios: 1,
    cor: '#ec4899',
    emoji: '🩷',
  },
  termo_consulta: {
    nome: 'Termo de Consulta Jurídica',
    descricao: 'Consultas avulsas e pareceres jurídicos',
    campos: ['nomeCliente', 'cpfCliente', 'assunto', 'valorConsulta'],
    signatarios: 2,
    cor: '#6b7280',
    emoji: '⚫',
  },
}

// ─── Serviço ZapSign — chamadas reais via proxy ───────────────
export const ZapSignService = {

  // Criar documento para assinatura
  async criarDocumento(doc: ZapSignDocument): Promise<ZapSignDocumentResponse> {
    const res = await fetch('/api/zapsign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'criar', payload: doc }),
    })
    if (!res.ok) {
      const erro = await res.text()
      throw new Error(`ZapSign erro ${res.status}: ${erro}`)
    }
    return res.json()
  },

  // Listar documentos
  async listarDocumentos(pagina = 1): Promise<ZapSignListResponse> {
    const res = await fetch(`/api/zapsign?action=listar&page=${pagina}`)
    if (!res.ok) throw new Error(`ZapSign erro ${res.status}`)
    return res.json()
  },

  // Buscar documento por token
  async buscarDocumento(token: string): Promise<ZapSignDocumentResponse> {
    const res = await fetch(`/api/zapsign?action=buscar&token=${token}`)
    if (!res.ok) throw new Error(`ZapSign erro ${res.status}`)
    return res.json()
  },

  // Cancelar documento
  async cancelarDocumento(token: string): Promise<void> {
    const res = await fetch('/api/zapsign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancelar', token }),
    })
    if (!res.ok) throw new Error(`ZapSign erro ${res.status}`)
  },

  // Testar conexão com a API
  async testarConexao(): Promise<{ ok: boolean; conta?: string; erro?: string }> {
    try {
      const res = await fetch('/api/zapsign?action=teste')
      if (!res.ok) return { ok: false, erro: `HTTP ${res.status}` }
      const data = await res.json()
      return { ok: true, conta: data.email || 'Conta conectada' }
    } catch (e: any) {
      return { ok: false, erro: e.message }
    }
  },

  // Formatar mensagem de assinatura para WhatsApp
  formatarMensagemAssinatura(params: {
    nome: string
    tipoDocumento: string
    signUrl: string
    prazo: string
  }): string {
    return `Olá, *${params.nome}*! 👋\n\nO documento *${params.tipoDocumento}* está pronto para assinatura digital.\n\n✍️ *Clique para assinar:*\n${params.signUrl}\n\n⏰ *Prazo:* ${params.prazo}\n\n_Mauro Monção Advogados Associados — Teresina/PI_`
  },

  // Calcular status resumido
  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: '⏳ Aguardando assinatura',
      signed:  '✅ Assinado por todos',
      refused: '❌ Recusado',
    }
    return map[status] || status
  },

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      signed:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      refused: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return map[status] || 'bg-slate-500/20 text-slate-400'
  },
}

// ─── Webhook ────────────────────────────────────────────────────
export interface ZapSignWebhookEvent {
  type: 'doc_signed' | 'signer_signed' | 'doc_refused'
  docToken: string
  signerToken?: string
  signedAt?: string
  externalId?: string
}

export function processarWebhookZapSign(event: ZapSignWebhookEvent): {
  acao: string
  leadId?: string
  notificar: boolean
  proximoPasso: string
} {
  switch (event.type) {
    case 'doc_signed':
      return {
        acao: 'Contrato assinado por todos',
        leadId: event.externalId,
        notificar: true,
        proximoPasso: 'Gerar cobrança automática no Asaas',
      }
    case 'signer_signed':
      return {
        acao: 'Signatário assinou — aguardar demais',
        leadId: event.externalId,
        notificar: false,
        proximoPasso: 'Aguardar assinatura das demais partes',
      }
    case 'doc_refused':
      return {
        acao: 'Contrato recusado pelo cliente',
        leadId: event.externalId,
        notificar: true,
        proximoPasso: 'Contatar cliente via WhatsApp para entender objeção',
      }
    default:
      return { acao: 'Evento desconhecido', notificar: false, proximoPasso: '' }
  }
}
