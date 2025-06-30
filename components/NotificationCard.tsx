import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, Car, Calendar, Shield, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Settings, Clock, FileText } from 'lucide-react-native';

interface NotificationCardProps {
  notification: {
    id: string;
    type: 'expiry' | 'fine' | 'reminder' | 'system';
    title: string;
    description: string;
    date: string;
    vehiclePlate?: string;
    priority: 'high' | 'medium' | 'low';
    read: boolean;
  };
  onPress: () => void;
}

export default function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expiry': return Calendar;
      case 'fine': return AlertTriangle;
      case 'reminder': return Clock;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#EA580C';
      case 'low': return '#2563EB';
      default: return '#64748B';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `Há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'Agora mesmo';
    }
  };

  const IconComponent = getNotificationIcon(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.notificationCardUnread
      ]}
      onPress={onPress}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: `${getPriorityColor(notification.priority)}15` }
        ]}>
          <IconComponent
            size={20}
            color={getPriorityColor(notification.priority)}
            strokeWidth={2}
          />
        </View>

        <View style={styles.notificationDetails}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.notificationTitleUnread
            ]}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.notificationDescription}>
            {notification.description}
          </Text>
          
          <View style={styles.notificationMeta}>
            <Text style={styles.notificationTime}>
              {formatDate(notification.date)}
            </Text>
            {notification.vehiclePlate && (
              <>
                <View style={styles.metaSeparator} />
                <Text style={styles.vehiclePlate}>
                  {notification.vehiclePlate}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    flex: 1,
  },
  notificationTitleUnread: {
    fontFamily: 'Inter-SemiBold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginLeft: 8,
  },
  notificationDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  vehiclePlate: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});