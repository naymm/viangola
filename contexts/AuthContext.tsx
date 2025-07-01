import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { saveDeviceToken } from '@/lib/utils';

type User = Database['public']['Tables']['users']['Row'];

interface Permission {
  resource: string;
  actions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  driver: any | null;
  driverLoaded: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  fetchDriver?: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  operator: [
    { resource: 'vehicles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'drivers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'documents', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'fines', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'search', actions: ['read'] },
  ],
  agent: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'drivers', actions: ['read'] },
    { resource: 'documents', actions: ['read'] },
    { resource: 'fines', actions: ['create', 'read', 'update'] },
    { resource: 'search', actions: ['read'] },
  ],
  citizen: [
    { resource: 'vehicles', actions: ['create', 'read', 'update'] },
    { resource: 'documents', actions: ['create', 'read', 'update'] },
    { resource: 'fines', actions: ['read'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],
  company: [
    { resource: 'vehicles', actions: ['create', 'read', 'update'] },
    { resource: 'drivers', actions: ['create', 'read', 'update'] },
    { resource: 'documents', actions: ['create', 'read', 'update'] },
    { resource: 'fines', actions: ['read'] },
    { resource: 'fleet', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
  ],
};

// Credenciais de demonstração
const DEMO_CREDENTIALS = [
  {
    email: 'operador@autoveritas.pt',
    password: 'operador123',
    name: 'Admin Sistema',
    role: 'operator' as const
  },
  {
    email: 'agente@autoveritas.pt',
    password: 'agente123',
    name: 'João Silva Santos',
    role: 'agent' as const
  },
  {
    email: 'cidadao@autoveritas.pt',
    password: 'cidadao123',
    name: 'Maria João Ferreira',
    role: 'citizen' as const
  },
  {
    email: 'empresa@autoveritas.pt',
    password: 'empresa123',
    name: 'Carlos Manuel Costa',
    role: 'company' as const
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: false,
    driver: null,
    driverLoaded: false,
  });

  useEffect(() => {
    console.log('🚀 AuthProvider inicializado');
    
    // Para demonstração, vamos pular a verificação inicial da sessão do Supabase
    // e definir o estado como não autenticado
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
      driver: null,
      driverLoaded: false,
    });

    /*
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
          router.replace('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
    */
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      setAuthState({
        user: userProfile,
        isAuthenticated: true,
        loading: false,
        driver: null,
        driverLoaded: false,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        driver: null,
        driverLoaded: false,
      });
    }
  };

  const fetchDriver = async (userId: string) => {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('owner_id', userId)
        .single();
      setAuthState(prev => ({ ...prev, driver, driverLoaded: true }));
    } catch (error) {
      setAuthState(prev => ({ ...prev, driver: null, driverLoaded: true }));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true }));
    console.log('🔐 Tentativa de login para:', email);

    try {
      // Primeiro, verificar se é um usuário demo
      const demoUsers = [
        { email: 'operador@autoveritas.pt', password: 'operador123', role: 'operator' as const },
        { email: 'agente@autoveritas.pt', password: 'agente123', role: 'agent' as const },
        { email: 'cidadao@autoveritas.pt', password: 'cidadao123', role: 'citizen' as const },
        { email: 'empresa@autoveritas.pt', password: 'empresa123', role: 'company' as const },
      ];

      const demoUser = demoUsers.find(user => user.email === email && user.password === password);

      if (demoUser) {
        console.log('✅ Login demo bem-sucedido para:', email);
        const user = {
          id: `demo-${demoUser.role}`,
          email: demoUser.email,
          role: demoUser.role,
          name: `Usuário ${demoUser.role}`,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAuthState({
          user,
          isAuthenticated: true,
          loading: false,
          driver: null,
          driverLoaded: false,
        });
        await fetchDriver(user.id);
        await registerForPushNotificationsAsync(user.id);
        return true;
      }

      // Se não for demo, verificar na base de dados
      console.log('🔍 Verificando usuário na base de dados...');
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !user) {
        console.log('❌ Usuário não encontrado ou inativo');
        throw new Error('Credenciais inválidas');
      }

      // Validar senha em texto puro (apenas para testes)
      if (user.password !== password) {
        console.log('❌ Senha incorreta para o usuário:', user.email);
        throw new Error('Credenciais inválidas');
      }

      console.log('✅ Login bem-sucedido para usuário cadastrado:', user.email);
      
      setAuthState({
        user,
        isAuthenticated: true,
        loading: false,
        driver: null,
        driverLoaded: false,
      });
      await fetchDriver(user.id);
      await registerForPushNotificationsAsync(user.id);
      return true;

    } catch (error) {
      console.error('❌ Erro durante login:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Iniciando processo de logout...');
      
      // Para demonstração, não precisamos fazer logout do Supabase Auth
      // await supabase.auth.signOut();
      
      console.log('🔄 Limpando estado de autenticação...');
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        driver: null,
        driverLoaded: false,
      });
      
      console.log('📍 Redirecionando para login...');
      router.replace('/login');
      
      console.log('✅ Logout concluído com sucesso');
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Mesmo com erro, limpar o estado e redirecionar
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        driver: null,
        driverLoaded: false,
      });
      router.replace('/login');
      throw error;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!authState.user) return false;
    
    const permissions = ROLE_PERMISSIONS[authState.user.role] || [];
    const permission = permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  };

  // Função para registrar o token do dispositivo
  async function registerForPushNotificationsAsync(userId: string) {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permissão de notificação não concedida!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId,
      })).data;
      await saveDeviceToken(userId, token, Device.osName || 'unknown');
      console.log('Expo push token salvo:', token);
    } else {
      console.log('Deve usar um dispositivo físico para notificações push');
    }
  }

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      hasPermission,
      fetchDriver,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}