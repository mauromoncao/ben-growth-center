// ============================================================
// BEN GROWTH CENTER — Cron: Alertas de Agenda
// Rota: GET /api/cron/agenda-alertas
// Schedule: a cada 15 minutos (*/15 * * * *)
// Verifica compromissos próximos e envia alerta ao plantonista
// ============================================================

export const config = { maxDuration: 30 }

// Importar agenda da secretária (compartilhado via módulo)
// Em produção: buscar do Pinecone/Supabase
import { AGENDA, enviarWhatsApp, formatarDataHora } from '../secretaria.js'

export default async function handler(req, res) {
  // Aceitar GET (cron Vercel) ou POST (teste manual)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const agora = new Date()
    const plantonista = process.env.PLANTONISTA_WHATSAPP
    const alertasEnviados = []

    // Verificar cada compromisso
    for (const [id, comp] of AGENDA.entries()) {
      if (comp.status === 'cancelado' || comp.status === 'concluido') continue

      const dataComp = new Date(comp.dataHora)
      const diffMin = Math.floor((dataComp - agora) / 60000) // diferença em minutos

      // Verificar se deve alertar
      const alertas = comp.alertas_min || [30, 60]
      for (const minutosAntes of alertas) {
        const jaAlertado = comp.alertasEnviados?.includes(minutosAntes)
        if (!jaAlertado && diffMin > 0 && diffMin <= minutosAntes && diffMin > minutosAntes - 16) {
          // Dentro da janela de alerta (±15 min)
          const icones = {
            audiencia: '⚖️', reuniao: '🤝', consulta: '📋',
            prazo: '⏰', ligacao: '📞', outro: '📅',
          }

          const msg = `🔔 *LEMBRETE — ${minutosAntes}min*\n\n` +
            `${icones[comp.tipo] || '📅'} *${comp.titulo}*\n` +
            `📆 ${formatarDataHora(comp.dataHora)}\n` +
            (comp.cliente ? `👤 ${comp.cliente}\n` : '') +
            (comp.processo ? `📂 ${comp.processo}\n` : '') +
            (comp.local ? `📍 ${comp.local}\n` : '') +
            `\n_ID: ${id}_`

          if (plantonista) {
            await enviarWhatsApp(plantonista, msg)
          }

          // Registrar alerta enviado
          if (!comp.alertasEnviados) comp.alertasEnviados = []
          comp.alertasEnviados.push(minutosAntes)
          AGENDA.set(id, comp)

          alertasEnviados.push({
            compromissoId: id,
            titulo: comp.titulo,
            minutosAntes,
            dataHora: comp.dataHora,
          })

          console.log(`[Cron Agenda] Alerta ${minutosAntes}min enviado: ${comp.titulo}`)
        }
      }

      // Marcar como concluído se já passou
      if (diffMin < -30 && comp.status === 'agendado') {
        comp.status = 'concluido'
        AGENDA.set(id, comp)
      }
    }

    return res.status(200).json({
      success: true,
      verificados: AGENDA.size,
      alertasEnviados: alertasEnviados.length,
      detalhes: alertasEnviados,
      timestamp: agora.toISOString(),
    })

  } catch (error) {
    console.error('[Cron Agenda] Erro:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
