// ============================================================
// BEN GROWTH CENTER — Google Workspace Integration
// Calendar, Meet, Gmail, Drive APIs
// Google Workspace Business Standard @mauromoncao.adv.br
// ============================================================

export interface GoogleConfig {
  clientId: string
  scopes: string[]
  redirectUri: string
}

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
  attendees?: Array<{ email: string; displayName?: string }>
  location?: string
  meetLink?: string
  colorId?: string
}

export interface EmailMessage {
  to: string[]
  cc?: string[]
  subject: string
  body: string
  isHtml?: boolean
  attachmentDriveIds?: string[]
}

export interface DriveFile {
  id?: string
  name: string
  mimeType: string
  parentFolderId?: string
  content?: string
  description?: string
}

export interface MeetMeeting {
  title: string
  startTime: string
  durationMinutes: number
  attendees: string[]
  description?: string
}

// ─── OAuth Scopes necessários ────────────────────────────────
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

// ─── Constantes do escritório ────────────────────────────────
export const OFFICE_CONFIG = {
  email: 'mauromoncaoadv.escritorio@mauromoncao.adv.br',
  name: 'Mauro Monção Advogados Associados',
  timezone: 'America/Fortaleza',
  workingHours: { start: 8, end: 18 },
  workingDays: [1, 2, 3, 4, 5], // Seg-Sex
  calendarId: 'primary',
  // Pasta raiz no Drive para contratos
  driveFolderContratos: 'Ben Growth Center — Contratos',
  driveFolderLeads: 'Ben Growth Center — Leads',
  driveFolderRelatorios: 'Ben Growth Center — Relatórios',
}

// ─── Serviço Google Calendar ─────────────────────────────────
export const GoogleCalendarService = {
  /**
   * Cria evento de reunião de fechamento com link Google Meet automático
   */
  async criarReuniaoFechamento(params: {
    leadNome: string
    leadEmail: string
    leadTelefone: string
    assunto: string
    dataHora: string
    duracao?: number
  }): Promise<{ eventId: string; meetLink: string; calendarLink: string }> {
    const inicio = new Date(params.dataHora)
    const fim = new Date(inicio.getTime() + (params.duracao || 60) * 60000)

    const evento: CalendarEvent = {
      summary: `Reunião de Fechamento — ${params.leadNome}`,
      description: `
🎯 REUNIÃO COMERCIAL — BEN GROWTH CENTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Cliente: ${params.leadNome}
📱 Telefone: ${params.leadTelefone}
📧 Email: ${params.leadEmail}

📋 Assunto: ${params.assunto}

⚡ Gerado automaticamente pelo Ben Growth Center
Mauro Monção Advogados Associados
      `.trim(),
      startDateTime: inicio.toISOString(),
      endDateTime: fim.toISOString(),
      attendees: [
        { email: OFFICE_CONFIG.email, displayName: 'Dr. Mauro Monção' },
        { email: params.leadEmail, displayName: params.leadNome },
      ],
      colorId: '5', // Banana = amarelo/dourado
    }

    // Em produção: chamar Google Calendar API
    // const response = await gapi.client.calendar.events.insert({
    //   calendarId: 'primary',
    //   conferenceDataVersion: 1,
    //   requestBody: { ...evento, conferenceData: { createRequest: { requestId: uuid() } } }
    // })

    // Mock para desenvolvimento
    const mockEventId = `evt_${Date.now()}`
    const mockMeetLink = `https://meet.google.com/abc-${Math.random().toString(36).substr(2, 3)}-xyz`

    return {
      eventId: mockEventId,
      meetLink: mockMeetLink,
      calendarLink: `https://calendar.google.com/calendar/event?eid=${mockEventId}`,
    }
  },

  /**
   * Busca slots disponíveis na agenda nos próximos N dias
   */
  async buscarSlotsDisponiveis(diasAFrente: number = 7): Promise<Array<{
    data: string
    horarios: string[]
  }>> {
    const hoje = new Date()
    const slots = []

    for (let i = 1; i <= diasAFrente; i++) {
      const data = new Date(hoje)
      data.setDate(hoje.getDate() + i)
      const diaSemana = data.getDay()

      // Apenas dias úteis
      if (!OFFICE_CONFIG.workingDays.includes(diaSemana)) continue

      const horarios = []
      for (let h = OFFICE_CONFIG.workingHours.start; h < OFFICE_CONFIG.workingHours.end; h++) {
        if (h >= 12 && h < 13) continue // Pausa almoço
        horarios.push(`${h.toString().padStart(2, '0')}:00`)
        if (h < OFFICE_CONFIG.workingHours.end - 1) {
          horarios.push(`${h.toString().padStart(2, '0')}:30`)
        }
      }

      slots.push({
        data: data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
        horarios,
      })
    }

    return slots
  },

  /**
   * Cria lembrete automático 1h antes da reunião via WhatsApp
   */
  formatarLembreteWhatsApp(evento: { leadNome: string; dataHora: string; meetLink: string }): string {
    const data = new Date(evento.dataHora)
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    return `
Olá, ${evento.leadNome}! 👋

Lembrando que temos reunião hoje às *${horaFormatada}*.

📅 ${dataFormatada}
⏰ ${horaFormatada}
🎥 Link: ${evento.meetLink}

— Equipe Mauro Monção Advogados Associados
    `.trim()
  },
}

