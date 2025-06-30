import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Search, 
  Car, 
  Edit3, 
  Trash2, 
  Calendar,
  Shield,
  X,
  Save,
  Filter
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { vehicleService } from '@/lib/database';
import { Database } from '@/types/database';
import { formatAngolaPlate, validateAngolaPlate } from '@/lib/utils';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function VehiclesScreen() {
  const { user, hasPermission } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Estados para seletores de data
  const [showInsurancePicker, setShowInsurancePicker] = useState(false);
  const [showCirculationPicker, setShowCirculationPicker] = useState(false);
  const [showInspectionPicker, setShowInspectionPicker] = useState(false);

  // Estados para formulário
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    type: 'Ligeiro',
    insurance_expiry: '',
    circulation_expiry: '',
    inspection_expiry: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      console.log('🚗 Iniciando carregamento de veículos...');
      console.log('👤 Usuário atual:', user?.id, user?.role);
      console.log('🔐 Permissões:', hasPermission('vehicles', 'read'));
      
      setLoading(true);
      let vehiclesData: Vehicle[];
      
      if (hasPermission('vehicles', 'read') && (user?.role === 'operator' || user?.role === 'agent')) {
        console.log('🔍 Buscando todos os veículos (operador/agente)...');
        // Operadores e agentes podem ver todos os veículos
        vehiclesData = await vehicleService.getAllVehicles();
        console.log('✅ getAllVehicles retornou:', vehiclesData?.length || 0, 'veículos');
      } else {
        console.log('🔍 Buscando veículos do usuário:', user?.id);
        // Outros usuários veem apenas seus veículos
        vehiclesData = await vehicleService.getUserVehicles(user?.id || '');
        console.log('✅ getUserVehicles retornou:', vehiclesData?.length || 0, 'veículos');
      }
      
      console.log('📊 Dados dos veículos:', vehiclesData);
      setVehicles(vehiclesData);
      console.log('✅ Veículos carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar veículos:', error);
      console.error('🔍 Detalhes do erro:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      Alert.alert('Erro', 'Não foi possível carregar os veículos');
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento de veículos finalizado');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  const handleAddVehicle = () => {
    setFormData({
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      type: 'Ligeiro',
      insurance_expiry: '',
      circulation_expiry: '',
      inspection_expiry: '',
    });
    setEditingVehicle(null);
    setShowAddModal(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setFormData({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year.toString(),
      color: vehicle.color || '',
      type: vehicle.type,
      insurance_expiry: vehicle.insurance_expiry || '',
      circulation_expiry: vehicle.circulation_expiry || '',
      inspection_expiry: vehicle.inspection_expiry || '',
    });
    setEditingVehicle(vehicle);
    setShowAddModal(true);
  };

  // Função para formatar matrícula em tempo real
  const handlePlateChange = (text: string) => {
    const formatted = formatAngolaPlate(text);
    setFormData(prev => ({ ...prev, plate: formatted }));
  };

  // Função para formatar matrícula na pesquisa
  const handleSearchChange = (text: string) => {
    // Se parece ser uma matrícula (contém LD), formatar
    if (text.toUpperCase().includes('LD')) {
      const formatted = formatAngolaPlate(text);
      setSearchQuery(formatted);
    } else {
      setSearchQuery(text);
    }
  };

  // Funções para seleção de data
  const handleDateSelect = (date: Date, field: 'insurance_expiry' | 'circulation_expiry' | 'inspection_expiry') => {
    const formattedDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    setFormData(prev => ({ ...prev, [field]: formattedDate }));
  };

  const showDatePicker = (field: 'insurance_expiry' | 'circulation_expiry' | 'inspection_expiry') => {
    const currentDate = new Date();
    const minDate = new Date();
    minDate.setDate(currentDate.getDate() - 365); // Permitir datas até 1 ano atrás
    
    const maxDate = new Date();
    maxDate.setFullYear(currentDate.getFullYear() + 10); // Permitir datas até 10 anos no futuro

    if (Platform.OS === 'ios') {
      // Para iOS, mostrar modal com seletor
      Alert.prompt(
        'Selecionar Data',
        'Digite a data no formato YYYY-MM-DD:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: (dateString) => {
              if (dateString && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                handleDateSelect(new Date(dateString), field);
              }
            }
          }
        ],
        'plain-text',
        formData[field] || new Date().toISOString().split('T')[0]
      );
    } else {
      // Para Android, usar seletor nativo
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
      
      Alert.prompt(
        'Selecionar Data',
        'Digite a data no formato DD/MM/AAAA:',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: (dateString) => {
              if (dateString) {
                const [day, month, year] = dateString.split('/');
                if (day && month && year) {
                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  handleDateSelect(date, field);
                }
              }
            }
          }
        ],
        'plain-text',
        formData[field] ? new Date(formData[field]).toLocaleDateString('pt-BR') : ''
      );
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o veículo ${vehicle.plate}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleService.deleteVehicle(vehicle.id);
              await loadVehicles();
              Alert.alert('Sucesso', 'Veículo excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir veículo:', error);
              Alert.alert('Erro', 'Não foi possível excluir o veículo');
            }
          },
        },
      ]
    );
  };

  const handleSaveVehicle = async () => {
    if (!user || !formData.plate || !formData.brand || !formData.model || !formData.year) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar formato da matrícula angolana
    if (!validateAngolaPlate(formData.plate)) {
      Alert.alert('Erro', 'Formato de matrícula inválido. Use o formato LD-XX-XX-XX ou LDA-XX-XX-XX (ex: LD-35-87-IA ou LDA-35-87-IA)');
      return;
    }

    try {
      const vehicleData = {
        plate: formData.plate.toUpperCase(),
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color || undefined,
        type: formData.type,
        owner_id: user.id,
        status: 'active' as const,
        insurance_expiry: formData.insurance_expiry || undefined,
        circulation_expiry: formData.circulation_expiry || undefined,
        inspection_expiry: formData.inspection_expiry || undefined,
      };

      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle.id, vehicleData);
        Alert.alert('Sucesso', 'Veículo atualizado com sucesso!');
      } else {
        await vehicleService.createVehicle(vehicleData);
        Alert.alert('Sucesso', 'Veículo adicionado com sucesso!');
      }

      setShowAddModal(false);
      await loadVehicles();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o veículo');
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (vehicle: Vehicle) => {
    const today = new Date();
    const insuranceExpiry = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : null;
    const inspectionExpiry = vehicle.inspection_expiry ? new Date(vehicle.inspection_expiry) : null;

    if (insuranceExpiry && insuranceExpiry < today) return '#DC2626';
    if (inspectionExpiry && inspectionExpiry < today) return '#DC2626';
    if (insuranceExpiry && insuranceExpiry < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) return '#F59E0B';
    return '#059669';
  };

  const getStatusText = (vehicle: Vehicle) => {
    const today = new Date();
    const insuranceExpiry = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : null;
    const inspectionExpiry = vehicle.inspection_expiry ? new Date(vehicle.inspection_expiry) : null;

    if (insuranceExpiry && insuranceExpiry < today) return 'Seguro Expirado';
    if (inspectionExpiry && inspectionExpiry < today) return 'Inspeção Expirada';
    if (insuranceExpiry && insuranceExpiry < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) return 'A Expirar';
    return 'Em Dia';
  };

  return (
      <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#2563eb', '#3b82f6']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Veículos</Text>
          {hasPermission('vehicles', 'create') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddVehicle}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar veículos..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Vehicles List */}
          <ScrollView
            style={styles.vehiclesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando veículos...</Text>
              </View>
            ) : filteredVehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Car size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>
                  {searchQuery ? 'Nenhum veículo encontrado' : 'Nenhum veículo registado'}
                </Text>
              </View>
            ) : (
              filteredVehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleHeader}>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
                      <Text style={styles.vehicleModel}>
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
              </Text>
                      <Text style={styles.vehicleType}>{vehicle.type}</Text>
                    </View>
                    
                    <View style={styles.vehicleActions}>
                      {hasPermission('vehicles', 'update') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditVehicle(vehicle)}
                        >
                          <Edit3 size={16} color="#2563EB" />
                        </TouchableOpacity>
                      )}
                      
                      {hasPermission('vehicles', 'delete') && (
                <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteVehicle(vehicle)}
                >
                          <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.vehicleDetails}>
                    {vehicle.color && (
                      <Text style={styles.vehicleDetail}>
                        Cor: {vehicle.color}
                      </Text>
                    )}
                    
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicle) }]} />
                      <Text style={styles.statusText}>{getStatusText(vehicle)}</Text>
                    </View>
                  </View>

                  {/* Expiry Dates */}
                  <View style={styles.expiryContainer}>
                    {vehicle.insurance_expiry && (
                      <View style={styles.expiryItem}>
                        <Shield size={14} color="#64748B" />
                        <Text style={styles.expiryLabel}>Seguro:</Text>
                        <Text style={styles.expiryDate}>
                          {new Date(vehicle.insurance_expiry).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    )}
                    
                    {vehicle.inspection_expiry && (
                      <View style={styles.expiryItem}>
                        <Calendar size={14} color="#64748B" />
                        <Text style={styles.expiryLabel}>Inspeção:</Text>
                        <Text style={styles.expiryDate}>
                          {new Date(vehicle.inspection_expiry).toLocaleDateString('pt-BR')}
                        </Text>
            </View>
                    )}
                  </View>
                </View>
              ))
          )}
        </ScrollView>
        </View>
      </LinearGradient>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVehicle ? 'Editar Veículo' : 'Adicionar Veículo'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Matrícula *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.plate}
                  onChangeText={handlePlateChange}
                  placeholder="LD-35-87-IA ou LDA-35-87-IA"
                  autoCapitalize="characters"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Marca *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.brand}
                  onChangeText={(text) => setFormData({ ...formData, brand: text })}
                  placeholder="Mercedes-Benz"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Modelo *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.model}
                  onChangeText={(text) => setFormData({ ...formData, model: text })}
                  placeholder="C-Class"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Ano *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.year}
                  onChangeText={(text) => setFormData({ ...formData, year: text })}
                  placeholder="2020"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cor</Text>
                <TextInput
                  style={styles.input}
                  value={formData.color}
                  onChangeText={(text) => setFormData({ ...formData, color: text })}
                  placeholder="Preto"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tipo</Text>
                <TextInput
                  style={styles.input}
                  value={formData.type}
                  onChangeText={(text) => setFormData({ ...formData, type: text })}
                  placeholder="Ligeiro"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Data de Seguro</Text>
              <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePicker('insurance_expiry')}
              >
                  <Text style={[
                    styles.dateButtonText,
                    !formData.insurance_expiry && styles.dateButtonTextPlaceholder
                  ]}>
                    {formData.insurance_expiry || 'Selecionar data'}
                </Text>
                  <Calendar size={20} color="#64748B" />
              </TouchableOpacity>
                </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Data de Circulação</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePicker('circulation_expiry')}
                >
                  <Text style={[
                    styles.dateButtonText,
                    !formData.circulation_expiry && styles.dateButtonTextPlaceholder
                  ]}>
                    {formData.circulation_expiry || 'Selecionar data'}
                  </Text>
                  <Calendar size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Data de Inspeção</Text>
                  <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => showDatePicker('inspection_expiry')}
                >
                  <Text style={[
                    styles.dateButtonText,
                    !formData.inspection_expiry && styles.dateButtonTextPlaceholder
                  ]}>
                    {formData.inspection_expiry || 'Selecionar data'}
                  </Text>
                  <Calendar size={20} color="#64748B" />
                </TouchableOpacity>
                    </View>
            </ScrollView>

            <View style={styles.modalFooter}>
                  <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                  >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveVehicle}
                  >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingVehicle ? 'Atualizar' : 'Adicionar'}
                </Text>
                  </TouchableOpacity>
                </View>
          </View>
        </View>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  vehiclesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  expiryContainer: {
    gap: 8,
  },
  expiryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    minWidth: 50,
  },
  expiryDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  dateButtonTextPlaceholder: {
    color: '#9CA3AF',
  },
});