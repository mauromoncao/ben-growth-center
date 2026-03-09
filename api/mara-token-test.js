// TEMPORÁRIO - diagnóstico de token
export const config = { maxDuration: 15 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  const MARA_INSTANCE_ID = process.env.MARA_ZAPI_INSTANCE_ID || ''
  const MARA_TOKEN = process.env.MARA_ZAPI_TOKEN || ''
  const CLIENT_TOKEN = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
  const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`
  
  const results = {}
  
  // Mostrar tokens (parcialmente ocultos)
  results.instance_id = MARA_INSTANCE_ID ? MARA_INSTANCE_ID.slice(0, 8) + '...' : 'VAZIO'
  results.mara_token = MARA_TOKEN ? MARA_TOKEN.slice(0, 8) + '...' : 'VAZIO'
  results.client_token_usado = CLIENT_TOKEN 
    ? CLIENT_TOKEN.slice(0, 8) + '...' + CLIENT_TOKEN.slice(-4) 
    : 'VAZIO'
  results.client_token_length = CLIENT_TOKEN.length
  results.tem_mara_specific_token = !!(process.env.MARA_ZAPI_CLIENT_TOKEN)
  results.tem_zapi_fallback = !!(process.env.ZAPI_CLIENT_TOKEN)
  
  // Testar o token atual
  try {
    const r = await fetch(`${MARA_BASE}/status`, {
      headers: { 'Content-Type': 'application/json', 'Client-Token': CLIENT_TOKEN },
      signal: AbortSignal.timeout(8000)
    })
    results.status_test = { http: r.status, body: await r.json() }
  } catch (e) {
    results.status_test = { erro: e.message }
  }
  
  // Testar update-every-webhooks
  try {
    const r = await fetch(`${MARA_BASE}/update-every-webhooks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Client-Token': CLIENT_TOKEN },
      body: JSON.stringify({ value: 'https://ben-growth-center.vercel.app/api/whatsapp-mara', notifySentByMe: false }),
      signal: AbortSignal.timeout(8000)
    })
    results.webhook_test = { http: r.status, body: await r.json() }
  } catch (e) {
    results.webhook_test = { erro: e.message }
  }
  
  return res.json(results)
}
