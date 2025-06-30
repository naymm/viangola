# Guia de Implementação - Cadastro de Cidadãos

## ✅ Funcionalidades Implementadas

### 1. Tela de Cadastro (`app/register.tsx`)
- ✅ Formulário completo com validações
- ✅ Campos: nome, email, senha, confirmar senha, telefone, endereço, empresa
- ✅ Validação de email único
- ✅ Interface moderna e responsiva
- ✅ Redirecionamento automático após cadastro

### 2. Atualização da Tela de Login (`app/login.tsx`)
- ✅ Link para cadastro adicionado
- ✅ Botões para credenciais de demonstração
- ✅ Interface melhorada

### 3. Sistema de Autenticação (`contexts/AuthContext.tsx`)
- ✅ Suporte para usuários cadastrados
- ✅ Verificação de email único
- ✅ Login com usuários demo e cadastrados
- ✅ Controle de estado de autenticação

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente
Certifique-se de que o arquivo `config.env` contém:
```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
```

### 2. Base de Dados
A tabela `users` deve ter a seguinte estrutura:
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('operator', 'agent', 'citizen', 'company')),
  phone TEXT,
  address TEXT,
  company TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Políticas RLS (Row Level Security)
Execute as seguintes políticas no Supabase Dashboard:
```sql
-- Permitir inserção de novos usuários
CREATE POLICY "Users can insert their own data" ON users
FOR INSERT WITH CHECK (true);

-- Permitir leitura de usuários ativos
CREATE POLICY "Users can read active users" ON users
FOR SELECT USING (is_active = true);

-- Permitir atualização do próprio perfil
CREATE POLICY "Users can update their own data" ON users
FOR UPDATE USING (auth.uid()::text = id::text);
```

## 🚀 Como Usar

### 1. Cadastro de Novo Cidadão
1. Abra o app
2. Na tela de login, clique em "Criar Conta"
3. Preencha o formulário com:
   - Nome completo (obrigatório)
   - Email válido (obrigatório)
   - Senha (mínimo 6 caracteres)
   - Confirmar senha
   - Telefone (opcional)
   - Endereço (opcional)
   - Empresa (opcional)
4. Clique em "Criar Conta"
5. Após sucesso, será redirecionado para login

### 2. Login com Usuário Cadastrado
1. Use o email e senha do cadastro
2. O sistema verificará se o usuário existe e está ativo
3. Login será realizado automaticamente

### 3. Usuários de Demonstração
- **Operador**: operador@autoveritas.pt / operador123
- **Agente**: agente@autoveritas.pt / agente123
- **Cidadão**: cidadao@autoveritas.pt / cidadao123
- **Empresa**: empresa@autoveritas.pt / empresa123

## 🔒 Segurança

### Implementações Atuais
- ✅ Validação de email único
- ✅ Verificação de usuário ativo
- ✅ Validação de campos obrigatórios
- ✅ Sanitização de dados

### Melhorias Futuras (Produção)
- 🔄 Hash de senhas (bcrypt)
- 🔄 Verificação de email
- 🔄 Rate limiting
- 🔄 Validação mais robusta
- 🔄 Logs de auditoria

## 🧪 Testes

### Teste Manual
1. Execute o app: `npm run dev`
2. Teste cadastro com dados válidos
3. Teste cadastro com email duplicado
4. Teste login com usuário cadastrado
5. Teste login com credenciais inválidas

### Verificação no Supabase
1. Aceda ao Supabase Dashboard
2. Vá para Table Editor > users
3. Verifique se novos usuários aparecem
4. Confirme que o campo `is_active` está como `true`

## 📱 Interface

### Tela de Cadastro
- Design moderno com gradiente azul
- Campos organizados com ícones
- Validação em tempo real
- Botões de mostrar/ocultar senha
- Responsivo para diferentes tamanhos de tela

### Navegação
- Botão voltar para login
- Redirecionamento automático após sucesso
- Mensagens de erro claras
- Loading states durante operações

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro 400/401 no cadastro**
   - Verificar políticas RLS
   - Confirmar variáveis de ambiente
   - Verificar estrutura da tabela

2. **Email já existe**
   - Sistema verifica automaticamente
   - Mostra mensagem de erro apropriada

3. **Login não funciona após cadastro**
   - Verificar se `is_active = true`
   - Confirmar email está correto
   - Verificar logs no console

4. **Campos não salvam**
   - Verificar permissões de inserção
   - Confirmar estrutura da tabela
   - Verificar políticas RLS

## 📋 Checklist de Implementação

- [ ] Configurar variáveis de ambiente
- [ ] Aplicar políticas RLS no Supabase
- [ ] Testar cadastro de novo usuário
- [ ] Testar login com usuário cadastrado
- [ ] Verificar redirecionamentos
- [ ] Testar validações de formulário
- [ ] Verificar interface em diferentes dispositivos
- [ ] Testar cenários de erro

## 🎯 Próximos Passos

1. **Implementar hash de senhas**
2. **Adicionar verificação de email**
3. **Criar sistema de recuperação de senha**
4. **Implementar perfil de usuário completo**
5. **Adicionar upload de foto de perfil**
6. **Criar sistema de notificações por email**

---

**Status**: ✅ Implementação completa
**Versão**: 1.0.0
**Última atualização**: Janeiro 2025 