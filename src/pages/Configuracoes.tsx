import React, { useState } from 'react'
import { Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

interface ConfigField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'password' | 'url'
  status: 'configured' | 'pending' | 'error'
  hint?: string
}

const configSections = [
  {
    title: '🔵 Google Ads',
    description: 'Conecte sua conta Google Ads via OAuth2 para gerenciar campanhas automaticamente.',
    fields: [
      { key: 'GOOGLE_ADS_CLIENT_ID', label: 'Client ID', placeholder: 'xxx.apps.googleusercontent.com', type: 'text', status: 'pending' },
      { key: 'GOOGLE_ADS_CLIENT_SECRET', label: 'Client Secret', placeholder: 'GOCSPX-...', type: 'password', status: 'pending' },
      { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', label: 'Developer Token', placeholder: 'ABcd...', type: 'password', status: 'pending' },
      { key: 'GOOGLE_ADS_REFRESH_TOKEN', label: 'Refresh Token', placeholder: '1//0g...', type: 'password', status: 'pending', hint: 'Gerado via OAuth2 flow' },
    ] as ConfigField[],
  },
  {
    title: '🟣 Meta Ads',
    description: 'Conecte sua conta Meta Business para gerenciar campanhas no Facebook e Instagram.',
    fields: [
      { key: 'META_APP_ID', label: 'App ID', placeholder: '123456789', type: 'text', status: 'pending' },
      { key: 'META_APP_SECRET', label: 'App Secret', placeholder: 'abc123...', type: 'password', status: 'pending' },
      { key: 'META_ACCESS_TOKEN', label: 'Access Token (Long-lived)', placeholder: 'EAAb...', type: 'password', status: 'pending' },
      { key: 'META_AD_ACCOUNT_ID', label: 'Ad Account ID', placeholder: 'act_123456789', type: 'text', status: 'pending' },
    ] as ConfigField[],
  },
  {
    title: '🤖 Inteligência Artificial',
    description: 'Chaves de API para os modelos de IA usados pelos agentes Lex.',
    fields: [
      { key: 'GEMINI_API_KEY', label: 'Gemini API Key', placeholder: 'AIza...', type: 'password', status: 'configured', hint: 'Já configurado no Vercel' },
      { key: 'GENSPARK_API_KEY', label: 'Genspark API Key', placeholder: 'gsk_...', type: 'password', status: 'pending', hint: 'Plano Team — 12k créditos/mês' },
    ] as ConfigField[],
  },
  {
    title: '💬 WhatsApp & Kommo',
    description: 'Integração com WhatsApp para envio de alertas e relatórios automáticos.',
    fields: [
      { key: 'WHATSAPP_TOKEN', label: 'WhatsApp Token', placeholder: 'EAAb...', type: 'password', status: 'configured', hint: 'Dr. Ben já configurado' },
      { key: 'KOMMO_API_KEY', label: 'Kommo API Key', placeholder: 'kommo_...', type: 'password', status: 'pending' },
      { key: 'WHATSAPP_NUMBER', label: 'Número WhatsApp', placeholder: '+55 86 9xxxx-xxxx', type: 'text', status: 'pending' },
    ] as ConfigField[],
  },
  {
    title: '🗄️ Banco de Dados',
    description: 'PostgreSQL Neon para armazenar campanhas, leads e logs dos agentes.',
    fields: [
      { key: 'DATABASE_URL', label: 'Database URL (Neon)', placeholder: 'postgresql://...', type: 'password', status: 'pending', hint: 'Criar em neon.tech (gratuito)' },
      { key: 'JWT_SECRET', label: 'JWT Secret', placeholder: 'random-secret-32-chars', type: 'password', status: 'pending' },
    ] as ConfigField[],
  },
]

export default function Configuracoes() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  const toggleKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaved(true)
    await new Promise(r => setTimeout(r, 1500))
    setSaved(false)
  }

  const totalConfigured = configSections.flatMap(s => s.fields).filter(f => f.status === 'configured').length
  const totalFields = configSections.flatMap(s => s.fields).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-slate-500 text-sm mt-1">Variáveis de ambiente e integrações do Lex Traffic</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm">
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-slate-700">Progresso da Configuração</h2>
          <span className="text-slate-500 text-sm">{totalConfigured}/{totalFields} configurados</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full">
          <div className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all"
            style={{ width: `${(totalConfigured / totalFields) * 100}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <p className="text-green-600 font-bold">{totalConfigured}</p>
            <p className="text-slate-400 text-xs">Configurados</p>
          </div>
          <div className="text-center">
            <p className="text-amber-600 font-bold">{totalFields - totalConfigured}</p>
            <p className="text-slate-400 text-xs">Pendentes</p>
          </div>
          <div className="text-center">
            <p className="text-slate-800 font-bold">{totalFields}</p>
            <p className="text-slate-400 text-xs">Total</p>
          </div>
        </div>
      </div>

      {/* Config sections */}
      {configSections.map((section) => (
        <div key={section.title} className="card">
          <h2 className="font-semibold text-slate-800 mb-1">{section.title}</h2>
          <p className="text-slate-500 text-sm mb-4">{section.description}</p>
          <div className="space-y-3">
            {section.fields.map((field) => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">{field.label}</label>
                  <span className={field.status === 'configured' ? 'badge-green' : 'badge-yellow'}>
                    {field.status === 'configured' ? '✅ Configurado' : '⏳ Pendente'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showKeys[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    defaultValue={field.status === 'configured' ? '••••••••••••••••' : ''}
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                  />
                  {field.type === 'password' && (
                    <button type="button" onClick={() => toggleKey(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showKeys[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {field.hint && <p className="text-slate-400 text-xs mt-1">💡 {field.hint}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Guia de configuração rápida */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <h2 className="font-semibold mb-3">🚀 Guia de Configuração Rápida</h2>
        <div className="space-y-2 text-sm text-primary-200">
          {[
            { step: '1', text: 'Google Ads: acesse console.cloud.google.com → crie projeto → ative Google Ads API → gere credenciais OAuth2' },
            { step: '2', text: 'Meta Ads: acesse developers.facebook.com → crie app → gere token de longa duração (60 dias)' },
            { step: '3', text: 'Neon DB: acesse neon.tech → crie projeto gratuito → copie DATABASE_URL' },
            { step: '4', text: 'Genspark: acesse configurações da API no seu painel Team → copie a chave' },
            { step: '5', text: 'Cole todas as variáveis no Vercel: Settings → Environment Variables → redeploy' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <span className="w-6 h-6 bg-gold rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{item.step}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vercel env vars */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-3">📋 Variáveis para o Vercel (copie e cole)</h2>
        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-xs font-mono whitespace-pre">{`# Google Ads
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=

# Meta Ads
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=

# IA
GEMINI_API_KEY=                   # já existe no drben
GENSPARK_API_KEY=

# WhatsApp
WHATSAPP_TOKEN=                   # já existe
WHATSAPP_PHONE_NUMBER_ID=
KOMMO_API_KEY=

# Database
DATABASE_URL=                     # postgresql://... (Neon)
JWT_SECRET=                       # string aleatória longa`}</pre>
        </div>
      </div>
    </div>
  )
}
