import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Settings, Users, Shield, Building, Plus, Search, CreditCard as Edit, Trash2, X, Eye, UserCheck } from 'lucide-react-native';
import PermissionGate from '@/components/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_USERS, User, UserRole, ROLE_PERMISSIONS } from '@/types/auth';

export default function AdminScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'citizen' as UserRole,
    badge: '',
    company: '',
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      badge: newUser.badge || undefined,
      company: newUser.company || undefined,
      permissions: ROLE_PERMISSIONS[newUser.role],
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'citizen', badge: '', company: '' });
    setShowAddModal(false);
    Alert.alert('Sucesso', 'Utilizador adicionado com sucesso!');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      Alert.alert('Erro', 'Não pode eliminar o seu próprio utilizador');
      return;
    }

    Alert.alert(
      'Confirmar Eliminação',
      'Tem a certeza que pretende eliminar este utilizador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setUsers(users.filter(u => u.id !== userId));
            Alert.alert('Sucesso', 'Utilizador eliminado com sucesso!');
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'operator':
        return { icon: Settings, title: 'Operador', color: '#7C3AED' };
      case 'agent':
        return { icon: Shield, title: 'Agente', color: '#2563EB' };
      case 'citizen':
        return { icon: Users, title: 'Cidadão', color: '#059669' };
      case 'company':
        return { icon: Building, title: 'Empresa', color: '#EA580C' };
    }
  };

  const roleOptions = [
    { value: 'all', label: 'Todos', count: users.length },
    { value: 'operator', label: 'Operadores', count: users.filter(u => u.role === 'operator').length },
    { value: 'agent', label: 'Agentes', count: users.filter(u => u.role === 'agent').length },
    { value: 'citizen', label: 'Cidadãos', count: users.filter(u => u.role === 'citizen').length },
    { value: 'company', label: 'Empresas', count: users.filter(u => u.role === 'company').length },
  ];

  return (
    <PermissionGate resource="users" action="read">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Administração</Text>
            <Text style={styles.subtitle}>{users.length} utilizador(es) registado(s)</Text>
          </View>
          <PermissionGate resource="users" action="create" showFallback={false}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </PermissionGate>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#64748B" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <X size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Role Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {roleOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterTab,
                selectedRole === option.value && styles.filterTabActive
              ]}
              onPress={() => setSelectedRole(option.value as UserRole | 'all')}
            >
              <Text style={[
                styles.filterTabText,
                selectedRole === option.value && styles.filterTabTextActive
              ]}>
                {option.label}
              </Text>
              <View style={[
                styles.filterBadge,
                selectedRole === option.value && styles.filterBadgeActive
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  selectedRole === option.value && styles.filterBadgeTextActive
                ]}>
                  {option.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredUsers.map((user) => {
            const config = getRoleConfig(user.role);
            const IconComponent = config.icon;
            
            return (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userPhotoContainer}>
                    {user.photo ? (
                      <Image source={{ uri: user.photo }} style={styles.userPhoto} />
                    ) : (
                      <View style={styles.userPhotoPlaceholder}>
                        <Users size={24} color="#64748B" strokeWidth={2} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: `${config.color}15` }]}>
                      <IconComponent size={14} color={config.color} strokeWidth={2} />
                      <Text style={[styles.roleText, { color: config.color }]}>
                        {config.title}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setSelectedUser(user)}
                    >
                      <Eye size={16} color="#2563EB" strokeWidth={2} />
                    </TouchableOpacity>
                    <PermissionGate resource="users" action="delete" showFallback={false}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                      </TouchableOpacity>
                    </PermissionGate>
                  </View>
                </View>

                <View style={styles.userDetails}>
                  {user.badge && (
                    <Text style={styles.userDetail}>Crachá: {user.badge}</Text>
                  )}
                  {user.company && (
                    <Text style={styles.userDetail}>Empresa: {user.company}</Text>
                  )}
                  <Text style={styles.userDetail}>
                    Criado: {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                  </Text>
                  {user.lastLogin && (
                    <Text style={styles.userDetail}>
                      Último acesso: {new Date(user.lastLogin).toLocaleDateString('pt-PT')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Users size={64} color="#64748B" strokeWidth={2} />
              <Text style={styles.emptyTitle}>Nenhum utilizador encontrado</Text>
              <Text style={styles.emptyText}>
                {searchTerm 
                  ? 'Tente ajustar os termos de pesquisa'
                  : 'Adicione o primeiro utilizador para começar'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add User Modal */}
        <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Utilizador</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddModal(false)}
              >
                <X size={24} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nome Completo *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.name}
                  onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                  placeholder="Ex: João Silva Santos"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                  placeholder="Ex: joao.silva@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tipo de Utilizador *</Text>
                <View style={styles.roleContainer}>
                  {(['operator', 'agent', 'citizen', 'company'] as UserRole[]).map((role) => {
                    const config = getRoleConfig(role);
                    const IconComponent = config.icon;
                    
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleButton,
                          newUser.role === role && { backgroundColor: config.color }
                        ]}
                        onPress={() => setNewUser({ ...newUser, role })}
                      >
                        <IconComponent
                          size={20}
                          color={newUser.role === role ? '#FFFFFF' : config.color}
                          strokeWidth={2}
                        />
                        <Text style={[
                          styles.roleButtonText,
                          newUser.role === role && { color: '#FFFFFF' }
                        ]}>
                          {config.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {(newUser.role === 'operator' || newUser.role === 'agent') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Número do Crachá</Text>
                  <TextInput
                    style={styles.input}
                    value={newUser.badge}
                    onChangeText={(text) => setNewUser({ ...newUser, badge: text })}
                    placeholder="Ex: AG001234"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              {newUser.role === 'company' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nome da Empresa</Text>
                  <TextInput
                    style={styles.input}
                    value={newUser.company}
                    onChangeText={(text) => setNewUser({ ...newUser, company: text })}
                    placeholder="Ex: TransLisboa Lda."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.addUserButton}
                onPress={handleAddUser}
              >
                <Text style={styles.addUserButtonText}>Adicionar Utilizador</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* User Details Modal */}
        <Modal visible={!!selectedUser} animationType="slide" presentationStyle="pageSheet">
          {selectedUser && (
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedUser.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedUser.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedUser(null)}
                >
                  <X size={24} color="#64748B" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.detailsContainer}>
                  <Text style={styles.sectionTitle}>Permissões</Text>
                  {selectedUser.permissions.map((permission, index) => (
                    <View key={index} style={styles.permissionCard}>
                      <Text style={styles.permissionResource}>{permission.resource}</Text>
                      <View style={styles.permissionActions}>
                        {permission.actions.map((action, actionIndex) => (
                          <View key={actionIndex} style={styles.actionBadge}>
                            <Text style={styles.actionText}>{action}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </SafeAreaView>
          )}
        </Modal>
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
  addButton: {
    backgroundColor: '#7C3AED',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    paddingVertical: 12,
    paddingLeft: 12,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: '#7C3AED',
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginRight: 8,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userPhotoContainer: {
    marginRight: 12,
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  userDetail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '48%',
  },
  roleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginLeft: 8,
  },
  addUserButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addUserButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  detailsContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  permissionResource: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  permissionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    textTransform: 'capitalize',
  },
});