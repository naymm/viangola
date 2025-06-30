import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User, Calendar, CreditCard, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Shield, MapPin } from 'lucide-react-native';

interface DriverCardProps {
  driver: {
    id: string;
    name: string;
    licenseNumber: string;
    category: string[];
    expiryDate: string;
    birthDate: string;
    address: string;
    photo?: string;
    status: 'valid' | 'expiring' | 'expired' | 'suspended';
    points: number;
    maxPoints: number;
    company?: string;
  };
  onPress: () => void;
}

export default function DriverCard({ driver, onPress }: DriverCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return '#059669';
      case 'expiring': return '#EA580C';
      case 'expired': return '#DC2626';
      case 'suspended': return '#7C2D12';
      default: return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Válida';
      case 'expiring': return 'A Expirar';
      case 'expired': return 'Expirada';
      case 'suspended': return 'Suspensa';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT');
  };

  const getDaysUntilExpiry = (dateString: string) => {
    const today = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <TouchableOpacity style={styles.driverCard} onPress={onPress}>
      <View style={styles.driverHeader}>
        <View style={styles.driverPhotoContainer}>
          {driver.photo ? (
            <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
          ) : (
            <View style={styles.driverPhotoPlaceholder}>
              <User size={24} color="#64748B" strokeWidth={2} />
            </View>
          )}
        </View>
        
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.licenseNumber}>Carta: {driver.licenseNumber}</Text>
          <View style={styles.categoryContainer}>
            {driver.category.map((cat, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(driver.status)}15` }
        ]}>
          {driver.status === 'valid' ? (
            <CheckCircle size={16} color={getStatusColor(driver.status)} strokeWidth={2} />
          ) : (
            <AlertTriangle size={16} color={getStatusColor(driver.status)} strokeWidth={2} />
          )}
          <Text style={[styles.statusText, { color: getStatusColor(driver.status) }]}>
            {getStatusText(driver.status)}
          </Text>
        </View>
      </View>

      <View style={styles.driverDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.detailLabel}>Idade:</Text>
          <Text style={styles.detailValue}>{getAge(driver.birthDate)} anos</Text>
        </View>

        <View style={styles.detailRow}>
          <CreditCard size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.detailLabel}>Validade:</Text>
          <Text style={[
            styles.detailValue,
            { color: getDaysUntilExpiry(driver.expiryDate) < 90 ? '#EA580C' : '#059669' }
          ]}>
            {formatDate(driver.expiryDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Shield size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.detailLabel}>Pontos:</Text>
          <Text style={[
            styles.detailValue,
            { color: driver.points > 6 ? '#EA580C' : '#059669' }
          ]}>
            {driver.points}/{driver.maxPoints}
          </Text>
        </View>

        {driver.company && (
          <View style={styles.detailRow}>
            <MapPin size={16} color="#64748B" strokeWidth={2} />
            <Text style={styles.detailLabel}>Empresa:</Text>
            <Text style={styles.detailValue}>{driver.company}</Text>
          </View>
        )}
      </View>

      {driver.status === 'expiring' && (
        <View style={styles.warningContainer}>
          <AlertTriangle size={16} color="#EA580C" strokeWidth={2} />
          <Text style={styles.warningText}>
            Carta expira em {getDaysUntilExpiry(driver.expiryDate)} dias
          </Text>
        </View>
      )}

      {driver.status === 'suspended' && (
        <View style={styles.suspendedContainer}>
          <AlertTriangle size={16} color="#7C2D12" strokeWidth={2} />
          <Text style={styles.suspendedText}>
            Carta suspensa - {driver.points} pontos atingidos
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverPhotoContainer: {
    marginRight: 12,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  driverPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  licenseNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  driverDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D97706',
    marginLeft: 8,
  },
  suspendedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  suspendedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7C2D12',
    marginLeft: 8,
  },
});