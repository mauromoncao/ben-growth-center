// ============================================================
// LEX TRAFFIC — Dados Mock (substitua por APIs reais)
// ============================================================

export interface CampaignData {
  id: string
  name: string
  platform: 'google' | 'meta'
  status: 'active' | 'paused' | 'ended'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpl: number
  roas: number
  startDate: string
  area: string
}

export interface DailyMetric {
  date: string
  googleClicks: number
  metaClicks: number
  googleConversions: number
  metaConversions: number
  googleSpent: number
  metaSpent: number
  leads: number
}

export interface ContentItem {
  id: string
  title: string
  type: 'blog' | 'social' | 'ad_copy' | 'video_script'
  status: 'draft' | 'published' | 'scheduled'
  platform?: string
  area: string
  createdAt: string
  scheduledAt?: string
  aiAgent: string
  performance?: { views: number; clicks: number; leads: number }
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  area: string
  source: 'google_ads' | 'meta_ads' | 'organic' | 'whatsapp' | 'direct'
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  createdAt: string
  notes?: string
  value?: number
}

export interface AgentActivity {
  id: string
  agent: string
  action: string
  status: 'success' | 'running' | 'error' | 'scheduled'
  timestamp: string
  details?: string
}

export interface KeywordData {
  keyword: string
  volume: number
  cpc: number
  competition: 'low' | 'medium' | 'high'
  position?: number
  clicks?: number
  impressions?: number
  area: string
}

// ─── Campanhas ─────────────────────────────────────────────
export const mockCampaigns: CampaignData[] = [
  {
    id: 'g1',
    name: 'Recuperação Tributária - Piauí',
    platform: 'google',
    status: 'active',
    budget: 1500,
    spent: 987.40,
    impressions: 34520,
    clicks: 1241,
    conversions: 18,
    ctr: 3.59,
    cpc: 0.80,
    cpl: 54.86,
    roas: 4.2,
    startDate: '2026-02-01',
    area: 'Tributário',
  },
  {
    id: 'g2',
    name: 'Aposentadoria Especial INSS',
    platform: 'google',
    status: 'active',
    budget: 1000,
    spent: 654.20,
    impressions: 22100,
    clicks: 876,
    conversions: 12,
    ctr: 3.96,
    cpc: 0.75,
    cpl: 54.52,
    roas: 3.8,
    startDate: '2026-02-05',
    area: 'Previdenciário',
  },
  {
    id: 'g3',
    name: 'Revisão de Contrato Bancário',
    platform: 'google',
    status: 'paused',
    budget: 800,
    spent: 312.80,
    impressions: 9870,
    clicks: 310,
    conversions: 4,
    ctr: 3.14,
    cpc: 1.01,
    cpl: 78.20,
    roas: 2.1,
    startDate: '2026-02-10',
    area: 'Bancário',
  },
  {
    id: 'm1',
    name: 'Tributário - Instagram Stories',
    platform: 'meta',
    status: 'active',
    budget: 1200,
    spent: 834.60,
    impressions: 58400,
    clicks: 1520,
    conversions: 22,
    ctr: 2.60,
    cpc: 0.55,
    cpl: 37.94,
    roas: 5.1,
    startDate: '2026-02-01',
    area: 'Tributário',
  },
  {
    id: 'm2',
    name: 'Previdenciário - Facebook Feed',
    platform: 'meta',
    status: 'active',
    budget: 900,
    spent: 567.30,
    impressions: 41200,
    clicks: 980,
    conversions: 14,
    ctr: 2.38,
    cpc: 0.58,
    cpl: 40.52,
    roas: 4.3,
    startDate: '2026-02-08',
    area: 'Previdenciário',
  },
  {
    id: 'm3',
    name: 'Retargeting - Visitantes Site',
    platform: 'meta',
    status: 'active',
    budget: 500,
    spent: 289.70,
    impressions: 18600,
    clicks: 742,
    conversions: 19,
    ctr: 3.99,
    cpc: 0.39,
    cpl: 15.25,
    roas: 8.2,
    startDate: '2026-02-12',
    area: 'Geral',
  },
]

