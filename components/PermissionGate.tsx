import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react-native';

interface PermissionGateProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export default function PermissionGate({ 
  resource, 
  action, 
  children, 
  fallback,
  showFallback = true 
}: PermissionGateProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(resource, action)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (!showFallback) {
      return null;
    }

    return (
      <View style={styles.noPermissionContainer}>
        <Shield size={48} color="#64748B" strokeWidth={2} />
        <Text style={styles.noPermissionTitle}>Acesso Restrito</Text>
        <Text style={styles.noPermissionText}>
          Não tem permissão para aceder a esta funcionalidade
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  noPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8FAFC',
  },
  noPermissionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noPermissionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});