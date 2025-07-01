# Guia: Push Notifications Automáticas via Webhook

## 📋 Visão Geral

Este sistema envia notificações push automaticamente sempre que uma multa for criada no Supabase.

## 🚀 Configuração

### 1. Instalar Dependências
```bash
npm run install-webhook-deps
```

### 2. Rodar o Servidor Webhook
```bash
npm run webhook
```

O servidor ficará rodando em `http://localhost:4000`

### 3. Configurar Webhook no Supabase

1. Acesse o **Dashboard do Supabase**
2. Vá em **Database > Webhooks** (ou **Database > Triggers**)
3. Crie um novo webhook com as seguintes configurações:
   - **Tabela**: `fines`
   - **Evento**: `INSERT`
   - **URL**: `http://localhost:4000/fine-created` (ou sua URL pública)
   - **Método**: `POST`

### 4. Para Produção (URL Pública)

Para usar em produção, você precisa expor o servidor local:

#### Opção A: ngrok (para testes)
```bash
npx ngrok http 4000
```
Use a URL gerada pelo ngrok no webhook do Supabase.

#### Opção B: Deploy em servidor
Deploy o `webhook-server.js` em um servidor (Vercel, Railway, etc.) e use a URL pública.

## 🧪 Testando

### 1. Testar o Servidor
```bash
curl http://localhost:4000/test
```

### 2. Testar Push Manual
```bash
node send-fine-push.js <userId> "Teste" "Esta é uma notificação de teste"
```

### 3. Testar Webhook Completo
1. Rode o servidor: `npm run webhook`
2. Crie uma multa no app
3. Verifique os logs do servidor para ver se a notificação foi enviada

## 📱 Como Funciona

1. **Usuário faz login** → Token de push é registrado no Supabase
2. **Agente cria multa** → Supabase dispara webhook
3. **Servidor recebe webhook** → Busca proprietário e condutor
4. **Push é enviado** → Para todos os dispositivos dos usuários

## 🔧 Troubleshooting

### Erro: "Variáveis de ambiente não encontradas"
- Verifique se `config.env` tem `EXPO_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

### Erro: "Nenhum token encontrado"
- O usuário precisa ter feito login no app pelo menos uma vez
- Verifique se a tabela `device_tokens` tem registros

### Webhook não é chamado
- Verifique se a URL está correta no Supabase
- Teste com ngrok se estiver usando localhost

### Push não chega
- Verifique se o app tem permissão de notificação
- Teste com um dispositivo físico (não emulador)

## 📝 Logs

O servidor mostra logs detalhados:
- 📨 Webhook recebido
- 🚗 Dados da multa
- 📱 Envio de notificações
- ✅/❌ Sucesso/erro

## 🔒 Segurança

- Use HTTPS em produção
- Valide o webhook do Supabase (adicionar autenticação)
- Monitore os logs para detectar uso indevido 