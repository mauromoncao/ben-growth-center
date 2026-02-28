// ============================================================
// BEN GROWTH CENTER — ZapSign Integration
// Assinatura digital de contratos e procurações
// ============================================================

export interface ZapSignSigner {
  name: string
  email: string
  phone?: string
  sendAutomaticEmail?: boolean
  sendAutomaticWhatsapp?: boolean
  authMode?: 'assinaturaTela' | 'tokenEmail' | 'tokenWhatsapp' | 'selfie'
}

export interface ZapSignDocument {
  name: string
  urlPdf?: string
  base64Pdf?: string
  signers: ZapSignSigner[]
  lang?: 'pt' | 'en' | 'es'
  signDeadlineDays?: number
  message?: string
  externalId?: string
}

export interface ZapSignDocumentResponse {
  token: string
  name: string
  status: 'pending' | 'signed' | 'refused'
  createdAt: string
  signDeadline: string
  signers: Array<{
    token: string
    name: string
    email: string
    status: 'pending' | 'signed' | 'refused'
    signUrl: string
    signedAt?: string
  }>
  signedFileUrl?: string
  originalFileUrl: string
  externalId?: string
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
}> = {
  honorarios_tributario: {
    nome: 'Contrato de Honorários — Tributário',
    descricao: 'Contrato para causas de recuperação tributária, defesa fiscal e planejamento',
    campos: ['nomeCliente', 'cpfCnpj', 'enderecoCliente', 'objetoContrato', 'honorariosValor', 'honorariosSucesso'],
    signatarios: 2,
  },
  honorarios_previdenciario: {
    nome: 'Contrato de Honorários — Previdenciário',
    descricao: 'Contrato para aposentadorias, revisões de benefícios e recursos INSS',
    campos: ['nomeCliente', 'cpfCliente', 'enderecoCliente', 'tipoAposentadoria', 'honorariosSucesso'],
    signatarios: 2,
  },
  honorarios_bancario: {
    nome: 'Contrato de Honorários — Bancário',
    descricao: 'Contrato para revisão contratual, juros abusivos e superendividamento',
    campos: ['nomeCliente', 'cpfCnpj', 'enderecoCliente', 'bancoReu', 'valorDebito', 'honorariosFixo'],
    signatarios: 2,
  },
  procuracao_geral: {
    nome: 'Procuração Ad Judicia et Extra — Geral',
    descricao: 'Procuração para representação judicial e extrajudicial em geral',
    campos: ['nomeOutorgante', 'cpfOutorgante', 'enderecoOutorgante', 'estadoCivil'],
    signatarios: 2,
  },
  procuracao_especifica: {
    nome: 'Procuração Ad Judicia — Específica',
    descricao: 'Procuração específica para processo determinado',
    campos: ['nomeOutorgante', 'cpfOutorgante', 'enderecoOutorgante', 'finalidade', 'processo'],
    signatarios: 1,
  },
  termo_consulta: {
    nome: 'Termo de Consulta Jurídica',
    descricao: 'Termo para consultas avulsas e pareceres jurídicos',
    campos: ['nomeCliente', 'cpfCliente', 'assunto', 'valorConsulta'],
    signatarios: 2,
  },
}

export const ZapSignService = {
  baseUrl: 'https://api.zapsign.com.br/api/v1',

  async criarDocumento(doc: ZapSignDocument, apiToken: string): Promise<ZapSignDocumentResponse> {
    const mockToken = `doc_${Date.now()}`
    return {
      token: mockToken,
      name: doc.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      signDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      signers: doc.signers.map((s, i) => ({
        token: `signer_${i}_${Date.now()}`,
        name: s.name,
        email: s.email,
        status: 'pending',
        signUrl: `https://app.zapsign.com.br/verificar/signer_${i}_mock`,
      })),
      originalFileUrl: `https://zapsign.com.br/docs/${mockToken}/original.pdf`,
      externalId: doc.externalId,
    }
  },

  formatarMensagemAssinatura(params: {
    nome: string
    tipoDocumento: string
    signUrl: string
    prazo: string
  }): string {
    return `Olá, *${params.nome}*!\n\nO documento *${params.tipoDocumento}* está pronto para assinatura digital.\n\n✍️ Acesse: ${params.signUrl}\n\n⏰ Prazo: ${params.prazo}\n\n— *Mauro Monção Advogados Associados*`
  },
}

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
} {
  switch (event.type) {
    case 'doc_signed':
      return { acao: 'Contrato assinado — gerar cobrança no Asaas', leadId: event.externalId, notificar: true }
    case 'signer_signed':
      return { acao: 'Parte assinou — aguardar demais signatários', leadId: event.externalId, notificar: false }
    case 'doc_refused':
      return { acao: 'Contrato recusado — contatar cliente via WhatsApp', leadId: event.externalId, notificar: true }
    default:
      return { acao: 'Evento desconhecido', notificar: false }
  }
}
