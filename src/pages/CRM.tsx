import React, { useState } from 'react'
import {
  Phone, MessageCircle, Mail, Clock, AlertCircle,
  ChevronRight, User, Bot, Star, X,
  CheckCircle2, Calendar, Tag, ExternalLink,
  Video, FileSignature, CreditCard, Send,
  CalendarCheck, Banknote, FileText, RefreshCw,
  Copy, Check, ArrowUpRight, Zap
} from 'lucide-react'
import { formatCurrency, getStatusLabel } from '../lib/utils'
import { ZapSignTemplates, type TipoContrato } from '../lib/zapsign'
import { PLANOS_HONORARIOS } from '../lib/asaas'
import { GoogleCalendarService } from '../lib/googleWorkspace'

// ─── Tipos ──────────────────────────────────────────────────
export type Urgency = 'alta' | 'media' | 'baixa'
export type CRMStatus = 'novo' | 'qualificado' | 'aguardando' | 'em_atendimento' | 'convertido' | 'perdido'

export interface Mensagem {
  role: 'dr_ben' | 'lead' | 'humano'
  texto: string
  hora: string
}

export interface ReuniaoAgendada {
  id: string
  dataHora: string
  duracao: number
  meetLink: string
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada'
}

export interface ContratoAssinatura {
  id: string
  tipo: TipoContrato
  nome: string
  status: 'rascunho' | 'enviado' | 'assinado' | 'recusado'
  criadoEm: string
  signUrl?: string
  signedFileUrl?: string
}

export interface CobrancaAsaas {
  id: string
  descricao: string
  valor: number
  tipo: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE'
  vencimento: string
  invoiceUrl?: string
  pixQrCode?: string
}

export interface CRMLead {
  id: string
  nome: string
  telefone: string
  email: string
  area: string
  origem: string
  status: CRMStatus
  urgencia: Urgency
  score: number
  criadoEm: string
  ultimaInteracao: string
  resumoIA: string
  conversa: Mensagem[]
  plantonista?: string
  valor?: number
  tags: string[]
  // FASE A — Integrações
  reunioes?: ReuniaoAgendada[]
  contratos?: ContratoAssinatura[]
  cobrancas?: CobrancaAsaas[]
  driveLink?: string
  // FASE B
  emails?: Array<{ assunto: string; data: string; lido: boolean }>
}

