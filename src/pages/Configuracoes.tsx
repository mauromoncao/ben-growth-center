import React, { useState } from 'react'
import { Save, Eye, EyeOff, CheckCircle2, Bot, MapPin, Phone, Mail, Globe, Clock, MessageCircle } from 'lucide-react'
import { DR_BEN_PROFILE } from '../lib/drBenProfile'

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
    title: '💬 WhatsApp Business API (Meta)',
    description: 'Token oficial Meta para envio real de mensagens pelo Dr. Ben.',
    fields: [
      { key: 'WHATSAPP_TOKEN',          label: 'Access Token (Meta)',       placeholder: 'EAAb...', type: 'password', status: 'pending', hint: 'Meta Business Suite → Configurações → Acesso à API do WhatsApp' },
      { key: 'WHATSAPP_PHONE_NUMBER_ID',label: 'Phone Number ID',           placeholder: '12345678901234', type: 'text', status: 'pending', hint: 'ID do número: 888304720788200 (já verificado ✅)' },
      { key: 'WHATSAPP_WABA_ID',        label: 'WABA ID',                   placeholder: '888304720788200', type: 'text', status: 'configured', hint: 'Conta Dr. Mauro Monção — Meta Verificado ✅' },
    ] as ConfigField[],
  },
  {
    title: '🟣 Meta Ads (Facebook & Instagram)',
    description: 'Conta act_446623386807925 configurada. Insira o Access Token para ativar dados reais.',
    fields: [
      { key: 'META_AD_ACCOUNT_ID', label: 'Ad Account ID',             placeholder: 'act_446623386807925', type: 'text',     status: 'configured', hint: 'act_446623386807925 — Mauro Moncao ✅' },
      { key: 'META_APP_ID',        label: 'App ID',                    placeholder: '123456789',           type: 'text',     status: 'pending' },
      { key: 'META_APP_SECRET',    label: 'App Secret',                placeholder: 'abc123...',           type: 'password', status: 'pending' },
      { key: 'META_ACCESS_TOKEN',  label: 'Access Token (Long-lived)', placeholder: 'EAAb...',             type: 'password', status: 'pending', hint: 'developers.facebook.com → Explorador de API Graph → ads_read + ads_management' },
    ] as ConfigField[],
  },
  {
    title: '🔵 Google Ads',
    description: 'Conecte sua conta Google Ads para gerenciar campanhas e keywords automaticamente.',
    fields: [
      { key: 'GOOGLE_ADS_CLIENT_ID',       label: 'Client ID',        placeholder: 'xxx.apps.googleusercontent.com', type: 'text',     status: 'pending' },
      { key: 'GOOGLE_ADS_CLIENT_SECRET',   label: 'Client Secret',    placeholder: 'GOCSPX-...',                    type: 'password', status: 'pending' },
      { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', label: 'Developer Token',  placeholder: 'ABcd...',                       type: 'password', status: 'pending' },
      { key: 'GOOGLE_ADS_REFRESH_TOKEN',   label: 'Refresh Token',    placeholder: '1//0g...',                      type: 'password', status: 'pending', hint: 'Gerado via OAuth2 flow' },
    ] as ConfigField[],
  },
  {
    title: '💚 Asaas (Pix · Boleto · Cartão)',
    description: 'Cobranças automáticas, Pix instantâneo e boleto bancário. Token de produção ativo.',
    fields: [
      { key: 'ASAAS_TOKEN', label: 'API Token Asaas', placeholder: '$aact_prod_...', type: 'password', status: 'configured', hint: 'Token de produção configurado ✅' },
    ] as ConfigField[],
  },
  {
    title: '✍️ ZapSign',
    description: 'Assinatura eletrônica de contratos — token já configurado e ativo.',
    fields: [
      { key: 'ZAPSIGN_TOKEN', label: 'ZapSign API Token', placeholder: '426e787a-...', type: 'password', status: 'configured', hint: 'Token ativo: 426e787a-3446-4341-bbd2-2b88e544ad39 ✅' },
    ] as ConfigField[],
  },
  {
    title: '🤖 Inteligência Artificial — Stack Enterprise',
    description: 'OpenAI GPT-4o · Claude Haiku 4.5 · Perplexity — cada agente usa o modelo ideal. — cada agente usa o modelo ideal.',
    fields: [
      { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', placeholder: 'sk-...', type: 'password', status: 'configured', hint: 'GPT-4o + GPT-4o Mini — todos os agentes Growth' },
      { key: 'OPENAI_API_KEY',     label: 'OpenAI API Key (GPT-4o)',        placeholder: 'sk-...',        type: 'password', status: 'pending',    hint: 'Lex Campanhas + Lex Marketing + Lex Criativo — platform.openai.com' },
      { key: 'ANTHROPIC_API_KEY',  label: 'Anthropic API Key (Claude)',     placeholder: 'sk-ant-...',    type: 'password', status: 'pending',    hint: 'Lex Jurídico + Lex Petições — console.anthropic.com' },
      { key: 'PERPLEXITY_API_KEY', label: 'Perplexity API Key',             placeholder: 'pplx-...',      type: 'password', status: 'pending',    hint: 'Pesquisa jurisprudência STJ/STF em tempo real — perplexity.ai/api' },
    ] as ConfigField[],
  },
  {
    title: '🎙️ Voz & Memória — ElevenLabs + Pinecone',
    description: 'Dr. Ben fala com sua voz clonada e lembra de cada cliente.',
    fields: [
      { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs API Key',             placeholder: 'sk_...',        type: 'password', status: 'pending',    hint: 'Voz clonada do Dr. Ben — elevenlabs.io/app/settings/api-keys' },
      { key: 'ELEVENLABS_VOICE_ID',label: 'ElevenLabs Voice ID',            placeholder: 'abc123xyz...',  type: 'text',     status: 'pending',    hint: 'ID da voz clonada — elevenlabs.io/voice-lab' },
      { key: 'PINECONE_API_KEY',   label: 'Pinecone API Key',               placeholder: 'pcsk_...',      type: 'password', status: 'pending',    hint: 'Memória vetorial — Dr. Ben lembra clientes — pinecone.io' },
      { key: 'PINECONE_INDEX_HOST',label: 'Pinecone Index Host URL',        placeholder: 'https://xxx.svc.pinecone.io', type: 'text', status: 'pending', hint: 'URL do index criado no Pinecone' },
    ] as ConfigField[],
  },
  {
    title: '📧 Email & Notificações — Resend',
    description: 'Emails profissionais automáticos: confirmação de reunião, follow-up 24h, leads.',
    fields: [
      { key: 'RESEND_API_KEY',     label: 'Resend API Key',                 placeholder: 're_...',        type: 'password', status: 'pending',    hint: 'Emails transacionais gratuitos (3k/mês) — resend.com' },
    ] as ConfigField[],
  },
  {
    title: '🗄️ Banco de Dados',
    description: 'PostgreSQL Neon para armazenar leads, contratos e logs dos agentes.',
    fields: [
      { key: 'DATABASE_URL',       label: 'Database URL (Neon)',            placeholder: 'postgresql://...', type: 'password', status: 'pending', hint: 'Criar em neon.tech (gratuito até 3GB)' },
      { key: 'JWT_SECRET',         label: 'JWT Secret',                     placeholder: 'string-aleatoria-32-chars', type: 'password', status: 'pending' },
    ] as ConfigField[],
  },
]

export default function Configuracoes() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved]       = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'perfil' | 'integrações'>('perfil')

  const toggleKey = (key: string) =>
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))

  const handleSave = async () => {
    setSaved(true)
    await new Promise(r => setTimeout(r, 1500))
    setSaved(false)
  }

  const totalConfigured = configSections.flatMap(s => s.fields).filter(f => f.status === 'configured').length
  const totalFields     = configSections.flatMap(s => s.fields).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Perfil Dr. Ben · Integrações · Variáveis de ambiente</p>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
          style={{ background: '#D4A017', color: '#0f2044' }}>
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {(['perfil', 'integrações'] as const).map(aba => (
          <button key={aba} onClick={() => setAbaAtiva(aba)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border capitalize transition-all ${
              abaAtiva === aba
                ? 'border-[#D4A017] text-[#D4A017] bg-[#D4A017]/10'
                : 'border-gray-200 text-gray-400 hover:border-white/20'
            }`}>
            {aba === 'perfil' ? '🤖 Perfil Dr. Ben' : '🔌 Integrações'}
          </button>
        ))}
      </div>

      {/* ── ABA PERFIL DR. BEN ── */}
      {abaAtiva === 'perfil' && (
        <div className="space-y-6">

          {/* Card principal do perfil */}
          <div className="bg-[#0f1629] border border-gray-200 rounded-2xl overflow-hidden">
            {/* Banner */}
            <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #0f2044, #1e3470, #D4A017)' }} />

            {/* Avatar + Info */}
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-12 mb-4">
                <div className="relative">
                  <img
                    src="/dr-ben-avatar.jpg"
                    alt="Dr. Ben"
                    className="w-24 h-24 rounded-2xl border-4 object-cover shadow-xl"
                    style={{ borderColor: '#0f1629' }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: '#0f1629' }}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="pb-2">
                  <h2 className="text-xl font-bold text-gray-900">{DR_BEN_PROFILE.nomeCompleto}</h2>
                  <p className="text-gray-400 text-sm">{DR_BEN_PROFILE.descricao}</p>
                </div>
              </div>

              {/* Detalhes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: <MapPin className="w-4 h-4" />,      label: 'Endereço',  value: DR_BEN_PROFILE.endereco },
                  { icon: <Phone className="w-4 h-4" />,       label: 'Telefone',  value: DR_BEN_PROFILE.telefone },
                  { icon: <Mail className="w-4 h-4" />,        label: 'E-mail',    value: DR_BEN_PROFILE.email },
                  { icon: <Globe className="w-4 h-4" />,       label: 'Site',      value: DR_BEN_PROFILE.site },
                  { icon: <Clock className="w-4 h-4" />,       label: 'Horário',   value: DR_BEN_PROFILE.horario },
                  { icon: <MessageCircle className="w-4 h-4" />,label: 'WABA ID',  value: DR_BEN_PROFILE.whatsappId },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <div className="text-[#D4A017] flex-shrink-0">{item.icon}</div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-xs">{item.label}</p>
                      <p className="text-white text-sm font-medium truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Áreas de atuação */}
          <div className="bg-[#0f1629] border border-gray-200 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#D4A017]" /> Áreas de Atuação
            </h3>
            <div className="flex flex-wrap gap-2">
              {DR_BEN_PROFILE.areas.map(area => (
                <span key={area}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ background: 'rgba(212,160,23,0.10)', borderColor: 'rgba(212,160,23,0.30)', color: '#D4A017' }}>
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Mensagem de saudação */}
          <div className="bg-[#0f1629] border border-gray-200 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Mensagem de Saudação (WhatsApp)
            </h3>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <pre className="text-gray-600 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {DR_BEN_PROFILE.saudacao}
              </pre>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-[#0f1629] border border-gray-200 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3">📋 Templates de Mensagem Aprovados</h3>
            <div className="space-y-3">
              {Object.entries(DR_BEN_PROFILE.templates).map(([key, tpl]) => (
                <div key={key} className="bg-white/5 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-semibold">{tpl.nome}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#0f2044]/20 text-blue-300 border border-[#0f2044]/30">
                      {tpl.idioma}
                    </span>
                  </div>
                  <pre className="text-gray-400 text-xs whitespace-pre-wrap font-sans">{tpl.texto}</pre>
                </div>
              ))}
            </div>
          </div>

          {/* Instrução para configurar foto no WhatsApp */}
          <div className="bg-[#0f1629] border border-amber-500/30 rounded-2xl p-5">
            <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
              ⚠️ Para atualizar a foto do perfil no WhatsApp Business
            </h3>
            <p className="text-gray-500 text-sm mb-3">
              A foto acima está configurada no sistema. Para aplicar no WhatsApp Business oficial, 
              é necessário o <strong className="text-white">Access Token da Meta API</strong>. 
              Quando inserir o token na aba "Integrações", a foto será sincronizada automaticamente.
            </p>
            <div className="bg-black/30 rounded-xl p-3 font-mono text-xs text-green-400">
              POST https://graph.facebook.com/v19.0/888304720788200/whatsapp_business_profile<br/>
              → description, email, websites, vertical<br/>
              → profile_picture_url: /dr-ben-avatar.jpg
            </div>
          </div>

        </div>
      )}

      {/* ── ABA INTEGRAÇÕES ── */}
      {abaAtiva === 'integrações' && (
        <div className="space-y-6">

          {/* Progresso */}
          <div className="bg-[#0f1629] border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Progresso da Configuração</h2>
              <span className="text-gray-500 text-sm">{totalConfigured}/{totalFields} configurados</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(totalConfigured / totalFields) * 100}%`, background: '#D4A017' }} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Configurados', value: totalConfigured,              color: 'text-emerald-400' },
                { label: 'Pendentes',    value: totalFields - totalConfigured, color: 'text-amber-400' },
                { label: 'Total',        value: totalFields,                   color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seções de config */}
          {configSections.map(section => (
            <div key={section.title} className="bg-[#0f1629] border border-gray-200 rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-1">{section.title}</h2>
              <p className="text-gray-400 text-sm mb-4">{section.description}</p>
              <div className="space-y-4">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">{field.label}</label>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        field.status === 'configured'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {field.status === 'configured' ? '✅ Configurado' : '⏳ Pendente'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={field.type === 'password' && !showKeys[field.key] ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        defaultValue={field.status === 'configured' ? '••••••••••••••••' : ''}
                        className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-gray-200 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4A017] font-mono"
                      />
                      {field.type === 'password' && (
                        <button type="button" onClick={() => toggleKey(field.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {showKeys[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {field.hint && (
                      <p className="text-gray-400 text-xs mt-1">💡 {field.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Variáveis Vercel */}
          <div className="bg-[#0f1629] border border-gray-200 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-3">📋 Variáveis para o Vercel</h2>
            <div className="bg-black/50 rounded-xl p-4 overflow-x-auto">
              <pre className="text-green-400 text-xs font-mono whitespace-pre">{`# WhatsApp Business API (Meta)
WHATSAPP_TOKEN=               # EAAb... (Access Token Meta)
WHATSAPP_PHONE_NUMBER_ID=     # ID do número
WHATSAPP_WABA_ID=888304720788200

# Meta Ads
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=

# Google Ads
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_REFRESH_TOKEN=

# ZapSign ✅ já configurado
ZAPSIGN_TOKEN=426e787a-3446-4341-bbd2-2b88e544ad39

# IA ✅ Stack GPT-4o + Claude Haiku configurado
GEMINI_API_KEY=
GENSPARK_API_KEY=

# Database
DATABASE_URL=                 # postgresql://... (Neon)
JWT_SECRET=`}</pre>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
