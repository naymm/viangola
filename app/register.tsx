import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Building, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatAngolaPlate, validateAngolaPlate } from '@/lib/utils';

export default function RegisterScreen() {
  const [userType, setUserType] = useState<'citizen' | 'company'>('citizen');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    company: '',
    identification: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validações
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu nome completo');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (!formData.identification.trim()) {
      Alert.alert('Erro', userType === 'citizen' ? 'Por favor, insira o número do Bilhete de Identidade' : 'Por favor, insira o NIF da empresa');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Iniciando cadastro para:', formData.email);

      // Verificar se o email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (existingUser) {
        Alert.alert('Erro', 'Este email já está registado');
        setLoading(false);
        return;
      }

      // Criar novo usuário
      const newUser = {
        email: formData.email.toLowerCase(),
        name: formData.name.trim(),
        role: userType,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        company: userType === 'company' ? formData.name.trim() : undefined,
        identification: formData.identification.trim(),
        is_active: true,
        password: formData.password, // Salva a senha em texto puro (apenas para testes)
      };

      console.log('📝 Criando usuário:', newUser);

      const { error: createError } = await supabase
        .from('users')
        .insert(newUser);

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      // Buscar o usuário recém-criado pelo email
      const { data: user, error: fetchUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (fetchUserError || !user) {
        console.error('❌ Erro ao buscar usuário após cadastro:', fetchUserError);
        throw new Error('Erro ao buscar usuário após cadastro');
      }

      console.log('✅ Usuário criado e buscado com sucesso:', user.id);

      // Mostrar sucesso e redirecionar para login
      Alert.alert(
        'Sucesso!',
        'Conta criada com sucesso! Agora pode fazer login.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );

    } catch (error) {
      console.error('❌ Erro durante cadastro:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao criar sua conta. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#2563eb', '#3b82f6']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToLogin}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Criar Conta</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Bem-vindo ao Viangola</Text>
                <Text style={styles.welcomeSubtitle}>
                  Crie sua conta para aceder aos serviços de gestão automóvel
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Tipo de usuário - agora no topo */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tipo de Conta *</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity
                      style={[styles.typeButton, userType === 'citizen' && styles.typeButtonActive]}
                      onPress={() => setUserType('citizen')}
                    >
                      <User size={18} color={userType === 'citizen' ? '#2563EB' : '#64748B'} />
                      <Text style={[styles.typeButtonText, userType === 'citizen' && styles.typeButtonTextActive]}>Cidadão</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, userType === 'company' && styles.typeButtonActive]}
                      onPress={() => setUserType('company')}
                    >
                      <Building size={18} color={userType === 'company' ? '#2563EB' : '#64748B'} />
                      <Text style={[styles.typeButtonText, userType === 'company' && styles.typeButtonTextActive]}>Empresa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Nome completo ou nome da empresa */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{userType === 'company' ? 'Nome da Empresa *' : 'Nome Completo *'}</Text>
                  <View style={styles.inputWrapper}>
                    <User size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder={userType === 'company' ? 'Nome da empresa' : 'Seu nome completo'}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      placeholder="seu.email@exemplo.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Senha *</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#64748B" />
                    <TextInput
                      style={styles.passwordInput}
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#64748B" />
                      ) : (
                        <Eye size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirmar Senha *</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#64748B" />
                    <TextInput
                      style={styles.passwordInput}
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      placeholder="Confirme sua senha"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#64748B" />
                      ) : (
                        <Eye size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Telefone</Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholder="+351 912 345 678"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Endereço</Text>
                  <View style={styles.inputWrapper}>
                    <MapPin size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      value={formData.address}
                      onChangeText={(text) => setFormData({ ...formData, address: text })}
                      placeholder="Rua, número, cidade"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{userType === 'citizen' ? 'Bilhete de Identidade *' : 'NIF da Empresa *'}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.identification}
                      onChangeText={(text) => setFormData({ ...formData, identification: text })}
                      placeholder={userType === 'citizen' ? 'Número do BI' : 'NIF da empresa'}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Criando Conta...' : 'Criar Conta'}
                  </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginSection}>
                  <Text style={styles.loginText}>Já tem uma conta?</Text>
                  <TouchableOpacity onPress={handleBackToLogin}>
                    <Text style={styles.loginLink}>Fazer Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    paddingVertical: 12,
  },
  passwordInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
    marginLeft: 4,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
  },
  typeButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Medium',
  },
  typeButtonTextActive: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
}); 