// ─── Dados Mock ─────────────────────────────────────────────
export const crmLeadsMock: CRMLead[] = [
  {
    id: 'crm1',
    nome: 'Carlos Mendes',
    telefone: '(86) 99801-2345',
    email: 'carlos@email.com',
    area: 'Tributário',
    origem: 'WhatsApp',
    status: 'aguardando',
    urgencia: 'alta',
    score: 92,
    criadoEm: '28/02/2026 08:32',
    ultimaInteracao: '28/02/2026 09:14',
    resumoIA: 'Empresário com débito tributário de R$ 180k na Receita Federal. Busca parcelamento ou defesa administrativa. Alta intenção de contratar. Solicitou reunião presencial.',
    conversa: [
      { role: 'lead', texto: 'Olá, preciso de ajuda com uma dívida na Receita Federal', hora: '08:32' },
      { role: 'dr_ben', texto: 'Olá! Sou o Dr. Ben, assistente do escritório Mauro Monção. Pode me contar mais sobre a situação? Qual o valor aproximado e se já recebeu alguma notificação?', hora: '08:32' },
      { role: 'lead', texto: 'Sim, recebi uma notificação de R$ 180 mil, é ICMS atrasado dos últimos 3 anos', hora: '08:35' },
      { role: 'dr_ben', texto: 'Entendo. Essa situação tem solução! Temos duas opções principais: defesa administrativa ou parcelamento especial. O Dr. Mauro é especialista nesse tipo de caso. Você prefere ser atendido hoje ou amanhã?', hora: '08:35' },
      { role: 'lead', texto: 'Quanto antes melhor, é urgente', hora: '08:40' },
      { role: 'dr_ben', texto: '✅ Perfeito! Registrei sua solicitação como URGENTE. Um especialista humano entrará em contato em até 30 minutos. Seu caso foi encaminhado com prioridade máxima.', hora: '08:40' },
    ],
    tags: ['urgente', 'alto-valor', 'ICMS'],
    valor: 18000,
    reunioes: [],
    contratos: [],
    cobrancas: [],
  },
  {
    id: 'crm2',
    nome: 'Ana Paula Sousa',
    telefone: '(86) 99712-8765',
    email: 'ana@email.com',
    area: 'Previdenciário',
    origem: 'Site',
    status: 'qualificado',
    urgencia: 'media',
    score: 74,
    criadoEm: '28/02/2026 09:20',
    ultimaInteracao: '28/02/2026 09:28',
    resumoIA: 'Trabalhadora rural com 28 anos de contribuição. Pedido de aposentadoria negado pelo INSS. Quer recorrer administrativamente. Perfil de conversão médio-alto.',
    conversa: [
      { role: 'lead', texto: 'Meu pedido de aposentadoria foi negado pelo INSS', hora: '09:20' },
      { role: 'dr_ben', texto: 'Lamento saber disso! Mas saiba que muitos casos negados podem ser revertidos. Há quanto tempo você contribui e qual foi o motivo do indeferimento?', hora: '09:20' },
      { role: 'lead', texto: '28 anos como trabalhadora rural. Disseram que faltou comprovação', hora: '09:22' },
      { role: 'dr_ben', texto: 'Trabalhadora rural tem proteção especial na lei! Com 28 anos de trabalho, você provavelmente tem direito. Posso agendar uma consulta gratuita com o Dr. Mauro?', hora: '09:23' },
    ],
    tags: ['rural', 'INSS-negado'],
    valor: 3000,
    reunioes: [
      {
        id: 'reu1',
        dataHora: '2026-03-02T10:00:00',
        duracao: 60,
        meetLink: 'https://meet.google.com/abc-xyz-123',
        status: 'agendada',
      }
    ],
    contratos: [],
    cobrancas: [],
    emails: [
      { assunto: 'Confirmação de reunião — 02/03', data: '28/02 09:30', lido: true },
    ],
  },
  {
    id: 'crm3',
    nome: 'Roberto Lima',
    telefone: '(86) 98823-4567',
    email: 'roberto@empresa.com',
    area: 'Tributário',
    origem: 'Google Ads',
    status: 'em_atendimento',
    urgencia: 'alta',
    score: 88,
    criadoEm: '27/02/2026 14:15',
    ultimaInteracao: '28/02/2026 08:00',
    resumoIA: 'Empresário buscando planejamento tributário para redução de IRPJ/CSLL. Faturamento anual R$ 2M. Alto potencial de honorários recorrentes.',
    conversa: [
      { role: 'lead', texto: 'Quero reduzir minha carga tributária', hora: '14:15' },
      { role: 'dr_ben', texto: 'Excelente! O planejamento tributário correto pode reduzir significativamente o IRPJ e CSLL. Qual seu regime atual — Simples, Presumido ou Real?', hora: '14:15' },
    ],
    tags: ['planejamento', 'empresa', 'recorrente'],
    valor: 12000,
    reunioes: [],
    contratos: [
      {
        id: 'cont1',
        tipo: 'honorarios_tributario',
        nome: 'Contrato de Honorários — Tributário',
        status: 'enviado',
        criadoEm: '28/02/2026 08:30',
        signUrl: 'https://app.zapsign.com.br/verificar/mock-roberto',
      }
    ],
    cobrancas: [
      {
        id: 'cob1',
        descricao: 'Honorários Tributário — Entrada',
        valor: 2500,
        tipo: 'PIX',
        status: 'PENDING',
        vencimento: '03/03/2026',
        invoiceUrl: 'https://www.asaas.com/i/mock-roberto',
        pixQrCode: '00020126580014br.gov.bcb.pix0136mock-key-roberto',
      }
    ],
    emails: [],
  },
  {
    id: 'crm4',
    nome: 'Fernanda Costa',
    telefone: '(86) 99934-5678',
    email: 'fernanda@email.com',
    area: 'Bancário',
    origem: 'Instagram',
    status: 'convertido',
    urgencia: 'media',
    score: 96,
    criadoEm: '25/02/2026 10:00',
    ultimaInteracao: '27/02/2026 16:00',
    resumoIA: 'Consumidora com juros abusivos em financiamento imobiliário. Contrato assinado e pago. Caso em andamento.',
    conversa: [
      { role: 'lead', texto: 'Tenho juros altíssimos no meu financiamento', hora: '10:00' },
      { role: 'dr_ben', texto: 'Isso é mais comum do que parece! Podemos revisar o contrato e recuperar o que foi cobrado a mais.', hora: '10:00' },
    ],
    tags: ['convertido', 'bancário', 'juros-abusivos'],
    valor: 8500,
    reunioes: [
      {
        id: 'reu2',
        dataHora: '2026-02-26T14:00:00',
        duracao: 60,
        meetLink: 'https://meet.google.com/def-456-ghi',
        status: 'realizada',
      }
    ],
    contratos: [
      {
        id: 'cont2',
        tipo: 'honorarios_bancario',
        nome: 'Contrato de Honorários — Bancário',
        status: 'assinado',
        criadoEm: '26/02/2026 15:00',
        signedFileUrl: 'https://drive.google.com/file/d/mock-fernanda/view',
      }
    ],
    cobrancas: [
      {
        id: 'cob2',
        descricao: 'Honorários Bancário — Entrada',
        valor: 1500,
        tipo: 'PIX',
        status: 'CONFIRMED',
        vencimento: '27/02/2026',
      }
    ],
    driveLink: 'https://drive.google.com/drive/folders/mock-fernanda',
    emails: [
      { assunto: 'Contrato assinado — cópia para você', data: '26/02 15:05', lido: true },
      { assunto: 'Recibo de pagamento — Asaas', data: '27/02 09:00', lido: true },
    ],
  },
  {
    id: 'crm5',
    nome: 'Marcelo Barbosa',
    telefone: '(86) 99856-7890',
    email: 'marcelo@email.com',
    area: 'Previdenciário',
    origem: 'ManyChat',
    status: 'novo',
    urgencia: 'baixa',
    score: 45,
    criadoEm: '28/02/2026 10:55',
    ultimaInteracao: '28/02/2026 10:58',
    resumoIA: 'Lead captado via ManyChat Instagram. Interesse em aposentadoria por tempo de contribuição. Score baixo — ainda em fase de educação/nutrição.',
    conversa: [
      { role: 'lead', texto: 'Vi no Instagram sobre aposentadoria', hora: '10:55' },
      { role: 'dr_ben', texto: 'Olá! Fico feliz que tenha entrado em contato. Você tem quantos anos de contribuição aproximadamente?', hora: '10:55' },
      { role: 'lead', texto: 'Uns 20 anos', hora: '10:57' },
    ],
    tags: ['manychat', 'instagram', 'nurturing'],
    reunioes: [],
    contratos: [],
    cobrancas: [],
  },
]

