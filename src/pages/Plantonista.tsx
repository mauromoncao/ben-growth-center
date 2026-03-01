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
    telefone: '(86) 99999-0001',
    whatsapp: '5586999990001',
    ativo: true,
    online: true,
    atendimentosHoje: 3,
    avatar: 'MM',
  },
  {
    id: 'p2',
    nome: 'Dra. Ana Secretária',
    cargo: 'Assistente Jurídica',
    telefone: '(86) 99999-0002',
    whatsapp: '5586999990002',
    ativo: true,
    online: false,
    atendimentosHoje: 1,
    avatar: 'AS',
  },
  {
    id: 'p3',
    nome: 'Carlos Estagiário',
    cargo: 'Estagiário',
    telefone: '(86) 99999-0003',
    whatsapp: '5586999990003',
    ativo: false,
    online: false,
    atendimentosHoje: 0,
    avatar: 'CE',
  },
]

const escalaMock: EscalaDia[] = [
  { diaSemana: 'Sábado',      data: '01/03',   plantonistaId: 'p1', turno: '08h–18h', hoje: false },
  { diaSemana: 'Domingo',     data: '02/03',   plantonistaId: 'p2', turno: '09h–13h', hoje: false },
  { diaSemana: 'Segunda',     data: '03/03',   plantonistaId: 'p1', turno: '08h–18h', hoje: false },
  { diaSemana: 'Terça',       data: '04/03',   plantonistaId: 'p1', turno: '08h–18h', hoje: false },
  { diaSemana: 'Quarta',      data: '05/03',   plantonistaId: 'p2', turno: '08h–18h', hoje: false },
  { diaSemana: 'Quinta',      data: '06/03',   plantonistaId: 'p1', turno: '08h–18h', hoje: false },
  { diaSemana: 'Sexta',       data: '07/03',   plantonistaId: 'p1', turno: '08h–18h', hoje: false },
]

