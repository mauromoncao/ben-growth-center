// ============================================================
// SUPABASE EDGE FUNCTION — WhatsApp QR Code Manager
// Função: whatsapp-qrcode
// Retorna QR Code e status da conexão para o painel
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_URL  = Deno.env.get("EVOLUTION_API_URL") ?? "";
const EVOLUTION_KEY  = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const EVOLUTION_INST = Deno.env.get("EVOLUTION_INSTANCE") ?? "drben";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url    = new URL(req.url);
  const action = url.searchParams.get("action") ?? "status";

  // ── GET status e QR Code ───────────────────────────────────
  if (req.method === "GET" && action === "status") {
    const { data: statusData } = await supabase
      .from("whatsapp_config")
      .select("chave, valor")
      .in("chave", ["status", "qrcode"]);

    const config: Record<string, string> = {};
    (statusData ?? []).forEach((row: any) => { config[row.chave] = row.valor; });

    return new Response(
      JSON.stringify({
        status:  config.status  ?? "disconnected",
        qrcode:  config.qrcode  ?? null,
        online:  config.status  === "open",
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  // ── POST — solicitar novo QR Code ──────────────────────────
  if (req.method === "POST" && action === "refresh") {
    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Solicitar QR Code da Evolution API
      const res = await fetch(
        `${EVOLUTION_URL}/instance/connect/${EVOLUTION_INST}`,
        {
          method: "GET",
          headers: { "apikey": EVOLUTION_KEY },
        }
      );
      const data = await res.json();
      const qrcode = data?.base64 ?? data?.qrcode?.base64 ?? null;

      if (qrcode) {
        await supabase
          .from("whatsapp_config")
          .upsert({ chave: "qrcode", valor: qrcode, atualizado_em: new Date().toISOString() });
      }

      return new Response(
        JSON.stringify({ ok: true, qrcode }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: e.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ── POST — desconectar ─────────────────────────────────────
  if (req.method === "POST" && action === "disconnect") {
    if (EVOLUTION_URL && EVOLUTION_KEY) {
      await fetch(`${EVOLUTION_URL}/instance/logout/${EVOLUTION_INST}`, {
        method: "DELETE",
        headers: { "apikey": EVOLUTION_KEY },
      });
    }
    await supabase
      .from("whatsapp_config")
      .upsert({ chave: "status", valor: "disconnected", atualizado_em: new Date().toISOString() });

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400 });
});
