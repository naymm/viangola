import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ChartBar as BarChart3, TrendingUp, Users, Car, FileText, Calendar, Download, Filter, Eye } from 'lucide-react-native';
import PermissionGate from '@/components/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';

interface ReportData {
  id: string;
  title: string;
  description: string;
  type: 'vehicles' | 'drivers' | 'fines' | 'documents';
  period: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export default function ReportsScreen() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const reports: ReportData[] = [
    {
      id: '1',
      title: 'Veículos Registados',
      description: 'Total de veículos no sistema',
      type: 'vehicles',
      period: 'Este mês',
      value: '1,247',
      change: '+12%',
      trend: 'up',
    },
    {
      id: '2',
      title: 'Condutores Ativos',
      description: 'Condutores com cartas válidas',
      type: 'drivers',
      period: 'Este mês',
      value: '892',
      change: '+8%',
      trend: 'up',
    },
    {
      id: '3',
      title: 'Multas Aplicadas',
      description: 'Total de multas este período',
      type: 'fines',
      period: 'Este mês',
      value: '156',
      change: '-5%',
      trend: 'down',
    },
    {
      id: '4',
      title: 'Documentos Processados',
      description: 'Documentos enviados e validados',
      type: 'documents',
      period: 'Este mês',
      value: '2,341',
      change: '+15%',
      trend: 'up',
    },
  ];

  const detailedReports = [
    {
      id: '1',
      title: 'Relatório Mensal de Veículos',
      description: 'Análise completa dos veículos registados por categoria',
      date: '2024-02-01',
      size: '2.4 MB',
    },
    {
      id: '2',
      title: 'Estatísticas de Multas',
      description: 'Distribuição de multas por tipo e localização',
      date: '2024-02-01',
      size: '1.8 MB',
    },
    {
      id: '3',
      title: 'Relatório de Condutores',
      description: 'Estado das cartas de condução e penalizações',
      date: '2024-02-01',
      size: '3.2 MB',
    },
    {
      id: '4',
      title: 'Análise de Documentos',
      description: 'Documentos por estado e tempo de processamento',
      date: '2024-02-01',
      size: '1.5 MB',
    },
  ];

  const periods = [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Ano' },
  ];

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'vehicles': return Car;
      case 'drivers': return Users;
      case 'fines': return FileText;
      case 'documents': return FileText;
      default: return BarChart3;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case 'vehicles': return '#2563EB';
      case 'drivers': return '#059669';
      case 'fines': return '#EA580C';
      case 'documents': return '#7C3AED';
      default: return '#64748B';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#059669';
      case 'down': return '#DC2626';
      case 'stable': return '#64748B';
      default: return '#64748B';
    }
  };

  const handleDownloadReport = (reportId: string) => {
    Alert.alert('Download', 'O relatório será baixado em breve...');
  };

  const handleViewReport = (reportId: string) => {
    Alert.alert('Visualizar', 'Abrindo relatório...');
  };

  const handleGenerateReport = () => {
    Alert.alert(
      'Gerar Relatório',
      'Escolha o tipo de relatório:',
      [
        { text: 'Veículos', onPress: () => Alert.alert('Sucesso', 'Relatório de veículos gerado!') },
        { text: 'Condutores', onPress: () => Alert.alert('Sucesso', 'Relatório de condutores gerado!') },
        { text: 'Multas', onPress: () => Alert.alert('Sucesso', 'Relatório de multas gerado!') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <PermissionGate resource="reports" action="read">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Relatórios</Text>
            <Text style={styles.subtitle}>Análise e estatísticas do sistema</Text>
          </View>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
          >
            <BarChart3 size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period Filter */}
          <View style={styles.periodContainer}>
            <Text style={styles.sectionTitle}>Período</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodButtons}
            >
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.value}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.value && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period.value)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.value && styles.periodButtonTextActive
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Statistics Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>
            <View style={styles.statsGrid}>
              {reports.map((report) => {
                const IconComponent = getReportIcon(report.type);
                const color = getReportColor(report.type);
                const trendColor = getTrendColor(report.trend);
                
                return (
                  <View key={report.id} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
                        <IconComponent size={24} color={color} strokeWidth={2} />
                      </View>
                      <View style={[styles.trendBadge, { backgroundColor: `${trendColor}15` }]}>
                        <TrendingUp size={12} color={trendColor} strokeWidth={2} />
                        <Text style={[styles.trendText, { color: trendColor }]}>
                          {report.change}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statValue}>{report.value}</Text>
                    <Text style={styles.statTitle}>{report.title}</Text>
                    <Text style={styles.statDescription}>{report.description}</Text>
                    <Text style={styles.statPeriod}>{report.period}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Detailed Reports */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relatórios Detalhados</Text>
            {detailedReports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportIcon}>
                    <FileText size={24} color="#2563EB" strokeWidth={2} />
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportDescription}>{report.description}</Text>
                    <View style={styles.reportMeta}>
                      <Text style={styles.reportDate}>
                        {new Date(report.date).toLocaleDateString('pt-PT')}
                      </Text>
                      <Text style={styles.reportSize}>{report.size}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={styles.reportActionButton}
                    onPress={() => handleViewReport(report.id)}
                  >
                    <Eye size={16} color="#2563EB" strokeWidth={2} />
                    <Text style={styles.reportActionText}>Ver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reportActionButton}
                    onPress={() => handleDownloadReport(report.id)}
                  >
                    <Download size={16} color="#2563EB" strokeWidth={2} />
                    <Text style={styles.reportActionText}>Baixar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Company-specific reports for company users */}
          {user?.role === 'company' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Relatórios da Frota</Text>
              <View style={styles.fleetReportCard}>
                <Text style={styles.fleetReportTitle}>Relatório da Frota - {user.company}</Text>
                <Text style={styles.fleetReportDescription}>
                  Análise completa dos veículos e condutores da sua empresa
                </Text>
                <TouchableOpacity
                  style={styles.fleetReportButton}
                  onPress={() => Alert.alert('Relatório da Frota', 'Gerando relatório personalizado...')}
                >
                  <BarChart3 size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.fleetReportButtonText}>Gerar Relatório</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  generateButton: {
    backgroundColor: '#2563EB',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  periodContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  statPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  reportSize: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
  },
  reportActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  reportActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  reportActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginLeft: 6,
  },
  fleetReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fleetReportTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  fleetReportDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 20,
  },
  fleetReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 16,
  },
  fleetReportButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});