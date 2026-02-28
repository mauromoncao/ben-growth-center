// ============================================================
// BEN GROWTH CENTER — Asaas Integration
// Gestão de pagamentos: Pix, Boleto, Cartão
// ============================================================

export type AsaasPaymentType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
export type AsaasPaymentStatus =
  | 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE'
  | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'

export interface AsaasCustomer {
  id?: string
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string  // Bairro
  postalCode?: string
  externalReference?: string  // leadId do CRM
  notificationDisabled?: boolean
  observations?: string
}

export interface AsaasPayment {
  customer: string       // ID do customer no Asaas
  billingType: AsaasPaymentType
  value: number
  dueDate: string        // YYYY-MM-DD
  description?: string
  externalReference?: string  // leadId/contratoId
  installmentCount?: number
  installmentValue?: number
  discount?: {
    value: number
    dueDateLimitDays: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  fine?: {
    value: number
    type: 'FIXED' | 'PERCENTAGE'
  }
  interest?: {
    value: number
    type: 'PERCENTAGE'
  }
  postalService?: boolean
}

export interface AsaasPaymentResponse {
  id: string
  customer: string
  billingType: AsaasPaymentType
  value: number
  netValue?: number
  originalValue?: number
  status: AsaasPaymentStatus
  dueDate: string
  description?: string
  bankSlipUrl?: string      // URL do boleto
  invoiceUrl?: string       // Link da fatura
  externalReference?: string
  pixQrCodeId?: string
  pixQrCode?: string        // Código Pix copia e cola
  pixExpirationDate?: string
}

export interface AsaasSubscription {
  customer: string
  billingType: AsaasPaymentType
  value: number
  nextDueDate: string
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description?: string
  externalReference?: string
  maxPayments?: number
}

// ─── Planos de honorários pré-configurados ───────────────────
export const PLANOS_HONORARIOS = {
  consulta_avulsa: {
    nome: 'Consulta Jurídica',
    valor: 300,
    tipo: 'PIX' as AsaasPaymentType,
    descricao: 'Consulta jurídica presencial ou online — 1 hora',
    vencimento_dias: 1,
  },
  tributario_entrada: {
    nome: 'Honorários Tributário — Entrada',
    valor: 2500,
    tipo: 'PIX' as AsaasPaymentType,
    descricao: 'Entrada dos honorários — Causa tributária',
    vencimento_dias: 3,
  },
  tributario_mensalidade: {
    nome: 'Honorários Tributário — Mensalidade',
    valor: 800,
    tipo: 'BOLETO' as AsaasPaymentType,
    descricao: 'Mensalidade de acompanhamento — Causa tributária',
    vencimento_dias: 5,
  },
  previdenciario_sucesso: {
    nome: 'Honorários Previdenciário — Êxito',
    valor: 3000,
    tipo: 'PIX' as AsaasPaymentType,
    descricao: 'Honorários de êxito — Aposentadoria concedida',
    vencimento_dias: 7,
  },
  bancario_entrada: {
    nome: 'Honorários Bancário — Entrada',
    valor: 1500,
    tipo: 'PIX' as AsaasPaymentType,
    descricao: 'Entrada dos honorários — Revisão contratual bancária',
    vencimento_dias: 3,
  },
}

// ─── Serviço Asaas ───────────────────────────────────────────
export const AsaasService = {
  // Produção: https://www.asaas.com/api/v3
  // Sandbox: https://sandbox.asaas.com/api/v3
  baseUrl: 'https://www.asaas.com/api/v3',
  sandboxUrl: 'https://sandbox.asaas.com/api/v3',

  /**
   * Cria cliente no Asaas
   */
  async criarCliente(cliente: AsaasCustomer, apiKey: string): Promise<AsaasCustomer & { id: string }> {
    // Em produção:
    // const response = await fetch(`${this.baseUrl}/customers`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'access_token': apiKey,
    //   },
    //   body: JSON.stringify(cliente)
    // })
    // return response.json()

    // Mock
    return {
      ...cliente,
      id: `cus_${Date.now()}`,
    }
  },

  /**
   * Cria cobrança (Pix, Boleto ou Cartão)
   */
  async criarCobranca(pagamento: AsaasPayment, apiKey: string): Promise<AsaasPaymentResponse> {
    // Em produção:
    // const response = await fetch(`${this.baseUrl}/payments`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'access_token': apiKey,
    //   },
    //   body: JSON.stringify(pagamento)
    // })
    // return response.json()

    // Mock
    const mockId = `pay_${Date.now()}`
    return {
      id: mockId,
      customer: pagamento.customer,
      billingType: pagamento.billingType,
      value: pagamento.value,
      netValue: pagamento.value * 0.982, // Descontando taxa
      status: 'PENDING',
      dueDate: pagamento.dueDate,
      description: pagamento.description,
      bankSlipUrl: pagamento.billingType === 'BOLETO'
        ? `https://www.asaas.com/b/pdf/${mockId}`
        : undefined,
      invoiceUrl: `https://www.asaas.com/i/${mockId}`,
      pixQrCode: pagamento.billingType === 'PIX'
        ? `00020126580014br.gov.bcb.pix0136mock-pix-key-${mockId}5204000053039865406${pagamento.value.toFixed(2)}5802BR5920MAURO MONCAO ADVOGADOS6008TERESINA62070503***6304MOCK`
        : undefined,
      pixExpirationDate: pagamento.billingType === 'PIX'
        ? new Date(Date.now() + 86400000).toISOString()
        : undefined,
      externalReference: pagamento.externalReference,
    }
  },

  /**
   * Cria assinatura recorrente (mensalidades)
   */
  async criarAssinatura(sub: AsaasSubscription, apiKey: string): Promise<{ id: string; status: string }> {
    // Mock
    return { id: `sub_${Date.now()}`, status: 'ACTIVE' }
  },

  /**
   * Formata mensagem WhatsApp com link de pagamento
   */
  formatarMensagemCobranca(params: {
    nome: string
    descricao: string
    valor: number
    vencimento: string
    invoiceUrl: string
    pixQrCode?: string
    billingType: AsaasPaymentType
  }): string {
    const valorFormatado = params.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const tipoLabel = {
      PIX: '⚡ Pix',
      BOLETO: '🧾 Boleto',
      CREDIT_CARD: '💳 Cartão',
      UNDEFINED: '💰 Pagamento',
    }[params.billingType]

    let msg = `💼 *Honorários — Mauro Monção Advogados*\n\n`
    msg += `📋 ${params.descricao}\n`
    msg += `💰 Valor: *${valorFormatado}*\n`
    msg += `📅 Vencimento: ${params.vencimento}\n`
    msg += `${tipoLabel}\n\n`
    msg += `🔗 Pagar online: ${params.invoiceUrl}\n`

    if (params.pixQrCode && params.billingType === 'PIX') {
      msg += `\n📱 *Pix copia e cola:*\n\`${params.pixQrCode.substring(0, 50)}...\`\n`
    }

    msg += `\nDúvidas? Responda esta mensagem.\n— *Equipe Mauro Monção Advogados*`

    return msg
  },

  /**
   * Calcula valor líquido após taxas do Asaas
   */
  calcularValorLiquido(valor: number, tipo: AsaasPaymentType): number {
    const taxas = {
      PIX: 0.01,          // R$ 0,01 fixo (Asaas cobra 1 centavo no Pix)
      BOLETO: 1.99,       // R$ 1,99 por boleto
      CREDIT_CARD: valor * 0.0199, // 1,99% no cartão
      UNDEFINED: 0,
    }
    return valor - (taxas[tipo] || 0)
  },
}

// ─── Webhook Asaas ────────────────────────────────────────────
export interface AsaasWebhookEvent {
  event: string
  payment: {
    id: string
    customer: string
    status: AsaasPaymentStatus
    value: number
    externalReference?: string
    billingType: AsaasPaymentType
  }
}

export function processarWebhookAsaas(event: AsaasWebhookEvent): {
  acao: string
  leadId?: string
  notificar: boolean
  statusCRM?: string
} {
  switch (event.event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      return {
        acao: 'Pagamento recebido — atualizar CRM para "Pago" e notificar advogado',
        leadId: event.payment.externalReference,
        notificar: true,
        statusCRM: 'pago',
      }
    case 'PAYMENT_OVERDUE':
      return {
        acao: 'Pagamento vencido — enviar lembrete automático via WhatsApp',
        leadId: event.payment.externalReference,
        notificar: true,
        statusCRM: 'inadimplente',
      }
    case 'PAYMENT_REFUNDED':
      return {
        acao: 'Pagamento estornado — verificar situação com cliente',
        leadId: event.payment.externalReference,
        notificar: true,
        statusCRM: 'estornado',
      }
    default:
      return { acao: 'Evento Asaas não mapeado', notificar: false }
  }
}
