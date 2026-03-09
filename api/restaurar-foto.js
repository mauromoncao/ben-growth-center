// ============================================================
// BEN GROWTH CENTER — Restaurar Foto de Perfil do Dr. Mauro
// Rota: POST /api/restaurar-foto  → força a foto do Dr. Mauro
//       GET  /api/restaurar-foto  → status e instruções
//
// PROBLEMA IDENTIFICADO:
//   Durante o desenvolvimento da MARA IA, a função
//   `definirFotoPerfilDrMauro()` foi executada e definiu a
//   foto da MARA via Z-API PUT /profile-picture. A foto ficou
//   travada mesmo após o código ser removido, pois o Z-API
//   persiste a foto no servidor e não reverte automaticamente.
//
// SOLUÇÃO:
//   Este endpoint força a definição da foto correta (Dr. Mauro)
//   via Z-API usando a mesma instância que foi afetada.
//   Deve ser chamado UMA VEZ para restaurar.
//
// INSTÂNCIA AFETADA: MARA_ZAPI_INSTANCE_ID (número (86) 999484761)
// ============================================================

export const config = { maxDuration: 30 }

// ── Credenciais da instância do Dr. Mauro (número pessoal) ──
// O número (86) 999484761 usa a instância MARA_ZAPI_INSTANCE_ID
const MARA_INSTANCE_ID = process.env.MARA_ZAPI_INSTANCE_ID || ''
const MARA_TOKEN       = process.env.MARA_ZAPI_TOKEN       || ''
const CLIENT_TOKEN     = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''

// URL pública da foto correta — Dr. Mauro Monção (hospedada no Vercel)
const MAURO_FOTO_URL = 'https://ben-growth-center.vercel.app/mauro-zapi.jpg'

const MARA_BASE = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

function zapiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (CLIENT_TOKEN) h['Client-Token'] = CLIENT_TOKEN
  return h
}

// ── Tenta definir a foto via URL (método suportado pela Z-API) ──
async function tentarViaURL() {
  try {
    const r = await fetch(`${MARA_BASE}/profile-picture`, {
      method: 'PUT',
      headers: zapiHeaders(),
      body: JSON.stringify({ value: MAURO_FOTO_URL }),
      signal: AbortSignal.timeout(15000),
    })
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    console.log('[RESTAURAR-FOTO] Tentativa via URL:', JSON.stringify(d))
    return { sucesso: d?.value === true, metodo: 'url', resultado: d }
  } catch (e) {
    return { sucesso: false, metodo: 'url', erro: e.message }
  }
}

// ── Tenta definir a foto via base64 (fallback) ──
async function tentarViaBase64() {
  try {
    // Baixar a imagem do Vercel e converter para base64
    const imgRes = await fetch(MAURO_FOTO_URL, { signal: AbortSignal.timeout(10000) })
    if (!imgRes.ok) return { sucesso: false, metodo: 'base64', erro: `Não foi possível baixar a imagem (${imgRes.status})` }

    const imgBuf  = await imgRes.arrayBuffer()
    const base64  = Buffer.from(imgBuf).toString('base64')
    const mime    = imgRes.headers.get('content-type') || 'image/jpeg'
    const dataUrl = `data:${mime};base64,${base64}`

    const r = await fetch(`${MARA_BASE}/profile-picture`, {
      method: 'PUT',
      headers: zapiHeaders(),
      body: JSON.stringify({ value: dataUrl }),
      signal: AbortSignal.timeout(20000),
    })
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    console.log('[RESTAURAR-FOTO] Tentativa via base64:', JSON.stringify(d).slice(0, 200))
    return { sucesso: d?.value === true, metodo: 'base64', resultado: d }
  } catch (e) {
    return { sucesso: false, metodo: 'base64', erro: e.message }
  }
}

// ── Verificar foto atual do perfil ──
async function verificarFotoAtual() {
  try {
    const r = await fetch(`${MARA_BASE}/profile-picture`, {
      method: 'GET',
      headers: zapiHeaders(),
      signal: AbortSignal.timeout(8000),
    })
    const d = await r.json().catch(() => null)
    return d
  } catch (e) {
    return { error: e.message }
  }
}

