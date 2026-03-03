// ============================================================
// SUPABASE EDGE FUNCTION — WhatsApp Evolution API
// Função: whatsapp-evolution
// Projeto: xjjxnzoapqswagqbvdto (Mauro Monção)
//
// Responsabilidades:
//   1. Receber webhook da Evolution API
//   2. Processar mensagens recebidas
//   3. Chamar Dr. Ben IA (Gemini)
//   4. Responder via Evolution API
//   5. Salvar sessões no Supabase
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_KEY        = Deno.env.get("GEMINI_API_KEY") ?? "";
const EVOLUTION_URL     = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY     = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVOLUTION_INST    = Deno.env.get("EVOLUTION_INSTANCE") ?? "drben";
const PLANTONISTA       = Deno.env.get("PLANTONISTA_WHATSAPP") ?? "5586999484761";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Enviar mensagem via Evolution API ───────────────────────
async function enviarMensagem(numero: string, texto: string) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.log("[Evolution] ENV não configurada — simulando envio para", numero);
    return;
  }
  try {
    const res = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INST}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_KEY,
        },
        body: JSON.stringify({ number: numero, text: texto }),
      }
    );
    const data = await res.json();
    console.log("[Evolution] Enviado:", data);
  } catch (e: any) {
    console.error("[Evolution] Erro envio:", e.message);
  }
}

// ── Consultar Dr. Ben IA ─────────────────────────────────────
async function consultarDrBen(historico: string, mensagem: string): Promise<string> {
  if (!GEMINI_KEY) {
    return "Olá! Sou o *Dr. Ben*, assistente jurídico do escritório *Mauro Monção Advogados*. Como posso te ajudar?";
  }

  const prompt = `Você é o Dr. Ben, assistente jurídico inteligente do escritório Mauro Monção Advogados.
Especialidades: Direito Tributário, Previdenciário e Bancário — em Parnaíba/PI.
Seja cordial, profissional e objetivo. Responda em português. Máximo 3 parágrafos curtos.
Ao final, sempre ofereça agendar consulta com Dr. Mauro Monção.

Histórico:
${historico}

Cliente: ${mensagem}
Dr. Ben:`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "Desculpe, tive um problema técnico. Por favor, tente novamente em instantes.";
  } catch (e: any) {
    console.error("[DrBen] Erro Gemini:", e.message);
    return "Olá! Sou o Dr. Ben. Tive um problema técnico momentâneo. Tente novamente em instantes.";
  }
}

// ── Salvar sessão no Supabase ────────────────────────────────
async function salvarSessao(numero: string, sessao: any) {
  await supabase
    .from("whatsapp_sessions")
    .upsert({ numero, sessao, atualizado_em: new Date().toISOString() });
}

// ── Buscar sessão no Supabase ────────────────────────────────
async function buscarSessao(numero: string) {
  const { data } = await supabase
    .from("whatsapp_sessions")
    .select("sessao")
    .eq("numero", numero)
    .single();
  return data?.sessao ?? { historico: [], etapa: "inicio" };
}

// ── Salvar lead no Supabase ──────────────────────────────────
async function salvarLead(numero: string, nome: string, mensagem: string, urgente: boolean) {
  await supabase.from("whatsapp_leads").insert({
    numero,
    nome: nome ?? "Não informado",
    ultima_mensagem: mensagem,
    urgente,
    criado_em: new Date().toISOString(),
  });
}

// ── Notificar plantonista ────────────────────────────────────
async function notificarPlantonista(numero: string, nome: string, mensagem: string) {
  const msg = `🚨 *LEAD URGENTE — Dr. Ben*\n\n👤 *Nome:* ${nome ?? "Não informado"}\n📱 *Número:* ${numero}\n💬 *Mensagem:* ${mensagem}\n\n_Atender em até 30 minutos!_`;
  await enviarMensagem(PLANTONISTA, msg);
}

// ── Handler principal ────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
      },
    });
  }

  // Health check
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", service: "Dr. Ben WhatsApp — Supabase Edge" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    console.log("[Webhook] Evento:", JSON.stringify(body).slice(0, 300));

    const evento = body?.event ?? body?.type ?? "";

    // ── Mensagem recebida ───────────────────────────────────
    if (
      evento === "messages.upsert" ||
      evento === "MESSAGES_UPSERT" ||
      body?.data?.message
    ) {
      const msgData  = body?.data ?? body;
      const fromMe   = msgData?.key?.fromMe ?? false;
      if (fromMe) return new Response(JSON.stringify({ ok: true }));

      const numero = (msgData?.key?.remoteJid ?? "").replace("@s.whatsapp.net", "");
      const texto  = msgData?.message?.conversation
                  ?? msgData?.message?.extendedTextMessage?.text
                  ?? "";

      if (!numero || !texto) return new Response(JSON.stringify({ ok: true }));

      console.log(`[Dr. Ben] De ${numero}: ${texto}`);

      // Buscar sessão
      const sessao = await buscarSessao(numero);
      const historicoTexto = (sessao.historico ?? [])
        .slice(-6)
        .map((m: any) => `${m.role === "user" ? "Cliente" : "Dr. Ben"}: ${m.text}`)
        .join("\n");

      // Dr. Ben responde
      const resposta = await consultarDrBen(historicoTexto, texto);

      // Atualizar sessão
      sessao.historico = [...(sessao.historico ?? []),
        { role: "user", text: texto },
        { role: "bot",  text: resposta },
      ].slice(-20); // manter últimas 20 mensagens

      await salvarSessao(numero, sessao);

      // Detectar urgência
      const urgente = /multa|infração|execução|penhora|urgente|prazo|amanhã|bloqueio/i.test(texto);
      await salvarLead(numero, sessao.nome, texto, urgente);

      if (urgente) {
        await notificarPlantonista(numero, sessao.nome, texto);
      }

      // Enviar resposta
      await enviarMensagem(numero, resposta);

      return new Response(JSON.stringify({ ok: true, respondido: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── QR Code gerado ──────────────────────────────────────
    if (evento === "qrcode.updated" || evento === "QRCODE_UPDATED") {
      const qrcode = body?.data?.qrcode?.base64 ?? "";
      // Salvar QR Code no Supabase para exibir no painel
      await supabase
        .from("whatsapp_config")
        .upsert({ chave: "qrcode", valor: qrcode, atualizado_em: new Date().toISOString() });

      console.log("[Evolution] QR Code salvo no Supabase");
      return new Response(JSON.stringify({ ok: true }));
    }

    // ── Status da conexão ───────────────────────────────────
    if (evento === "connection.update" || evento === "CONNECTION_UPDATE") {
      const state = body?.data?.state ?? "";
      await supabase
        .from("whatsapp_config")
        .upsert({ chave: "status", valor: state, atualizado_em: new Date().toISOString() });

      console.log("[Evolution] Status conexão:", state);
      return new Response(JSON.stringify({ ok: true, state }));
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("[Webhook] Erro:", e.message);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }
});
