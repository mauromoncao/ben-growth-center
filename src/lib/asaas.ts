// ============================================================
// BEN GROWTH CENTER — Asaas Integration (PRODUÇÃO)
// Token configurado — chamadas reais via /api/asaas proxy
// ============================================================

export type AsaasPaymentType   = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
export type AsaasPaymentStatus =
  | 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE'
  | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS'

// ─── Interfaces ───────────────────────────────────────────────
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
  province?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
  observations?: string
}

export interface AsaasPayment {
  customer: string
  billingType: AsaasPaymentType
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  installmentCount?: number
  installmentValue?: number
  discount?: { value: number; dueDateLimitDays: number; type: 'FIXED' | 'PERCENTAGE' }
  fine?:     { value: number; type: 'FIXED' | 'PERCENTAGE' }
  interest?: { value: number; type: 'PERCENTAGE' }
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
  bankSlipUrl?: string
  invoiceUrl?: string
  externalReference?: string
  pixQrCodeId?: string
  pixQrCode?: string
  pixPayload?: string
  pixQrCodeImg?: string
  pixExpirationDate?: string
}

export interface AsaasListResponse<T> {
  object: 'list'
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: T[]
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

export interface AsaasBalance {
  balance: number
}

export interface AsaasAccount {
  name: string
  email: string
  cpfCnpj: string
  personType: string
  companyType?: string
  phone?: string
  mobilePhone?: string
  site?: string
  city?: string
  state?: string
}

// ─── Planos de Honorários pré-configurados ────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────
function dueDateFromDays(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

// ─── Serviço Asaas — chamadas reais via proxy ─────────────────
export const AsaasService = {

  // Teste de conexão
  async testarConexao(): Promise<{ ok: boolean; conta?: string; saldo?: number; erro?: string }> {
    try {
      const [contaRes, saldoRes] = await Promise.all([
        fetch('/api/asaas?action=teste'),
        fetch('/api/asaas?action=saldo'),
      ])
      if (!contaRes.ok) return { ok: false, erro: `HTTP ${contaRes.status}` }
      const conta = await contaRes.json() as AsaasAccount
      const saldo = saldoRes.ok ? ((await saldoRes.json()) as AsaasBalance).balance : undefined
      return { ok: true, conta: conta.name, saldo }
    } catch (e: any) {
      return { ok: false, erro: e.message }
    }
  },

  // Criar cliente
  async criarCliente(cliente: AsaasCustomer): Promise<AsaasCustomer & { id: string }> {
    const res = await fetch('/api/asaas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'criar_cliente', cliente }),
    })
    if (!res.ok) throw new Error(`Asaas erro ${res.status}: ${await res.text()}`)
    return res.json()
  },

  // Listar clientes
  async listarClientes(offset = 0, limit = 20): Promise<AsaasListResponse<AsaasCustomer>> {
    const res = await fetch(`/api/asaas?action=listar_clientes&offset=${offset}&limit=${limit}`)
    if (!res.ok) throw new Error(`Asaas erro ${res.status}`)
    return res.json()
  },

  // Criar cobrança real (Pix, Boleto ou Cartão)
  async criarCobranca(pagamento: AsaasPayment): Promise<AsaasPaymentResponse> {
    const res = await fetch('/api/asaas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'criar_cobranca', cobranca: pagamento }),
    })
    if (!res.ok) throw new Error(`Asaas erro ${res.status}: ${await res.text()}`)
    return res.json()
  },

  // Criar cobrança a partir de um plano
  async cobrarPorPlano(
    customerId: string,
    plano: keyof typeof PLANOS_HONORARIOS,
    externalRef?: string
  ): Promise<AsaasPaymentResponse> {
    const p = PLANOS_HONORARIOS[plano]
    return this.criarCobranca({
      customer: customerId,
      billingType: p.tipo,
      value: p.valor,
      dueDate: dueDateFromDays(p.vencimento_dias),
      description: p.descricao,
      externalReference: externalRef,
    })
  },

  // Listar cobranças
  async listarCobrancas(
    offset = 0,
    limit = 20,
    status?: string
  ): Promise<AsaasListResponse<AsaasPaymentResponse>> {
    const params = new URLSearchParams({
      action: 'listar_cobrancas',
      offset: String(offset),
      limit: String(limit),
    })
    if (status) params.set('status', status)
    const res = await fetch(`/api/asaas?${params}`)
    if (!res.ok) throw new Error(`Asaas erro ${res.status}`)
    return res.json()
  },

