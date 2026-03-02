import React, { useState } from 'react'
import {
  CheckCircle2, XCircle, AlertCircle, ExternalLink,
  Settings, Zap, RefreshCw, ChevronRight, Info,
  Calendar, Mail, HardDrive, Video, FileSignature,
  CreditCard, MessageCircle, Camera, Bot, ArrowRight
} from 'lucide-react'
import { INTEGRACOES_CONFIG, type IntegracaoStatus } from '../lib/googleWorkspace'

// ─── Tipos ──────────────────────────────────────────────────
interface IntegracaoUI extends IntegracaoStatus {
  chave: string
  fase: 'A' | 'B' | 'C'
  categoria: 'google' | 'juridico' | 'pagamento' | 'comunicacao' | 'automacao'
  linkConfig?: string
  linkDocs?: string
  proximo?: string
}

// ─── Mapeamento completo ─────────────────────────────────────
const INTEGRACOES: IntegracaoUI[] = [
  // ── FASE A ──
  {
    chave: 'google_calendar',
    nome: 'Google Calendar',
    ativo: false,
    icone: '📅',
    cor: '#4285F4',
    descricao: 'Agenda reuniões automaticamente. Cria eventos com link Meet para cada cliente.',
    configurado: false,
    fase: 'A',
    categoria: 'google',
    linkConfig: 'https://console.cloud.google.com/apis/library/calendar-json.googleapis.com',
    linkDocs: 'https://developers.google.com/calendar',
    proximo: 'Ativar OAuth no Google Cloud Console',
  },
  {
    chave: 'google_meet',
    nome: 'Google Meet',
    ativo: false,
    icone: '🎥',
    cor: '#00897B',
    descricao: 'Links de reunião automáticos criados a cada agendamento. Integrado ao Calendar.',
    configurado: false,
    fase: 'A',
    categoria: 'google',
    proximo: 'Automático com Google Calendar',
  },
  {
    chave: 'zapsign',
    nome: 'ZapSign',
    ativo: false,
    icone: '✍️',
    cor: '#7C3AED',
    descricao: 'Gera e envia contratos para assinatura digital. Suporte a Pix, Boleto e Cartão.',
    configurado: false,
    fase: 'A',
    categoria: 'juridico',
    linkConfig: 'https://app.zapsign.com.br/conta/api',
    linkDocs: 'https://docs.zapsign.com.br',
    proximo: 'Obter API Token no painel ZapSign',
  },
  {
    chave: 'asaas',
    nome: 'Asaas',
    ativo: false,
    icone: '💳',
    cor: '#059669',
    descricao: 'Geração de cobranças Pix, Boleto e Cartão diretamente do card do cliente no CRM.',
    configurado: false,
    fase: 'A',
    categoria: 'pagamento',
    linkConfig: 'https://app.asaas.com/config/integracoes',
    linkDocs: 'https://docs.asaas.com',
    proximo: 'Obter API Key no painel Asaas',
  },
  // ── FASE B ──
  {
    chave: 'gmail',
    nome: 'Gmail @mauromoncao.adv.br',
    ativo: false,
    icone: '✉️',
    cor: '#EA4335',
    descricao: 'Emails automáticos vinculados ao card do cliente: confirmação, lembrete 1h antes, follow-up 24h.',
    configurado: false,
    fase: 'B',
    categoria: 'google',
    linkConfig: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
    proximo: 'Habilitar Gmail API e configurar OAuth',
  },
  {
    chave: 'google_drive',
    nome: 'Google Drive',
    ativo: false,
    icone: '💾',
    cor: '#FBBC04',
    descricao: 'Armazenamento automático de contratos assinados. Pasta por cliente, link no card CRM.',
    configurado: false,
    fase: 'B',
    categoria: 'google',
    linkConfig: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
    proximo: 'Habilitar Drive API e configurar OAuth',
  },
  // ── FASE A — já integrado ──
  {
    chave: 'whatsapp',
    nome: 'WhatsApp Business',
    ativo: true,
    icone: '💬',
    cor: '#25D366',
    descricao: 'Notificações de reunião, links de assinatura, cobranças e follow-up automático via Dr. Ben.',
    configurado: true,
    ultimaSync: new Date().toISOString(),
    fase: 'A',
    categoria: 'comunicacao',
  },
  // ── FASE C ──
  {
    chave: 'manychat',
    nome: 'ManyChat',
    ativo: false,
    icone: '🤖',
    cor: '#0084FF',
    descricao: 'Automação de fluxos no Instagram e WhatsApp. Captura leads e passa para Dr. Ben via webhook.',
    configurado: false,
    fase: 'C',
    categoria: 'automacao',
    linkConfig: 'https://manychat.com',
    linkDocs: 'https://manychat.com/blog/instagram-automation/',
    proximo: 'Criar conta ManyChat e conectar Instagram Business',
  },
  {
    chave: 'instagram',
    nome: 'Instagram Graph API',
    ativo: false,
    icone: '📸',
    cor: '#E1306C',
    descricao: 'Captura leads de DMs e comentários do Instagram. Integrado ao ManyChat + CRM.',
    configurado: false,
    fase: 'C',
    categoria: 'comunicacao',
    linkConfig: 'https://developers.facebook.com/apps',
    proximo: 'Criar App no Meta Business e obter token',
  },
]

