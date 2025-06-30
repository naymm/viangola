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
  User, 
  Edit3, 
  Trash2, 
  Calendar,
  CreditCard,
  X,
  Save,
  Shield
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { driverService } from '@/lib/database';
import { Database } from '@/types/database';

type Driver = Database['public']['Tables']['drivers']['Row'];

export default function DriversScreen() {
  const { user, hasPermission } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Estados para formulário
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    categories: ['B'],
    issue_date: '',
    expiry_date: '',
    birth_date: '',
    phone: '',
    address: '',
    email: '',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      let driversData: Driver[];
      
      if (hasPermission('drivers', 'read') && (user?.role === 'operator' || user?.role === 'agent')) {
        // Operadores e agentes podem ver todos os condutores
        driversData = await driverService.getAllDrivers();
      } else {
        // Outros usuários veem apenas seus condutores
        driversData = await driverService.getUserDrivers(user?.id || '');
      }
      
      setDrivers(driversData);
    } catch (error) {
      console.error('Erro ao carregar condutores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os condutores');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
  };

  const handleAddDriver = () => {
    setFormData({
      name: '',
      license_number: '',
      categories: ['B'],
      issue_date: '',
      expiry_date: '',
      birth_date: '',
      phone: '',
      address: '',
      email: '',
    });
    setEditingDriver(null);
    setShowAddModal(true);
  };

  const handleEditDriver = (driver: Driver) => {
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      categories: driver.categories,
      issue_date: driver.issue_date,
      expiry_date: driver.expiry_date,
      birth_date: driver.birth_date,
      phone: driver.phone || '',
      address: driver.address || '',
      email: driver.email || '',
    });
    setEditingDriver(driver);
    setShowAddModal(true);
  };

  const handleDeleteDriver = (driver: Driver) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o condutor ${driver.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await driverService.deleteDriver(driver.id);
              await loadDrivers();
              Alert.alert('Sucesso', 'Condutor excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir condutor:', error);
              Alert.alert('Erro', 'Não foi possível excluir o condutor');
            }
          },
        },
      ]
    );
  };

  const handleSaveDriver = async () => {
    if (!user || !formData.name || !formData.license_number || !formData.categories.length) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const driverData = {
        name: formData.name,
        license_number: formData.license_number,
        categories: formData.categories,
        issue_date: formData.issue_date || new Date().toISOString().split('T')[0],
        expiry_date: formData.expiry_date || new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        birth_date: formData.birth_date,
        owner_id: user.id,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        email: formData.email || undefined,
        status: 'valid' as const,
        points: 0,
        max_points: 12,
      };

      if (editingDriver) {
        await driverService.updateDriver(editingDriver.id, driverData);
        Alert.alert('Sucesso', 'Condutor atualizado com sucesso!');
      } else {
        await driverService.createDriver(driverData);
        Alert.alert('Sucesso', 'Condutor adicionado com sucesso!');
      }

      setShowAddModal(false);
      await loadDrivers();
    } catch (error) {
      console.error('Erro ao salvar condutor:', error);
      Alert.alert('Erro', 'Não foi possível salvar o condutor');
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.license_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLicenseStatusColor = (driver: Driver) => {
    const today = new Date();
    const expiryDate = new Date(driver.expiry_date);
    
    if (expiryDate < today) return '#DC2626';
    if (expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) return '#F59E0B';
    return '#059669';
  };

  const getLicenseStatusText = (driver: Driver) => {
    const today = new Date();
    const expiryDate = new Date(driver.expiry_date);
    
    if (expiryDate < today) return 'Expirada';
    if (expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) return 'A Expirar';
    return 'Válida';
  };

  // Função para seleção de data
  const showDatePicker = (field: 'issue_date' | 'expiry_date' | 'birth_date') => {
    const currentDate = new Date();
    const minDate = new Date();
    minDate.setDate(currentDate.getDate() - 365 * 100); // Permitir datas até 100 anos atrás
    
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
                setFormData(prev => ({ ...prev, [field]: dateString }));
              }
            }
          }
        ],
        'plain-text',
        formData[field] || new Date().toISOString().split('T')[0]
      );
    } else {
      // Para Android, usar seletor nativo
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
                  const formattedDate = date.toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, [field]: formattedDate }));
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

  return (
      <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#2563eb', '#3b82f6']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Condutores</Text>
          {hasPermission('drivers', 'create') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddDriver}
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
              placeholder="Pesquisar condutores..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
        </View>

          {/* Drivers List */}
        <ScrollView
            style={styles.driversList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando condutores...</Text>
              </View>
            ) : filteredDrivers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <User size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Nenhum condutor encontrado' : 'Nenhum condutor registado'}
              </Text>
              </View>
            ) : (
              filteredDrivers.map((driver) => (
                <View key={driver.id} style={styles.driverCard}>
                  <View style={styles.driverHeader}>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{driver.name}</Text>
                      <Text style={styles.driverLicense}>
                        Carta: {driver.license_number} ({driver.categories.join(', ')})
                </Text>
                      {driver.phone && (
                        <Text style={styles.driverPhone}>{driver.phone}</Text>
                      )}
              </View>
                    
                    <View style={styles.driverActions}>
                      {hasPermission('drivers', 'update') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditDriver(driver)}
                        >
                          <Edit3 size={16} color="#2563EB" />
            </TouchableOpacity>
                      )}
                      
                      {hasPermission('drivers', 'delete') && (
                <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteDriver(driver)}
                >
                          <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
                    </View>
                  </View>

                  <View style={styles.driverDetails}>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getLicenseStatusColor(driver) }]} />
                      <Text style={styles.statusText}>{getLicenseStatusText(driver)}</Text>
                    </View>
                  </View>

                  {/* Additional Info */}
                  <View style={styles.infoContainer}>
                    {driver.expiry_date && (
                      <View style={styles.infoItem}>
                        <Calendar size={14} color="#64748B" />
                        <Text style={styles.infoLabel}>Validade:</Text>
                        <Text style={styles.infoValue}>
                          {new Date(driver.expiry_date).toLocaleDateString('pt-BR')}
                        </Text>
            </View>
                    )}
                    
                    {driver.birth_date && (
                      <View style={styles.infoItem}>
                        <User size={14} color="#64748B" />
                        <Text style={styles.infoLabel}>Nascimento:</Text>
                        <Text style={styles.infoValue}>
                          {new Date(driver.birth_date).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    )}
                    
                    {driver.address && (
                      <View style={styles.infoItem}>
                        <Shield size={14} color="#64748B" />
                        <Text style={styles.infoLabel}>Endereço:</Text>
                        <Text style={styles.infoValue}>{driver.address}</Text>
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
                {editingDriver ? 'Editar Condutor' : 'Adicionar Condutor'}
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
                <Text style={styles.inputLabel}>Nome Completo *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="João Silva Santos"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Número da Carta *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.license_number}
                  onChangeText={(text) => setFormData({ ...formData, license_number: text })}
                  placeholder="123456789"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categorias *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.categories.join(', ')}
                  onChangeText={(text) => setFormData({ ...formData, categories: text.split(',').map(c => c.trim()).filter(c => c) })}
                  placeholder="B, C, etc."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Data de Emissão</Text>
                    <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePicker('issue_date')}
                    >
                      <Text style={[
                    styles.dateButtonText,
                    !formData.issue_date && styles.dateButtonTextPlaceholder
                      ]}>
                    {formData.issue_date || 'Selecionar data'}
                      </Text>
                  <Calendar size={20} color="#64748B" />
                    </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Validade</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePicker('expiry_date')}
                >
                  <Text style={[
                    styles.dateButtonText,
                    !formData.expiry_date && styles.dateButtonTextPlaceholder
                  ]}>
                    {formData.expiry_date || 'Selecionar data'}
                  </Text>
                  <Calendar size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Data de Nascimento</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePicker('birth_date')}
                >
                  <Text style={[
                    styles.dateButtonText,
                    !formData.birth_date && styles.dateButtonTextPlaceholder
                  ]}>
                    {formData.birth_date || 'Selecionar data'}
                  </Text>
                  <Calendar size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="+351 912 345 678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Endereço</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Rua das Flores, 123, Lisboa"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="joao@example.com"
                  placeholderTextColor="#9CA3AF"
                  />
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
                onPress={handleSaveDriver}
                >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingDriver ? 'Atualizar' : 'Adicionar'}
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
  driversList: {
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  driverLicense: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  driverDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  infoContainer: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    minWidth: 70,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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