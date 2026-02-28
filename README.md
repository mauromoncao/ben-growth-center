# Ben Growth Center
### Centro de Inteligência Comercial Jurídica
**Mauro Monção Advogados — Teresina/PI**

---

## 🎯 O que é o Ben Growth Center?

Sistema proprietário de gestão comercial centralizada para escritórios de advocacia.
Integra **Tráfego Pago + Marketing IA + CRM + Dr. Ben** em uma única plataforma PWA,
eliminando dependência de ferramentas externas como Kommo, Notion ou Astrea.

---

## 🧠 7 Agentes de Inteligência Artificial

| Agente | Modelo | Função | Horário |
|--------|--------|--------|---------|
| **Lex Conteúdo** | Gemini 2.5 Pro | Blog + Social Media | 07:00 diário |
| **Lex Campanhas** | GPT-5 | Otimização de Ads | 08:00 diário |
| **Lex Marketing** | Claude Opus 4 | Estratégia comercial | 07:05 diário |
| **Lex Relatório** | Claude Opus 4 | PDF Relatório semanal | 2ª 09:00 |
| **Lex Criativo** | Imagen 4 + GPT-5 | Imagens e scripts | Sob demanda |
| **Lex Monitor** | Gemini 2.5 Flash | Palavras-chave + alertas | A cada hora |
| **Lex Pesquisa** | Genspark Super Agent | Pesquisa jurídica deep | Sob demanda |

---

## 🏗️ Módulos do Sistema

### CRM & Atendimento
- **Pipeline Kanban** — 5 etapas: Novo → Qualificado → Aguardando → Atendimento → Convertido
- **Plantonista & Alertas** — Repasse automático via PWA push notification
- **Dr. Ben IA** — WhatsApp + Site → CRM direto (Gemini 2.5 Flash)

### Tráfego & Marketing
- **Campanhas** — Google Ads + Meta Ads com KPIs em tempo real
- **Analytics** — Gráficos de leads, cliques, ROAS, CPL
- **Conteúdo IA** — Blog + Instagram + Facebook com conformidade OAB
- **Palavras-chave** — Volume, CPC, posição, concorrência

### Inteligência
- **Agentes IA** — 7 agentes com modelos otimizados por tarefa
- **Dashboard Ads** — Visão consolidada Google + Meta
- **Configurações** — Variáveis de ambiente + guia de deploy

---

## 🚀 Deploy no Vercel

### Pré-requisitos
- Node.js 20+
- Conta Vercel (free ou Pro)
- Repositório no GitHub

### Passos
```bash
# 1. Instalar dependências
npm install

# 2. Build
npm run build

# 3. Deploy (via Vercel CLI)
npx vercel --prod
```

### Variáveis de Ambiente (Vercel Dashboard)

```env
# Banco de dados
DATABASE_URL=postgresql://...

# IA
GEMINI_API_KEY=AIza...
GENSPARK_API_KEY=gs-...
OPENAI_API_KEY=sk-...  (opcional — Genspark já cobre)

# Publicidade
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
META_APP_ID=...
META_APP_SECRET=...
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=act_...

# WhatsApp / Dr. Ben
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...

# Segurança
JWT_SECRET=...
```

---

## 🔗 URLs do Ecossistema

| Projeto | URL |
|---------|-----|
| **Ben Growth Center** | `bengrowth.mauromoncao.adv.br` |
| **Site Institucional** | `mauromoncao.adv.br` |
| **Blog** | `blog.mauromoncao.adv.br` |
| **Soluções Jurídicas** | `solucoesjuridicaspi.com.br` |
| **Dr. Ben** | WhatsApp + site integrado |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **PWA:** Service Worker + Web Push Notifications
- **Backend:** Node.js + Express (serverless Vercel)
- **Banco:** PostgreSQL via Neon + Drizzle ORM
- **IA:** Gemini 2.5 Pro/Flash · GPT-5 · Claude Opus 4 · Genspark Super Agent
- **Ads:** Google Ads API v23 · Meta Marketing API v21
- **CI/CD:** GitHub → Vercel auto-deploy
- **Cron:** Vercel Cron Jobs (gratuito)

---

## 📋 Conformidade OAB

Todos os conteúdos gerados pela IA respeitam o **Provimento 205/2021** da OAB:
- ✅ Sem promessas de resultado
- ✅ Sem comparação de preços
- ✅ Informativo, não publicitário
- ✅ Tom profissional e educativo

---

*Desenvolvido por Genspark AI | © 2026 Mauro Monção Advogados*