// ─── Métricas Diárias (últimos 14 dias) ────────────────────
export const mockDailyMetrics: DailyMetric[] = [
  { date: '15/02', googleClicks: 187, metaClicks: 241, googleConversions: 3, metaConversions: 4, googleSpent: 142, metaSpent: 118, leads: 7 },
  { date: '16/02', googleClicks: 203, metaClicks: 268, googleConversions: 4, metaConversions: 5, googleSpent: 158, metaSpent: 131, leads: 9 },
  { date: '17/02', googleClicks: 176, metaClicks: 224, googleConversions: 2, metaConversions: 3, googleSpent: 138, metaSpent: 107, leads: 5 },
  { date: '18/02', googleClicks: 219, metaClicks: 287, googleConversions: 5, metaConversions: 6, googleSpent: 167, metaSpent: 142, leads: 11 },
  { date: '19/02', googleClicks: 234, metaClicks: 312, googleConversions: 4, metaConversions: 7, googleSpent: 182, metaSpent: 154, leads: 11 },
  { date: '20/02', googleClicks: 198, metaClicks: 256, googleConversions: 3, metaConversions: 5, googleSpent: 154, metaSpent: 124, leads: 8 },
  { date: '21/02', googleClicks: 167, metaClicks: 198, googleConversions: 2, metaConversions: 3, googleSpent: 128, metaSpent: 96,  leads: 5 },
  { date: '22/02', googleClicks: 245, metaClicks: 334, googleConversions: 6, metaConversions: 8, googleSpent: 192, metaSpent: 162, leads: 14 },
  { date: '23/02', googleClicks: 228, metaClicks: 298, googleConversions: 4, metaConversions: 6, googleSpent: 177, metaSpent: 147, leads: 10 },
  { date: '24/02', googleClicks: 267, metaClicks: 341, googleConversions: 5, metaConversions: 8, googleSpent: 204, metaSpent: 167, leads: 13 },
  { date: '25/02', googleClicks: 289, metaClicks: 367, googleConversions: 7, metaConversions: 9, googleSpent: 221, metaSpent: 178, leads: 16 },
  { date: '26/02', googleClicks: 312, metaClicks: 389, googleConversions: 8, metaConversions: 11, googleSpent: 238, metaSpent: 192, leads: 19 },
  { date: '27/02', googleClicks: 278, metaClicks: 351, googleConversions: 6, metaConversions: 8, googleSpent: 215, metaSpent: 172, leads: 14 },
  { date: '28/02', googleClicks: 294, metaClicks: 378, googleConversions: 7, metaConversions: 10, googleSpent: 226, metaSpent: 184, leads: 17 },
]

// ─── Conteúdo Gerado por IA ─────────────────────────────────
export const mockContent: ContentItem[] = [
  {
    id: 'c1',
    title: 'Como Recuperar Créditos de ICMS no Piauí: Guia 2026',
    type: 'blog',
    status: 'published',
    area: 'Tributário',
    createdAt: '2026-02-25',
    aiAgent: 'Lex Conteúdo',
    performance: { views: 1240, clicks: 89, leads: 4 },
  },
  {
    id: 'c2',
    title: '5 Sinais que Você Tem Direito à Aposentadoria Especial',
    type: 'blog',
    status: 'published',
    area: 'Previdenciário',
    createdAt: '2026-02-23',
    aiAgent: 'Lex Conteúdo',
    performance: { views: 2180, clicks: 167, leads: 9 },
  },
  {
    id: 'c3',
    title: 'Juros Abusivos no Cheque Especial: Como Contestar',
    type: 'blog',
    status: 'scheduled',
    area: 'Bancário',
    createdAt: '2026-02-27',
    scheduledAt: '2026-03-01',
    aiAgent: 'Lex Conteúdo',
  },
  {
    id: 'c4',
    title: 'Post Instagram: Tributário — Você sabia que sua empresa pode recuperar impostos pagos indevidamente?',
    type: 'social',
    status: 'published',
    platform: 'Instagram',
    area: 'Tributário',
    createdAt: '2026-02-26',
    aiAgent: 'Lex Marketing',
    performance: { views: 4320, clicks: 234, leads: 12 },
  },
  {
    id: 'c5',
    title: 'Copy Google Ads: Recuperação de Crédito Tributário | Advocacia Especializada em Teresina',
    type: 'ad_copy',
    status: 'published',
    platform: 'Google Ads',
    area: 'Tributário',
    createdAt: '2026-02-20',
    aiAgent: 'Lex Campanhas',
    performance: { views: 34520, clicks: 1241, leads: 18 },
  },
  {
    id: 'c6',
    title: 'Script Vídeo Reels: Previdenciário — 3 erros que fazem você perder a aposentadoria',
    type: 'video_script',
    status: 'draft',
    platform: 'Instagram / TikTok',
    area: 'Previdenciário',
    createdAt: '2026-02-28',
    aiAgent: 'Lex Criativo',
  },
]

// ─── Leads ──────────────────────────────────────────────────
export const mockLeads: Lead[] = [
  { id: 'l1', name: 'Carlos Mendes', phone: '(86) 99801-2345', email: 'carlos@email.com', area: 'Tributário', source: 'google_ads', status: 'qualified', createdAt: '2026-02-28', value: 8000 },
  { id: 'l2', name: 'Ana Paula Sousa', phone: '(86) 99712-8765', email: 'ana@email.com', area: 'Previdenciário', source: 'meta_ads', status: 'new', createdAt: '2026-02-28', value: 3500 },
  { id: 'l3', name: 'Roberto Lima', phone: '(86) 99634-5678', email: 'roberto@email.com', area: 'Bancário', source: 'organic', status: 'contacted', createdAt: '2026-02-27', value: 5200 },
  { id: 'l4', name: 'Fernanda Costa', phone: '(86) 99521-9870', email: 'fernanda@email.com', area: 'Tributário', source: 'meta_ads', status: 'converted', createdAt: '2026-02-27', value: 12000 },
  { id: 'l5', name: 'José Alves', phone: '(86) 99400-1234', email: 'jose@email.com', area: 'Previdenciário', source: 'google_ads', status: 'qualified', createdAt: '2026-02-26', value: 4800 },
  { id: 'l6', name: 'Maria Oliveira', phone: '(86) 99388-5432', email: 'maria@email.com', area: 'Tributário', source: 'whatsapp', status: 'new', createdAt: '2026-02-26', value: 9500 },
  { id: 'l7', name: 'Paulo Santos', phone: '(86) 99245-6789', email: 'paulo@email.com', area: 'Bancário', source: 'google_ads', status: 'lost', createdAt: '2026-02-25', value: 0 },
  { id: 'l8', name: 'Luciana Ferreira', phone: '(86) 99178-3456', email: 'luciana@email.com', area: 'Previdenciário', source: 'meta_ads', status: 'converted', createdAt: '2026-02-25', value: 6200 },
]

