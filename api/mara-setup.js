// ============================================================
// MARA IA — Setup Automático da Instância Z-API
// Rota: GET /api/mara-setup?action=webhook  → configura webhook
//       GET /api/mara-setup?action=status   → verifica status
//       GET /api/mara-setup?action=testar   → envia mensagem de teste
// ============================================================

export const config = { maxDuration: 30 }

const MARA_INSTANCE_ID  = process.env.MARA_ZAPI_INSTANCE_ID  || ''
const MARA_TOKEN        = process.env.MARA_ZAPI_TOKEN        || ''
const CLIENT_TOKEN      = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
const WEBHOOK_URL       = 'https://ben-growth-center.vercel.app/api/whatsapp-mara'
const DR_MAURO_NUMERO   = process.env.PLANTONISTA_WHATSAPP   || '+5586999484761'

const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (CLIENT_TOKEN) h['Client-Token'] = CLIENT_TOKEN
  return h
}

async function zapiGet(path) {
  const r = await fetch(`${MARA_BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  })
  return r.json().catch(() => ({ error: 'resposta inválida' }))
}

async function zapiPost(path, body) {
  const r = await fetch(`${MARA_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  })
  return r.json().catch(() => ({ error: 'resposta inválida' }))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const action = req.query?.action || 'status'

  // ── Verificar configuração ────────────────────────────────
  const config_ok = {
    instance_id: MARA_INSTANCE_ID ? `✅ ${MARA_INSTANCE_ID.slice(0, 8)}...` : '❌ NÃO CONFIGURADO',
    token:       MARA_TOKEN       ? `✅ ${MARA_TOKEN.slice(0, 8)}...`        : '❌ NÃO CONFIGURADO',
    client_token: CLIENT_TOKEN    ? '✅ configurado'                         : '❌ NÃO CONFIGURADO',
  }

  if (!MARA_INSTANCE_ID || !MARA_TOKEN) {
    return res.status(200).json({
      ok: false,
      mensagem: '⚠️ Instância MARA não configurada no Vercel',
      instrucoes: {
        passo1: 'Acesse: https://vercel.com → seu projeto → Settings → Environment Variables',
        passo2: 'Adicione: MARA_ZAPI_INSTANCE_ID = 3EFBA328D48CC11FFCB66237BF5854B6',
        passo3: 'Adicione: MARA_ZAPI_TOKEN = EAC44AD0F0FF58FCD5A23C3B',
        passo4: 'MARA_ZAPI_CLIENT_TOKEN já usa o ZAPI_CLIENT_TOKEN como fallback ✅',
        passo5: 'Após salvar, aguarde o redeploy e acesse /api/mara-setup?action=webhook',
      },
      config: config_ok,
    })
  }

  // ── ACTION: status ────────────────────────────────────────
  if (action === 'status') {
    const status = await zapiGet('/status').catch(e => ({ error: e.message }))
    const webhooks = await zapiGet('/webhooks').catch(e => ({ error: e.message }))

    return res.json({
      ok: true,
      instancia: MARA_INSTANCE_ID,
      config: config_ok,
      status_zapi: status,
      webhooks_configurados: webhooks,
      webhook_esperado: WEBHOOK_URL,
    })
  }

  // ── ACTION: webhook ───────────────────────────────────────
  if (action === 'webhook') {
    const resultados = {}

    // Configurar webhook de mensagens recebidas
    resultados.received = await zapiPost('/update-webhook-received', {
      value: WEBHOOK_URL,
    }).catch(e => ({ error: e.message }))

    // Configurar webhook de entrega
    resultados.delivery = await zapiPost('/update-webhook-received-delivery', {
      value: WEBHOOK_URL,
    }).catch(e => ({ error: e.message }))

    // Configurar webhook de conexão
    resultados.connection = await zapiPost('/update-webhook-disconnect', {
      value: WEBHOOK_URL,
    }).catch(e => ({ error: e.message }))

    // Verificar status após configuração
    const status = await zapiGet('/status').catch(e => ({ error: e.message }))

    return res.json({
      ok: true,
      mensagem: '✅ Webhooks configurados para a instância MARA!',
      webhook_url: WEBHOOK_URL,
      resultados,
      status_atual: status,
    })
  }

  // ── ACTION: testar ────────────────────────────────────────
  if (action === 'testar') {
    const numero = DR_MAURO_NUMERO.replace(/\D/g, '')

    const resultado = await zapiPost('/send-text', {
      phone: numero,
      message: `🌟 *MARA IA — Teste de Conexão*\n\nOlá, Dr. Mauro! ✅\n\nInstância dedicada configurada com sucesso!\n\n📱 Instance ID: ${MARA_INSTANCE_ID.slice(0, 8)}...\n🔗 Webhook: Ativo\n🤖 IA: GPT-4o-mini\n\nEstou pronta para servi-lo! Digite */ajuda* para ver os comandos.\n\n_— MARA IA 🌟_`,
    }).catch(e => ({ error: e.message }))

    return res.json({
      ok: !resultado?.error,
      mensagem: resultado?.error
        ? `❌ Erro ao enviar: ${resultado.error}`
        : `✅ Mensagem de teste enviada para ${DR_MAURO_NUMERO}`,
      resultado,
    })
  }

  // ── ACTION: qrcode ────────────────────────────────────────
  if (action === 'qrcode') {
    const qr = await zapiGet('/qr-code').catch(e => ({ error: e.message }))
    return res.json({
      ok: true,
      mensagem: 'QR Code da instância MARA (escaneie com o WhatsApp do número dedicado)',
      qrcode: qr,
    })
  }

  // ── ACTION: desconectar ───────────────────────────────────
  if (action === 'desconectar') {
    const result = await zapiPost('/disconnect', {}).catch(e => ({ error: e.message }))
    return res.json({
      ok: true,
      mensagem: 'Instância MARA desconectada. Use ?action=qrcode para reconectar.',
      result,
    })
  }

  return res.json({
    ok: true,
    actions_disponiveis: {
      'status':      `${WEBHOOK_URL.replace('/api/whatsapp-mara', '/api/mara-setup')}?action=status`,
      'webhook':     `${WEBHOOK_URL.replace('/api/whatsapp-mara', '/api/mara-setup')}?action=webhook`,
      'testar':      `${WEBHOOK_URL.replace('/api/whatsapp-mara', '/api/mara-setup')}?action=testar`,
      'qrcode':      `${WEBHOOK_URL.replace('/api/whatsapp-mara', '/api/mara-setup')}?action=qrcode`,
      'desconectar': `${WEBHOOK_URL.replace('/api/whatsapp-mara', '/api/mara-setup')}?action=desconectar`,
    },
    config: config_ok,
  })
}
