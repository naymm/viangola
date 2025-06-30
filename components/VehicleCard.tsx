import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Car, Calendar, Shield, FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';

interface VehicleCardProps {
  vehicle: {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    type: string;
    insuranceExpiry: string;
    circulationExpiry: string;
    inspectionExpiry: string;
    status: 'active' | 'expiring' | 'expired';
  };
  onPress: () => void;
}

export default function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#059669';
      case 'expiring': return '#EA580C';
      case 'expired': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Em dia';
      case 'expiring': return 'A expirar';
      case 'expired': return 'Expirado';
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

  return (
    <TouchableOpacity style={styles.vehicleCard} onPress={onPress}>
      <View style={styles.vehicleHeader}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateText}>{vehicle.plate}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(vehicle.status)}15` }
        ]}>
          {vehicle.status === 'active' ? (
            <CheckCircle size={16} color={getStatusColor(vehicle.status)} strokeWidth={2} />
          ) : (
            <AlertTriangle size={16} color={getStatusColor(vehicle.status)} strokeWidth={2} />
          )}
          <Text style={[styles.statusText, { color: getStatusColor(vehicle.status) }]}>
            {getStatusText(vehicle.status)}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>
          {vehicle.brand} {vehicle.model}
        </Text>
        <View style={styles.vehicleDetails}>
          <Text style={styles.detailText}>Ano: {vehicle.year}</Text>
          <Text style={styles.detailText}>Cor: {vehicle.color}</Text>
          <Text style={styles.detailText}>Tipo: {vehicle.type}</Text>
        </View>
      </View>

      <View style={styles.documentsContainer}>
        <View style={styles.documentRow}>
          <Shield size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.documentLabel}>Seguro:</Text>
          <Text style={[
            styles.documentDate,
            { color: getDaysUntilExpiry(vehicle.insuranceExpiry) < 30 ? '#EA580C' : '#059669' }
          ]}>
            {formatDate(vehicle.insuranceExpiry)}
          </Text>
        </View>

        <View style={styles.documentRow}>
          <Calendar size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.documentLabel}>Taxa:</Text>
          <Text style={styles.documentDate}>
            {formatDate(vehicle.circulationExpiry)}
          </Text>
        </View>

        <View style={styles.documentRow}>
          <FileText size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.documentLabel}>Inspeção:</Text>
          <Text style={[
            styles.documentDate,
            { color: getDaysUntilExpiry(vehicle.inspectionExpiry) < 60 ? '#EA580C' : '#059669' }
          ]}>
            {formatDate(vehicle.inspectionExpiry)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  vehicleCard: {
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
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  plateContainer: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
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
  vehicleInfo: {
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginRight: 16,
    marginBottom: 4,
  },
  documentsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  documentDate: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
  },
});