  // Buscar QR Code Pix
  async buscarPixQrCode(paymentId: string): Promise<{ payload: string; encodedImage: string }> {
    const res = await fetch(`/api/asaas?action=pix_qrcode&id=${paymentId}`)
    if (!res.ok) throw new Error(`Asaas erro ${res.status}`)
    return res.json()
  },

  // Cancelar cobrança
  async cancelarCobranca(id: string): Promise<void> {
    const res = await fetch('/api/asaas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancelar_cobranca', id }),
    })
    if (!res.ok) throw new Error(`Asaas erro ${res.status}`)
  },

  // Saldo da conta
  async saldo(): Promise<number> {
    const res = await fetch('/api/asaas?action=saldo')
    if (!res.ok) throw new Error(`Asaas erro ${res.status}`)
    const data = await res.json() as AsaasBalance
    return data.balance
  },

  // Formatar mensagem WhatsApp com cobrança
  formatarMensagemCobranca(params: {
    nome: string
    descricao: string
    valor: number
    vencimento: string
    invoiceUrl: string
    pixPayload?: string
    billingType: AsaasPaymentType
  }): string {
    const fmtValor = params.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const tipoLabel: Record<string, string> = {
      PIX: '⚡ Pix', BOLETO: '🧾 Boleto', CREDIT_CARD: '💳 Cartão', UNDEFINED: '💰 Pagamento',
    }
    let msg = `💼 *Honorários — Mauro Monção Advogados*\n\n`
    msg += `📋 ${params.descricao}\n`
    msg += `💰 Valor: *${fmtValor}*\n`
    msg += `📅 Vencimento: ${params.vencimento}\n`
    msg += `${tipoLabel[params.billingType] || '💰'}\n\n`
    msg += `🔗 Pagar online: ${params.invoiceUrl}\n`
    if (params.pixPayload && params.billingType === 'PIX') {
      msg += `\n📱 *Pix copia e cola:*\n\`${params.pixPayload.substring(0, 60)}...\`\n`
    }
    msg += `\nDúvidas? Responda esta mensagem.\n— *Equipe Mauro Monção Advogados* | Parnaíba/PI`
    return msg
  },

  // Calcular valor líquido após taxas
  calcularValorLiquido(valor: number, tipo: AsaasPaymentType): number {
    const taxas: Record<string, number> = {
      PIX: 0.01, BOLETO: 1.99, CREDIT_CARD: valor * 0.0199, UNDEFINED: 0,
    }
    return valor - (taxas[tipo] || 0)
  },

  // Labels de status
  getStatusLabel(status: AsaasPaymentStatus): string {
    const map: Record<string, string> = {
      PENDING:          '⏳ Aguardando',
      RECEIVED:         '✅ Recebido',
      CONFIRMED:        '✅ Confirmado',
      OVERDUE:          '🔴 Vencido',
      REFUNDED:         '↩️ Estornado',
      RECEIVED_IN_CASH: '💵 Recebido em dinheiro',
    }
    return map[status] || status
  },

  getStatusColor(status: AsaasPaymentStatus): string {
    const map: Record<string, string> = {
      PENDING:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
      RECEIVED:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      CONFIRMED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      OVERDUE:   'bg-red-500/20 text-red-300 border-red-500/30',
      REFUNDED:  'bg-slate-500/20 text-slate-300 border-slate-500/30',
    }
    return map[status] || 'bg-slate-500/20 text-slate-300'
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
  acao: string; leadId?: string; notificar: boolean; statusCRM?: string
} {
  switch (event.event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      return { acao: 'Pagamento recebido — atualizar CRM e notificar advogado', leadId: event.payment.externalReference, notificar: true, statusCRM: 'pago' }
    case 'PAYMENT_OVERDUE':
      return { acao: 'Pagamento vencido — enviar lembrete via WhatsApp', leadId: event.payment.externalReference, notificar: true, statusCRM: 'inadimplente' }
    case 'PAYMENT_REFUNDED':
      return { acao: 'Pagamento estornado — verificar com cliente', leadId: event.payment.externalReference, notificar: true, statusCRM: 'estornado' }
    default:
      return { acao: 'Evento Asaas não mapeado', notificar: false }
  }
}
