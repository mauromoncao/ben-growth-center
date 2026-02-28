import React, { useState } from 'react'
import {
  Phone, MessageCircle, Mail, Clock, AlertCircle,
  ChevronRight, User, Bot, Star, ArrowRight, X,
  CheckCircle2, Calendar, Tag, ExternalLink
} from 'lucide-react'
import { formatCurrency, getStatusLabel } from '../lib/utils'

// ─── Tipos ──────────────────────────────────────────────────
export type Urgency = 'alta' | 'media' | 'baixa'
export type CRMStatus = 'novo' | 'qualificado' | 'aguardando' | 'em_atendimento' | 'convertido' | 'perdido'

export interface Mensagem {
  role: 'dr_ben' | 'lead' | 'humano'
  texto: string
  hora: string
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
  },
  {
    id: 'crm2',
    nome: 'Ana Paula Sousa',
    telefone: '(86) 99712-8765',
    email: 'ana@email.com',
    area: 'Previdenciário',
    origem: 'Site',
    status: 'novo',
    urgencia: 'media',
    score: 74,
    criadoEm: '28/02/2026 09:20',
    ultimaInteracao: '28/02/2026 09:28',
    resumoIA: 'Trabalhadora rural com 28 anos de contribuição. Pedido de aposentadoria negado pelo INSS. Quer recorrer administrativamente. Perfil de conversão médio-alto.',
    conversa: [
      { role: 'lead', texto: 'Meu pedido de aposentadoria foi negado pelo INSS', hora: '09:20' },
      { role: 'dr_ben', texto: 'Lamento saber disso! Mas saiba que muitos casos negados podem ser revertidos. Há quanto tempo você contribui e qual foi o motivo do indeferimento?', hora: '09:20' },
      { role: 'lead', texto: '28 anos como trabalhadora rural. Disseram que faltou comprovação', hora: '09:22' },
      { role: 'dr_ben', texto: 'Esse é um caso clássico que temos sucesso! Trabalhadores rurais têm direitos especiais e a prova pode ser feita de várias formas. Vou encaminhar para um especialista em Previdenciário.', hora: '09:22' },
    ],
    tags: ['INSS', 'rural', 'recurso'],
    valor: 4800,
  },
  {
    id: 'crm3',
    nome: 'Roberto Lima',
    telefone: '(86) 99634-5678',
    email: 'roberto@email.com',
    area: 'Bancário',
    origem: 'Google Ads',
    status: 'em_atendimento',
    urgencia: 'media',
    score: 68,
    criadoEm: '27/02/2026 14:10',
    ultimaInteracao: '28/02/2026 08:00',
    resumoIA: 'Consumidor com juros abusivos em financiamento de veículo. Parcelas 40% acima do contratado. Em atendimento com Dr. Mauro desde ontem.',
    conversa: [
      { role: 'lead', texto: 'Minhas parcelas do carro aumentaram 40% sem explicação', hora: '14:10' },
      { role: 'dr_ben', texto: 'Isso é caracterizado como juros abusivos! Você tem direito à revisão contratual. Posso analisar seu contrato?', hora: '14:10' },
      { role: 'lead', texto: 'Sim, quero saber se tenho algum direito', hora: '14:15' },
      { role: 'dr_ben', texto: 'Com certeza tem! Vou encaminhar para o Dr. Mauro que é especialista em Direito Bancário.', hora: '14:15' },
      { role: 'humano', texto: 'Olá Roberto, sou o Dr. Mauro. Pode me enviar o contrato por WhatsApp?', hora: '14:45' },
    ],
    plantonista: 'Dr. Mauro',
    tags: ['juros-abusivos', 'veículo'],
    valor: 5200,
  },
  {
    id: 'crm4',
    nome: 'Fernanda Costa',
    telefone: '(86) 99521-9870',
    email: 'fernanda@email.com',
    area: 'Tributário',
    origem: 'Meta Ads',
    status: 'convertido',
    urgencia: 'baixa',
    score: 99,
    criadoEm: '27/02/2026 10:00',
    ultimaInteracao: '27/02/2026 16:00',
    resumoIA: 'Empresa com crédito tributário de R$ 120k identificado pelo Dr. Ben. Contrato assinado. Honorários de R$ 12.000.',
    conversa: [
      { role: 'lead', texto: 'Vi o anúncio sobre recuperação de impostos', hora: '10:00' },
      { role: 'dr_ben', texto: 'Ótimo! Muitas empresas têm créditos que não conhecem. Qual o ramo da sua empresa e faturamento aproximado?', hora: '10:00' },
      { role: 'lead', texto: 'Comércio, faturamento de R$ 2 milhões ao ano', hora: '10:05' },
      { role: 'dr_ben', texto: 'Com esse perfil, estimamos um potencial de recuperação de R$ 80k a R$ 150k! Vou encaminhar urgente para o Dr. Mauro.', hora: '10:05' },
      { role: 'humano', texto: 'Fernanda, identifiquei R$ 120k em créditos recuperáveis. Podemos formalizar?', hora: '11:00' },
      { role: 'lead', texto: 'Sim! Vamos em frente', hora: '11:30' },
    ],
    plantonista: 'Dr. Mauro',
    tags: ['contrato-fechado', 'crédito-tributário'],
    valor: 12000,
  },
  {
    id: 'crm5',
    nome: 'José Alves',
    telefone: '(86) 99400-1234',
    email: 'jose@email.com',
    area: 'Previdenciário',
    origem: 'Google Ads',
    status: 'qualificado',
    urgencia: 'alta',
    score: 85,
    criadoEm: '28/02/2026 07:00',
    ultimaInteracao: '28/02/2026 07:45',
    resumoIA: 'Servidor público com pedido de aposentadoria especial negado. 35 anos de contribuição. Alta chance de êxito judicial. Aguardando contato humano.',
    conversa: [
      { role: 'lead', texto: 'Sou servidor público e tive minha aposentadoria especial negada', hora: '07:00' },
      { role: 'dr_ben', texto: 'Olá! Servidor público com aposentadoria especial negada é um caso que temos muito sucesso. Qual cargo e há quanto tempo contribui?', hora: '07:00' },
      { role: 'lead', texto: '35 anos como professor, regime especial', hora: '07:05' },
      { role: 'dr_ben', texto: 'Perfeito! Professor com 35 anos tem direito garantido pela CF/88. Esse caso é forte! Classificando como ALTA PRIORIDADE e encaminhando agora.', hora: '07:05' },
    ],
    tags: ['servidor-público', 'professor', 'alta-prioridade'],
    valor: 4800,
  },
  {
    id: 'crm6',
    nome: 'Maria Oliveira',
    telefone: '(86) 99388-5432',
    email: 'maria@email.com',
    area: 'Tributário',
    origem: 'WhatsApp',
    status: 'novo',
    urgencia: 'baixa',
    score: 45,
    criadoEm: '28/02/2026 10:00',
    ultimaInteracao: '28/02/2026 10:10',
    resumoIA: 'Pessoa física com dúvida sobre imposto de renda. Baixa urgência. Dr. Ben ainda coletando informações.',
    conversa: [
      { role: 'lead', texto: 'Tenho uma dúvida sobre imposto de renda', hora: '10:00' },
      { role: 'dr_ben', texto: 'Olá! Pode me contar mais? É sobre declaração, restituição ou alguma notificação da Receita?', hora: '10:00' },
      { role: 'lead', texto: 'É sobre a declaração, acho que errei algo', hora: '10:05' },
      { role: 'dr_ben', texto: 'Sem problema! Erros na declaração têm solução pela retificação. Me conta mais sobre o que aconteceu...', hora: '10:05' },
    ],
    tags: ['IR', 'pessoa-física'],
    valor: 0,
  },
]

