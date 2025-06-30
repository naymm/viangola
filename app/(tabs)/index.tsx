import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Car, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Users, Shield, Calendar, TrendingUp, Search, Plus, Bell, User, Settings, ChartBar as BarChart3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/PermissionGate';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { fineService } from '@/lib/database';

export default function HomeScreen() {
  const { user, hasPermission, driver, driverLoaded } = useAuth();
  const [refresh, setRefresh] = useState(false);
  const [finesCount, setFinesCount] = useState(0);

  // Fetch data for dashboard stats
  const { data: vehicles } = useSupabaseQuery('vehicles', {
    filter: user?.role === 'citizen' || user?.role === 'company' 
      ? { owner_id: user.id }
      : undefined
  });

  const { data: drivers } = useSupabaseQuery('drivers', {
    filter: user?.role === 'company' 
      ? { owner_id: user.id }
      : undefined
  });

  const { data: documents } = useSupabaseQuery('documents', {
    filter: user?.role === 'citizen' || user?.role === 'company' 
      ? { owner_id: user.id }
      : undefined
  });

  const { data: notifications } = useSupabaseQuery('notifications', {
    filter: user ? { user_id: user.id, read: false } : undefined
  });

  useEffect(() => {
    async function fetchFines() {
      if (user?.role === 'citizen') {
        // Buscar carta de condução do cidadão
        const { data: driver } = await supabase
          .from('drivers')
          .select('license_number')
          .eq('owner_id', user.id)
          .single();
        // Buscar placas dos veículos do cidadão
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('plate')
          .eq('owner_id', user.id);
        const license = driver?.license_number;
        const plates = (vehicles || []).map(v => v.plate);
        let query = supabase
          .from('fines')
          .select('id');
        if (license && plates.length > 0) {
          query = query.or(`driver_license.eq.${license},vehicle_plate.in.(${plates.join(',')})`);
        } else if (license) {
          query = query.eq('driver_license', license);
        } else if (plates.length > 0) {
          query = query.in('vehicle_plate', plates);
        } else {
          setFinesCount(0);
          return;
        }
        const { data, error } = await query;
        if (!error) setFinesCount(data?.length || 0);
      }
    }
    fetchFines();
  }, [user]);

  if (!user) {
    return null;
  }

  const stats = [
    { 
      label: 'Veículos Registados', 
      value: vehicles?.length.toString() || '0', 
      icon: Car, 
      color: '#2563EB', 
      onPress: () => hasPermission('vehicles', 'read') && router.push('/(tabs)/vehicles'),
      visible: hasPermission('vehicles', 'read')
    },
    { 
      label: 'Condutores Ativos', 
      value: drivers?.filter(d => d.status === 'valid').length.toString() || '0', 
      icon: Users, 
      color: '#059669', 
      onPress: () => hasPermission('drivers', 'read') && router.push('/(tabs)/drivers'),
      visible: hasPermission('drivers', 'read')
    },
    { 
      label: 'Documentos Válidos', 
      value: documents?.filter(d => d.status === 'valid').length.toString() || '0', 
      icon: CheckCircle, 
      color: '#7C3AED', 
      onPress: () => hasPermission('documents', 'read') && router.push('/(tabs)/documents'),
      visible: hasPermission('documents', 'read')
    },
    { 
      label: 'Alertas Pendentes', 
      value: notifications?.length.toString() || '0', 
      icon: AlertTriangle, 
      color: '#EA580C', 
      onPress: () => router.push('/(tabs)/notifications'),
      visible: true
    },
    {
      label: 'Multas',
      value: finesCount.toString(),
      icon: FileText,
      color: '#DC2626',
      onPress: () => hasPermission('fines', 'read') && router.push('/(tabs)/fines'),
      visible: hasPermission('fines', 'read')
    },
  ].filter(stat => stat.visible);

  const getQuickActions = () => {
    const actions = [];

    if (hasPermission('search', 'read')) {
      actions.push({
        title: 'Consultar Veículo',
        icon: Search,
        color: '#2563EB',
        onPress: () => router.push('/(tabs)/search')
      });
    }

    if (hasPermission('drivers', 'create')) {
      actions.push({
        title: 'Adicionar Condutor',
        icon: Users,
        color: '#059669',
        onPress: () => {
          router.push('/(tabs)/drivers');
          setTimeout(() => {
            Alert.alert('Adicionar Condutor', 'Modal de adicionar condutor seria aberto aqui');
          }, 500);
        }
      });
    }

    if (hasPermission('documents', 'create')) {
      actions.push({
        title: 'Upload Documento',
        icon: FileText,
        color: '#EA580C',
        onPress: () => {
          router.push('/(tabs)/documents');
          setTimeout(() => {
            Alert.alert('Upload Documento', 'Modal de upload seria aberto aqui');
          }, 500);
        }
      });
    }

    if (hasPermission('fines', 'create')) {
      actions.push({
        title: 'Aplicar Multa',
        icon: AlertTriangle,
        color: '#DC2626',
        onPress: () => router.push('/(tabs)/fines')
      });
    }

    if (user.role === 'operator') {
      actions.push({
        title: 'Administração',
        icon: Settings,
        color: '#7C3AED',
        onPress: () => router.push('/(tabs)/admin')
      });
    }

    if (hasPermission('reports', 'read')) {
      actions.push({
        title: 'Relatórios',
        icon: BarChart3,
        color: '#059669',
        onPress: () => router.push('/(tabs)/reports')
      });
    }

    actions.push({
      title: 'Ver Alertas',
      icon: Bell,
      color: '#7C3AED',
      onPress: () => router.push('/(tabs)/notifications')
    });

    return actions;
  };

  const quickActions = getQuickActions();

  const recentActivities = [
    {
      id: 1,
      type: 'vehicle',
      title: 'Veículo Adicionado',
      description: `${vehicles?.[0]?.brand || 'Novo'} ${vehicles?.[0]?.model || 'Veículo'} - ${vehicles?.[0]?.plate || 'XX-XX-XX'}`,
      time: 'Há 1 hora',
      status: 'success',
      onPress: () => hasPermission('vehicles', 'read') && router.push('/(tabs)/vehicles')
    },
    {
      id: 2,
      type: 'document',
      title: 'Documento Carregado',
      description: `${documents?.[0]?.type || 'Documento'} - ${documents?.[0]?.vehicle_plate || 'XX-XX-XX'}`,
      time: 'Há 2 horas',
      status: 'success',
      onPress: () => hasPermission('documents', 'read') && router.push('/(tabs)/documents')
    },
    {
      id: 3,
      type: 'alert',
      title: 'Nova Notificação',
      description: notifications?.[0]?.title || 'Verifique os seus alertas',
      time: 'Há 1 dia',
      status: 'warning',
      onPress: () => router.push('/(tabs)/notifications')
    },
    {
      id: 4,
      type: 'driver',
      title: 'Condutor Registado',
      description: `${drivers?.[0]?.name || 'Novo condutor'} - Carta: ${drivers?.[0]?.license_number || 'XXXXXXXXX'}`,
      time: 'Há 2 dias',
      status: 'info',
      onPress: () => hasPermission('drivers', 'read') && router.push('/(tabs)/drivers')
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#059669';
      case 'warning': return '#EA580C';
      case 'info': return '#2563EB';
      default: return '#64748B';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'operator': return '#7C3AED';
      case 'agent': return '#2563EB';
      case 'citizen': return '#059669';
      case 'company': return '#EA580C';
      default: return '#64748B';
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'operator': return 'Operador';
      case 'agent': return 'Agente de Trânsito';
      case 'citizen': return 'Cidadão';
      case 'company': return 'Empresa';
      default: return 'Utilizador';
    }
  };

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[getRoleColor(user.role), '#3B82F6']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Bem-vindo de volta</Text>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userType}>{getRoleTitle(user.role)}</Text>
              {user.badge && (
                <Text style={styles.userBadge}>Crachá: {user.badge}</Text>
              )}
              {user.company && (
                <Text style={styles.userCompany}>{user.company}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => router.push('/profile')}
            >
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.profilePhoto} />
              ) : (
                <User size={32} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        {stats.length > 0 && (
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.statCard}
                  onPress={stat.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                    <IconComponent size={24} color={stat.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.quickActionCard}
                    onPress={action.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                      <IconComponent size={28} color={action.color} strokeWidth={2} />
                    </View>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Recentes</Text>
          <View style={styles.activitiesContainer}>
            {recentActivities.map((activity) => (
              <TouchableOpacity 
                key={activity.id} 
                style={styles.activityCard}
                onPress={activity.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.activityContent}>
                  <View style={[
                    styles.activityStatus,
                    { backgroundColor: getStatusColor(activity.status) }
                  ]} />
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Role-specific information */}
        {user.role === 'operator' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Painel de Administração</Text>
            <TouchableOpacity 
              style={styles.adminCard}
              onPress={() => router.push('/(tabs)/admin')}
            >
              <Settings size={32} color="#7C3AED" strokeWidth={2} />
              <Text style={styles.adminCardTitle}>Gerir Sistema</Text>
              <Text style={styles.adminCardDescription}>
                Acesso completo a utilizadores, configurações e relatórios
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {user.role === 'company' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestão de Frota</Text>
            <TouchableOpacity 
              style={styles.fleetCard}
              onPress={() => hasPermission('reports', 'read') && router.push('/(tabs)/reports')}
            >
              <Car size={32} color="#EA580C" strokeWidth={2} />
              <Text style={styles.fleetCardTitle}>Frota da Empresa</Text>
              <Text style={styles.fleetCardDescription}>
                Gerir veículos e condutores da {user.company}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  userType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  userBadge: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  userCompany: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    lineHeight: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  activitiesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityStatus: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  adminCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  adminCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  fleetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fleetCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  fleetCardDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});