// ── Handler Principal ──────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── Verificar configuração ─────────────────────────────
  if (!MARA_INSTANCE_ID || !MARA_TOKEN) {
    return res.status(200).json({
      ok: false,
      erro: 'Credenciais da instância não configuradas',
      dica: 'Verifique MARA_ZAPI_INSTANCE_ID e MARA_ZAPI_TOKEN no Vercel',
      instancia_configurada: false,
    })
  }

  // ── GET: Status e diagnóstico ──────────────────────────
  if (req.method === 'GET') {
    const fotoAtual = await verificarFotoAtual()
    return res.json({
      ok: true,
      servico: 'Restaurador de Foto de Perfil — Dr. Mauro Monção',
      instancia: `${MARA_INSTANCE_ID.slice(0, 8)}...`,
      numero_afetado: '(86) 999484761',
      foto_correta_url: MAURO_FOTO_URL,
      foto_atual_zapi: fotoAtual,
      instrucoes: {
        para_restaurar: 'Envie POST /api/restaurar-foto com body {}',
        ou_via_dashboard: 'Use o botão "Restaurar Foto" no painel MARA IA',
      },
      diagnostico: {
        problema: 'A foto da MARA IA foi definida via API Z-API (PUT /profile-picture) durante desenvolvimento',
        causa: 'Commits históricos executaram definirFotoPerfilDrMauro() que sobrescreveu a foto do número pessoal',
        solucao: 'Este endpoint força a redefinição da foto correta via mesma API',
      },
    })
  }

  // ── POST: Restaurar foto ───────────────────────────────
  if (req.method === 'POST') {
    console.log('[RESTAURAR-FOTO] 🔄 Iniciando restauração da foto do Dr. Mauro Monção...')

    const tentativas = []

    // Tentativa 1: Via URL direta
    console.log('[RESTAURAR-FOTO] Tentativa 1: via URL...')
    const t1 = await tentarViaURL()
    tentativas.push(t1)

    if (t1.sucesso) {
      console.log('[RESTAURAR-FOTO] ✅ Foto restaurada com sucesso via URL!')
      return res.json({
        ok: true,
        mensagem: '✅ Foto do Dr. Mauro Monção restaurada com sucesso!',
        metodo_usado: 'url',
        foto_url: MAURO_FOTO_URL,
        tentativas,
        dica: 'A foto deve aparecer em alguns segundos no WhatsApp.',
      })
    }

    // Tentativa 2: Via base64 (fallback)
    console.log('[RESTAURAR-FOTO] Tentativa 1 falhou. Tentativa 2: via base64...')
    await new Promise(r => setTimeout(r, 2000)) // aguarda 2s entre tentativas
    const t2 = await tentarViaBase64()
    tentativas.push(t2)

    if (t2.sucesso) {
      console.log('[RESTAURAR-FOTO] ✅ Foto restaurada com sucesso via base64!')
      return res.json({
        ok: true,
        mensagem: '✅ Foto do Dr. Mauro Monção restaurada com sucesso (via base64)!',
        metodo_usado: 'base64',
        foto_url: MAURO_FOTO_URL,
        tentativas,
        dica: 'A foto deve aparecer em alguns segundos no WhatsApp.',
      })
    }

    // Tentativa 3: Repetir URL após delay maior
    console.log('[RESTAURAR-FOTO] Tentativa 2 falhou. Tentativa 3: URL com delay maior...')
    await new Promise(r => setTimeout(r, 3000))
    const t3 = await tentarViaURL()
    tentativas.push({ ...t3, metodo: 'url_retry_3s' })

    if (t3.sucesso) {
      console.log('[RESTAURAR-FOTO] ✅ Foto restaurada na terceira tentativa!')
      return res.json({
        ok: true,
        mensagem: '✅ Foto restaurada (terceira tentativa)!',
        metodo_usado: 'url_retry',
        foto_url: MAURO_FOTO_URL,
        tentativas,
        dica: 'A foto deve aparecer em alguns segundos no WhatsApp.',
      })
    }

    // Todas as tentativas falharam
    console.error('[RESTAURAR-FOTO] ❌ Todas as tentativas falharam:', JSON.stringify(tentativas))
    return res.json({
      ok: false,
      mensagem: '⚠️ Não foi possível restaurar a foto automaticamente via API.',
      tentativas,
      alternativas: [
        '1. Abra o WhatsApp no celular e mude a foto manualmente nas configurações',
        '2. Verifique se a instância Z-API está conectada (acesse /api/mara-setup?action=status)',
        '3. Se a instância estiver desconectada, reconecte via QR Code e tente novamente',
        '4. Verifique se a URL da foto está acessível: ' + MAURO_FOTO_URL,
      ],
      debug: {
        instancia: MARA_INSTANCE_ID.slice(0, 8) + '...',
        client_token_ok: !!CLIENT_TOKEN,
        foto_url: MAURO_FOTO_URL,
      },
    })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