// ─── Fluxo de automação visual ────────────────────────────────
const FLUXO_COMERCIAL = [
  { label: 'Lead chega', sub: 'WhatsApp · Instagram · Site', icone: '📩', cor: 'bg-blue-100 text-blue-700' },
  { label: 'ManyChat', sub: 'Fluxo inicial + coleta de dados', icone: '🤖', cor: 'bg-sky-100 text-sky-700', fase: 'C' },
  { label: 'Dr. Ben qualifica', sub: 'Score automático de 0-100', icone: '⚡', cor: 'bg-amber-100 text-amber-700' },
  { label: 'Entra no CRM', sub: 'Card criado automaticamente', icone: '📊', cor: 'bg-navy-100 text-gold', fase: 'A' },
  { label: 'Reunião agendada', sub: 'Google Calendar + Meet', icone: '📅', cor: 'bg-blue-100 text-blue-700', fase: 'A' },
  { label: 'Contrato enviado', sub: 'ZapSign — assinatura digital', icone: '✍️', cor: 'bg-violet-100 text-violet-700', fase: 'A' },
  { label: 'Cobrança gerada', sub: 'Asaas — Pix, Boleto, Cartão', icone: '💳', cor: 'bg-emerald-100 text-emerald-700', fase: 'A' },
  { label: 'Contrato salvo', sub: 'Google Drive — pasta cliente', icone: '💾', cor: 'bg-yellow-100 text-yellow-700', fase: 'B' },
]