// ─── Serviço Gmail ───────────────────────────────────────────
export const GmailService = {
  /**
   * Templates de email para cada etapa do funil
   */
  templates: {
    boas_vindas: (nome: string): EmailMessage => ({
      to: [''],
      subject: '✅ Recebemos sua mensagem — Mauro Monção Advogados',
      body: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Georgia', serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2340; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #c9a84c; margin: 0; font-size: 20px;">MAURO MONÇÃO ADVOGADOS ASSOCIADOS</h1>
    <p style="color: #8fa8c8; margin: 8px 0 0; font-size: 13px;">Ben Growth Center — Inteligência Comercial Jurídica</p>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Olá, <strong>${nome}</strong>,</p>
    <p>Recebemos sua mensagem e nossa equipe entrará em contato em breve.</p>
    <p>Caso seja urgente, entre em contato diretamente:</p>
    <div style="background: #f7f5f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📱 WhatsApp:</strong> (86) 99999-9999</p>
      <p style="margin: 8px 0 0;"><strong>📧 Email:</strong> mauromoncaoadv.escritorio@mauromoncao.adv.br</p>
    </div>
    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
      Atenciosamente,<br>
      <strong style="color: #0f2340;">Equipe Mauro Monção Advogados Associados</strong><br>
      <span style="color: #c9a84c;">Tributarista · Previdenciário · Bancário</span>
    </p>
  </div>
  <div style="background: #f7f5f0; padding: 12px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #9ca3af;">
    OAB/PI — Teresina, Piauí | <a href="https://www.mauromoncao.adv.br" style="color: #0f2340;">mauromoncao.adv.br</a>
  </div>
</body>
</html>
      `.trim(),
      isHtml: true,
    }),

    confirmacao_reuniao: (nome: string, dataHora: string, meetLink: string): EmailMessage => ({
      to: [''],
      subject: '📅 Reunião Confirmada — Mauro Monção Advogados',
      body: `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2340; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #c9a84c; margin: 0; font-size: 20px;">REUNIÃO CONFIRMADA</h1>
    <p style="color: #8fa8c8; margin: 8px 0 0;">Mauro Monção Advogados Associados</p>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>Sua reunião foi confirmada:</p>
    <div style="background: #f0f9f4; border-left: 4px solid #00b37e; padding: 16px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0;"><strong>📅 Data:</strong> ${dataHora}</p>
      <p style="margin: 8px 0 0;"><strong>🎥 Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>
    </div>
    <p><strong>O que preparar:</strong></p>
    <ul>
      <li>Documentos relacionados ao seu caso</li>
      <li>Perguntas que deseja fazer</li>
      <li>Conexão estável com internet</li>
    </ul>
  </div>
</body>
</html>
      `.trim(),
      isHtml: true,
    }),

    follow_up_24h: (nome: string): EmailMessage => ({
      to: [''],
      subject: '👋 Oi ${nome}, ainda posso ajudar? — Mauro Monção',
      body: `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f2340; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #c9a84c; margin: 0; font-size: 20px;">MAURO MONÇÃO ADVOGADOS</h1>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Olá, <strong>${nome}</strong>,</p>
    <p>Vi que você entrou em contato ontem. Gostaria de agendar uma conversa rápida para entender melhor como posso ajudar?</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://www.mauromoncao.adv.br/agendar" 
         style="background: #c9a84c; color: #0f2340; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Agendar Conversa Gratuita →
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      Ou responda este email com sua disponibilidade.<br><br>
      Atenciosamente,<br>
      <strong>Dr. Mauro Monção</strong><br>
      Tributarista · OAB/PI
    </p>
  </div>
</body>
</html>
      `.trim(),
      isHtml: true,
    }),
  },
}

// ─── Serviço Google Drive ────────────────────────────────────
export const GoogleDriveService = {
  /**
   * Estrutura de pastas do escritório no Drive
   */
  estruturaPastas: {
    'Ben Growth Center': {
      'Contratos': {
        '2026': {},
        'Pendentes Assinatura': {},
        'Assinados': {},
      },
      'Leads': {
        'Qualificados': {},
        'Convertidos': {},
      },
      'Relatórios': {
        'Semanais': {},
        'Mensais': {},
      },
      'Marketing': {
        'Criativos': {},
        'Campanhas': {},
      },
    },
  },

  /**
   * Gera nome de arquivo padronizado para contrato
   */
  gerarNomeContrato(clienteNome: string, tipo: string): string {
    const data = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const nomeLimpo = clienteNome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase()
    const tipoLimpo = tipo.replace(/\s+/g, '_').toUpperCase()
    return `${data}_CONTRATO_${tipoLimpo}_${nomeLimpo}.pdf`
  },

  /**
   * Gera link direto do Drive para visualização
   */
  gerarLinkVisualizacao(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`
  },

  /**
   * Gera link de download
   */
  gerarLinkDownload(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  },
}

// ─── Tipos para reunião completa ─────────────────────────────
export interface ReuniaoCompleta {
  leadId: string
  leadNome: string
  leadEmail: string
  leadTelefone: string
  assunto: string
  dataHora: string
  duracao: number
  meetLink?: string
  eventId?: string
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada'
  contratoZapSignId?: string
  pagamentoAsaasId?: string
  driveContratoId?: string
}

// ─── Status de integração para exibição no painel ────────────
export interface IntegracaoStatus {
  nome: string
  ativo: boolean
  icone: string
  cor: string
  descricao: string
  configurado: boolean
  ultimaSync?: string
}

export const INTEGRACOES_CONFIG: Record<string, IntegracaoStatus> = {
  google_calendar: {
    nome: 'Google Calendar',
    ativo: true,
    icone: '📅',
    cor: '#4285F4',
    descricao: 'Agendamento automático de reuniões com link Meet',
    configurado: false,
    ultimaSync: undefined,
  },
  google_meet: {
    nome: 'Google Meet',
    ativo: true,
    icone: '🎥',
    cor: '#00897B',
    descricao: 'Links de reunião automáticos criados com cada agendamento',
    configurado: false,
    ultimaSync: undefined,
  },
  gmail: {
    nome: 'Gmail',
    ativo: true,
    icone: '✉️',
    cor: '#EA4335',
    descricao: 'Emails automáticos: confirmação, lembrete e follow-up',
    configurado: false,
    ultimaSync: undefined,
  },
  google_drive: {
    nome: 'Google Drive',
    ativo: true,
    icone: '💾',
    cor: '#FBBC04',
    descricao: 'Armazenamento automático de contratos e documentos',
    configurado: false,
    ultimaSync: undefined,
  },
  zapsign: {
    nome: 'ZapSign',
    ativo: true,
    icone: '✍️',
    cor: '#7C3AED',
    descricao: 'Assinatura digital de contratos e procurações',
    configurado: false,
    ultimaSync: undefined,
  },
  asaas: {
    nome: 'Asaas',
    ativo: true,
    icone: '💳',
    cor: '#059669',
    descricao: 'Cobrança automática: Pix, boleto e cartão de crédito',
    configurado: false,
    ultimaSync: undefined,
  },
  whatsapp: {
    nome: 'WhatsApp Business',
    ativo: true,
    icone: '💬',
    cor: '#25D366',
    descricao: 'Notificações, lembretes e atendimento via Dr. Ben',
    configurado: true,
    ultimaSync: new Date().toISOString(),
  },
  instagram: {
    nome: 'Instagram Graph API',
    ativo: false,
    icone: '📸',
    cor: '#E1306C',
    descricao: 'Captura leads de DM e comentários para o CRM (Fase 2)',
    configurado: false,
    ultimaSync: undefined,
  },
}
