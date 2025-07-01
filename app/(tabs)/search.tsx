import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Search, Car, User, Shield, Calendar, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, FileText, Camera, X } from 'lucide-react-native';
import PermissionGate from '@/components/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { vehicleService, driverService, fineService } from '@/lib/database';
import { formatAngolaPlate, validateAngolaPlate } from '@/lib/utils';

type SearchType = 'vehicle' | 'driver';

export default function SearchScreen() {
  const { hasPermission } = useAuth();
  const [searchType, setSearchType] = useState<SearchType>('vehicle');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pendingFines, setPendingFines] = useState<any[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Erro', 'Por favor, insira um termo de pesquisa');
      return;
    }

    console.log('🔍 Iniciando pesquisa...');
    console.log('📋 Tipo de pesquisa:', searchType);
    console.log('🔤 Termo de pesquisa:', searchTerm);

    setLoading(true);
    setPendingFines([]);
    
    try {
      if (searchType === 'vehicle') {
        // Validar formato da matrícula se parece ser uma matrícula
        const formattedPlate = searchTerm.toUpperCase();
        if (formattedPlate.includes('LD') && !validateAngolaPlate(formattedPlate)) {
          Alert.alert('Erro', 'Formato de matrícula inválido. Use o formato LD-XX-XX-XX ou LDA-XX-XX-XX');
          setLoading(false);
          return;
        }

        console.log('🔍 Pesquisando veículo:', formattedPlate);
        const vehicle = await vehicleService.getVehicleByPlate(formattedPlate);
        
        if (vehicle) {
          console.log('✅ Veículo encontrado:', vehicle);
          setSearchResult(vehicle);
          // Buscar multas pendentes por placa
          const fines = await fineService.getPendingFinesByPlateOrLicense(vehicle.plate);
          setPendingFines(fines);
        } else {
          console.log('❌ Veículo não encontrado');
          Alert.alert('Não Encontrado', 'Nenhum veículo encontrado com esta matrícula');
          setSearchResult(null);
        }
      } else {
        // Pesquisar condutor por número da carta
        console.log('🔍 Pesquisando condutor:', searchTerm);
        const driver = await driverService.getDriverByLicense(searchTerm);
        
        if (driver) {
          console.log('✅ Condutor encontrado:', driver);
          setSearchResult(driver);
          // Buscar multas pendentes por número da carta
          const fines = await fineService.getPendingFinesByPlateOrLicense('', driver.license_number);
          setPendingFines(fines);
        } else {
          console.log('❌ Condutor não encontrado');
          Alert.alert('Não Encontrado', 'Nenhum condutor encontrado com este número de carta');
          setSearchResult(null);
        }
      }
    } catch (error) {
      console.error('❌ Erro na pesquisa:', error);
      console.error('🔍 Detalhes do erro:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      Alert.alert('Erro', 'Ocorreu um erro ao realizar a pesquisa');
      setSearchResult(null);
    } finally {
      setLoading(false);
      console.log('🏁 Pesquisa finalizada');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
  };

  const handleCameraSearch = () => {
    Alert.alert(
      'Digitalizar',
      'Escolha uma opção:',
      [
        { 
          text: 'Câmera', 
          onPress: () => {
            Alert.alert('Câmera', 'Funcionalidade da câmera seria implementada aqui');
          }
        },
        { 
          text: 'Galeria', 
          onPress: () => {
            Alert.alert('Galeria', 'Funcionalidade da galeria seria implementada aqui');
          }
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleApplyFine = () => {
    if (!hasPermission('fines', 'create')) {
      Alert.alert('Sem Permissão', 'Não tem permissão para aplicar multas');
      return;
    }

    Alert.alert(
      'Aplicar Multa',
      'Escolha o tipo de infração:',
      [
        { text: 'Excesso de Velocidade', onPress: () => Alert.alert('Multa Aplicada', 'Multa por excesso de velocidade aplicada com sucesso!') },
        { text: 'Estacionamento Indevido', onPress: () => Alert.alert('Multa Aplicada', 'Multa por estacionamento indevido aplicada com sucesso!') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderVehicleResult = (result: any) => (
    <View style={styles.resultContainer}>
      <View style={styles.resultHeader}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateText}>{result.plate}</Text>
        </View>
        <View style={styles.statusBadge}>
          <CheckCircle size={16} color="#059669" strokeWidth={2} />
          <Text style={styles.statusText}>
            {result.status === 'active' ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>{result.brand} {result.model}</Text>
        <View style={styles.vehicleDetails}>
          <Text style={styles.detailText}>Ano: {result.year}</Text>
          <Text style={styles.detailText}>Cor: {result.color || 'Não especificada'}</Text>
          <Text style={styles.detailText}>Tipo: {result.type}</Text>
        </View>
      </View>

      {result.insurance_expiry && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seguro</Text>
        <TouchableOpacity 
          style={styles.infoCard}
            onPress={() => Alert.alert('Seguro', `Data de validade: ${new Date(result.insurance_expiry).toLocaleDateString('pt-BR')}`)}
        >
          <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validade:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.insurance_expiry) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.insurance_expiry).toLocaleDateString('pt-BR')}
              </Text>
          </View>
          <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.insurance_expiry) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.insurance_expiry) < new Date() ? 'Expirado' : 'Válido'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      )}

      {result.circulation_expiry && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taxa de Circulação</Text>
        <TouchableOpacity 
          style={styles.infoCard}
            onPress={() => Alert.alert('Taxa de Circulação', `Data de validade: ${new Date(result.circulation_expiry).toLocaleDateString('pt-BR')}`)}
        >
          <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validade:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.circulation_expiry) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.circulation_expiry).toLocaleDateString('pt-BR')}
              </Text>
          </View>
          <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.circulation_expiry) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.circulation_expiry) < new Date() ? 'Expirado' : 'Válido'}
              </Text>
          </View>
        </TouchableOpacity>
      </View>
      )}

      {result.inspection_expiry && (
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspeção Periódica</Text>
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => Alert.alert('Inspeção', `Data de validade: ${new Date(result.inspection_expiry).toLocaleDateString('pt-BR')}`)}
          >
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validade:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.inspection_expiry) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.inspection_expiry).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.inspection_expiry) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.inspection_expiry) < new Date() ? 'Expirado' : 'Válido'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Proprietário</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID do Proprietário:</Text>
            <Text style={styles.infoValue}>{result.owner_id}</Text>
            </View>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registado em:</Text>
            <Text style={styles.infoValue}>
              {new Date(result.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </View>

      {/* Multas pendentes */}
      {pendingFines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Multas Pendentes</Text>
          {pendingFines.map((fine) => (
            <View key={fine.id} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{fine.type}</Text>
              <Text style={styles.infoLabel}>Valor:</Text>
              <Text style={styles.infoValue}>{fine.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 })}</Text>
              <Text style={styles.infoLabel}>Data:</Text>
              <Text style={styles.infoValue}>{new Date(fine.date).toLocaleDateString('pt-BR')}</Text>
            </View>
        ))}
      </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleApplyFine}
        >
          <FileText size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.actionButtonText}>Aplicar Multa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDriverResult = (result: any) => (
    <View style={styles.resultContainer}>
      <View style={styles.resultHeader}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateText}>{result.license_number}</Text>
        </View>
        <View style={styles.statusBadge}>
          <CheckCircle size={16} color="#059669" strokeWidth={2} />
          <Text style={styles.statusText}>
            {result.status === 'valid' ? 'Válida' : 
             result.status === 'expired' ? 'Expirada' : 
             result.status === 'suspended' ? 'Suspensa' : 'A Expirar'}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleTitle}>{result.name}</Text>
        <View style={styles.vehicleDetails}>
          <Text style={styles.detailText}>
            Categorias: {(Array.isArray(result.categories) ? result.categories : []).join(', ')}
          </Text>
          <Text style={styles.detailText}>Pontos: {result.points}/{result.max_points}</Text>
          {result.phone && <Text style={styles.detailText}>Telefone: {result.phone}</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carta de Condução</Text>
        <TouchableOpacity 
          style={styles.infoCard}
          onPress={() => Alert.alert('Carta de Condução', `Detalhes da carta de condução`)}
        >
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data de Emissão:</Text>
            <Text style={styles.infoValue}>
              {new Date(result.issue_date).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Validade:</Text>
            <Text style={[
              styles.infoValue, 
              { color: new Date(result.expiry_date) < new Date() ? '#DC2626' : '#059669' }
            ]}>
              {new Date(result.expiry_date).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[
              styles.infoValue,
              { color: new Date(result.expiry_date) < new Date() ? '#DC2626' : '#059669' }
            ]}>
              {new Date(result.expiry_date) < new Date() ? 'Expirada' : 'Válida'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {result.birth_date && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de Nascimento:</Text>
              <Text style={styles.infoValue}>
                {new Date(result.birth_date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            {result.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Endereço:</Text>
                <Text style={styles.infoValue}>{result.address}</Text>
              </View>
            )}
            {result.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{result.email}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {result.medical_exam && (
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exame Médico</Text>
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => Alert.alert('Exame Médico', `Data de validade: ${new Date(result.medical_exam).toLocaleDateString('pt-BR')}`)}
          >
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validade:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.medical_exam) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.medical_exam).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[
                styles.infoValue, 
                { color: new Date(result.medical_exam) < new Date() ? '#DC2626' : '#059669' }
              ]}>
                {new Date(result.medical_exam) < new Date() ? 'Expirado' : 'Válido'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Sistema</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID do Proprietário:</Text>
            <Text style={styles.infoValue}>{result.owner_id || 'Não especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registado em:</Text>
            <Text style={styles.infoValue}>
              {new Date(result.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </View>

      {/* Multas pendentes */}
      {pendingFines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Multas Pendentes</Text>
          {pendingFines.map((fine) => (
            <View key={fine.id} style={styles.infoCard}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{fine.type}</Text>
              <Text style={styles.infoLabel}>Valor:</Text>
              <Text style={styles.infoValue}>{fine.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 })}</Text>
              <Text style={styles.infoLabel}>Data:</Text>
              <Text style={styles.infoValue}>{new Date(fine.date).toLocaleDateString('pt-BR')}</Text>
            </View>
        ))}
      </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fotos da Carta de Condução</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Frente</Text>
            {result.photo_front ? (
              <TouchableOpacity onPress={() => setSelectedImageUrl(result.photo_front)}>
                <Image source={{ uri: result.photo_front }} style={{ width: 140, height: 100, borderRadius: 8, backgroundColor: '#F1F5F9' }} />
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#64748B' }}>Sem foto</Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Verso</Text>
            {result.photo_back ? (
              <TouchableOpacity onPress={() => setSelectedImageUrl(result.photo_back)}>
                <Image source={{ uri: result.photo_back }} style={{ width: 140, height: 100, borderRadius: 8, backgroundColor: '#F1F5F9' }} />
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#64748B' }}>Sem foto</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleApplyFine}
        >
          <FileText size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.actionButtonText}>Aplicar Multa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <PermissionGate resource="search" action="read">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Consultar</Text>
          <Text style={styles.subtitle}>Pesquise por matrícula ou carta de condução</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchTypeContainer}>
            <TouchableOpacity
              style={[
                styles.searchTypeButton,
                searchType === 'vehicle' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('vehicle')}
            >
              <Car
                size={20}
                color={searchType === 'vehicle' ? '#FFFFFF' : '#64748B'}
                strokeWidth={2}
              />
              <Text style={[
                styles.searchTypeText,
                searchType === 'vehicle' && styles.searchTypeTextActive
              ]}>
                Veículo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.searchTypeButton,
                searchType === 'driver' && styles.searchTypeButtonActive
              ]}
              onPress={() => setSearchType('driver')}
            >
              <User
                size={20}
                color={searchType === 'driver' ? '#FFFFFF' : '#64748B'}
                strokeWidth={2}
              />
              <Text style={[
                styles.searchTypeText,
                searchType === 'driver' && styles.searchTypeTextActive
              ]}>
                Condutor
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#64748B" strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  searchType === 'vehicle' 
                    ? 'Ex: LD-35-87-IA ou LDA-35-87-IA'
                    : 'Ex: 123456789'
                }
                value={searchTerm}
                onChangeText={(text) => {
                  if (searchType === 'vehicle' && text.toUpperCase().includes('LD')) {
                    // Formatar matrícula automaticamente
                    const formatted = formatAngolaPlate(text);
                    setSearchTerm(formatted);
                  } else {
                    setSearchTerm(text);
                  }
                }}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButtonContainer}>
                  <X size={16} color="#64748B" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              <Text style={styles.searchButtonText}>
                {loading ? 'Pesquisando...' : 'Pesquisar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraButton} onPress={handleCameraSearch}>
              <Camera size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.cameraButtonText}>Digitalizar</Text>
            </TouchableOpacity>
          </View>

          {searchResult && (
            searchType === 'vehicle' 
              ? renderVehicleResult(searchResult)
              : renderDriverResult(searchResult)
          )}

          {!searchResult && searchTerm && !loading && (
            <View style={styles.noResultsContainer}>
              <AlertTriangle size={48} color="#64748B" strokeWidth={2} />
              <Text style={styles.noResultsTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.noResultsText}>
                Verifique se os dados inseridos estão corretos
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <Modal visible={!!selectedImageUrl} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 2 }} onPress={() => setSelectedImageUrl(null)}>
            <Text style={{ color: '#fff', fontSize: 28 }}>✕</Text>
          </TouchableOpacity>
          {selectedImageUrl && (
            <Image source={{ uri: selectedImageUrl }} style={{ width: '90%', height: '70%', borderRadius: 12, resizeMode: 'contain' }} />
          )}
        </View>
      </Modal>
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchTypeButtonActive: {
    backgroundColor: '#2563EB',
  },
  searchTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginLeft: 8,
  },
  searchTypeTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    paddingVertical: 12,
    paddingLeft: 12,
  },
  clearButtonContainer: {
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  cameraButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginLeft: 8,
  },
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  plateContainer: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#059669',
    marginLeft: 4,
  },
  vehicleInfo: {
    marginBottom: 20,
  },
  vehicleTitle: {
    fontSize: 20,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  fineCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  penaltyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  ownerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
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
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  actionButtons: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  fineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
  },
  fineButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});