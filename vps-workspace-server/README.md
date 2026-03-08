# BEN Workspace API — Deploy na VPS
# ============================================================

## Deploy Rápido (passo a passo)

### 1. Subir arquivos para a VPS
```bash
# Do seu computador local ou do servidor de CI:
scp -r vps-workspace-server/ root@181.215.135.202:/tmp/ben-workspace-deploy/

# Na VPS:
ssh root@181.215.135.202
cp /tmp/ben-workspace-deploy/install-workspace.sh /root/
chmod +x /root/install-workspace.sh
sudo /root/install-workspace.sh
```

### 2. Copiar server.js
```bash
cp /tmp/ben-workspace-deploy/server.js /opt/ben-workspace/
cp /tmp/ben-workspace-deploy/package.json /opt/ben-workspace/
cd /opt/ben-workspace && npm install
```

### 3. Configurar variáveis de ambiente
```bash
nano /opt/ben-workspace/.env
# Adicione suas API keys:
# OPENAI_API_KEY=sk-...
# ADMIN_SENHA=sua_senha_segura
```

### 4. Iniciar com PM2
```bash
pm2 start /opt/ben-workspace/server.js --name ben-workspace
pm2 save
pm2 list
```

### 5. Testar
```bash
curl http://181.215.135.202:3002/health
```

---

## Atualizar (após mudanças no código)
```bash
# Na VPS:
scp server.js root@181.215.135.202:/opt/ben-workspace/
ssh root@181.215.135.202 "pm2 restart ben-workspace"
```

---

## Variáveis de Ambiente (.env)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DB_PASS` | ✅ | Senha do PostgreSQL (definida no install) |
| `JWT_SECRET` | ✅ | Segredo para tokens JWT |
| `OPENAI_API_KEY` | ⚡ Recomendada | Para busca vetorial (embeddings) |
| `MONITOR_ADMIN_TOKEN` | ✅ | Token do monitor de custos |
| `ADMIN_SENHA` | ✅ | Senha do Dr. Mauro no workspace |
| `JURIS_URL` | opcional | URL do Juris Center (padrão: vercel) |
| `USD_BRL_RATE` | opcional | Câmbio (padrão: 5.75) |

---

## Rotas da API

### Autenticação
- `POST /auth/login` — `{ email, senha }`
- `GET  /auth/me` — (requer Bearer token)

### Projetos
- `GET  /projects` — lista projetos
- `POST /projects` — cria projeto
- `GET  /projects/:id` — detalhes + resumo
- `PATCH /projects/:id` — atualiza
- `DELETE /projects/:id` — arquiva

### Conversas
- `GET  /conversations?project_id=` — lista
- `POST /conversations` — cria
- `GET  /conversations/:id` — detalhes + mensagens
- `POST /conversations/:id/messages` — adiciona mensagem

### Documentos
- `GET  /documents?project_id=` — lista
- `POST /documents` — salva documento
- `GET  /documents/:id` — busca
- `PATCH /documents/:id` — atualiza (versão++)

### Tarefas
- `GET  /tasks?project_id=` — lista
- `POST /tasks` — cria
- `PATCH /tasks/:id` — atualiza/conclui

### Monitor (admin)
- `POST /monitor/log` — recebe log de custo
- `GET  /monitor/stats?token=` — estatísticas
- `GET  /monitor/daily?token=` — custo por dia

### Memória Vetorial
- `POST /memory/index` — indexa conteúdo
- `POST /memory/search` — busca semântica

### Pipelines Multi-Agente
- `POST /pipelines` — executa cadeia de agentes
- `GET  /pipelines?project_id=` — lista
- `GET  /pipelines/:id` — resultado

---

## Arquitetura de Portas na VPS

```
181.215.135.202:3001  →  Ben Leads API    (SQLite — mantida intacta)
181.215.135.202:3002  →  Ben Workspace API (PostgreSQL — nova)
```