// ─── Configurações visuais ───────────────────────────────────
const COLUNAS = [
  { id: 'novo', label: 'Novos', icone: '🆕', cor: 'border-blue-200 bg-blue-50/50' },
  { id: 'qualificado', label: 'Qualificados', icone: '⭐', cor: 'border-amber-200 bg-amber-50/50' },
  { id: 'aguardando', label: 'Aguardando', icone: '⏳', cor: 'border-orange-200 bg-orange-50/50' },
  { id: 'em_atendimento', label: 'Em Atendimento', icone: '🎯', cor: 'border-purple-200 bg-purple-50/50' },
  { id: 'convertido', label: 'Convertidos', icone: '🏆', cor: 'border-emerald-200 bg-emerald-50/50' },
  { id: 'perdido', label: 'Perdidos', icone: '❌', cor: 'border-white/10 bg-white/4/50' },
] as const

const URGENCIA_CONFIG = {
  alta: { label: 'Urgente', cor: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  media: { label: 'Médio', cor: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  baixa: { label: 'Baixo', cor: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

const ORIGEM_ICONE: Record<string, string> = {
  'WhatsApp': '💬',
  'Site': '🌐',
  'Google Ads': '🎯',
  'Instagram': '📸',
  'Meta Ads': '🟣',
  'Orgânico': '🟢',
  'ManyChat': '🤖',
}

const STATUS_COBRANCA: Record<string, { label: string; cor: string }> = {
  PENDING: { label: 'Aguardando', cor: 'text-amber-600 bg-amber-50' },
  RECEIVED: { label: 'Recebido', cor: 'text-emerald-600 bg-emerald-50' },
  CONFIRMED: { label: 'Confirmado', cor: 'text-emerald-700 bg-emerald-50' },
  OVERDUE: { label: 'Vencido', cor: 'text-red-600 bg-red-50' },
}

const STATUS_CONTRATO: Record<string, { label: string; cor: string }> = {
  rascunho: { label: 'Rascunho', cor: 'text-white/80 bg-white/6' },
  enviado: { label: 'Aguard. Assinatura', cor: 'text-amber-600 bg-amber-50' },
  assinado: { label: 'Assinado ✓', cor: 'text-emerald-700 bg-emerald-50' },
  recusado: { label: 'Recusado', cor: 'text-red-600 bg-red-50' },
}

// ─── Modal de Agendamento ─────────────────────────────────────
function ModalAgendamento({ lead, onClose, onConfirm }: {
  lead: CRMLead
  onClose: () => void
  onConfirm: (reuniao: ReuniaoAgendada) => void
}) {
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horaSelecionada, setHoraSelecionada] = useState('')
  const [assunto, setAssunto] = useState(`Reunião de Fechamento — ${lead.nome}`)
  const [criando, setCriando] = useState(false)
  const [criado, setCriado] = useState(false)
  const [reuniaoData, setReuniaoData] = useState<{ meetLink: string; eventId: string } | null>(null)

  const slots = GoogleCalendarService.buscarSlotsDisponiveis
  const proximosDias = []
  const hoje = new Date()
  for (let i = 1; i <= 5; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    if ([1, 2, 3, 4, 5].includes(d.getDay())) {
      proximosDias.push({
        valor: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }),
      })
    }
  }

  const horarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

  const handleConfirmar = async () => {
    if (!dataSelecionada || !horaSelecionada) return
    setCriando(true)
    await new Promise(r => setTimeout(r, 1200))
    const meetLink = `https://meet.google.com/${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 3)}`
    const eventId = `evt_${Date.now()}`
    setReuniaoData({ meetLink, eventId })
    setCriando(false)
    setCriado(true)
    onConfirm({
      id: eventId,
      dataHora: `${dataSelecionada}T${horaSelecionada}:00`,
      duracao: 60,
      meetLink,
      status: 'agendada',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-white">Agendar Reunião Google Meet</h3>
              <p className="text-white/50 text-xs">{lead.nome} · {lead.area}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/6 rounded-lg">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {!criado ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/80 mb-2 block">Assunto da Reunião</label>
              <input
                value={assunto}
                onChange={e => setAssunto(e.target.value)}
                className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/55"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-white/80 mb-2 block">📅 Data</label>
              <div className="grid grid-cols-3 gap-2">
                {proximosDias.map(d => (
                  <button
                    key={d.valor}
                    onClick={() => setDataSelecionada(d.valor)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${dataSelecionada === d.valor ? 'bg-navy text-white border-primary' : 'border-white/10 hover:border-white/55'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/80 mb-2 block">⏰ Horário</label>
              <div className="grid grid-cols-3 gap-2">
                {horarios.map(h => (
                  <button
                    key={h}
                    onClick={() => setHoraSelecionada(h)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${horaSelecionada === h ? 'bg-navy text-white border-primary' : 'border-white/10 hover:border-white/55'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
              <Video className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-blue-700 text-xs">Link Google Meet será criado automaticamente e enviado para <strong>{lead.email}</strong> e WhatsApp do cliente.</p>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={!dataSelecionada || !horaSelecionada || criando}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {criando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Criando no Google Calendar...
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  Confirmar e Criar Reunião
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-700">Reunião Criada com Sucesso!</p>
              <p className="text-emerald-600 text-sm mt-1">
                {new Date(`${dataSelecionada}T${horaSelecionada}`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {horaSelecionada}
              </p>
            </div>

            {reuniaoData && (
              <div className="bg-white/4 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">🎥 Link Google Meet</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(reuniaoData.meetLink)}
                    className="text-xs text-gold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
                <p className="text-sm font-mono text-gold break-all">{reuniaoData.meetLink}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Mail className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-blue-700">Email enviado<br/>para {lead.email}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <MessageCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-green-700">WhatsApp enviado<br/>para {lead.telefone}</p>
              </div>
            </div>

            <button onClick={onClose} className="w-full bg-white/6 text-white/90 py-2.5 rounded-xl font-medium text-sm hover:bg-white/8 transition-colors">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal de Contrato ZapSign ────────────────────────────────
function ModalContrato({ lead, onClose, onConfirm }: {
  lead: CRMLead
  onClose: () => void
  onConfirm: (contrato: ContratoAssinatura) => void
}) {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoContrato | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [signUrl, setSignUrl] = useState('')

  const handleEnviar = async () => {
    if (!tipoSelecionado) return
    setEnviando(true)
    await new Promise(r => setTimeout(r, 1500))
    const url = `https://app.zapsign.com.br/verificar/mock-${lead.id}-${Date.now()}`
    setSignUrl(url)
    setEnviando(false)
    setEnviado(true)
    onConfirm({
      id: `cont_${Date.now()}`,
      tipo: tipoSelecionado,
      nome: ZapSignTemplates[tipoSelecionado].nome,
      status: 'enviado',
      criadoEm: new Date().toLocaleString('pt-BR'),
      signUrl: url,
    })
  }

  const tiposDisponiveis: TipoContrato[] = lead.area === 'Tributário'
    ? ['honorarios_tributario', 'procuracao_geral', 'procuracao_especifica', 'termo_consulta']
    : lead.area === 'Previdenciário'
    ? ['honorarios_previdenciario', 'procuracao_geral', 'termo_consulta']
    : ['honorarios_bancario', 'procuracao_geral', 'termo_consulta']

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-white">Gerar Contrato — ZapSign</h3>
              <p className="text-white/50 text-xs">{lead.nome} · Assinatura digital</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/6 rounded-lg">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {!enviado ? (
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80 block">Tipo de Documento</label>
              {tiposDisponiveis.map(tipo => {
                const t = ZapSignTemplates[tipo]
                return (
                  <button
                    key={tipo}
                    onClick={() => setTipoSelecionado(tipo)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${tipoSelecionado === tipo ? 'border-violet-400 bg-violet-50' : 'border-white/10 hover:border-white/12'}`}
                  >
                    <p className="font-medium text-sm text-white">{t.nome}</p>
                    <p className="text-xs text-white/60 mt-0.5">{t.descricao}</p>
                    <p className="text-xs text-violet-600 mt-1">✍️ {t.signatarios} signatário{t.signatarios > 1 ? 's' : ''}</p>
                  </button>
                )
              })}
            </div>

            <div className="bg-violet-50 rounded-xl p-3 flex items-start gap-2">
              <FileSignature className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-violet-700 text-xs">O link de assinatura será enviado via WhatsApp e email para <strong>{lead.nome}</strong>. Válido por 7 dias.</p>
            </div>

            <button
              onClick={handleEnviar}
              disabled={!tipoSelecionado || enviando}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {enviando ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando no ZapSign...</>
              ) : (
                <><Send className="w-4 h-4" /> Gerar e Enviar Contrato</>
              )}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-700">Contrato Enviado!</p>
              <p className="text-emerald-600 text-sm mt-1">Aguardando assinatura de {lead.nome}</p>
            </div>

            <div className="bg-white/4 rounded-xl p-3 space-y-2">
              <span className="text-xs text-white/60">🔗 Link de assinatura</span>
              <p className="text-xs font-mono text-violet-600 break-all">{signUrl}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(signUrl)}
                className="text-xs text-violet-600 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copiar link
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <MessageCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-green-700">WhatsApp<br/>enviado</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Mail className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-blue-700">Email<br/>enviado</p>
              </div>
            </div>

            <button onClick={onClose} className="w-full bg-white/6 text-white/90 py-2.5 rounded-xl font-medium text-sm hover:bg-white/8 transition-colors">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal de Cobrança Asaas ──────────────────────────────────
function ModalCobranca({ lead, onClose, onConfirm }: {
  lead: CRMLead
  onClose: () => void
  onConfirm: (cobranca: CobrancaAsaas) => void
}) {
  const [planoSelecionado, setPlanoSelecionado] = useState<keyof typeof PLANOS_HONORARIOS | null>(null)
  const [tipoPersonalizado, setTipoPersonalizado] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX')
  const [valorPersonalizado, setValorPersonalizado] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [cobrancaData, setCobrancaData] = useState<CobrancaAsaas | null>(null)

  const planosArea = Object.entries(PLANOS_HONORARIOS).filter(([k]) => {
    if (lead.area === 'Tributário') return k.includes('tributario') || k === 'consulta_avulsa'
    if (lead.area === 'Previdenciário') return k.includes('previdenciario') || k === 'consulta_avulsa'
    if (lead.area === 'Bancário') return k.includes('bancario') || k === 'consulta_avulsa'
    return k === 'consulta_avulsa'
  })

  const handleGerar = async () => {
    if (!planoSelecionado && !valorPersonalizado) return
    setEnviando(true)
    await new Promise(r => setTimeout(r, 1200))

    const plano = planoSelecionado ? PLANOS_HONORARIOS[planoSelecionado] : null
    const valor = plano ? plano.valor : parseFloat(valorPersonalizado)
    const tipo = plano ? plano.tipo : tipoPersonalizado
    const venc = new Date(Date.now() + 3 * 86400000).toLocaleDateString('pt-BR')

    const nova: CobrancaAsaas = {
      id: `cob_${Date.now()}`,
      descricao: plano ? plano.nome : 'Honorários Jurídicos',
      valor,
      tipo,
      status: 'PENDING',
      vencimento: venc,
      invoiceUrl: `https://www.asaas.com/i/mock-${lead.id}`,
      pixQrCode: tipo === 'PIX' ? `00020126580014br.gov.bcb.pix0136mock-${lead.id}` : undefined,
    }
    setCobrancaData(nova)
    setEnviando(false)
    setEnviado(true)
    onConfirm(nova)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-white">Gerar Cobrança — Asaas</h3>
              <p className="text-white/50 text-xs">{lead.nome} · Pix · Boleto · Cartão</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/6 rounded-lg">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {!enviado ? (
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80 block">Planos de Honorários</label>
              {planosArea.map(([key, plano]) => (
                <button
                  key={key}
                  onClick={() => setPlanoSelecionado(key as keyof typeof PLANOS_HONORARIOS)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${planoSelecionado === key ? 'border-emerald-400 bg-emerald-50' : 'border-white/10 hover:border-white/12'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-white">{plano.nome}</p>
                    <span className="font-bold text-emerald-600 text-sm">{formatCurrency(plano.valor)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/60">{plano.tipo === 'PIX' ? '⚡ Pix' : '🧾 Boleto'}</span>
                    <span className="text-xs text-white/50">· Vence em {plano.vencimento_dias}d</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-white/8 pt-3">
              <label className="text-xs font-medium text-white/80 block mb-2">Ou valor personalizado</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">R$</span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={valorPersonalizado}
                    onChange={e => { setValorPersonalizado(e.target.value); setPlanoSelecionado(null) }}
                    className="w-full border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <select
                  value={tipoPersonalizado}
                  onChange={e => setTipoPersonalizado(e.target.value as any)}
                  className="border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="PIX">⚡ Pix</option>
                  <option value="BOLETO">🧾 Boleto</option>
                  <option value="CREDIT_CARD">💳 Cartão</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGerar}
              disabled={(!planoSelecionado && !valorPersonalizado) || enviando}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {enviando ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando no Asaas...</>
              ) : (
                <><Banknote className="w-4 h-4" /> Gerar e Enviar Cobrança</>
              )}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-emerald-700">Cobrança Gerada!</p>
              {cobrancaData && (
                <p className="text-emerald-600 font-bold text-xl mt-1">{formatCurrency(cobrancaData.valor)}</p>
              )}
            </div>

            {cobrancaData?.pixQrCode && (
              <div className="bg-white/4 rounded-xl p-3 space-y-1">
                <span className="text-xs text-white/60 block">⚡ Pix copia e cola</span>
                <p className="text-xs font-mono text-white/90 break-all">{cobrancaData.pixQrCode}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(cobrancaData.pixQrCode || '')}
                  className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copiar Pix
                </button>
              </div>
            )}

            {cobrancaData?.invoiceUrl && (
              <a href={cobrancaData.invoiceUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-between bg-emerald-50 rounded-xl p-3 hover:bg-emerald-100 transition-colors">
                <span className="text-emerald-700 text-sm font-medium">Ver fatura online</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </a>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <MessageCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-green-700">WhatsApp<br/>enviado</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Mail className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-blue-700">Email<br/>enviado</p>
              </div>
            </div>

            <button onClick={onClose} className="w-full bg-white/6 text-white/90 py-2.5 rounded-xl font-medium text-sm hover:bg-white/8 transition-colors">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card do Lead ────────────────────────────────────────────
function LeadCard({ lead, onClick }: { lead: CRMLead; onClick: () => void }) {
  const urg = URGENCIA_CONFIG[lead.urgencia]
  return (
    <div
      onClick={onClick}
      className="bg-white/6 rounded-xl border border-white/10 p-3 cursor-pointer hover:shadow-md hover:border-white/55 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center">
            <span className="text-gold font-bold text-sm">{lead.nome[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{lead.nome}</p>
            <p className="text-white/50 text-xs">{lead.area}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${urg.cor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
          {urg.label}
        </span>
      </div>

      <p className="text-white/60 text-xs line-clamp-2 mb-2">{lead.resumoIA}</p>

      {/* Indicadores de integração */}
      <div className="flex gap-1 mb-2">
        {(lead.reunioes?.length ?? 0) > 0 && (
          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Video className="w-2.5 h-2.5" /> {lead.reunioes!.length}
          </span>
        )}
        {(lead.contratos?.length ?? 0) > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
            lead.contratos!.some(c => c.status === 'assinado') ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'
          }`}>
            <FileSignature className="w-2.5 h-2.5" />
            {lead.contratos!.some(c => c.status === 'assinado') ? '✓' : '⏳'}
          </span>
        )}
        {(lead.cobrancas?.length ?? 0) > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
            lead.cobrancas!.some(c => c.status === 'CONFIRMED' || c.status === 'RECEIVED') ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}>
            <CreditCard className="w-2.5 h-2.5" />
            {lead.cobrancas!.some(c => c.status === 'CONFIRMED' || c.status === 'RECEIVED') ? '✓' : '⏳'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm">{ORIGEM_ICONE[lead.origem] || '📍'}</span>
          <span className="text-white/50 text-xs">{lead.origem}</span>
        </div>
        <div className="flex items-center gap-2">
          {lead.valor ? (
            <span className="text-xs font-medium text-emerald-600">{formatCurrency(lead.valor)}</span>
          ) : null}
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-white/6 rounded-full">
              <div className="h-full bg-navy rounded-full" style={{ width: `${lead.score}%` }} />
            </div>
            <span className="text-xs text-white/50">{lead.score}</span>
          </div>
        </div>
      </div>

      {lead.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {lead.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-white/6 text-white/60 px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      )}

      <p className="text-slate-300 text-xs mt-2">{lead.ultimaInteracao}</p>
    </div>
  )
}

// ─── Modal de Ficha do Lead ──────────────────────────────────
function FichaModal({ lead: initialLead, onClose, onUpdate }: {
  lead: CRMLead
  onClose: () => void
  onUpdate: (lead: CRMLead) => void
}) {
  const [lead, setLead] = useState(initialLead)
  const [abaAtiva, setAbaAtiva] = useState<'conversa' | 'dados' | 'acoes' | 'historico'>('conversa')
  const [modalAberto, setModalAberto] = useState<'agenda' | 'contrato' | 'cobranca' | null>(null)
  const urg = URGENCIA_CONFIG[lead.urgencia]

  const handleReuniaoConfirmada = (reuniao: ReuniaoAgendada) => {
    const atualizado = { ...lead, reunioes: [...(lead.reunioes || []), reuniao] }
    setLead(atualizado)
    onUpdate(atualizado)
  }

  const handleContratoConfirmado = (contrato: ContratoAssinatura) => {
    const atualizado = { ...lead, contratos: [...(lead.contratos || []), contrato] }
    setLead(atualizado)
    onUpdate(atualizado)
  }

  const handleCobrancaConfirmada = (cobranca: CobrancaAsaas) => {
    const atualizado = { ...lead, cobrancas: [...(lead.cobrancas || []), cobranca] }
    setLead(atualizado)
    onUpdate(atualizado)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white/5 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{lead.nome[0]}</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{lead.nome}</h2>
                <div className="flex items-center gap-2">
                  <span className="badge-blue">{lead.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urg.cor}`}>{urg.label}</span>
                  <span className="text-white/50 text-xs">{ORIGEM_ICONE[lead.origem]} {lead.origem}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/6 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Score e Resumo IA */}
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-amber-700 text-xs font-medium">Análise Dr. Ben</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-amber-200 rounded-full">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${lead.score}%` }} />
                    </div>
                    <span className="text-amber-700 text-xs font-bold">{lead.score}/100</span>
                  </div>
                </div>
                <p className="text-white/90 text-sm">{lead.resumoIA}</p>
              </div>
            </div>
          </div>

          {/* Abas */}
          <div className="flex border-b border-white/8">
            {[
              { id: 'conversa', label: '💬 Conversa' },
              { id: 'dados', label: '👤 Dados' },
              { id: 'acoes', label: '⚡ Ações' },
              { id: 'historico', label: '📋 Histórico' },
            ].map(aba => (
              <button key={aba.id} onClick={() => setAbaAtiva(aba.id as any)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${abaAtiva === aba.id ? 'text-gold border-b-2 border-primary' : 'text-white/60 hover:text-white/90'}`}>
                {aba.label}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* ABA: Conversa */}
            {abaAtiva === 'conversa' && (
              <div className="space-y-3">
                {lead.conversa.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'lead' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'lead' && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'dr_ben' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                        {msg.role === 'dr_ben' ? <Bot className="w-4 h-4 text-amber-600" /> : <User className="w-4 h-4 text-blue-600" />}
                      </div>
                    )}
                    <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'lead' ? 'bg-navy text-white rounded-tr-sm' :
                      msg.role === 'dr_ben' ? 'bg-amber-50 border border-amber-200 text-white/90 rounded-tl-sm' :
                      'bg-blue-50 border border-blue-200 text-white/90 rounded-tl-sm'
                    }`}>
                      {msg.role !== 'lead' && (
                        <p className={`text-xs font-medium mb-0.5 ${msg.role === 'dr_ben' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {msg.role === 'dr_ben' ? '🤖 Dr. Ben' : '👤 ' + (lead.plantonista || 'Advogado')}
                        </p>
                      )}
                      <p>{msg.texto}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'lead' ? 'text-gold-200' : 'text-white/50'}`}>{msg.hora}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 flex gap-2">
                  <input type="text" placeholder="Enviar mensagem como advogado..."
                    className="flex-1 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/55" />
                  <button className="btn-primary px-4 py-2 text-sm">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ABA: Dados */}
            {abaAtiva === 'dados' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Telefone', value: lead.telefone, icon: <Phone className="w-4 h-4" /> },
                    { label: 'Email', value: lead.email, icon: <Mail className="w-4 h-4" /> },
                    { label: 'Área', value: lead.area, icon: <Tag className="w-4 h-4" /> },
                    { label: 'Origem', value: lead.origem, icon: <ExternalLink className="w-4 h-4" /> },
                    { label: 'Criado em', value: lead.criadoEm, icon: <Calendar className="w-4 h-4" /> },
                    { label: 'Plantonista', value: lead.plantonista || 'Não atribuído', icon: <User className="w-4 h-4" /> },
                  ].map(item => (
                    <div key={item.label} className="bg-white/4 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-white/50 mb-1">
                        {item.icon}
                        <span className="text-xs">{item.label}</span>
                      </div>
                      <p className="text-white font-medium text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
                {lead.valor ? (
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-emerald-600 text-sm">Valor Estimado do Caso</p>
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(lead.valor)}</p>
                  </div>
                ) : null}
                {lead.driveLink && (
                  <a href={lead.driveLink} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between bg-yellow-50 rounded-xl p-3 hover:bg-yellow-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💾</span>
                      <span className="text-sm font-medium text-white/90">Pasta no Google Drive</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/60" />
                  </a>
                )}
                <div>
                  <p className="text-white/60 text-xs mb-2">Tags</p>
                  <div className="flex gap-2 flex-wrap">
                    {lead.tags.map(tag => (
                      <span key={tag} className="bg-navy-50 text-gold text-xs px-3 py-1 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA: Ações (FASE A integrada) */}
            {abaAtiva === 'acoes' && (
              <div className="space-y-3">
                {/* BLOCO 1: Agendamento */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-blue-700 font-medium text-sm mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" /> Google Calendar & Meet
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setModalAberto('agenda')}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">Agendar Reunião de Fechamento</p>
                          <p className="text-xs text-white/50">Cria evento no Calendar + link Meet automático</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </button>

                    {/* Reuniões agendadas */}
                    {(lead.reunioes?.length ?? 0) > 0 && (
                      <div className="space-y-2 mt-2">
                        {lead.reunioes!.map(r => (
                          <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-blue-100">
                            <div>
                              <p className="text-xs font-medium text-white/90">
                                {new Date(r.dataHora).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} às {new Date(r.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-white/50">{r.status}</p>
                            </div>
                            <a href={r.meetLink} target="_blank" rel="noreferrer"
                              className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-200">
                              <Video className="w-3 h-3" /> Entrar
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOCO 2: Contratos ZapSign */}
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-violet-700 font-medium text-sm mb-3 flex items-center gap-2">
                    <FileSignature className="w-4 h-4" /> ZapSign — Assinatura Digital
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setModalAberto('contrato')}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-violet-200 hover:border-violet-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-violet-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">Gerar Contrato / Procuração</p>
                          <p className="text-xs text-white/50">Envia link de assinatura via WhatsApp e email</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </button>

                    {(lead.contratos?.length ?? 0) > 0 && (
                      <div className="space-y-2 mt-2">
                        {lead.contratos!.map(c => (
                          <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-violet-100">
                            <div>
                              <p className="text-xs font-medium text-white/90">{c.nome}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_CONTRATO[c.status].cor}`}>
                                {STATUS_CONTRATO[c.status].label}
                              </span>
                            </div>
                            {c.signUrl && c.status === 'enviado' && (
                              <a href={c.signUrl} target="_blank" rel="noreferrer"
                                className="text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-violet-200">
                                <ExternalLink className="w-3 h-3" /> Link
                              </a>
                            )}
                            {c.signedFileUrl && c.status === 'assinado' && (
                              <a href={c.signedFileUrl} target="_blank" rel="noreferrer"
                                className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-emerald-200">
                                <ArrowUpRight className="w-3 h-3" /> PDF
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOCO 3: Cobranças Asaas */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-emerald-700 font-medium text-sm mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Asaas — Cobranças
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setModalAberto('cobranca')}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-emerald-200 hover:border-emerald-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-emerald-500" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">Gerar Cobrança</p>
                          <p className="text-xs text-white/50">Pix, Boleto ou Cartão — envia via WhatsApp</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/50" />
                    </button>

                    {(lead.cobrancas?.length ?? 0) > 0 && (
                      <div className="space-y-2 mt-2">
                        {lead.cobrancas!.map(c => (
                          <div key={c.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-emerald-100">
                            <div>
                              <p className="text-xs font-medium text-white/90">{c.descricao}</p>
                              <p className="text-xs text-emerald-600 font-bold">{formatCurrency(c.valor)}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COBRANCA[c.status].cor}`}>
                              {STATUS_COBRANCA[c.status].label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOCO 4: Outros */}
                <div className="space-y-2">
                  <button
                    onClick={() => window.open(`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`, '_blank')}
                    className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Abrir WhatsApp</p>
                        <p className="text-xs text-white/50">{lead.telefone}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/50" />
                  </button>

                  <button className="w-full flex items-center justify-between p-3 bg-white/4 border border-white/10 rounded-xl hover:bg-white/6 transition-colors">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">Marcar como Convertido</p>
                        <p className="text-xs text-white/50">Atualiza status no CRM</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>
            )}

            {/* ABA: Histórico */}
            {abaAtiva === 'historico' && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Timeline do Lead</p>

                {/* Emails — FASE B placeholder */}
                {lead.emails && lead.emails.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-medium">📧 Emails</p>
                    {lead.emails.map((e, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${e.lido ? 'bg-white/4 border-white/8' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{e.assunto}</p>
                          {!e.lido && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-xs text-white/50">{e.data}</p>
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 border-dashed rounded-xl p-3 text-center">
                      <p className="text-xs text-blue-600">📧 Gmail integrado ao card — <strong>FASE B</strong></p>
                      <p className="text-xs text-blue-400 mt-1">Ver e enviar emails diretamente daqui</p>
                    </div>
                  </div>
                )}

                {/* Reuniões */}
                {(lead.reunioes?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-medium">📅 Reuniões</p>
                    {lead.reunioes!.map(r => (
                      <div key={r.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm font-medium text-white">
                          {new Date(r.dataHora).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.status === 'realizada' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {r.status}
                          </span>
                          <a href={r.meetLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                            {r.meetLink}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contratos */}
                {(lead.contratos?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-medium">✍️ Contratos ZapSign</p>
                    {lead.contratos!.map(c => (
                      <div key={c.id} className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                        <p className="text-sm font-medium text-white">{c.nome}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-white/50">{c.criadoEm}</p>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_CONTRATO[c.status].cor}`}>
                            {STATUS_CONTRATO[c.status].label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cobranças */}
                {(lead.cobrancas?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-medium">💳 Cobranças Asaas</p>
                    {lead.cobrancas!.map(c => (
                      <div key={c.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{c.descricao}</p>
                          <p className="font-bold text-emerald-600">{formatCurrency(c.valor)}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COBRANCA[c.status].cor}`}>
                            {STATUS_COBRANCA[c.status].label}
                          </span>
                          <span className="text-xs text-white/50">{c.tipo} · Vence {c.vencimento}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FASE C placeholder */}
                <div className="bg-pink-50 border border-pink-200 border-dashed rounded-xl p-3 text-center">
                  <p className="text-xs text-pink-600">📸 Instagram leads via ManyChat → <strong>FASE C</strong></p>
                  <p className="text-xs text-pink-400 mt-1">Captura automática de DMs e comentários para o CRM</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais de ação */}
      {modalAberto === 'agenda' && (
        <ModalAgendamento
          lead={lead}
          onClose={() => setModalAberto(null)}
          onConfirm={(r) => { handleReuniaoConfirmada(r); setModalAberto(null) }}
        />
      )}
      {modalAberto === 'contrato' && (
        <ModalContrato
          lead={lead}
          onClose={() => setModalAberto(null)}
          onConfirm={(c) => { handleContratoConfirmado(c); setModalAberto(null) }}
        />
      )}
      {modalAberto === 'cobranca' && (
        <ModalCobranca
          lead={lead}
          onClose={() => setModalAberto(null)}
          onConfirm={(c) => { handleCobrancaConfirmada(c); setModalAberto(null) }}
        />
      )}
    </>
  )
}

// ─── Componente Principal ────────────────────────────────────
export default function CRM() {
  const [leads, setLeads] = useState<CRMLead[]>(crmLeadsMock)
  const [fichaAberta, setFichaAberta] = useState<CRMLead | null>(null)
  const [visualizacao, setVisualizacao] = useState<'kanban' | 'lista'>('kanban')

  const totalValor = leads.filter(l => l.status === 'convertido').reduce((a, l) => a + (l.valor || 0), 0)
  const aguardando = leads.filter(l => l.status === 'aguardando').length
  const novos = leads.filter(l => l.status === 'novo').length
  const totalReunioes = leads.reduce((a, l) => a + (l.reunioes?.filter(r => r.status === 'agendada').length || 0), 0)
  const totalPendente = leads.reduce((a, l) => a + (l.cobrancas?.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.valor, 0) || 0), 0)

  const handleLeadUpdate = (updated: CRMLead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setFichaAberta(updated)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM — Gestão Comercial</h1>
          <p className="text-white/60 text-sm mt-1">
            Pipeline · ZapSign · Asaas · Google Meet · {leads.length} leads ativos
          </p>
        </div>
        <div className="flex gap-3">
          {aguardando > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-full px-4 py-2 animate-pulse">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700 text-sm font-medium">{aguardando} aguard. atendimento</span>
            </div>
          )}
          <div className="flex gap-1 bg-white/6 border border-white/10 rounded-lg p-1">
            <button onClick={() => setVisualizacao('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${visualizacao === 'kanban' ? 'bg-navy text-white' : 'text-white/80 hover:bg-white/4'}`}>
              Kanban
            </button>
            <button onClick={() => setVisualizacao('lista')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${visualizacao === 'lista' ? 'bg-navy text-white' : 'text-white/80 hover:bg-white/4'}`}>
              Lista
            </button>
          </div>
          <button className="btn-primary text-sm">+ Novo Lead</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Leads', value: leads.length, cor: 'text-white', icon: '👥' },
          { label: 'Novos', value: novos, cor: 'text-blue-600', icon: '🆕' },
          { label: 'Aguardando', value: aguardando, cor: 'text-amber-600', icon: '⏳' },
          { label: 'Reuniões Ativas', value: totalReunioes, cor: 'text-blue-600', icon: '📅' },
          { label: 'A Receber', value: formatCurrency(totalPendente), cor: 'text-amber-600', icon: '💳' },
          { label: 'Convertido', value: formatCurrency(totalValor), cor: 'text-emerald-600', icon: '🏆' },
        ].map(k => (
          <div key={k.label} className="card text-center py-3">
            <p className="text-lg mb-0.5">{k.icon}</p>
            <p className={`text-lg font-bold ${k.cor}`}>{k.value}</p>
            <p className="text-white/60 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Banner integrações ativas */}
      <div className="bg-gradient-to-r from-primary to-primary-600 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-growth" />
            <p className="text-white font-medium text-sm">FASE A ativa — ZapSign · Asaas · Google Calendar/Meet</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: 'ZapSign', cor: 'bg-violet-500' },
              { label: 'Asaas', cor: 'bg-emerald-500' },
              { label: 'Google', cor: 'bg-blue-500' },
            ].map(tag => (
              <span key={tag.label} className={`${tag.cor} text-white text-xs px-2 py-1 rounded-full`}>{tag.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* KANBAN */}
      {visualizacao === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS.map(col => {
            const colLeads = leads.filter(l => l.status === col.id)
            return (
              <div key={col.id} className="flex-shrink-0 w-64">
                <div className={`rounded-xl border-2 ${col.cor} p-3 min-h-32`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-white/90 text-sm flex items-center gap-1">
                      {col.icone} {col.label}
                    </span>
                    <span className="bg-white/5 text-white/80 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colLeads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} onClick={() => setFichaAberta(lead)} />
                    ))}
                    {colLeads.length === 0 && (
                      <div className="text-center py-6 text-slate-300 text-xs">Nenhum lead</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* LISTA */}
      {visualizacao === 'lista' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/4 border-b border-white/8">
              <tr>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Lead</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Área</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Urgência</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Score</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Integrações</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-white/60 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => {
                const urg = URGENCIA_CONFIG[lead.urgencia]
                return (
                  <tr key={lead.id} className="border-b border-slate-50 hover:bg-white/4 transition-colors cursor-pointer" onClick={() => setFichaAberta(lead)}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{lead.nome}</p>
                        <p className="text-white/50 text-xs">{lead.telefone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge-blue">{lead.area}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urg.cor}`}>{urg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/6 rounded-full">
                          <div className="h-full bg-navy rounded-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs text-white/60">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {(lead.reunioes?.length ?? 0) > 0 && <span title="Reunião" className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">📅</span>}
                        {(lead.contratos?.length ?? 0) > 0 && <span title="Contrato" className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">✍️</span>}
                        {(lead.cobrancas?.length ?? 0) > 0 && <span title="Cobrança" className="text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">💳</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.valor ? <span className="text-emerald-600 font-medium">{formatCurrency(lead.valor)}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs bg-navy text-white px-3 py-1 rounded-lg hover:bg-navy-600 transition-colors">
                        Abrir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de ficha */}
      {fichaAberta && (
        <FichaModal
          lead={fichaAberta}
          onClose={() => setFichaAberta(null)}
          onUpdate={handleLeadUpdate}
        />
      )}
    </div>
  )
}
