export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  const MARA_INSTANCE_ID = process.env.MARA_ZAPI_INSTANCE_ID || ''
  const MARA_TOKEN       = process.env.MARA_ZAPI_TOKEN       || ''
  const CLIENT_MARA      = process.env.MARA_ZAPI_CLIENT_TOKEN || ''
  const CLIENT_DRBEN     = process.env.ZAPI_CLIENT_TOKEN     || ''
  const BASE             = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

  const resultados = {}

  // Testar sem client token
  try {
    const r = await fetch(`${BASE}/status`)
    resultados.sem_token = await r.json()
  } catch(e) { resultados.sem_token = { erro: e.message } }

  // Testar com MARA_ZAPI_CLIENT_TOKEN
  if (CLIENT_MARA) {
    try {
      const r = await fetch(`${BASE}/status`, { headers: { 'Client-Token': CLIENT_MARA } })
      resultados.token_mara = await r.json()
    } catch(e) { resultados.token_mara = { erro: e.message } }
  }

  // Testar com ZAPI_CLIENT_TOKEN (Dr. Ben)
  if (CLIENT_DRBEN) {
    try {
      const r = await fetch(`${BASE}/status`, { headers: { 'Client-Token': CLIENT_DRBEN } })
      resultados.token_drben = await r.json()
    } catch(e) { resultados.token_drben = { erro: e.message } }
  }

  // Tentar PUT /profile-picture com MARA token
  if (CLIENT_MARA) {
    try {
      const r = await fetch(`${BASE}/profile-picture`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Client-Token': CLIENT_MARA },
        body: JSON.stringify({ value: 'https://ben-growth-center.vercel.app/mauro-zapi.jpg' })
      })
      resultados.put_foto_mara_token = await r.json()
    } catch(e) { resultados.put_foto_mara_token = { erro: e.message } }
  }

  return res.json({
    instancia: MARA_INSTANCE_ID.slice(0,8) + '...',
    tokens: {
      MARA_ZAPI_CLIENT_TOKEN: CLIENT_MARA ? CLIENT_MARA.slice(0,8) + '...' : '❌ NÃO CONFIGURADO',
      ZAPI_CLIENT_TOKEN: CLIENT_DRBEN ? CLIENT_DRBEN.slice(0,8) + '...' : '❌ NÃO CONFIGURADO',
      sao_iguais: CLIENT_MARA === CLIENT_DRBEN,
    },
    resultados
  })
}