// ─── Colunas do Kanban ───────────────────────────────────────
const COLUNAS: { id: CRMStatus; label: string; cor: string; icone: string }[] = [
  { id: 'novo',          label: 'Novo Lead',        cor: 'border-blue-400 bg-blue-50',    icone: '🆕' },
  { id: 'qualificado',   label: 'Qualificado',       cor: 'border-green-400 bg-green-50',  icone: '✅' },
  { id: 'aguardando',    label: '⏳ Aguard. Humano', cor: 'border-amber-400 bg-amber-50',  icone: '⏳' },
  { id: 'em_atendimento',label: 'Em Atendimento',    cor: 'border-purple-400 bg-purple-50',icone: '👤' },
  { id: 'convertido',    label: 'Convertido',        cor: 'border-emerald-400 bg-emerald-50', icone: '🏆' },
]

const URGENCIA_CONFIG = {
  alta:  { label: 'Urgente',  cor: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  media: { label: 'Média',    cor: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  baixa: { label: 'Baixa',    cor: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
}

const ORIGEM_ICONE: Record<string, string> = {
  'WhatsApp': '💬',
  'Site': '🌐',
  'Google Ads': '🔵',
  'Meta Ads': '🟣',
  'Orgânico': '🟢',
}

// ─── Card do Lead ────────────────────────────────────────────
function LeadCard({ lead, onClick }: { lead: CRMLead; onClick: () => void }) {
  const urg = URGENCIA_CONFIG[lead.urgencia]
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-3 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{lead.nome[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{lead.nome}</p>
            <p className="text-slate-400 text-xs">{lead.area}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${urg.cor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
          {urg.label}
        </span>
      </div>

      {/* Resumo IA */}
      <p className="text-slate-500 text-xs line-clamp-2 mb-2">{lead.resumoIA}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm">{ORIGEM_ICONE[lead.origem] || '📍'}</span>
          <span className="text-slate-400 text-xs">{lead.origem}</span>
        </div>
        <div className="flex items-center gap-2">
          {lead.valor ? (
            <span className="text-xs font-medium text-emerald-600">{formatCurrency(lead.valor)}</span>
          ) : null}
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: `${lead.score}%` }} />
            </div>
            <span className="text-xs text-slate-400">{lead.score}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {lead.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">#{tag}</span>
          ))}
        </div>
      )}

      {/* Hora */}
      <p className="text-slate-300 text-xs mt-2">{lead.ultimaInteracao}</p>
    </div>
  )
}

