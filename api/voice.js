// ============================================================
// BEN GROWTH CENTER — ElevenLabs Voice API
// Converte texto do Dr. Ben em áudio com voz clonada
// Rota: POST /api/voice
// Body: { text, voiceId?, stability?, similarityBoost? }
// ============================================================

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const {
      text,
      voiceId = process.env.ELEVENLABS_VOICE_ID || 'default',
      stability = 0.5,
      similarityBoost = 0.85,
      style = 0.2,
      speakerBoost = true,
    } = req.body

    if (!text) return res.status(400).json({ error: 'text é obrigatório' })

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })

    // Limitar texto para não exceder créditos
    const truncatedText = text.slice(0, 1000)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: truncatedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: speakerBoost,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`ElevenLabs error: ${err}`)
    }

    // Retornar áudio como base64
    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return res.status(200).json({
      success: true,
      audio: base64Audio,
      mimeType: 'audio/mpeg',
      voiceId,
      characters: truncatedText.length,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Voice API] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar áudio',
    })
  }
}
