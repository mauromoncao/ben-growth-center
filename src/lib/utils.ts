import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.join(' ').replace(/\s+/g, ' ').trim()
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'google': return '#4285F4'
    case 'meta': return '#1877F2'
    default: return '#6366f1'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'badge-green'
    case 'paused': return 'badge-yellow'
    case 'ended': return 'badge-red'
    case 'new': return 'badge-blue'
    case 'contacted': return 'badge-yellow'
    case 'qualified': return 'badge-green'
    case 'converted': return 'bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium'
    case 'lost': return 'badge-red'
    case 'published': return 'badge-green'
    case 'draft': return 'badge-yellow'
    case 'scheduled': return 'badge-blue'
    case 'success': return 'badge-green'
    case 'running': return 'badge-blue'
    case 'error': return 'badge-red'
    default: return 'badge-yellow'
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    paused: 'Pausado',
    ended: 'Encerrado',
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    converted: 'Convertido',
    lost: 'Perdido',
    published: 'Publicado',
    draft: 'Rascunho',
    scheduled: 'Agendado',
    success: 'Concluído',
    running: 'Executando',
    error: 'Erro',
    google_ads: 'Google Ads',
    meta_ads: 'Meta Ads',
    organic: 'Orgânico',
    whatsapp: 'WhatsApp',
    direct: 'Direto',
    blog: 'Blog',
    social: 'Redes Sociais',
    ad_copy: 'Copy Anúncio',
    video_script: 'Script Vídeo',
  }
  return labels[status] || status
}
