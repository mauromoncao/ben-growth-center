import React, { useState, useEffect } from 'react'
import {
  Bell, BellOff, User, Clock, Phone, CheckCircle2,
  AlertCircle, Calendar, Shield, ArrowRight, Zap, MessageCircle
} from 'lucide-react'
import { crmLeadsMock } from './CRM'
import { formatCurrency } from '../lib/utils'

// ─── Tipos ───────────────────────────────────────────────────
interface Plantonista {
  id: string
  nome: string
  cargo: string
  telefone: string
  whatsapp: string
  ativo: boolean
  online: boolean
  atendimentosHoje: number
  avatar: string
}

interface EscalaDia {
  diaSemana: string
  data: string
  plantonistaId: string
  turno: string
  hoje: boolean
}

// ─── Mock ────────────────────────────────────────────────────
const plantonistasMock: Plantonista[] = [
  {
    id: 'p1',
    nome: 'Dr. Mauro Monção',
    cargo: 'Advogado Titular',
    telefone: '(86) 99948-4761',
    whatsapp: '5586999484761',
    ativo: true,
    online: true,
    atendimentosHoje: 3,
    avatar: 'MM',
  },
]

// ─── Gera escala dinâmica para a semana atual ─────────────────
function gerarEscalaSemana(): EscalaDia[] {
  const hoje = new Date()
  // Encontrar a segunda-feira desta semana
  const diaSemana = hoje.getDay() // 0=dom, 1=seg, ..., 6=sab
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + diffParaSegunda)

  const nomes = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  const turnos = ['08h–18h', '08h–18h', '08h–18h', '08h–18h', '08h–18h', '08h–13h', 'Plantão']

  return nomes.map((nome, i) => {
    const dia = new Date(segunda)
    dia.setDate(segunda.getDate() + i)
    const dd = String(dia.getDate()).padStart(2, '0')
    const mm = String(dia.getMonth() + 1).padStart(2, '0')
    const ehHoje =
      dia.getDate() === hoje.getDate() &&
      dia.getMonth() === hoje.getMonth() &&
      dia.getFullYear() === hoje.getFullYear()
    return {
      diaSemana: nome,
      data: `${dd}/${mm}`,
      plantonistaId: 'p1',
      turno: turnos[i],
      hoje: ehHoje,
    }
  })
}

