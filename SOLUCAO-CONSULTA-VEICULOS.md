# 🔧 Solução para Problema de Consulta de Veículos

## ❌ Problema Identificado
A consulta de veículos não está funcionando porque as variáveis de ambiente do Supabase não estão configuradas.

## 🔧 Solução Passo a Passo

### 1. Configurar Variáveis de Ambiente

#### Opção A: Criar arquivo .env (Recomendado)
1. Crie um arquivo `.env` na raiz do projeto (mesmo nível do package.json)
2. Adicione as seguintes linhas:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

#### Opção B: Definir variáveis no sistema
```powershell
# Windows PowerShell
$env:EXPO_PUBLIC_SUPABASE_URL="https://qgsoeulqzaqgrlcwsknz.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnc29ldWxxemFxZ3JsY3dza256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUzOTAsImV4cCI6MjA2NjcxMTM5MH0.nQYkVxBJ3a49KucS8uVqjDl8HOg_57Udjt4T_uoRsmM"


### 2. Obter Credenciais do Supabase

1. **Acesse o Supabase**: https://supabase.com
2. **Crie um novo projeto** ou use um existente
3. **Vá para Settings > API**
4. **Copie as credenciais**:
   - **Project URL**: Copie a URL do projeto
   - **anon public**: Copie a chave anon

### 3. Aplicar Migrações no Supabase

1. **Vá para o SQL Editor** no Supabase Dashboard
2. **Execute as migrações** na seguinte ordem:
   - `20250628181039_sparkling_frost.sql`
   - `20250628181115_gentle_dawn.sql`
   - `20250628181735_flat_spire.sql`
   - `20250628181937_little_wildflower.sql`
   - `20250628182000_fix_rls_policies.sql`

### 4. Verificar Dados de Exemplo

Após aplicar as migrações, você deve ter:
- **3 usuários demo** com diferentes roles
- **3 veículos demo** com matrículas angolanas
- **3 condutores demo** com cartas de condução
- **4 documentos demo** de diferentes tipos
- **3 multas demo** com diferentes status

### 5. Testar a Aplicação

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

2. **Faça login** com um usuário demo:
   - **Operador**: `operador@autoveritas.pt` / `operador123`
   - **Agente**: `agente@autoveritas.pt` / `agente123`
   - **Cidadão**: `cidadao@autoveritas.pt` / `cidadao123`
   - **Empresa**: `empresa@autoveritas.pt` / `empresa123`

3. **Vá para a aba "Veículos"** e verifique se os dados são carregados

### 6. Verificar Logs

Se ainda houver problemas, verifique os logs no console do Metro para identificar erros específicos.

## 🔍 Dados Esperados

### Veículos de Demonstração
- **12-AB-34**: Mercedes-Benz C-Class (2020)
- **56-CD-78**: BMW X5 (2019)
- **90-EF-12**: Audi A4 (2021)

### Usuários de Demonstração
- **Admin Sistema** (operator): Pode ver todos os veículos
- **João Silva Santos** (agent): Pode ver todos os veículos
- **Maria João Ferreira** (citizen): Vê apenas seus veículos
- **Carlos Manuel Costa** (company): Vê apenas seus veículos

## 🚨 Problemas Comuns

### 1. "Network Error"
- Verifique se a URL do Supabase está correta
- Verifique se o projeto está ativo

### 2. "RLS Policy Violation"
- Execute o script `fix-rls-policies.sql` no Supabase
- Verifique se as políticas estão ativas

### 3. "Table does not exist"
- Execute todas as migrações no Supabase
- Verifique se as tabelas foram criadas

### 4. "Unauthorized"
- Verifique se a anon key está correta
- Verifique se as RLS policies permitem acesso anônimo

## 📞 Suporte

Se o problema persistir após seguir estes passos, verifique:
1. Logs detalhados no console do Metro
2. Logs no Supabase Dashboard > Logs
3. Status do projeto no Supabase Dashboard 