// ─── Card de integração ──────────────────────────────────────
function IntegracaoCard({ integracao }: { integracao: IntegracaoUI }) {
  const [expandido, setExpandido] = useState(false)

  const faseCor = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    B: 'bg-blue-100 text-blue-700 border-blue-300',
    C: 'bg-purple-100 text-purple-700 border-purple-300',
  }[integracao.fase]

  const statusIcon = integracao.configurado
    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    : integracao.fase === 'A'
    ? <AlertCircle className="w-5 h-5 text-amber-500" />
    : <XCircle className="w-5 h-5 text-gray-500" />

  const statusLabel = integracao.configurado ? 'Conectado' : integracao.fase === 'A' ? 'Configurar agora' : 'Pendente'

  return (
    <div className={`bg-white/5 rounded-xl border transition-all ${integracao.configurado ? 'border-emerald-200 shadow-sm' : integracao.fase === 'A' ? 'border-amber-200' : 'border-gray-200 opacity-80'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: integracao.cor + '20' }}
            >
              {integracao.icone}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">{integracao.nome}</h3>
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${faseCor}`}>
                  Fase {integracao.fase}
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{integracao.descricao}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {statusIcon}
            <button onClick={() => setExpandido(!expandido)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandido ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs font-medium ${integracao.configurado ? 'text-emerald-600' : integracao.fase === 'A' ? 'text-amber-600' : 'text-gray-400'}`}>
            {statusLabel}
          </span>
          {integracao.ultimaSync && (
            <span className="text-xs text-gray-400">
              Sync: {new Date(integracao.ultimaSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Expandido */}
      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {integracao.proximo && (
            <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-700 text-xs font-medium">Próximo passo</p>
                <p className="text-amber-600 text-xs mt-0.5">{integracao.proximo}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {integracao.linkConfig && (
              <a href={integracao.linkConfig} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-navy text-white py-2 rounded-lg text-xs font-medium hover:bg-navy-600 transition-colors">
                <Settings className="w-3.5 h-3.5" />
                Configurar
              </a>
            )}
            {integracao.linkDocs && (
              <a href={integracao.linkDocs} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium hover:bg-white/8 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                Documentação
              </a>
            )}
            {!integracao.linkConfig && !integracao.linkDocs && (
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 py-2 rounded-lg text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                Automático via Google OAuth
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────
export default function Integracoes() {
  const [filtroFase, setFiltroFase] = useState<'todas' | 'A' | 'B' | 'C'>('todas')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  const integracoesFiltradas = INTEGRACOES.filter(i => {
    const passFase = filtroFase === 'todas' || i.fase === filtroFase
    const passCat = filtroCategoria === 'todas' || i.categoria === filtroCategoria
    return passFase && passCat
  })

  const totalConfigurados = INTEGRACOES.filter(i => i.configurado).length
  const faseATotal = INTEGRACOES.filter(i => i.fase === 'A').length
  const faseAConfigurados = INTEGRACOES.filter(i => i.fase === 'A' && i.configurado).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Central de Integrações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Google Workspace · ZapSign · Asaas · WhatsApp · ManyChat · Instagram
        </p>
      </div>

      {/* Status geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-emerald-600">{totalConfigurados}/{INTEGRACOES.length}</p>
          <p className="text-gray-500 text-xs mt-1">Integrações Ativas</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-amber-600">{faseATotal - faseAConfigurados}</p>
          <p className="text-gray-500 text-xs mt-1">Fase A — Pendentes</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-600">3</p>
          <p className="text-gray-500 text-xs mt-1">Google APIs</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gold">100%</p>
          <p className="text-gray-500 text-xs mt-1">Fluxo Mapeado</p>
        </div>
      </div>

      {/* Fluxo comercial visual */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-growth" />
          Fluxo Comercial Automatizado
        </h2>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {FLUXO_COMERCIAL.map((etapa, i) => (
            <React.Fragment key={etapa.label}>
              <div className={`flex-shrink-0 text-center rounded-xl p-3 min-w-[110px] ${etapa.cor}`}>
                <p className="text-2xl mb-1">{etapa.icone}</p>
                <p className="font-medium text-xs leading-tight">{etapa.label}</p>
                <p className="text-xs opacity-75 mt-0.5 leading-tight">{etapa.sub}</p>
                {etapa.fase && (
                  <span className="text-xs font-bold opacity-80 block mt-1">Fase {etapa.fase}</span>
                )}
              </div>
              {i < FLUXO_COMERCIAL.length - 1 && (
                <div className="flex-shrink-0 flex items-center mt-6">
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ManyChat Destaque */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/5/20 rounded-xl flex items-center justify-center text-2xl">🤖</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">ManyChat + Dr. Ben</h3>
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">Fase C</span>
              </div>
              <p className="text-blue-100 text-sm max-w-xl">
                O ManyChat atua como "front-end" do WhatsApp e Instagram: coleta nome, telefone e interesse.
                O webhook passa esses dados para o Dr. Ben, que qualifica o lead com score de 0–100
                e o insere automaticamente no CRM.
              </p>
              <div className="flex gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-pink-300" />
                  <span className="text-blue-100">Leads do Instagram DM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-green-300" />
                  <span className="text-blue-100">WhatsApp automatizado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-300" />
                  <span className="text-blue-100">Score automático Dr. Ben</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fluxo ManyChat */}
        <div className="mt-4 bg-white/5/10 rounded-xl p-4">
          <p className="text-xs text-blue-200 font-medium mb-3">FLUXO MANYCHAT → BEN GROWTH CENTER</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Lead comenta no Instagram', icone: '📸' },
              { label: 'ManyChat responde automaticamente', icone: '🤖' },
              { label: 'Coleta: nome, tel, assunto', icone: '📝' },
              { label: 'Webhook → Dr. Ben', icone: '⚡' },
              { label: 'Score calculado', icone: '🎯' },
              { label: 'Card no CRM', icone: '📊' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="bg-white/5/20 rounded-lg px-3 py-1.5 text-xs text-white flex items-center gap-1.5 flex-shrink-0">
                  <span>{s.icone}</span> {s.label}
                </div>
                {i < 5 && <ArrowRight className="w-3 h-3 text-blue-300 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
          {['todas', 'A', 'B', 'C'].map(fase => (
            <button
              key={fase}
              onClick={() => setFiltroFase(fase as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filtroFase === fase ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {fase === 'todas' ? 'Todas' : `Fase ${fase}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'google', label: '🔵 Google' },
            { id: 'juridico', label: '✍️ Jurídico' },
            { id: 'pagamento', label: '💳 Pagamento' },
            { id: 'comunicacao', label: '💬 Comunicação' },
            { id: 'automacao', label: '🤖 Automação' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filtroCategoria === cat.id ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integracoesFiltradas.map(integracao => (
          <IntegracaoCard key={integracao.chave} integracao={integracao} />
        ))}
      </div>

      {/* Guia rápido OAuth Google */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          Guia Rápido — Google Workspace @mauromoncao.adv.br
        </h2>
        <div className="space-y-3">
          {[
            {
              passo: '1',
              titulo: 'Criar projeto no Google Cloud Console',
              desc: 'Acesse console.cloud.google.com → Novo Projeto → "Ben Growth Center"',
              link: 'https://console.cloud.google.com',
            },
            {
              passo: '2',
              titulo: 'Habilitar APIs necessárias',
              desc: 'Calendar API, Gmail API, Drive API, Google Meet API',
              link: 'https://console.cloud.google.com/apis/library',
            },
            {
              passo: '3',
              titulo: 'Configurar OAuth 2.0',
              desc: 'Credenciais → Criar credenciais → OAuth 2.0 → Web Application',
              link: 'https://console.cloud.google.com/apis/credentials',
            },
            {
              passo: '4',
              titulo: 'Adicionar variáveis de ambiente',
              desc: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI no .env',
              link: null,
            },
            {
              passo: '5',
              titulo: 'Configurar no Ben Growth Center',
              desc: 'Ir em Configurações → Integrações → Google Workspace → Conectar',
              link: null,
            },
          ].map(step => (
            <div key={step.passo} className="flex items-start gap-4">
              <div className="w-7 h-7 bg-navy text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step.passo}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{step.titulo}</p>
                <p className="text-gray-500 text-xs mt-0.5">{step.desc}</p>
              </div>
              {step.link && (
                <a href={step.link} target="_blank" rel="noreferrer"
                  className="text-xs text-gold hover:underline flex items-center gap-1 flex-shrink-0">
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="card p-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Webhooks — Recebimento de Eventos
        </h2>
        <div className="space-y-3">
          {[
            {
              servico: 'ZapSign',
              icone: '✍️',
              cor: 'bg-violet-100',
              url: '/api/webhooks/zapsign',
              eventos: ['doc_signed', 'signer_signed', 'doc_refused'],
              acao: 'Atualiza status do contrato no CRM e dispara cobrança automática no Asaas',
            },
            {
              servico: 'Asaas',
              icone: '💳',
              cor: 'bg-emerald-100',
              url: '/api/webhooks/asaas',
              eventos: ['PAYMENT_RECEIVED', 'PAYMENT_OVERDUE', 'PAYMENT_REFUNDED'],
              acao: 'Atualiza status financeiro no CRM e notifica via WhatsApp',
            },
            {
              servico: 'ManyChat',
              icone: '🤖',
              cor: 'bg-blue-100',
              url: '/api/webhooks/manychat',
              eventos: ['lead_captured', 'flow_completed'],
              acao: 'Envia lead para Dr. Ben qualificar e criar card no CRM',
            },
          ].map(wh => (
            <div key={wh.servico} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-8 h-8 ${wh.cor} rounded-lg flex items-center justify-center`}>{wh.icone}</span>
                <div>
                  <p className="font-medium text-white text-sm">{wh.servico}</p>
                  <code className="text-xs text-gold bg-navy-50 px-2 py-0.5 rounded">{wh.url}</code>
                </div>
              </div>
              <p className="text-gray-500 text-xs">{wh.acao}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {wh.eventos.map(ev => (
                  <span key={ev} className="text-xs bg-white/8 text-gray-600 px-2 py-0.5 rounded font-mono">{ev}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
