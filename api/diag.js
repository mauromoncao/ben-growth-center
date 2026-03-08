export const config = { maxDuration: 20 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  const keys = {
    ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
    OPENAI: !!process.env.OPENAI_API_KEY,
    PERPLEXITY: !!process.env.PERPLEXITY_API_KEY,
    ANTHROPIC_preview: (process.env.ANTHROPIC_API_KEY || '').slice(0,15),
    OPENAI_preview: (process.env.OPENAI_API_KEY || '').slice(0,15),
    PERPLEXITY_preview: (process.env.PERPLEXITY_API_KEY || '').slice(0,15),
  }
  
  let claudeTest = 'not_tested'
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 10 }),
        signal: AbortSignal.timeout(10000),
      })
      const d = await r.json()
      claudeTest = r.ok ? 'ok:' + (d.content?.[0]?.text || '') : 'err:' + r.status + ':' + JSON.stringify(d.error)
    } catch(e) { claudeTest = 'exception:' + e.message }
  }
  
  let openaiTest = 'not_tested'
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Say OK' }], max_tokens: 10 }),
        signal: AbortSignal.timeout(10000),
      })
      const d = await r.json()
      openaiTest = r.ok ? 'ok:' + (d.choices?.[0]?.message?.content || '') : 'err:' + r.status + ':' + JSON.stringify(d.error)
    } catch(e) { openaiTest = 'exception:' + e.message }
  }
  
  return res.status(200).json({ keys, claudeTest, openaiTest })
}
