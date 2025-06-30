import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, User, Building, Eye, EyeOff, Info, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USERS } from '@/types/auth';

type UserRole = 'operator' | 'agent' | 'citizen' | 'company';

interface Credential {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

const DEMO_CREDENTIALS: Credential[] = [
  {
    email: 'operador@autoveritas.pt',
    password: 'operador123',
    name: 'Admin Sistema',
    role: 'operator'
  },
  {
    email: 'agente@autoveritas.pt',
    password: 'agente123',
    name: 'João Silva Santos',
    role: 'agent'
  },
  {
    email: 'cidadao@autoveritas.pt',
    password: 'cidadao123',
    name: 'Maria João Ferreira',
    role: 'citizen'
  },
  {
    email: 'empresa@autoveritas.pt',
    password: 'empresa123',
    name: 'Carlos Manuel Costa',
    role: 'company'
  }
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('agent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    console.log('🔐 Iniciando processo de login...');

    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ Login bem-sucedido, redirecionando...');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Login falhou');
        Alert.alert('Erro', 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('❌ Erro durante login:', error);
      Alert.alert('Erro', 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar Senha',
      'Esta é uma aplicação de demonstração. Use as credenciais fornecidas para testar diferentes níveis de acesso.',
      [
        {
          text: 'Ver Credenciais',
          onPress: () => setShowCredentials(true)
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  const fillCredentials = (credential: Credential) => {
    setEmail(credential.email);
    setPassword(credential.password);
    setUserRole(credential.role);
    setShowCredentials(false);
  };

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'operator':
        return {
          icon: Settings,
          title: 'Operador',
          description: 'Acesso total ao sistema',
          color: '#7C3AED',
        };
      case 'agent':
        return {
          icon: Shield,
          title: 'Agente de Trânsito',
          description: 'Consultas e fiscalização',
          color: '#2563EB',
        };
      case 'citizen':
        return {
          icon: User,
          title: 'Cidadão',
          description: 'Gerir os seus veículos',
          color: '#059669',
        };
      case 'company':
        return {
          icon: Building,
          title: 'Empresa',
          description: 'Gestão de frota empresarial',
          color: '#EA580C',
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#2563eb', '#3b82f6']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.logoContainer}
                onPress={() => Alert.alert('Viangola', 'Sistema de Gestão e Fiscalização Digital de Veículos\nVersão 1.0.0')}
              >
                <Shield size={48} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.title}>Viangola</Text>
              <Text style={styles.subtitle}>
                Gestão e Fiscalização Digital de Veículos
              </Text>
              
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu.email@exemplo.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Sua senha"
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

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (loading || !email.trim() || !password.trim()) && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={loading || !email.trim() || !password.trim()}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerSection}>
                <Text style={styles.registerText}>Não tem uma conta?</Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={styles.registerLink}>Criar Conta</Text>
                </TouchableOpacity>
              </View>

              {/* Demo Credentials */}
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Credentials Modal */}
      {showCredentials && (
        <View style={styles.modalOverlay}>
          <View style={styles.credentialsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Credenciais de Demonstração</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCredentials(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Esta é uma aplicação de demonstração. Use as credenciais abaixo para testar diferentes níveis de acesso:
              </Text>
              
              {DEMO_CREDENTIALS.map((credential, index) => {
                const config = getRoleConfig(credential.role);
                const IconComponent = config.icon;
                const user = DEMO_USERS.find(u => u.email === credential.email);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.credentialCard, { borderLeftColor: config.color }]}
                    onPress={() => fillCredentials(credential)}
                  >
                    <View style={styles.credentialHeader}>
                      <View style={[styles.credentialIcon, { backgroundColor: `${config.color}15` }]}>
                        <IconComponent size={24} color={config.color} strokeWidth={2} />
                      </View>
                      <View style={styles.credentialInfo}>
                        <Text style={styles.credentialRole}>{config.title}</Text>
                        <Text style={styles.credentialName}>{credential.name}</Text>
                      </View>
                      {user?.photo && (
                        <Image source={{ uri: user.photo }} style={styles.credentialPhoto} />
                      )}
                    </View>
                    <View style={styles.credentialDetails}>
                      <Text style={styles.credentialLabel}>Email:</Text>
                      <Text style={styles.credentialValue}>{credential.email}</Text>
                    </View>
                    <View style={styles.credentialDetails}>
                      <Text style={styles.credentialLabel}>Senha:</Text>
                      <Text style={styles.credentialValue}>{credential.password}</Text>
                    </View>
                    <Text style={styles.credentialTap}>Toque para preencher automaticamente</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  credentialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  credentialsButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  userRoleContainer: {
    marginBottom: 32,
  },
  userRoleTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  userRoleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userRoleButton: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  userRoleButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  userRoleButtonDescription: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
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
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  registerSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  demoSection: {
    marginTop: 20,
  },
  demoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 16,
  },
  demoCredentials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  demoButton: {
    width: '48%',
    backgroundColor: '#E0E7EF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  demoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  credentialsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  credentialCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  credentialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialRole: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  credentialName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  credentialPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  credentialDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  credentialLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    width: 60,
  },
  credentialValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  credentialTap: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
  },
});