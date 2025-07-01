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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Calendar,
  MapPin,
  Euro,
  X,
  Save,
  CreditCard
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fineService } from '@/lib/database';
import { Database } from '@/types/database';
import { formatAngolaPlate, validateAngolaPlate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

type Fine = Database['public']['Tables']['fines']['Row'];

export default function FinesScreen() {
  const { user, hasPermission } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFine, setEditingFine] = useState<Fine | null>(null);
  const [payingFineId, setPayingFineId] = useState<string | null>(null);

  // Estados para formulário
  const [formData, setFormData] = useState({
    type: '',
    vehicle_plate: '',
    driver_name: '',
    driver_license: '',
    amount: '',
    points: '',
    location: '',
    date: '',
    time: '',
    description: '',
  });

  // Adicionar estados para picker de data/hora
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    try {
      setLoading(true);
      let finesData: Fine[] = [];
      if (hasPermission('fines', 'read') && (user?.role === 'operator' || user?.role === 'agent')) {
        // Operadores e agentes podem ver todas as multas
        finesData = await fineService.getAllFines();
      } else if (user?.role === 'citizen') {
        // Buscar carta de condução do cidadão
        const { data: driver } = await supabase
          .from('drivers')
          .select('license_number')
          .eq('owner_id', user.id)
          .single();
        // Buscar placas dos veículos do cidadão
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('plate')
          .eq('owner_id', user.id);
        const license = driver?.license_number;
        const plates = (vehicles || []).map(v => v.plate);
        // Montar filtro
        let query = supabase
          .from('fines')
          .select('*')
          .order('created_at', { ascending: false });
        if (license && plates.length > 0) {
          query = query.or(`driver_license.eq.${license},vehicle_plate.in.(${plates.join(',')})`);
        } else if (license) {
          query = query.eq('driver_license', license);
        } else if (plates.length > 0) {
          query = query.in('vehicle_plate', plates);
        } else {
          setFines([]);
          setLoading(false);
          return;
        }
        const { data, error } = await query;
        if (error) throw error;
        finesData = data || [];
      } else {
        // Outros usuários veem apenas suas multas (fallback)
        finesData = await fineService.getUserFines(user?.id || '');
      }
      setFines(finesData);
    } catch (error) {
      console.error('Erro ao carregar multas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as multas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFines();
    setRefreshing(false);
  };

  const handleAddFine = () => {
    setFormData({
      type: '',
      vehicle_plate: '',
      driver_name: '',
      driver_license: '',
      amount: '',
      points: '',
      location: '',
      date: '',
      time: '',
      description: '',
    });
    setEditingFine(null);
    setShowAddModal(true);
  };

  const handleEditFine = (fine: Fine) => {
    setFormData({
      type: fine.type,
      vehicle_plate: fine.vehicle_plate,
      driver_name: fine.driver_name,
      driver_license: fine.driver_license,
      amount: fine.amount.toString(),
      points: fine.points.toString(),
      location: fine.location,
      date: fine.date,
      time: fine.time,
      description: fine.description || '',
    });
    setEditingFine(fine);
    setShowAddModal(true);
  };

  // Função para formatar matrícula em tempo real
  const handlePlateChange = (text: string) => {
    const formatted = formatAngolaPlate(text);
    setFormData(prev => ({ ...prev, vehicle_plate: formatted }));
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

  const handleDeleteFine = (fine: Fine) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a multa de ${fine.driver_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await fineService.deleteFine(fine.id);
              await loadFines();
              Alert.alert('Sucesso', 'Multa excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir multa:', error);
              Alert.alert('Erro', 'Não foi possível excluir a multa');
            }
          },
        },
      ]
    );
  };

  const handleSaveFine = async () => {
    if (!user || !formData.type || !formData.vehicle_plate || !formData.driver_name || 
        !formData.driver_license || !formData.amount || !formData.points || 
        !formData.location || !formData.date || !formData.time) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validar formato da matrícula angolana
    if (!validateAngolaPlate(formData.vehicle_plate)) {
      Alert.alert('Erro', 'Formato de matrícula inválido. Use o formato LD-XX-XX-XX ou LDA-XX-XX-XX (ex: LD-35-87-IA ou LDA-35-87-IA)');
      return;
    }

    try {
      const fineData = {
        type: formData.type,
        vehicle_plate: formData.vehicle_plate.toUpperCase(),
        driver_name: formData.driver_name,
        driver_license: formData.driver_license,
        amount: parseFloat(formData.amount),
        points: parseInt(formData.points),
        location: formData.location,
        date: formData.date,
        time: formData.time,
        description: formData.description || undefined,
        status: 'pending' as const,
        agent_id: user.id,
        agent_name: user.name,
        agent_badge: user.badge,
      };

      if (editingFine) {
        await fineService.updateFine(editingFine.id, fineData);
        Alert.alert('Sucesso', 'Multa atualizada com sucesso!');
      } else {
        // Criar multa e obter o id
        console.log('Enviando fineData:', fineData);
        let createdFine;
        try {
          createdFine = await fineService.createFineWithReturn(fineData);
        } catch (fineError) {
          console.error('Erro detalhado ao criar multa:', fineError);
          const errorMsg = typeof fineError === 'object' && fineError !== null && 'message' in fineError ? (fineError as any).message : String(fineError);
          Alert.alert('Erro', `Erro ao criar multa: ${errorMsg}`);
          return;
        }
        // Buscar proprietário do veículo
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('*')
          .eq('plate', fineData.vehicle_plate)
          .single();
        // Buscar condutor infrator
        const { data: driver } = await supabase
          .from('drivers')
          .select('*')
          .eq('license_number', fineData.driver_license)
          .single();
        const ownerId = vehicle?.owner_id;
        const driverOwnerId = driver?.owner_id;
        // Mensagem da notificação
        const notificationMsg = `Uma multa de Kz ${fineData.amount} foi registrada para o veículo ${fineData.vehicle_plate} em ${fineData.date}.`;
        // Notificação para o proprietário
        if (ownerId) {
          await supabase.from('notifications').insert({
            user_id: ownerId,
            title: 'Nova multa registrada',
            message: notificationMsg,
            vehicle_plate: fineData.vehicle_plate,
            fine_id: createdFine.id,
            date: fineData.date,
            value: fineData.amount,
            is_read: false,
          });
        }
        // Notificação para o condutor, se diferente do proprietário
        if (driverOwnerId && driverOwnerId !== ownerId) {
          await supabase.from('notifications').insert({
            user_id: driverOwnerId,
            title: 'Você recebeu uma multa',
            message: notificationMsg,
            vehicle_plate: fineData.vehicle_plate,
            fine_id: createdFine.id,
            date: fineData.date,
            value: fineData.amount,
            is_read: false,
          });
        }
        Alert.alert('Sucesso', 'Multa registada com sucesso!');
      }

      setShowAddModal(false);
      await loadFines();
    } catch (error) {
      console.error('Erro ao salvar multa:', error);
      Alert.alert('Erro', 'Não foi possível salvar a multa');
    }
  };

  // Função para gerar referência RUPE (simulada)
  const generateRupeReference = () => {
    // Exemplo: RUPE + 8 dígitos aleatórios
    return 'RUPE' + Math.floor(10000000 + Math.random() * 90000000);
  };

  // Função para pagar multa
  const handlePayFine = async (fine: Fine) => {
    setPayingFineId(fine.id);
    try {
      const rupe = generateRupeReference();
      const { error } = await supabase
        .from('fines')
        .update({ rupe_reference: rupe })
        .eq('id', fine.id);
      if (error) throw error;
      Alert.alert('Referência gerada', `Referência RUPE: ${rupe}`);
      await loadFines();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível gerar a referência de pagamento.');
    } finally {
      setPayingFineId(null);
    }
  };

  const filteredFines = fines.filter(fine =>
    fine.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fine.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fine.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'paid': return '#059669';
      case 'contested': return '#2563EB';
      case 'cancelled': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Paga';
      case 'contested': return 'Contestada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecido';
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
          <Text style={styles.headerTitle}>Multas</Text>
          {hasPermission('fines', 'create') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFine}
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
              placeholder="Pesquisar multas..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Fines List */}
          <ScrollView
            style={styles.finesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Carregando multas...</Text>
              </View>
            ) : filteredFines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AlertTriangle size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Nenhuma multa encontrada' : 'Nenhuma multa registada'}
                </Text>
              </View>
            ) : (
              filteredFines.map((fine) => (
                <View key={fine.id} style={styles.fineCard}>
                  <View style={styles.fineHeader}>
                    <View style={styles.fineInfo}>
                      <Text style={styles.fineType}>{fine.type}</Text>
                      <Text style={styles.fineVehicle}>
                        {fine.vehicle_plate} - {fine.driver_name}
                      </Text>
                      <Text style={styles.fineLocation}>
                        <MapPin size={12} color="#64748B" /> {fine.location}
                      </Text>
                    </View>
                    
                    <View style={styles.fineActions}>
                      {hasPermission('fines', 'update') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditFine(fine)}
                        >
                          <Edit3 size={16} color="#2563EB" />
                        </TouchableOpacity>
                      )}
                      
                      {hasPermission('fines', 'delete') && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteFine(fine)}
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.fineDetails}>
                    <View style={styles.amountContainer}>
                      <Text style={styles.fineAmount}>
                        {fine.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    
                    <View style={styles.pointsContainer}>
                      <CreditCard size={16} color="#F59E0B" />
                      <Text style={styles.finePoints}>{fine.points} pontos</Text>
                    </View>
                    
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(fine.status) }]} />
                      <Text style={styles.statusText}>{getStatusText(fine.status)}</Text>
                    </View>
                  </View>

                  {/* Additional Info */}
                  <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                      <Calendar size={14} color="#64748B" />
                      <Text style={styles.infoLabel}>Data:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(fine.date).toLocaleDateString('pt-BR')} às {fine.time}
                      </Text>
                    </View>
                    
                    {fine.agent_name && (
                      <View style={styles.infoItem}>
                        <AlertTriangle size={14} color="#64748B" />
                        <Text style={styles.infoLabel}>Agente:</Text>
                        <Text style={styles.infoValue}>
                          {fine.agent_name} {fine.agent_badge && `(${fine.agent_badge})`}
                        </Text>
                      </View>
                    )}
                    
                    {fine.description && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Descrição:</Text>
                        <Text style={styles.infoValue}>{fine.description}</Text>
                      </View>
                    )}
                  </View>

                  {/* RUPE Reference & Payment Button */}
                  {fine.rupe_reference ? (
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: '#e0f2fe', borderRadius: 8 }}>
                      <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>Referência RUPE:</Text>
                      <Text selectable style={{ color: '#0369a1', fontSize: 16 }}>{fine.rupe_reference}</Text>
                    </View>
                  ) : ((user?.role === 'citizen' || user?.role === 'company') && (
                    <TouchableOpacity
                      style={{ marginTop: 8, backgroundColor: '#2563eb', borderRadius: 8, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                      onPress={() => handlePayFine(fine)}
                      disabled={payingFineId === fine.id}
                    >
                      {payingFineId === fine.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Euro size={18} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Pagar Multa</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
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
                {editingFine ? 'Editar Multa' : 'Registar Multa'}
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
                <Text style={styles.inputLabel}>Tipo de Infração *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.type}
                  onChangeText={(text) => setFormData({ ...formData, type: text })}
                  placeholder="Excesso de velocidade"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Matrícula do Veículo *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.vehicle_plate}
                  onChangeText={handlePlateChange}
                  placeholder="LD-35-87-IA ou LDA-35-87-IA"
                  autoCapitalize="characters"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nome do Condutor *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.driver_name}
                  onChangeText={(text) => setFormData({ ...formData, driver_name: text })}
                  placeholder="João Silva Santos"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Número da Carta *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.driver_license}
                  onChangeText={(text) => setFormData({ ...formData, driver_license: text })}
                  placeholder="123456789"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Valor (€) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="120.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pontos *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.points}
                  onChangeText={(text) => setFormData({ ...formData, points: text })}
                  placeholder="3"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Local *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Avenida da Liberdade, Lisboa"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Data da Multa *</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                  <Text style={{ color: formData.date ? '#111' : '#888' }}>{formData.date || 'Selecionar data'}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.date ? new Date(formData.date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
                    }}
                  />
                )}
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Hora *</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateInput}>
                  <Text style={{ color: formData.time ? '#111' : '#888' }}>{formData.time || 'Selecionar hora'}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={formData.time ? new Date(`1970-01-01T${formData.time}`) : new Date()}
                    mode="time"
                    display="default"
                    is24Hour={true}
                    onChange={(event, time) => {
                      setShowTimePicker(false);
                      if (time) {
                        const h = time.getHours().toString().padStart(2, '0');
                        const m = time.getMinutes().toString().padStart(2, '0');
                        setFormData(prev => ({ ...prev, time: `${h}:${m}` }));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descrição</Text>
                <TextInput
                  style={styles.input}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Descrição detalhada da infração"
                  multiline
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
                onPress={handleSaveFine}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingFine ? 'Atualizar' : 'Registar'}
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
  finesList: {
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
  fineCard: {
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
  fineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fineInfo: {
    flex: 1,
  },
  fineType: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  fineVehicle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  fineLocation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  fineDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fineAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finePoints: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
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
    minWidth: 60,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
});