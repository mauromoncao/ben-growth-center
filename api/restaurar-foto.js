// ============================================================
// BEN GROWTH CENTER — Restaurar / Definir Foto de Perfil
// Rota: POST /api/restaurar-foto  → força restauração da foto
//       GET  /api/restaurar-foto  → status e diagnóstico
//
// PROBLEMA RAIZ:
//   Commits 4b31c23, 9bcc622, 5ffbabc, 8cd0f81 usaram a função
//   definirFotoPerfilDrMauro() que chamava PUT /profile-picture
//   via Z-API, substituindo a foto pessoal pelo avatar da MARA.
//   O commit 4998ce2 removeu o código, mas a foto ficou persistida
//   no cache da instância Z-API. Além disso, o estado session:false
//   indica que a sessão WhatsApp não estava ativa, bloqueando
//   novas alterações manuais no app.
//
// INSTÂNCIA AFETADA: MARA_ZAPI_INSTANCE_ID (número (86) 999484761)
//
// BODY aceito no POST:
//   { "foto_url": "https://..." }   → usa URL personalizada
//   { "restart": true }             → força restart da sessão antes
//   {}                              → usa mauro-zapi.jpg (padrão)
// ============================================================

export const config = { maxDuration: 60 }

const MARA_INSTANCE_ID   = process.env.MARA_ZAPI_INSTANCE_ID || ''
const MARA_TOKEN         = process.env.MARA_ZAPI_TOKEN       || ''
const CLIENT_TOKEN       = process.env.MARA_ZAPI_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN || ''
const MAURO_FOTO_PADRAO  = 'https://ben-growth-center.vercel.app/mauro-zapi.jpg'
const MARA_BASE          = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`

function zapiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (CLIENT_TOKEN) h['Client-Token'] = CLIENT_TOKEN
  return h
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Verificar status/sessão da instância ──
async function verificarStatus() {
  try {
    const r = await fetch(`${MARA_BASE}/status`, {
      headers: zapiHeaders(),
      signal: AbortSignal.timeout(8000),
    })
    return await r.json().catch(() => null)
  } catch (e) {
    return { error: e.message }
  }
}

// ── Reiniciar sessão da instância Z-API ──
async function reiniciarSessao() {
  try {
    const r = await fetch(`${MARA_BASE}/restart`, {
      method: 'PUT',
      headers: zapiHeaders(),
      signal: AbortSignal.timeout(15000),
    })
    const d = await r.json().catch(() => null)
    console.log('[RESTAURAR-FOTO] Restart sessão:', JSON.stringify(d))
    return d
  } catch (e) {
    console.warn('[RESTAURAR-FOTO] Restart falhou:', e.message)
    return { error: e.message }
  }
}

// ── Definir foto via URL ──
async function definirFotoViaURL(fotoUrl) {
  try {
    const r = await fetch(`${MARA_BASE}/profile-picture`, {
      method: 'PUT',
      headers: zapiHeaders(),
      body: JSON.stringify({ value: fotoUrl }),
      signal: AbortSignal.timeout(20000),
    })
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    console.log('[RESTAURAR-FOTO] PUT /profile-picture (URL):', JSON.stringify(d))
    return { sucesso: d?.value === true, metodo: 'url', resultado: d }
  } catch (e) {
    return { sucesso: false, metodo: 'url', erro: e.message }
  }
}

// ── Definir foto via base64 ──
async function definirFotoViaBase64(fotoUrl) {
  try {
    const imgRes = await fetch(fotoUrl, { signal: AbortSignal.timeout(15000) })
    if (!imgRes.ok) return { sucesso: false, metodo: 'base64', erro: `Download falhou (${imgRes.status})` }
    const imgBuf  = await imgRes.arrayBuffer()
    const base64  = Buffer.from(imgBuf).toString('base64')
    const mime    = imgRes.headers.get('content-type') || 'image/jpeg'
    const dataUrl = `data:${mime};base64,${base64}`
    const r = await fetch(`${MARA_BASE}/profile-picture`, {
      method: 'PUT',
      headers: zapiHeaders(),
      body: JSON.stringify({ value: dataUrl }),
      signal: AbortSignal.timeout(25000),
    })
    const d = await r.json().catch(() => ({ error: 'resposta inválida' }))
    console.log('[RESTAURAR-FOTO] PUT /profile-picture (base64):', JSON.stringify(d).slice(0, 150))
    return { sucesso: d?.value === true, metodo: 'base64', resultado: d }
  } catch (e) {
    return { sucesso: false, metodo: 'base64', erro: e.message }
  }
}

// ── GET /profile-picture para verificar foto atual ──
async function verificarFotoAtual() {
  try {
    const r = await fetch(`${MARA_BASE}/profile-picture`, {
      headers: zapiHeaders(),
      signal: AbortSignal.timeout(8000),
    })
    return await r.json().catch(() => null)
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

  if (!MARA_INSTANCE_ID || !MARA_TOKEN) {
    return res.status(200).json({
      ok: false,
      erro: 'Credenciais não configuradas',
      dica: 'Verifique MARA_ZAPI_INSTANCE_ID e MARA_ZAPI_TOKEN no Vercel',
    })
  }

  // ── GET: Diagnóstico ────────────────────────────────────
  if (req.method === 'GET') {
    const [status, fotoAtual] = await Promise.all([
      verificarStatus(),
      verificarFotoAtual(),
    ])
    const sessaoAtiva = status?.session === true
    return res.json({
      ok: true,
      instancia: `${MARA_INSTANCE_ID.slice(0, 8)}...`,
      numero_afetado: '(86) 999484761',
      foto_padrao_url: MAURO_FOTO_PADRAO,
      status_instancia: status,
      sessao_ativa: sessaoAtiva,
      alerta_sessao: !sessaoAtiva
        ? '⚠️ session:false — a sessão WhatsApp não está ativa. Use POST com restart:true para forçar reconexão antes de trocar a foto.'
        : null,
      foto_atual_zapi: fotoAtual,
      instrucoes: {
        restaurar_padrao: 'POST /api/restaurar-foto (body vazio ou {})',
        restaurar_url_customizada: 'POST /api/restaurar-foto com body {"foto_url":"https://sua-foto.jpg"}',
        forcar_restart_antes: 'POST /api/restaurar-foto com body {"restart":true} ou {"restart":true,"foto_url":"..."}',
      },
    })
  }

  // ── POST: Restaurar foto ────────────────────────────────
  if (req.method === 'POST') {
    const log = []

    // Determinar qual foto usar: personalizada ou padrão
    const fotoUrl      = req.body?.foto_url || MAURO_FOTO_PADRAO
    const forcaRestart = req.body?.restart === true
    const usandoCustom = !!(req.body?.foto_url)

    log.push(`📷 Foto a definir: ${usandoCustom ? 'URL personalizada' : 'padrão (mauro-zapi.jpg)'}`)
    log.push(`URL: ${fotoUrl}`)

    log.push('🔍 Verificando status da sessão...')
    const statusInicial = await verificarStatus()
    const sessionOk     = statusInicial?.session === true
    log.push(`Status: connected=${statusInicial?.connected}, session=${statusInicial?.session}`)

    // Se sessão inativa OU force restart solicitado → reiniciar
    if (!sessionOk || forcaRestart) {
      log.push('⚠️ Sessão inativa ou restart forçado — reiniciando instância Z-API...')
      await reiniciarSessao()
      log.push('⏳ Aguardando reconexão (15s)...')
      await sleep(15000)

      const statusPos = await verificarStatus()
      log.push(`Status após restart: connected=${statusPos?.connected}, session=${statusPos?.session}`)
    } else {
      log.push('✅ Sessão ativa — prosseguindo para definição de foto')
    }

    // Tentativa 1: URL
    log.push('📸 Tentativa 1 — PUT /profile-picture via URL...')
    const t1 = await definirFotoViaURL(fotoUrl)
    log.push(`Resultado URL: sucesso=${t1.sucesso}, resposta=${JSON.stringify(t1.resultado)}`)

    if (t1.sucesso) {
      log.push('✅ Foto definida via URL!')
      return res.json({
        ok: true,
        mensagem: usandoCustom
          ? '✅ Foto personalizada definida com sucesso!'
          : '✅ Foto do Dr. Mauro Monção restaurada com sucesso!',
        metodo_usado: 'url',
        foto_definida: fotoUrl,
        log,
        dica: 'Feche e abra o WhatsApp no celular para ver a atualização (pode levar 1-2 minutos).',
      })
    }

    // Tentativa 2: base64 (caso a URL não seja acessível pelo Z-API)
    log.push('📸 Tentativa 2 — convertendo para base64 e enviando...')
    await sleep(3000)
    const t2 = await definirFotoViaBase64(fotoUrl)
    log.push(`Resultado base64: sucesso=${t2.sucesso}`)

    if (t2.sucesso) {
      log.push('✅ Foto definida via base64!')
      return res.json({
        ok: true,
        mensagem: usandoCustom
          ? '✅ Foto personalizada definida via base64!'
          : '✅ Foto restaurada via base64!',
        metodo_usado: 'base64',
        foto_definida: fotoUrl,
        log,
        dica: 'Feche e abra o WhatsApp no celular para ver a atualização.',
      })
    }

    // Tentativa 3: URL novamente após delay maior
    log.push('📸 Tentativa 3 — URL com delay adicional (7s)...')
    await sleep(7000)
    const t3 = await definirFotoViaURL(fotoUrl)
    log.push(`Resultado retry: sucesso=${t3.sucesso}, resposta=${JSON.stringify(t3.resultado)}`)

    if (t3.sucesso) {
      return res.json({
        ok: true,
        mensagem: '✅ Foto definida na 3ª tentativa!',
        metodo_usado: 'url_retry',
        foto_definida: fotoUrl,
        log,
        dica: 'Feche e abra o WhatsApp no celular para ver a atualização.',
      })
    }

    // Falhou tudo
    log.push('❌ Todas as tentativas falharam')
    return res.json({
      ok: false,
      mensagem: '⚠️ Não foi possível definir a foto automaticamente via API.',
      log,
      debug: {
        instancia: MARA_INSTANCE_ID.slice(0, 8) + '...',
        connected: statusInicial?.connected,
        session: statusInicial?.session,
        foto_tentada: fotoUrl,
      },
      alternativas: [
        'Tente novamente com {"restart":true} no body para forçar reconexão da sessão',
        'Se usar foto personalizada, certifique-se que a URL é pública e acessível (sem autenticação)',
        'Abra o WhatsApp no celular → Configurações → Toque na foto → troque manualmente',
        'Verifique a instância em /api/mara-setup?action=status',
      ],
    })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