// ─── Componente de Alerta Push (simulado) ────────────────────
function AlertaPush({ onClose }: { onClose: () => void }) {
  const lead = crmLeadsMock.find(l => l.status === 'aguardando')!

  return (
    <div
      className="fixed top-4 right-4 z-50 w-84 overflow-hidden animate-bounce-once"
      style={{
        width: '340px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)',
        border: '2px solid #f59e0b',
      }}
    >
      {/* Header laranja sólido */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.25)' }}>
            <Bell className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">⚡ LEAD AGUARDANDO VOCÊ</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Corpo branco sólido */}
      <div className="p-4" style={{ background: '#ffffff' }}>
        {/* Lead info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#0f2044' }}>
            <span className="text-white font-bold text-base">{lead.nome[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{lead.nome}</p>
            <p className="text-gray-500 text-xs truncate">{lead.area} · {lead.origem}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
            URGENTE
          </span>
        </div>

        {/* Resumo */}
        <div className="rounded-xl p-3 mb-3 text-sm"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p className="text-gray-700 leading-relaxed">
            "{lead.resumoIA.substring(0, 100)}..."
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
          >
            <MessageCircle className="w-4 h-4" /> Assumir
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
          >
            Adiar 10min
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────
export default function Plantonista() {
  const [plantonistaAtivo, setPlantonistaAtivo] = useState<string>('p1')
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [pwaInstalado, setPwaInstalado] = useState(false)

  // Gera escala dinamicamente (semana atual)
  const escalaDinamica = gerarEscalaSemana()

  const aguardando = crmLeadsMock.filter(l => l.status === 'aguardando')
  const plantonistaHoje = plantonistasMock.find(p => p.id === plantonistaAtivo)!

  // Simular alerta chegando após 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => setMostrarAlerta(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* Alerta Push simulado */}
      {mostrarAlerta && <AlertaPush onClose={() => setMostrarAlerta(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantonista & Alertas</h1>
          <p className="text-gray-500 text-sm mt-1">Controle de quem está de plantão e repasse automático do Dr. Ben</p>
        </div>
        <button
          onClick={() => setMostrarAlerta(true)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Bell className="w-4 h-4" /> Simular Alerta
        </button>
      </div>

      {/* Plantonista ativo agora */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #0f2044 0%, #1a3a6e 100%)', border: '1px solid #1e3a6e', boxShadow: '0 4px 20px rgba(15,32,68,0.3)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" style={{ color: '#D4A017' }} /> Plantonista Agora
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 text-sm font-medium">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#D4A017' }}>
            <span className="text-white font-bold text-xl">{plantonistaHoje.avatar}</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">{plantonistaHoje.nome}</p>
            <p className="text-blue-200 text-sm">{plantonistaHoje.cargo}</p>
            <p className="text-amber-300 text-sm mt-1 font-medium">{plantonistaHoje.telefone}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: '#D4A017' }}>{plantonistaHoje.atendimentosHoje}</p>
            <p className="text-blue-200 text-sm">atend. hoje</p>
          </div>
        </div>

        {/* Fila de espera */}
        {aguardando.length > 0 && (
          <div className="mt-4 rounded-xl p-3"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <p className="text-amber-300 font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {aguardando.length} lead(s) aguardando atendimento humano
            </p>
            {aguardando.map(lead => (
              <div key={lead.id} className="flex items-center justify-between rounded-lg p-2 mb-1"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-white text-sm font-medium">{lead.nome}</p>
                  <p className="text-blue-200 text-xs">{lead.area} · {lead.urgencia === 'alta' ? '🔴 Urgente' : '🟡 Normal'}</p>
                </div>
                <button className="text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors hover:opacity-90"
                  style={{ background: '#16a34a' }}>
                  Assumir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuração de Notificações PWA */}
      <div className="card border-2 border-dashed border-amber-300 bg-amber-50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">📲 Notificações PWA no Celular</h2>
            <p className="text-gray-500 text-sm mt-1">
              Instale o app no seu celular e receba alertas push quando um lead chegar qualificado pelo Dr. Ben.
              Funciona sem internet móvel (wi-fi) e sem app store.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => {
                  setNotificacoesAtivas(!notificacoesAtivas)
                  if (!notificacoesAtivas && 'Notification' in window) {
                    Notification.requestPermission()
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  notificacoesAtivas
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-white/8 text-gray-600 hover:bg-slate-300'
                }`}
              >
                {notificacoesAtivas ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {notificacoesAtivas ? 'Notificações Ativas' : 'Ativar Notificações'}
              </button>
              <button
                onClick={() => setPwaInstalado(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-navy text-white hover:bg-navy-700 transition-colors"
              >
                📲 Instalar App no Celular
              </button>
            </div>
            {pwaInstalado && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  App instalado! Você receberá alertas automáticos quando o Dr. Ben qualificar um lead.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fluxo de repasse visual */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">🔄 Fluxo de Repasse Automático</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { icone: '🌐', titulo: 'Lead Entra', desc: 'Site, WhatsApp\nou Google/Meta Ads', cor: 'bg-[#f0f3fa] border-[#c5d0e8]' },
            { icone: '🤖', titulo: 'Dr. Ben Qualifica', desc: 'IA coleta dados,\navalia urgência e área', cor: 'bg-amber-50 border-amber-200' },
            { icone: '📊', titulo: 'Score ≥ 70', desc: 'Lead aprovado\npara humano', cor: 'bg-purple-50 border-purple-200' },
            { icone: '📲', titulo: 'Alerta Push', desc: 'Notificação no celular\ndo plantonista', cor: 'bg-red-50 border-red-200' },
            { icone: '👤', titulo: 'Humano Assume', desc: 'Plantonista continua\no atendimento', cor: 'bg-green-50 border-green-200' },
          ].map((etapa, i) => (
            <React.Fragment key={etapa.titulo}>
              <div className={`flex-shrink-0 w-36 border-2 rounded-xl p-3 text-center ${etapa.cor}`}>
                <span className="text-3xl block mb-1">{etapa.icone}</span>
                <p className="font-semibold text-gray-700 text-xs">{etapa.titulo}</p>
                <p className="text-gray-400 text-xs mt-1 whitespace-pre-line">{etapa.desc}</p>
              </div>
              {i < 4 && (
                <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Equipe */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">👥 Equipe</h2>
        </div>
        {/* Info WhatsApp Plantonista */}
        <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-800 text-sm">Alertas WhatsApp ativos</p>
            <p className="text-green-600 text-xs">Mensagens urgentes enviadas para <strong>(86) 99948-4761</strong></p>
          </div>
          <span className="ml-auto bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">✅ ATIVO</span>
        </div>
        <div className="space-y-3">
          {plantonistasMock.map(p => (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${plantonistaAtivo === p.id ? 'bg-blue-50 border-blue-200' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                    <span className="text-gold font-bold text-sm">{p.avatar}</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${p.online ? 'bg-green-400' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{p.nome}</p>
                  <p className="text-gray-400 text-xs">{p.cargo} · {p.atendimentosHoje} hoje</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.online ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={() => setPlantonistaAtivo(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    plantonistaAtivo === p.id
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-white/8'
                  }`}
                >
                  {plantonistaAtivo === p.id ? '✅ Plantonista' : 'Definir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escala semanal — datas dinâmicas */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Escala Semanal
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {escalaDinamica.map(dia => {
            const p = plantonistasMock.find(pl => pl.id === dia.plantonistaId)!
            return (
              <div key={dia.diaSemana} className={`border rounded-xl p-3 ${dia.hoje ? 'border-white/40 bg-navy-50 ring-2 ring-gold' : 'border-gray-100'}`}>
                <p className={`font-semibold text-sm ${dia.hoje ? 'text-gold' : 'text-gray-600'}`}>
                  {dia.diaSemana} {dia.hoje && '(Hoje)'}
                </p>
                <p className="text-gray-400 text-xs">{dia.data}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-navy-100 rounded-full flex items-center justify-center">
                    <span className="text-[#0f2044] font-bold text-xs">{p.avatar}</span>
                  </div>
                  <div>
                    <p className="text-gray-700 text-xs font-medium">{p.nome.split(' ')[1]}</p>
                    <p className="text-gray-400 text-xs">{dia.turno}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Config de critérios do Dr. Ben */}
      <div className="card border-l-4 border-primary">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-gold" /> Critérios de Repasse — Dr. Ben
        </h2>
        <p className="text-gray-500 text-sm mb-4">Quando o Dr. Ben deve acionar o alerta de plantonista?</p>
        <div className="space-y-3">
          {[
            { label: 'Score ≥ 70 pontos', ativo: true, desc: 'Lead bem qualificado pela IA' },
            { label: 'Lead solicita falar com humano', ativo: true, desc: 'Detectado pela análise de intenção' },
            { label: 'Valor estimado > R$ 3.000', ativo: true, desc: 'Caso de alto valor comercial' },
            { label: 'Palavras-chave de urgência', ativo: true, desc: 'Ex: "urgente", "preciso hoje", "corre risco"' },
            { label: 'Área Tributário (sempre)', ativo: false, desc: 'Todos os leads tributários vão para humano' },
          ].map((criterio, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-700 text-sm">{criterio.label}</p>
                <p className="text-gray-400 text-xs">{criterio.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${criterio.ativo ? 'bg-green-400' : 'bg-white/8'}`}>
                <div className={`w-4 h-4 bg-white/5 rounded-full shadow mt-1 transition-transform ${criterio.ativo ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
