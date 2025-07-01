// Script para enviar push notification via Expo para todos os tokens de um usuário
// Uso: node send-fine-push.js <userId> <titulo> <mensagem>
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendPushNotification(tokens, title, message) {
  const expoMessages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body: message,
    data: { type: 'fine' },
  }));

  const chunks = [];
  for (let i = 0; i < expoMessages.length; i += 100) {
    chunks.push(expoMessages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    const data = await response.json();
    console.log('Expo response:', data);
  }
}

async function main() {
  const [,, userId, title, ...msgParts] = process.argv;
  const message = msgParts.join(' ');
  if (!userId || !title || !message) {
    console.log('Uso: node send-fine-push.js <userId> <titulo> <mensagem>');
    process.exit(1);
  }

  const { data: tokens, error } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId);
  if (error) {
    console.error('Erro ao buscar tokens:', error);
    process.exit(1);
  }
  if (!tokens || tokens.length === 0) {
    console.log('Nenhum token encontrado para o usuário.');
    process.exit(0);
  }
  const tokenList = tokens.map(t => t.token);
  await sendPushNotification(tokenList, title, message);
  console.log('Notificação enviada para', tokenList.length, 'dispositivo(s).');
}

main(); 