// ─── Atividade dos Agentes ──────────────────────────────────
export const mockAgentActivities: AgentActivity[] = [
  { id: 'a1', agent: 'Lex Campanhas', action: 'Pausou palavra-chave "advogado gratuito" (CTR 0.3%)', status: 'success', timestamp: '28/02 08:47', details: 'Economia estimada: R$ 45/dia' },
  { id: 'a2', agent: 'Lex Conteúdo', action: 'Gerou artigo de blog — Tributário (1.2k palavras)', status: 'success', timestamp: '28/02 07:00', details: 'Publicado automaticamente no blog' },
  { id: 'a3', agent: 'Lex Marketing', action: 'Criou 3 posts para Instagram e Facebook', status: 'success', timestamp: '28/02 07:05', details: 'Agendados para 18:00, 20:00 e 22:00' },
  { id: 'a4', agent: 'Lex Relatório', action: 'Gerando relatório semanal (PDF)', status: 'running', timestamp: '28/02 09:00', details: 'Estimativa: 2 min' },
  { id: 'a5', agent: 'Lex Criativo', action: 'Gerou 4 variações de imagem para Meta Ads', status: 'success', timestamp: '27/02 16:30', details: 'Aguardando aprovação manual' },
  { id: 'a6', agent: 'Lex Campanhas', action: 'Aumentou lance +15% para "recuperação tributária Piauí"', status: 'success', timestamp: '27/02 09:12', details: 'Keyword com conversão acima de 5%' },
  { id: 'a7', agent: 'Lex Monitor', action: 'Alerta: orçamento Meta atingiu 70%', status: 'success', timestamp: '27/02 14:22', details: 'Notificação enviada via WhatsApp' },
  { id: 'a8', agent: 'Lex Conteúdo', action: 'Pesquisa de palavras-chave — área Bancário', status: 'scheduled', timestamp: '01/03 07:00', details: 'Agendado para amanhã' },
]

// ─── Palavras-chave ─────────────────────────────────────────
export const mockKeywords: KeywordData[] = [
  { keyword: 'recuperação tributária piauí', volume: 880, cpc: 2.40, competition: 'medium', position: 2, clicks: 412, impressions: 8200, area: 'Tributário' },
  { keyword: 'advogado tributarista teresina', volume: 590, cpc: 3.10, competition: 'medium', position: 1, clicks: 287, impressions: 5900, area: 'Tributário' },
  { keyword: 'aposentadoria especial inss', volume: 2400, cpc: 1.80, competition: 'high', position: 4, clicks: 198, impressions: 9600, area: 'Previdenciário' },
  { keyword: 'revisão de benefício inss', volume: 1600, cpc: 1.50, competition: 'high', position: 3, clicks: 167, impressions: 6400, area: 'Previdenciário' },
  { keyword: 'juros abusivos banco', volume: 3200, cpc: 2.20, competition: 'high', position: 6, clicks: 134, impressions: 12800, area: 'Bancário' },
  { keyword: 'crédito tributário empresa', volume: 720, cpc: 2.80, competition: 'medium', position: 2, clicks: 298, impressions: 4320, area: 'Tributário' },
  { keyword: 'advogado previdenciário piauí', volume: 480, cpc: 2.60, competition: 'low', position: 1, clicks: 312, impressions: 3840, area: 'Previdenciário' },
  { keyword: 'defesa administrativa receita federal', volume: 390, cpc: 3.40, competition: 'low', position: 1, clicks: 245, impressions: 2340, area: 'Tributário' },
]

// ─── Resumo de KPIs ─────────────────────────────────────────
export const mockKPIs = {
  totalLeads: 89,
  leadsVariation: +23.4,
  totalSpent: 3646.00,
  spentVariation: +8.2,
  avgCPL: 40.97,
  cplVariation: -12.1,
  totalConversions: 89,
  conversionRate: 4.8,
  conversionVariation: +1.2,
  totalImpressions: 184690,
  totalClicks: 5669,
  avgCTR: 3.07,
  roas: 4.8,
  roasVariation: +0.6,
  googleBudget: 3300,
  metaBudget: 2600,
  googleSpent: 1954.40,
  metaSpent: 1691.60,
  contentPublished: 14,
  contentScheduled: 3,
  activeAgents: 4,
}
