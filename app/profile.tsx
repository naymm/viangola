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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Building, 
  Edit3, 
  LogOut,
  Save,
  X
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(user);

  // Estados para edição
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editCompany, setEditCompany] = useState(user?.company || '');

  // Novo estado para upload
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setUserData(user);
      setEditName(user.name);
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
      setEditCompany(user.company || '');
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Iniciando logout...');
              await logout();
              console.log('✅ Logout concluído');
            } catch (error) {
              console.error('❌ Erro durante logout:', error);
              Alert.alert('Erro', 'Não foi possível terminar a sessão');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!user || !editName.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(user.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        company: editCompany.trim() || undefined,
      });

      setUserData(updatedUser);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    } finally {
      setLoading(false);
    }
  };

  // Função para alterar foto de perfil
  const handleChangePhoto = async () => {
    if (!user) return;
    Alert.alert(
      'Alterar Foto de Perfil',
      'Escolha uma opção:',
      [
        {
          text: 'Câmera',
          onPress: async () => {
            const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPerm.granted) {
              Alert.alert('Permissão negada', 'É necessário permitir acesso à câmera.');
              return;
            }
            const pickerResult = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
              await uploadProfilePhoto(pickerResult.assets[0].uri);
            }
          },
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
              Alert.alert('Permissão negada', 'É necessário permitir acesso à galeria.');
              return;
            }
            const pickerResult = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!pickerResult.canceled && pickerResult.assets[0]?.uri) {
              await uploadProfilePhoto(pickerResult.assets[0].uri);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // Função auxiliar para upload
  const uploadProfilePhoto = async (uri: string) => {
    if (!user) return;
    try {
      setUploading(true);
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage.from('profile-photos').upload(fileName, blob, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      const photoUrl = publicUrlData?.publicUrl;
      if (!photoUrl) throw new Error('Erro ao obter URL da foto');
      await userService.updateProfile(user.id, { photo: photoUrl });
      setUserData(userData ? { ...userData, photo: photoUrl } : null);
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'operator':
        return { title: 'Operador', icon: Shield, color: '#7C3AED' };
      case 'agent':
        return { title: 'Agente de Trânsito', icon: Shield, color: '#2563EB' };
      case 'citizen':
        return { title: 'Cidadão', icon: User, color: '#059669' };
      case 'company':
        return { title: 'Empresa', icon: Building, color: '#EA580C' };
      default:
        return { title: 'Utilizador', icon: User, color: '#64748B' };
    }
  };

  const roleInfo = getRoleInfo(userData?.role || '');

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#2563eb', '#3b82f6']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {userData.photo ? (
                <Image source={{ uri: userData.photo }} style={styles.profilePhoto} />
              ) : (
                <View style={[styles.profilePhotoPlaceholder, { backgroundColor: roleInfo.color }]}>
                  <User size={40} color="#FFFFFF" />
                </View>
              )}
              
              {/* Botão de alterar foto */}
              {/*<TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto} disabled={uploading}>
                <Text style={styles.changePhotoText}>{uploading ? 'Atualizando...' : 'Alterar Foto'}</Text>
              </TouchableOpacity>*/}

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userData.name}</Text>
                <View style={styles.roleContainer}>
                  <roleInfo.icon size={16} color={roleInfo.color} />
                  <Text style={[styles.roleText, { color: roleInfo.color }]}>
                    {roleInfo.title}
                  </Text>
                </View>
                {userData.badge && (
                  <Text style={styles.badgeText}>Crachá: {userData.badge}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Edit3 size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Profile Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Mail size={20} color="#64748B" />
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{userData.email}</Text>
              </View>

              {userData.phone && (
                <View style={styles.detailItem}>
                  <Phone size={20} color="#64748B" />
                  <Text style={styles.detailLabel}>Telefone:</Text>
                  <Text style={styles.detailValue}>{userData.phone}</Text>
                </View>
              )}

              {userData.address && (
                <View style={styles.detailItem}>
                  <MapPin size={20} color="#64748B" />
                  <Text style={styles.detailLabel}>Endereço:</Text>
                  <Text style={styles.detailValue}>{userData.address}</Text>
                </View>
              )}

              {userData.company && (
                <View style={styles.detailItem}>
                  <Building size={20} color="#64748B" />
                  <Text style={styles.detailLabel}>Empresa:</Text>
                  <Text style={styles.detailValue}>{userData.company}</Text>
                </View>
              )}

              {userData.birth_date && (
                <View style={styles.detailItem}>
                  <Calendar size={20} color="#64748B" />
                  <Text style={styles.detailLabel}>Data de Nascimento:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(userData.birth_date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}

              <View style={styles.detailItem}>
                <Calendar size={20} color="#64748B" />
                <Text style={styles.detailLabel}>Membro desde:</Text>
                <Text style={styles.detailValue}>
                  {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>

              {userData.last_login && (
                <View style={styles.detailItem}>
                  <Calendar size={20} color="#64748B" />
                  <Text style={styles.detailLabel}>Último login:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(userData.last_login).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(userData.last_login).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Botão Minha Carta para cidadão */}
          {userData.role === 'citizen' && (
            <TouchableOpacity
              style={styles.cartaButton}
              onPress={() => router.push('/minha-carta')}
            >
              <Text style={styles.cartaButtonText}>Minha Carta de Condução</Text>
            </TouchableOpacity>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/vehicles')}
            >
              <Text style={styles.actionButtonText}>Ver Meus Veículos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/fines')}
            >
              <Text style={styles.actionButtonText}>Ver Minhas Multas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Text style={styles.actionButtonText}>Ver Notificações</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Edit Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsEditing(false)}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nome *</Text>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.editField}>
                <Text style={styles.editLabel}>Telefone</Text>
                <TextInput
                  style={styles.editInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+351 912 345 678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.editField}>
                <Text style={styles.editLabel}>Endereço</Text>
                <TextInput
                  style={styles.editInput}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Rua, número, cidade"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.editField}>
                <Text style={styles.editLabel}>Empresa</Text>
                <TextInput
                  style={styles.editInput}
                  value={editCompany}
                  onChangeText={setEditCompany}
                  placeholder="Nome da empresa"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Salvar'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  detailsContainer: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    minWidth: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    textAlign: 'center',
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
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  editField: {
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
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
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  cartaButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cartaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
});