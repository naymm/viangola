import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Calendar, Shield, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Eye, Download } from 'lucide-react-native';

interface DocumentCardProps {
  document: {
    id: string;
    type: string;
    vehiclePlate: string;
    fileName: string;
    uploadDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
    size: string;
  };
  onView: () => void;
  onDownload: () => void;
}

export default function DocumentCard({ document, onView, onDownload }: DocumentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return '#059669';
      case 'expiring': return '#EA580C';
      case 'expired': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Válido';
      case 'expiring': return 'A expirar';
      case 'expired': return 'Expirado';
      default: return 'Desconhecido';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'Seguro': return Shield;
      case 'Inspeção': return CheckCircle;
      case 'Taxa de Circulação': return Calendar;
      default: return FileText;
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

  const IconComponent = getDocumentIcon(document.type);
  const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <IconComponent size={24} color="#2563EB" strokeWidth={2} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentType}>{document.type}</Text>
          <Text style={styles.vehiclePlate}>{document.vehiclePlate}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(document.status)}15` }
        ]}>
          {document.status === 'valid' ? (
            <CheckCircle size={16} color={getStatusColor(document.status)} strokeWidth={2} />
          ) : (
            <AlertTriangle size={16} color={getStatusColor(document.status)} strokeWidth={2} />
          )}
          <Text style={[styles.statusText, { color: getStatusColor(document.status) }]}>
            {getStatusText(document.status)}
          </Text>
        </View>
      </View>

      <View style={styles.documentDetails}>
        <Text style={styles.fileName}>{document.fileName}</Text>
        <View style={styles.documentMeta}>
          <Text style={styles.metaText}>Enviado: {formatDate(document.uploadDate)}</Text>
          <Text style={styles.metaText}>Tamanho: {document.size}</Text>
        </View>
        
        {document.expiryDate !== '2030-12-31' && (
          <View style={styles.expiryInfo}>
            <Calendar size={16} color="#64748B" strokeWidth={2} />
            <Text style={[
              styles.expiryText,
              { color: daysUntilExpiry < 30 ? '#EA580C' : '#64748B' }
            ]}>
              Expira em {formatDate(document.expiryDate)}
              {daysUntilExpiry < 30 && (
                <Text> ({daysUntilExpiry} dias)</Text>
              )}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.documentActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onView}>
          <Eye size={16} color="#2563EB" strokeWidth={2} />
          <Text style={styles.actionButtonText}>Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
          <Download size={16} color="#2563EB" strokeWidth={2} />
          <Text style={styles.actionButtonText}>Baixar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  documentDetails: {
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  documentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginLeft: 6,
  },
});