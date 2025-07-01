const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
// Tenta carregar .env e config.env
dotenv.config();
dotenv.config({ path: 'config.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '0e77fbcb-49eb-456a-9555-4ad29465d4f2';

async function testUserPush() {
  try {
    console.log('🔍 Verificando tokens do usuário:', userId);
    
    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('✅ Usuário encontrado:', user);
    
    // Verificar tokens de push registrados
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', userId);
    
    if (tokensError) {
      console.error('❌ Erro ao buscar tokens:', tokensError);
      return;
    }
    
    console.log('📱 Tokens encontrados:', tokens?.length || 0);
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️  Nenhum token encontrado. O usuário precisa fazer login no app primeiro.');
      return;
    }
    
    // Enviar notificação de teste
    console.log('📤 Enviando notificação de teste...');
    
    const { exec } = require('child_process');
    const title = '🧪 Teste de Notificação';
    const message = 'Esta é uma notificação de teste para verificar se o sistema está funcionando.';
    
    exec(`node send-fine-push.js "${userId}" "${title}" "${message}"`, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Erro ao enviar push:', err);
        console.error('stderr:', stderr);
      } else {
        console.log('✅ Push enviado com sucesso!');
        console.log('stdout:', stdout);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUserPush(); 