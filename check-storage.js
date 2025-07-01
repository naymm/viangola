const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './config.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStorage() {
  console.log('🔍 Verificando Supabase Storage...\n');

  try {
    // 1. Verificar se o bucket 'documents' existe
    console.log('1. Verificando bucket "documents"...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }

    console.log('📦 Buckets encontrados:');
    if (buckets.length === 0) {
      console.log('   Nenhum bucket encontrado');
    } else {
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }

    const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    
    if (!documentsBucket) {
      console.log('\n❌ Bucket "documents" não encontrado!');
      console.log('💡 Para criar o bucket, você precisa:');
      console.log('   1. Acessar o dashboard do Supabase');
      console.log('   2. Ir para Storage > Buckets');
      console.log('   3. Criar um novo bucket chamado "documents"');
      console.log('   4. Marcar como público');
      console.log('   5. Configurar as políticas RLS');
    } else {
      console.log('\n✅ Bucket "documents" encontrado!');
      console.log(`   - Nome: ${documentsBucket.name}`);
      console.log(`   - Público: ${documentsBucket.public ? 'Sim' : 'Não'}`);
      console.log(`   - Criado em: ${documentsBucket.created_at}`);
    }

    // 2. Listar arquivos no bucket (se existir)
    if (documentsBucket) {
      console.log('\n2. Listando arquivos no bucket "documents"...');
      const { data: files, error: filesError } = await supabase.storage
        .from('documents')
        .list();

      if (filesError) {
        console.error('❌ Erro ao listar arquivos:', filesError);
      } else {
        if (files.length === 0) {
          console.log('📁 Nenhum arquivo encontrado no bucket');
        } else {
          console.log(`📁 ${files.length} arquivo(s) encontrado(s):`);
          files.forEach(file => {
            console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
          });
        }
      }
    }

    console.log('\n🎯 Próximos passos:');
    console.log('   1. Se o bucket não existe, crie-o no dashboard do Supabase');
    console.log('   2. Configure as políticas RLS para permitir upload');
    console.log('   3. Teste o upload de uma imagem');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

// Executar a verificação
checkStorage(); 