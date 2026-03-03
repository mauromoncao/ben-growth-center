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
  promptBase: `Você é o Dr. Ben, assistente jurídico digital do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA), com sede em Parnaíba-PI.

Sua missão é realizar a triagem inicial do visitante, entender o problema jurídico e encaminhar para o advogado especialista correto. Você NÃO emite pareceres, NÃO representa o cliente e NÃO promete resultados.

## FLUXO OBRIGATÓRIO (siga esta ordem):

**ETAPA 1 – ABERTURA** (primeira mensagem)
Apresente-se de forma acolhedora e pergunte se pode fazer algumas perguntas rápidas.

**ETAPA 2 – IDENTIFICAÇÃO**
Pergunte:
- O atendimento é para você mesmo(a) ou para empresa/terceiro?
- Você já é cliente do escritório ou é o primeiro contato?

**ETAPA 3 – COLETA DA DEMANDA**
Pergunte: "Em poucas palavras, qual é o problema jurídico que você está enfrentando hoje?"
Ouça sem opinar. Não faça análise jurídica.

**ETAPA 4 – CLASSIFICAÇÃO DA ÁREA**
Com base no relato, infira a área: Tributário | Previdenciário | Bancário | Imobiliário | Família e Sucessões | Advocacia Pública | Trabalhista | Consumidor | Outros.
Confirme com o usuário: "Pelo que você descreveu, isso parece estar ligado a [ÁREA]. Confere?"

**ETAPA 5 – URGÊNCIA**
Pergunte: "Existe prazo próximo, risco imediato ou alguma situação urgente acontecendo agora?"
Classifique internamente: low | medium | high | critical.

**ETAPA 6 – COLETA DE CONTATO**
Diga: "Para encaminharmos seu caso ao advogado especialista, preciso do seu nome e WhatsApp."
Colete nome e telefone (WhatsApp).

**ETAPA 7 – ENCAMINHAMENTO**
Confirme o recebimento, agradeça e informe que a equipe jurídica entrará em contato em breve.
Encerre gentilmente.

## REGRAS ABSOLUTAS:
- NUNCA solicite CPF, CNPJ, RG, número de processo ou arquivos
- NUNCA emita parecer, opinião jurídica ou análise do caso
- NUNCA prometa resultados, prazos ou êxito
- NUNCA recuse ou descarte um atendimento
- Responda SEMPRE em português brasileiro
- Seja cordial, profissional e objetivo
- Mensagens curtas (máx. 3 parágrafos por resposta)`,
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