// ─── Componente de Alerta Push (simulado) ────────────────────
function AlertaPush({ onClose }: { onClose: () => void }) {
  const lead = crmLeadsMock.find(l => l.status === 'aguardando')!

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white/5 rounded-2xl shadow-2xl border-2 border-amber-400 animate-bounce-once overflow-hidden">
      {/* Header vermelho */}
      <div className="bg-amber-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-bold text-sm">⚡ LEAD AGUARDANDO VOCÊ</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">✕</button>
      </div>
      {/* Corpo */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{lead.nome[0]}</span>
          </div>
          <div>
            <p className="font-bold text-white">{lead.nome}</p>
            <p className="text-white/60 text-xs">{lead.area} · {lead.origem}</p>
          </div>
          <span className="ml-auto bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">URGENTE</span>
        </div>
        <p className="text-white/80 text-sm bg-white/4 rounded-lg p-3 mb-3">
          "{lead.resumoIA.substring(0, 100)}..."
        </p>
        <div className="flex gap-2">
          <button className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
            <MessageCircle className="w-4 h-4" /> Assumir
          </button>
          <button className="flex-1 bg-white/6 text-white/80 py-2 rounded-xl text-sm font-medium hover:bg-white/8 transition-colors">
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
          <h1 className="text-2xl font-bold text-white">Plantonista & Alertas</h1>
          <p className="text-white/60 text-sm mt-1">Controle de quem está de plantão e repasse automático do Dr. Ben</p>
        </div>
        <button
          onClick={() => setMostrarAlerta(true)}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <Bell className="w-4 h-4" /> Simular Alerta
        </button>
      </div>

      {/* Plantonista ativo agora */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" /> Plantonista Agora
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-sm">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">{plantonistaHoje.avatar}</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">{plantonistaHoje.nome}</p>
            <p className="text-gold-200">{plantonistaHoje.cargo}</p>
            <p className="text-gold-300 text-sm mt-1">{plantonistaHoje.telefone}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gold">{plantonistaHoje.atendimentosHoje}</p>
            <p className="text-gold-200 text-sm">atend. hoje</p>
          </div>
        </div>

        {/* Fila de espera */}
        {aguardando.length > 0 && (
          <div className="mt-4 bg-amber-500/20 border border-amber-400/40 rounded-xl p-3">
            <p className="text-amber-300 font-medium text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {aguardando.length} lead(s) aguardando atendimento humano
            </p>
            {aguardando.map(lead => (
              <div key={lead.id} className="flex items-center justify-between bg-white/5/10 rounded-lg p-2 mb-1">
                <div>
                  <p className="text-white text-sm font-medium">{lead.nome}</p>
                  <p className="text-gold-200 text-xs">{lead.area} · {lead.urgencia === 'alta' ? '🔴 Urgente' : '🟡 Normal'}</p>
                </div>
                <button className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-400 transition-colors">
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
            <h2 className="font-semibold text-white">📲 Notificações PWA no Celular</h2>
            <p className="text-white/60 text-sm mt-1">
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
                    : 'bg-white/8 text-white/80 hover:bg-slate-300'
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
        <h2 className="font-semibold text-white mb-4">🔄 Fluxo de Repasse Automático</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { icone: '🌐', titulo: 'Lead Entra', desc: 'Site, WhatsApp\nou Google/Meta Ads', cor: 'bg-blue-50 border-blue-200' },
            { icone: '🤖', titulo: 'Dr. Ben Qualifica', desc: 'IA coleta dados,\navalia urgência e área', cor: 'bg-amber-50 border-amber-200' },
            { icone: '📊', titulo: 'Score ≥ 70', desc: 'Lead aprovado\npara humano', cor: 'bg-purple-50 border-purple-200' },
            { icone: '📲', titulo: 'Alerta Push', desc: 'Notificação no celular\ndo plantonista', cor: 'bg-red-50 border-red-200' },
            { icone: '👤', titulo: 'Humano Assume', desc: 'Plantonista continua\no atendimento', cor: 'bg-green-50 border-green-200' },
          ].map((etapa, i) => (
            <React.Fragment key={etapa.titulo}>
              <div className={`flex-shrink-0 w-36 border-2 rounded-xl p-3 text-center ${etapa.cor}`}>
                <span className="text-3xl block mb-1">{etapa.icone}</span>
                <p className="font-semibold text-white/90 text-xs">{etapa.titulo}</p>
                <p className="text-white/50 text-xs mt-1 whitespace-pre-line">{etapa.desc}</p>
              </div>
              {i < 4 && (
                <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Equipe */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">👥 Equipe</h2>
          <button className="text-xs bg-navy-50 text-gold px-3 py-1 rounded-full hover:bg-navy-100">
            + Adicionar Membro
          </button>
        </div>
        <div className="space-y-3">
          {plantonistasMock.map(p => (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${plantonistaAtivo === p.id ? 'border-white/55 bg-navy-50' : 'border-white/8 hover:border-white/10'}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                    <span className="text-gold font-bold text-sm">{p.avatar}</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${p.online ? 'bg-green-400' : 'bg-slate-300'}`} />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{p.nome}</p>
                  <p className="text-white/50 text-xs">{p.cargo} · {p.atendimentosHoje} hoje</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.online ? 'bg-green-100 text-green-700' : 'bg-white/6 text-white/60'}`}>
                  {p.online ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={() => setPlantonistaAtivo(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    plantonistaAtivo === p.id
                      ? 'bg-navy text-white'
                      : 'bg-white/6 text-white/80 hover:bg-white/8'
                  }`}
                >
                  {plantonistaAtivo === p.id ? '✅ Plantonista' : 'Definir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escala semanal */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Escala Semanal
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {escalaMock.slice(0, 7).map(dia => {
            const p = plantonistasMock.find(pl => pl.id === dia.plantonistaId)!
            return (
              <div key={dia.diaSemana} className={`border rounded-xl p-3 ${dia.hoje ? 'border-white/40 bg-navy-50' : 'border-white/8'}`}>
                <p className={`font-semibold text-sm ${dia.hoje ? 'text-gold' : 'text-white/80'}`}>
                  {dia.diaSemana} {dia.hoje && '(Hoje)'}
                </p>
                <p className="text-white/50 text-xs">{dia.data}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-navy-100 rounded-full flex items-center justify-center">
                    <span className="text-gold font-bold text-xs">{p.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white/90 text-xs font-medium">{p.nome.split(' ')[1]}</p>
                    <p className="text-white/50 text-xs">{dia.turno}</p>
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
        <p className="text-white/60 text-sm mb-4">Quando o Dr. Ben deve acionar o alerta de plantonista?</p>
        <div className="space-y-3">
          {[
            { label: 'Score ≥ 70 pontos', ativo: true, desc: 'Lead bem qualificado pela IA' },
            { label: 'Lead solicita falar com humano', ativo: true, desc: 'Detectado pela análise de intenção' },
            { label: 'Valor estimado > R$ 3.000', ativo: true, desc: 'Caso de alto valor comercial' },
            { label: 'Palavras-chave de urgência', ativo: true, desc: 'Ex: "urgente", "preciso hoje", "corre risco"' },
            { label: 'Área Tributário (sempre)', ativo: false, desc: 'Todos os leads tributários vão para humano' },
          ].map((criterio, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/4 rounded-xl">
              <div>
                <p className="font-medium text-white/90 text-sm">{criterio.label}</p>
                <p className="text-white/50 text-xs">{criterio.desc}</p>
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
