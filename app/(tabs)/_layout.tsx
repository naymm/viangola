import { Tabs, Redirect } from 'expo-router';
import { Chrome as Home, Search, Car, FileText, Bell, Users, Settings, ChartBar as BarChart3, TriangleAlert as AlertTriangle, CreditCard } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { user, hasPermission, loading } = useAuth();

  console.log('🔍 TabLayout - Estado atual:', { 
    user: user?.name, 
    role: user?.role,
    isAuthenticated: !!user, 
    loading 
  });

  // Log extra para depuração
  console.log('🟠 Valor real de user.role:', user?.role);

  // Show loading state while checking auth
  if (loading) {
    console.log('⏳ TabLayout - Mostrando loading...');
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🚫 TabLayout - Usuário não autenticado, redirecionando para login...');
    return <Redirect href="/login" />;
  }

  console.log('✅ TabLayout - Usuário autenticado, mostrando tabs...');

  // Configuração específica para agente de trânsito
  const isAgent = user.role === 'agent';
  
  if (isAgent) {
    console.log('🚦 TabLayout - Configurando tabs para agente de trânsito');
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            paddingHorizontal: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter-Medium',
            marginBottom: Platform.OS === 'ios' ? 4 : 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="search"
          options={{
            title: 'Consultar',
            tabBarIcon: ({ size, color }) => (
              <Search size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        <Tabs.Screen
          name="fines"
          options={{
            title: 'Multas',
            tabBarIcon: ({ size, color }) => (
              <AlertTriangle size={size} color={color} strokeWidth={2} />
            ),
          }}
        />

        {/* Ocultar outras abas para agente */}
        <Tabs.Screen
          name="vehicles"
          options={{
            href: null, // Oculta a aba
          }}
        />
        <Tabs.Screen
          name="drivers"
          options={{
            href: null, // Oculta a aba
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            href: null, // Oculta a aba
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null, // Oculta a aba
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            href: null, // Oculta a aba
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            href: null, // Oculta a aba
          }}
        />
      </Tabs>
    );
  }

  // Configuração específica para cidadão
  const isCitizen = user.role === 'citizen';
  if (isCitizen) {
    console.log('👤 TabLayout - Configurando tabs para cidadão');
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            paddingHorizontal: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter-Medium',
            marginBottom: Platform.OS === 'ios' ? 4 : 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Veículos',
            tabBarIcon: ({ size, color }) => (
              <Car size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documentos',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="fines"
          options={{
            title: 'Multas',
            tabBarIcon: ({ size, color }) => (
              <AlertTriangle size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alertas',
            tabBarIcon: ({ size, color }) => (
              <Bell size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="minha-carta"
          options={{
            title: 'Carta',
            tabBarIcon: ({ size, color }) => (
              <CreditCard size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        {/* Ocultar todas as outras abas para cidadão */}
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
      </Tabs>
    );
  }

  // Configuração específica para empresa
  const isCompany = user.role === 'company';
  if (isCompany) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            paddingHorizontal: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: 'Inter-Medium',
            marginBottom: Platform.OS === 'ios' ? 4 : 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Veículos',
            tabBarIcon: ({ size, color }) => (
              <Car size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="drivers"
          options={{
            title: 'Condutores',
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documentos',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="fines"
          options={{
            title: 'Multas',
            tabBarIcon: ({ size, color }) => (
              <AlertTriangle size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alertas',
            tabBarIcon: ({ size, color }) => (
              <Bell size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Relatórios',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    );
  }

  // Configuração padrão para outros usuários
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: Platform.OS === 'ios' ? 88 : 70, // Increased height for better spacing
          paddingBottom: Platform.OS === 'ios' ? 28 : 12, // More padding at bottom
          paddingTop: 12,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginBottom: Platform.OS === 'ios' ? 4 : 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      
      {hasPermission('search', 'read') && (
        <Tabs.Screen
          name="search"
          options={{
            title: 'Consultar',
            tabBarIcon: ({ size, color }) => (
              <Search size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}

      {hasPermission('vehicles', 'read') && (
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Veículos',
            tabBarIcon: ({ size, color }) => (
              <Car size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}

      {hasPermission('drivers', 'read') && (
        <Tabs.Screen
          name="drivers"
          options={{
            title: 'Condutores',
            tabBarIcon: ({ size, color }) => (
              <Users size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}

      {hasPermission('documents', 'read') && (
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documentos',
            tabBarIcon: ({ size, color }) => (
              <FileText size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}

      {hasPermission('fines', 'read') && (
        <Tabs.Screen
          name="fines"
          options={{
            title: 'Multas',
            tabBarIcon: ({ size, color }) => (
              <AlertTriangle size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ size, color }) => (
            <Bell size={size} color={color} strokeWidth={2} />
          ),
        }}
      />

      {user.role === 'operator' && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ size, color }) => (
              <Settings size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}

      {(user.role === 'operator' || user.role === 'company') && (
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Relatórios',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}