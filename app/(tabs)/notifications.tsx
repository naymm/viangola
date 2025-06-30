import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Bell, Car, Calendar, Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Settings, Clock, FileText } from 'lucide-react-native';
import NotificationCard from '@/components/NotificationCard';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery, useSupabaseUpdate } from '@/hooks/useSupabase';
import { Database } from '@/types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    expiry: true,
    fines: true,
    reminders: true,
    system: false,
  });

  // Fetch notifications for current user
  const { data: notifications, loading, error, refetch } = useSupabaseQuery('notifications', {
    filter: user ? { user_id: user.id } : undefined,
    orderBy: { column: 'created_at', ascending: false }
  });

  const { update: updateNotification } = useSupabaseUpdate('notifications');

  const markAsRead = async (id: string) => {
    try {
      await updateNotification(id, { 
        read: true, 
        read_at: new Date().toISOString() 
      });
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications?.filter(n => !n.read) || [];
      
      await Promise.all(
        unreadNotifications.map(notification =>
          updateNotification(notification.id, { 
            read: true, 
            read_at: new Date().toISOString() 
          })
        )
      );
      
      refetch();
      Alert.alert('Sucesso', 'Todas as notificações foram marcadas como lidas');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao marcar notificações como lidas');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to relevant screen based on notification type
    switch (notification.type) {
      case 'expiry':
        Alert.alert('Vencimento', `${notification.title}\n\n${notification.description}`);
        break;
      case 'fine':
        Alert.alert('Multa', `${notification.title}\n\n${notification.description}`);
        break;
      case 'reminder':
        Alert.alert('Lembrete', `${notification.title}\n\n${notification.description}`);
        break;
      case 'system':
        Alert.alert('Sistema', `${notification.title}\n\n${notification.description}`);
        break;
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const updateNotificationSetting = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    Alert.alert('Configuração', `Notificações de ${key} ${value ? 'ativadas' : 'desativadas'}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar notificações: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alertas</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} nova(s) notificação(ões)` : 'Todas as notificações lidas'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <CheckCircle size={20} color="#2563EB" strokeWidth={2} />
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configurações de Notificação</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Calendar size={20} color="#2563EB" strokeWidth={2} />
                <Text style={styles.settingTitle}>Vencimentos</Text>
              </View>
              <Switch
                value={notificationSettings.expiry}
                onValueChange={(value) => updateNotificationSetting('expiry', value)}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <AlertTriangle size={20} color="#EA580C" strokeWidth={2} />
                <Text style={styles.settingTitle}>Multas</Text>
              </View>
              <Switch
                value={notificationSettings.fines}
                onValueChange={(value) => updateNotificationSetting('fines', value)}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Clock size={20} color="#059669" strokeWidth={2} />
                <Text style={styles.settingTitle}>Lembretes</Text>
              </View>
              <Switch
                value={notificationSettings.reminders}
                onValueChange={(value) => updateNotificationSetting('reminders', value)}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Settings size={20} color="#64748B" strokeWidth={2} />
                <Text style={styles.settingTitle}>Sistema</Text>
              </View>
              <Switch
                value={notificationSettings.system}
                onValueChange={(value) => updateNotificationSetting('system', value)}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Notificações Recentes</Text>
          <View style={styles.notificationsContainer}>
            {notifications?.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={{
                  id: notification.id,
                  type: notification.type as 'expiry' | 'fine' | 'reminder' | 'system',
                  title: notification.title,
                  description: notification.description,
                  date: notification.created_at,
                  vehiclePlate: notification.vehicle_plate,
                  priority: notification.priority as 'high' | 'medium' | 'low',
                  read: notification.read,
                }}
                onPress={() => handleNotificationPress(notification)}
              />
            ))}
          </View>
        </View>

        {(!notifications || notifications.length === 0) && (
          <View style={styles.emptyContainer}>
            <Bell size={64} color="#64748B" strokeWidth={2} />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptyText}>
              Todas as suas notificações aparecerão aqui
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingsContainer: {
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginLeft: 12,
  },
  notificationsSection: {
    margin: 20,
  },
  notificationsContainer: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
});