// ============================================================
// BEN GROWTH CENTER — Pinecone Memory API
// Memória vetorial do Dr. Ben — lembra de cada cliente
// Rota: POST /api/memory
// Body: { action: 'save'|'search'|'delete', clientId, text?, query? }
// ============================================================

export const config = { maxDuration: 20 }

async function getEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY necessária para embeddings')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  )
  if (!res.ok) throw new Error(`Embedding error: ${await res.text()}`)
  const data = await res.json()
  return data.embedding?.values
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const apiKey = process.env.PINECONE_API_KEY
  const indexHost = process.env.PINECONE_INDEX_HOST

  if (!apiKey || !indexHost) {
    return res.status(200).json({
      success: false,
      message: 'Pinecone não configurado — operando sem memória persistente',
      memories: [],
    })
  }

  try {
    const { action, clientId, text, query, metadata = {} } = req.body

    if (!action || !clientId) {
      return res.status(400).json({ error: 'action e clientId são obrigatórios' })
    }

    // ── SALVAR memória ─────────────────────────────────────────
    if (action === 'save') {
      if (!text) return res.status(400).json({ error: 'text é obrigatório para salvar' })

      const vector = await getEmbedding(text)

      const upsertRes = await fetch(`${indexHost}/vectors/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
        body: JSON.stringify({
          vectors: [{
            id: `mem-${clientId}-${Date.now()}`,
            values: vector,
            metadata: {
              clientId,
              text: text.slice(0, 500),
              timestamp: new Date().toISOString(),
              ...metadata,
            },
          }],
        }),
      })

      if (!upsertRes.ok) throw new Error(`Pinecone upsert error: ${await upsertRes.text()}`)

      return res.status(200).json({
        success: true,
        action: 'saved',
        clientId,
        timestamp: new Date().toISOString(),
      })
    }

    // ── BUSCAR memórias ────────────────────────────────────────
    if (action === 'search') {
      if (!query) return res.status(400).json({ error: 'query é obrigatório para buscar' })

      const vector = await getEmbedding(query)

      const queryRes = await fetch(`${indexHost}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
        body: JSON.stringify({
          vector,
          topK: 8,
          includeMetadata: true,
          filter: { clientId: { '$eq': clientId } },
        }),
      })

      if (!queryRes.ok) throw new Error(`Pinecone query error: ${await queryRes.text()}`)
      const queryData = await queryRes.json()

      const memories = queryData.matches
        ?.filter(m => m.score > 0.7)
        ?.map(m => ({
          text: m.metadata?.text,
          timestamp: m.metadata?.timestamp,
          score: m.score,
        })) || []

      return res.status(200).json({
        success: true,
        action: 'searched',
        clientId,
        memories,
        count: memories.length,
      })
    }

    // ── DELETAR memórias do cliente ────────────────────────────
    if (action === 'delete') {
      const deleteRes = await fetch(`${indexHost}/vectors/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
        body: JSON.stringify({
          filter: { clientId: { '$eq': clientId } },
          deleteAll: false,
        }),
      })

      if (!deleteRes.ok) throw new Error(`Pinecone delete error: ${await deleteRes.text()}`)

      return res.status(200).json({
        success: true,
        action: 'deleted',
        clientId,
      })
    }

    return res.status(400).json({ error: `Ação inválida: ${action}` })

  } catch (error) {
    console.error('[Memory API] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro na memória vetorial',
    })
  }
}