// ─── Modal de Ficha do Lead ──────────────────────────────────
function FichaModal({ lead, onClose }: { lead: CRMLead; onClose: () => void }) {
  const [abaAtiva, setAbaAtiva] = useState<'conversa' | 'dados' | 'acoes'>('conversa')
  const urg = URGENCIA_CONFIG[lead.urgencia]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{lead.nome[0]}</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{lead.nome}</h2>
              <div className="flex items-center gap-2">
                <span className="badge-blue">{lead.area}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urg.cor}`}>{urg.label}</span>
                <span className="text-slate-400 text-xs">{lead.origem}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Score e Resumo IA */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-700 text-xs font-medium mb-0.5">Análise Dr. Ben — Score {lead.score}/100</p>
              <p className="text-slate-700 text-sm">{lead.resumoIA}</p>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-100">
          {[
            { id: 'conversa', label: '💬 Conversa' },
            { id: 'dados', label: '👤 Dados' },
            { id: 'acoes', label: '⚡ Ações' },
          ].map(aba => (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${abaAtiva === aba.id ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}>
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
                    msg.role === 'lead' ? 'bg-primary text-white rounded-tr-sm' :
                    msg.role === 'dr_ben' ? 'bg-amber-50 border border-amber-200 text-slate-700 rounded-tl-sm' :
                    'bg-blue-50 border border-blue-200 text-slate-700 rounded-tl-sm'
                  }`}>
                    {msg.role !== 'lead' && (
                      <p className={`text-xs font-medium mb-0.5 ${msg.role === 'dr_ben' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {msg.role === 'dr_ben' ? '🤖 Dr. Ben' : '👤 ' + (lead.plantonista || 'Humano')}
                      </p>
                    )}
                    <p>{msg.texto}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'lead' ? 'text-primary-200' : 'text-slate-400'}`}>{msg.hora}</p>
                  </div>
                </div>
              ))}
              {/* Input para continuar conversa */}
              <div className="mt-4 flex gap-2">
                <input type="text" placeholder="Continuar atendimento como humano..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
                <button className="btn-primary px-4 py-2 text-sm">Enviar</button>
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
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      {item.icon}
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <p className="text-slate-800 font-medium text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              {lead.valor ? (
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-emerald-600 text-sm">Valor Estimado do Caso</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(lead.valor)}</p>
                </div>
              ) : null}
              <div>
                <p className="text-slate-500 text-xs mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {lead.tags.map(tag => (
                    <span key={tag} className="bg-primary-50 text-primary text-xs px-3 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA: Ações */}
          {abaAtiva === 'acoes' && (
            <div className="space-y-3">
              {[
                { label: 'Assumir Atendimento', desc: 'Você assume como plantonista agora', icon: '👤', cor: 'btn-primary' },
                { label: 'Abrir WhatsApp', desc: `Continuar pelo WhatsApp com ${lead.nome}`, icon: '💬', cor: 'bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors' },
                { label: 'Agendar Reunião', desc: 'Marcar horário na agenda do escritório', icon: '📅', cor: 'bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors' },
                { label: 'Marcar como Convertido', desc: 'Lead fechou contrato', icon: '🏆', cor: 'bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors' },
                { label: 'Encaminhar para Equipe', desc: 'Transferir para outro plantonista', icon: '🔁', cor: 'bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors' },
              ].map(acao => (
                <div key={acao.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{acao.icon}</span>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{acao.label}</p>
                      <p className="text-slate-400 text-xs">{acao.desc}</p>
                    </div>
                  </div>
                  <button className={acao.cor + ' text-sm'}>{acao.label.split(' ')[0]}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CRM — Gestão Comercial</h1>
          <p className="text-slate-500 text-sm mt-1">Pipeline integrado com Dr. Ben · {leads.length} leads ativos</p>
        </div>
        <div className="flex gap-3">
          {/* Alerta Aguardando */}
          {aguardando > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-full px-4 py-2 animate-pulse">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700 text-sm font-medium">{aguardando} aguard. atendimento humano</span>
            </div>
          )}
          <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button onClick={() => setVisualizacao('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${visualizacao === 'kanban' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              Kanban
            </button>
            <button onClick={() => setVisualizacao('lista')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${visualizacao === 'lista' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              Lista
            </button>
          </div>
          <button className="btn-primary text-sm">+ Novo Lead</button>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Leads', value: leads.length, cor: 'text-slate-800' },
          { label: 'Novos', value: novos, cor: 'text-blue-600' },
          { label: '⏳ Aguardando', value: aguardando, cor: 'text-amber-600' },
          { label: 'Em Atendimento', value: leads.filter(l => l.status === 'em_atendimento').length, cor: 'text-purple-600' },
          { label: 'Valor Convertido', value: formatCurrency(totalValor), cor: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="card text-center py-3">
            <p className={`text-xl font-bold ${k.cor}`}>{k.value}</p>
            <p className="text-slate-500 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* KANBAN */}
      {visualizacao === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS.map(col => {
            const colLeads = leads.filter(l => l.status === col.id)
            return (
              <div key={col.id} className="flex-shrink-0 w-64">
                <div className={`rounded-xl border-2 ${col.cor} p-3 min-h-32`}>
                  {/* Cabeçalho da coluna */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-1">
                      {col.icone} {col.label}
                    </span>
                    <span className="bg-white text-slate-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                      {colLeads.length}
                    </span>
                  </div>
                  {/* Cards */}
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
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Lead</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Área</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Urgência</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Score</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => {
                const urg = URGENCIA_CONFIG[lead.urgencia]
                const col = COLUNAS.find(c => c.id === lead.status)
                return (
                  <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{lead.nome}</p>
                        <p className="text-slate-400 text-xs">{lead.telefone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="badge-blue">{lead.area}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urg.cor}`}>{urg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{col?.icone} {col?.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {lead.valor ? formatCurrency(lead.valor) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setFichaAberta(lead)}
                        className="text-xs bg-primary-50 text-primary px-3 py-1 rounded-full hover:bg-primary-100 transition-colors">
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

      {/* Modal Ficha */}
      {fichaAberta && (
        <FichaModal lead={fichaAberta} onClose={() => setFichaAberta(null)} />
      )}
    </div>
  )
}
