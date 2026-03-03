// ============================================================
// BEN GROWTH CENTER — MARA IA Config API
// Rota: GET /api/mara-config  → retorna configuração ativa
//       POST /api/mara-config → salva nova configuração
// ============================================================

export const config = { maxDuration: 10 }

// Armazenamento em memória (persiste entre requests no mesmo container)
// Em produção, substituir por Supabase/KV store
let configAtiva = null

const CONFIG_PADRAO = {
  nome: 'Dr. Ben',
  saudacao: 'Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Como posso te ajudar hoje?',
  despedida: 'Foi um prazer atendê-lo! Se precisar de mais informações, estou aqui. Tenha um ótimo dia! ⚖️',
  tom: 'cordial',
  promptBase: `Você é o Dr. Ben, assistente jurídico inteligente do escritório Mauro Monção Advogados.
Especialidades: Direito Tributário, Previdenciário e Bancário.
Localização: Teresina, Piauí — Brasil.
Advogado responsável: Dr. Mauro Monção (OAB/PI).

REGRAS:
- Seja cordial, profissional e objetivo
- Responda em português do Brasil
- Nunca forneça pareceres jurídicos definitivos — indique a necessidade de consulta
- Ao final de cada resposta, ofereça agendar uma consulta
- Para urgências (execução fiscal, prazo, penhora), encaminhe ao plantonista
- Limite respostas a 3 parágrafos curtos para melhor leitura no WhatsApp`,
  areas: {
    tributario: true,
    previdenciario: true,
    bancario: true,
    trabalhista: false,
    civil: false,
    empresarial: false,
  },
  horario: {
    segunda: '08:00–18:00',
    terca:   '08:00–18:00',
    quarta:  '08:00–18:00',
    quinta:  '08:00–18:00',
    sexta:   '08:00–18:00',
    sabado:  '08:00–13:00',
    domingo: 'Fechado',
    ativoFimDeSemana: true,
  },
  repasseScore: 70,
  repassePalavras: ['urgente', 'execução fiscal', 'penhora', 'multa', 'prazo fatal', 'amanhã', 'hoje'],
  repasseValorMinimo: 3000,
  repasseSempre: ['tributario'],
  maxMensagensSesSao: 10,
  tempoEspera: 30,
  ativo: true,
  modoManutencao: false,
  mensagemManutencao: 'Estamos em manutenção no momento. Retornaremos em breve. Para urgências, ligue: (86) 99948-4761.',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET: retornar config atual ─────────────────────────────
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      config: configAtiva ?? CONFIG_PADRAO,
      fonte: configAtiva ? 'salva' : 'padrao',
      timestamp: new Date().toISOString(),
    })
  }

  // ── POST: salvar nova config ───────────────────────────────
  if (req.method === 'POST') {
    try {
      const novaConfig = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      // Validações básicas
      if (!novaConfig || typeof novaConfig !== 'object') {
        return res.status(400).json({ success: false, error: 'Configuração inválida' })
      }

      // Mesclar com padrão para garantir campos completos
      configAtiva = { ...CONFIG_PADRAO, ...novaConfig, updatedAt: new Date().toISOString() }

      console.log('[MARA Config] Configuração atualizada:', {
        nome: configAtiva.nome,
        ativo: configAtiva.ativo,
        tom: configAtiva.tom,
        areas: configAtiva.areas,
      })

      return res.status(200).json({
        success: true,
        config: configAtiva,
        message: 'Configuração da MARA IA salva com sucesso!',
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message })
    }
  }

  return res.status(405).json({ error: 'Método não permitido' })
}

// Exportar para uso no webhook whatsapp-evolution
export { configAtiva, CONFIG_PADRAO }
