const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './config.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('Certifique-se de que config.env contém:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreDocumentsPolicies() {
  console.log('🔧 Restaurando políticas RLS para a tabela documents...\n');

  try {
    // 1. Habilitar RLS
    console.log('1. Habilitando RLS na tabela documents...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE documents ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️  RLS já estava habilitado ou erro:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado com sucesso');
    }

    // 2. Criar políticas
    const policies = [
      {
        name: 'Users can view their own documents',
        sql: `
          CREATE POLICY "Users can view their own documents" ON documents
          FOR SELECT USING (
            auth.uid() = owner_id OR 
            auth.uid() IN (
              SELECT id FROM users WHERE role IN ('operator', 'agent')
            )
          );
        `
      },
      {
        name: 'Users can create their own documents',
        sql: `
          CREATE POLICY "Users can create their own documents" ON documents
          FOR INSERT WITH CHECK (
            auth.uid() = owner_id
          );
        `
      },
      {
        name: 'Users can update their own documents',
        sql: `
          CREATE POLICY "Users can update their own documents" ON documents
          FOR UPDATE USING (
            auth.uid() = owner_id OR 
            auth.uid() IN (
              SELECT id FROM users WHERE role IN ('operator', 'agent')
            )
          );
        `
      },
      {
        name: 'Users can delete their own documents',
        sql: `
          CREATE POLICY "Users can delete their own documents" ON documents
          FOR DELETE USING (
            auth.uid() = owner_id OR 
            auth.uid() IN (
              SELECT id FROM users WHERE role IN ('operator', 'agent')
            )
          );
        `
      },
      {
        name: 'Operators and agents can view all documents',
        sql: `
          CREATE POLICY "Operators and agents can view all documents" ON documents
          FOR SELECT USING (
            auth.uid() IN (
              SELECT id FROM users WHERE role IN ('operator', 'agent')
            )
          );
        `
      },
      {
        name: 'Operators and agents can update all documents',
        sql: `
          CREATE POLICY "Operators and agents can update all documents" ON documents
          FOR UPDATE USING (
            auth.uid() IN (
              SELECT id FROM users WHERE role IN ('operator', 'agent')
            )
          );
        `
      },
      {
        name: 'Operators and agents can delete all documents',
        sql: `
          CREATE POLICY "Operators and agents can delete all documents" ON documents
          FOR DELETE USING (
            auth.uid() IN (
              SELECT id FROM users WHERE role IN ('operator', 'agent')
            )
          );
        `
      }
    ];

    console.log('2. Criando políticas...');
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (error) {
          console.log(`⚠️  Política "${policy.name}" já existe ou erro:`, error.message);
        } else {
          console.log(`✅ Política "${policy.name}" criada com sucesso`);
        }
      } catch (err) {
        console.log(`⚠️  Erro ao criar política "${policy.name}":`, err.message);
      }
    }

    // 3. Verificar políticas existentes
    console.log('\n3. Verificando políticas existentes...');
    const { data: existingPolicies, error: checkError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'documents');

    if (checkError) {
      console.log('⚠️  Não foi possível verificar políticas existentes:', checkError.message);
    } else {
      console.log('📋 Políticas existentes na tabela documents:');
      existingPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname}`);
      });
    }

    // 4. Teste de acesso
    console.log('\n4. Testando acesso à tabela documents...');
    const { data: testData, error: testError } = await supabase
      .from('documents')
      .select('count(*)')
      .limit(1);

    if (testError) {
      console.log('❌ Erro ao testar acesso:', testError.message);
    } else {
      console.log('✅ Acesso à tabela documents funcionando corretamente');
    }

    console.log('\n🎉 Restauração das políticas concluída!');
    console.log('\n📝 Resumo das políticas criadas:');
    console.log('   • Usuários podem ver/criar/atualizar/deletar seus próprios documentos');
    console.log('   • Operadores e agentes podem ver/atualizar/deletar todos os documentos');
    console.log('   • RLS está habilitado para segurança');

  } catch (error) {
    console.error('❌ Erro durante a restauração:', error);
  }
}

// Executar a restauração
restoreDocumentsPolicies(); 