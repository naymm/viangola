import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Keyboard,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { FileText, Camera, Upload, Shield, Calendar, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Eye, Download, X, Plus } from 'lucide-react-native';
import DocumentCard from '@/components/DocumentCard';
import PermissionGate from '@/components/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseQuery } from '@/hooks/useSupabase';
import { Database } from '@/types/database';
import { vehicleService } from '@/lib/database';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import RNPickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';


type Document = Database['public']['Tables']['documents']['Row'];

export default function DocumentsScreen() {
  const { user, hasPermission } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (showUploadModal && user) {
      // Buscar veículos do usuário
      vehicleService.getUserVehicles(user.id).then(setVehicles);
    }
  }, [showUploadModal, user]);

  // Fetch documents based on user role
  const { data: documents, loading, error, refetch } = useSupabaseQuery('documents', {
    filter: user?.role === 'citizen' || user?.role === 'company' 
      ? { owner_id: user.id }
      : undefined,
    orderBy: { column: 'created_at', ascending: false }
  });

  // Filter documents based on type
  const getFilteredDocuments = () => {
    let filtered = documents || [];
    
    // Type filtering
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedFilter);
    }
    
    return filtered;
  };

  const filteredDocuments = getFilteredDocuments();

  const documentTypes = [
    { value: 'all', label: 'Todos', count: documents?.length || 0 },
    { value: 'Seguro', label: 'Seguros', count: documents?.filter(d => d.type === 'Seguro').length || 0 },
    { value: 'Livrete', label: 'Livretes', count: documents?.filter(d => d.type === 'Livrete').length || 0 },
    { value: 'Inspeção', label: 'Inspeções', count: documents?.filter(d => d.type === 'Inspeção').length || 0 },
    { value: 'Título de Propriedade', label: 'Títulos', count: documents?.filter(d => d.type === 'Título de Propriedade').length || 0 },
  ];

  const handleUploadDocument = () => {
    Alert.alert(
      'Upload de Documento',
      'Escolha uma opção:',
      [
        { text: 'Câmera', onPress: () => openCamera() },
        { text: 'Galeria', onPress: () => openGallery() },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
    setShowUploadModal(false);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'É necessário permitir acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]?.uri) {
      const fileName = `doc_${Date.now()}.jpg`;
      setSelectedFile({ uri: result.assets[0].uri, name: fileName });
      setFileName(fileName);
      setFileUrl(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'É necessário permitir acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]?.uri) {
      const fileName = `doc_${Date.now()}.jpg`;
      setSelectedFile({ uri: result.assets[0].uri, name: fileName });
      setFileName(fileName);
      setFileUrl(result.assets[0].uri);
    }
  };

  const viewDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  const downloadDocument = (document: Document) => {
    Alert.alert('Download', `Baixando ${document.file_name}...`);
  };

  const getScreenTitle = () => {
    switch (user?.role) {
      case 'operator':
      case 'agent':
        return 'Todos os Documentos';
      case 'company':
        return 'Documentos da Empresa';
      case 'citizen':
        return 'Meus Documentos';
      default:
        return 'Documentos';
    }
  };

  const handleSaveDocument = async () => {
    if (!user) return;
    if (!selectedFile) {
      Alert.alert('Erro', 'Por favor, selecione uma foto do documento.');
      return;
    }
    
    // Verificar se é uma imagem
    const validExtensions = ['.jpg', '.jpeg', '.png', '.heic'];
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      Alert.alert('Erro', 'Apenas imagens (JPG, PNG, HEIC) são permitidas.');
      return;
    }
    
    setIsUploading(true);
    try {
      const upload = await uploadDocumentImage(selectedFile.uri, user.id);
      const { fileName, url, size, mimeType, filePath } = upload;
      const status = getStatusByExpiry(expiryDate);
      const { error } = await supabase.from('documents').insert({
        name: fileName,
        file_name: fileName,
        size: size,
        type: selectedType,
        vehicle_plate: selectedVehicle,
        owner_id: user.id,
        file_url: url,
        upload_date: new Date().toISOString(),
        expiry_date: expiryDate || null,
        status
      });
      if (error) throw error;
      Alert.alert('Sucesso', 'Documento cadastrado com sucesso!');
      setShowUploadModal(false);
      setFileName('');
      setFileUrl('');
      setSelectedFile(null);
      refetch();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o documento.');
      console.error('Erro ao salvar documento:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const clearForm = () => {
    setSelectedVehicle('');
    setSelectedType('');
    setExpiryDate('');
    setFileName('');
    setFileUrl('');
    setSelectedFile(null);
  };

  const closeModal = () => {
    setShowUploadModal(false);
    clearForm();
  };



  // Função para upload para Supabase Storage
  async function uploadDocumentImage(uri: string, userId: string) {
    console.log('URI recebida para upload:', uri);
    
    try {
      // Determinar o tipo MIME baseado na extensão do arquivo
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'heic') mimeType = 'image/heic';
      
      const fileName = `doc_${userId}_${Date.now()}.${ext}`;
      const filePath = fileName;
      
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('Informações do arquivo:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Arquivo não encontrado');
      }
      
      // Ler o arquivo como base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Base64 gerado, tamanho:', base64.length);
      
      // Converter base64 para Uint8Array (mais confiável que blob)
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Verificar se a conversão foi bem-sucedida
      if (bytes.length === 0) {
        throw new Error('Conversão base64 falhou - bytes vazios');
      }
      
      console.log('Bytes gerados, tamanho:', bytes.length);
      
      if (bytes.length === 0) {
        throw new Error('Bytes gerados com tamanho 0');
      }
      
      const { data, error } = await supabase.storage.from('documents').upload(filePath, bytes, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType,
      });
      
      if (error) {
        console.error('Erro no upload para Supabase Storage:', error);
        throw error;
      }
      
      const { data: publicUrl } = supabase.storage.from('documents').getPublicUrl(filePath);
      console.log('URL pública gerada:', publicUrl?.publicUrl);
      
      return {
        fileName,
        url: publicUrl?.publicUrl,
        size: bytes.length,
        mimeType: mimeType,
        filePath
      };
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível fazer upload da imagem.');
      console.error('Erro ao fazer upload da imagem:', e);
      throw e;
    }
  }

  // Função para selecionar imagem da galeria
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      const fileName = `doc_${Date.now()}.jpg`;
      console.log('Imagem selecionada:', { uri: asset.uri, name: fileName });
      setSelectedFile({ uri: asset.uri, name: fileName });
      setFileName(fileName);
      setFileUrl(asset.uri);
      Alert.alert('Imagem selecionada', `Arquivo: ${fileName}`);
    }
  };

  // Função para calcular status do documento
  function getStatusByExpiry(expiryDateStr: string | null | undefined) {
    if (!expiryDateStr) return 'valid';
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffMs = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'valid';
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando documentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar documentos: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PermissionGate resource="documents" action="read">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{getScreenTitle()}</Text>
            <Text style={styles.subtitle}>{filteredDocuments.length} documento(s) armazenado(s)</Text>
          </View>
          <PermissionGate resource="documents" action="create" showFallback={false}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowUploadModal(true)}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </PermissionGate>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {documentTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.filterTab,
                selectedFilter === type.value && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(type.value)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === type.value && styles.filterTabTextActive
              ]}>
                {type.label}
              </Text>
              <View style={[
                styles.filterBadge,
                selectedFilter === type.value && styles.filterBadgeActive
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  selectedFilter === type.value && styles.filterBadgeTextActive
                ]}>
                  {type.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={{
                id: document.id,
                type: document.type,
                vehiclePlate: document.vehicle_plate || '',
                fileName: document.file_name,
                uploadDate: document.upload_date,
                expiryDate: document.expiry_date || '2030-12-31',
                status: document.status as 'valid' | 'expiring' | 'expired',
                size: document.size || '0 KB',
              }}
              onView={() => viewDocument(document)}
              onDownload={() => downloadDocument(document)}
            />
          ))}

          {filteredDocuments.length === 0 && (
            <View style={styles.emptyContainer}>
              <FileText size={64} color="#64748B" strokeWidth={2} />
              <Text style={styles.emptyTitle}>Nenhum documento encontrado</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === 'all' 
                  ? hasPermission('documents', 'create')
                    ? 'Faça upload dos seus documentos para começar'
                    : 'Não há documentos disponíveis para visualizar'
                  : `Não há documentos do tipo "${documentTypes.find(t => t.value === selectedFilter)?.label}"`
                }
              </Text>
              {hasPermission('documents', 'create') && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowUploadModal(true)}
                >
                  <Text style={styles.emptyButtonText}>Adicionar Documento</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Upload Modal */}
        <Modal visible={showUploadModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.uploadModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar Documento</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <X size={24} color="#64748B" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Seleção de Veículo */}
              <View style={{ marginHorizontal: 20, marginTop: 10, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: '#1F2937', marginBottom: 8 }}>
                  Selecione o veículo relacionado *
                </Text>
                {vehicles.length > 0 ? (
                  <RNPickerSelect
                    onValueChange={setSelectedVehicle}
                    value={selectedVehicle}
                    placeholder={{ label: 'Selecione a matrícula', value: '' }}
                    items={vehicles.map((v) => ({ label: v.plate, value: v.plate }))}
                    style={{
                      inputIOS: {
                        fontSize: 16,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 8,
                        color: '#1F2937',
                        backgroundColor: '#F8FAFC',
                        marginBottom: 8,
                      },
                      inputAndroid: {
                        fontSize: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        borderRadius: 8,
                        color: '#1F2937',
                        backgroundColor: '#F8FAFC',
                        marginBottom: 8,
                      },
                      placeholder: {
                        color: '#9CA3AF',
                      },
                    }}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => (
                      <View style={{ position: 'absolute', right: 10, top: 18 }}>
                        <Text style={{ fontSize: 18, color: '#64748B' }}>▼</Text>
                      </View>
                    )}
                    modalProps={{
                      presentationStyle: 'overFullScreen',
                    }}
                    doneText="OK"
                    onDonePress={() => Keyboard.dismiss && Keyboard.dismiss()}
                  />
                ) : (
                  <Text style={{ color: '#DC2626', fontSize: 14 }}>Cadastre um veículo primeiro.</Text>
                )}
              </View>

              <View style={{ marginHorizontal: 20, marginTop: 10, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: '#1F2937', marginBottom: 8 }}>
                  Tipo de Documento *
                </Text>
                <RNPickerSelect
                  onValueChange={setSelectedType}
                  value={selectedType}
                  placeholder={{ label: 'Selecione o tipo', value: '' }}
                  items={[
                    { label: 'Seguro', value: 'Seguro' },
                    { label: 'Livrete', value: 'Livrete' },
                    { label: 'Inspeção', value: 'Inspeção' },
                    { label: 'Título de Propriedade', value: 'Título de Propriedade' },
                  ]}
                  style={{
                    inputIOS: {
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      color: '#1F2937',
                      backgroundColor: '#F8FAFC',
                      marginBottom: 8,
                    },
                    inputAndroid: {
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 8,
                      color: '#1F2937',
                      backgroundColor: '#F8FAFC',
                      marginBottom: 8,
                    },
                    placeholder: {
                      color: '#9CA3AF',
                    },
                  }}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => (
                    <View style={{ position: 'absolute', right: 10, top: 18 }}>
                      <Text style={{ fontSize: 18, color: '#64748B' }}>▼</Text>
                    </View>
                  )}
                  modalProps={{
                    presentationStyle: 'overFullScreen',
                  }}
                  doneText="OK"
                  onDonePress={() => Keyboard.dismiss && Keyboard.dismiss()}
                />
              </View>

              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                  <Upload size={32} color="#059669" strokeWidth={2} />
                  <Text style={styles.uploadOptionTitle}>Selecionar Imagem</Text>
                  <Text style={styles.uploadOptionText}>
                    Selecione uma foto do documento
                  </Text>
                </TouchableOpacity>
              </View>

              {fileUrl ? (
                <View style={{ marginHorizontal: 20, marginBottom: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#2563EB', fontSize: 14 }}>
                    Arquivo selecionado: {fileName}
                    {selectedFile && !isUploading && ' (aguardando envio)'}
                    {isUploading && ' (enviando...)'}
                  </Text>
                  <Image source={{ uri: fileUrl }} style={{ width: 120, height: 120, borderRadius: 8, marginTop: 8 }} />
                </View>
              ) : null}

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Validade</Text>
                {Platform.OS === 'web' ? (
                  <TextInput
                    style={styles.dateInput}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setShowExpiryPicker(true)} style={styles.dateInput}>
                      <Text style={{ color: expiryDate ? '#111' : '#888' }}>{expiryDate || 'Selecione a data'}</Text>
                    </TouchableOpacity>
                    {showExpiryPicker && (
                      <DateTimePicker
                        value={expiryDate ? new Date(expiryDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                          setShowExpiryPicker(false);
                          if (date) setExpiryDate(date.toISOString().split('T')[0]);
                        }}
                      />
                    )}
                  </>
                )}
                {Platform.OS === 'web' && (
                  <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                    Formato: YYYY-MM-DD
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  (!(selectedVehicle && selectedType && expiryDate && selectedFile) || isUploading) && { opacity: 0.5 }
                ]}
                disabled={!(selectedVehicle && selectedType && expiryDate && selectedFile) || isUploading}
                onPress={handleSaveDocument}
              >
                <Text style={styles.saveButtonText}>
                  {isUploading ? 'Enviando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Document Viewer Modal */}
        <Modal visible={!!selectedDocument} animationType="slide" presentationStyle="pageSheet">
          {selectedDocument && (
            <SafeAreaView style={styles.viewerContainer}>
              <View style={styles.viewerHeader}>
                <View>
                  <Text style={styles.viewerTitle}>{selectedDocument.type}</Text>
                  <Text style={styles.viewerSubtitle}>{selectedDocument.vehicle_plate}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedDocument(null)}
                >
                  <X size={24} color="#64748B" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.viewerContent}>
                <View style={styles.documentPreview}>
                  {selectedDocument.file_url ? (
                    <Image 
                      source={{ uri: selectedDocument.file_url }} 
                      style={styles.documentImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <FileText size={48} color="#64748B" strokeWidth={2} />
                  )}
                  <Text style={styles.previewText}>
                    {selectedDocument.file_url ? 'Imagem do documento' : 'Pré-visualização do documento'}
                  </Text>
                  <Text style={styles.previewFileName}>{selectedDocument.file_name}</Text>
                </View>

                <View style={styles.viewerActions}>
                  <TouchableOpacity 
                    style={styles.viewerButton}
                    onPress={() => downloadDocument(selectedDocument)}
                  >
                    <Download size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.viewerButtonText}>Baixar</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
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
  uploadButton: {
    backgroundColor: '#2563EB',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#2563EB',
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
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  uploadModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  closeButton: {
    padding: 4,
  },
  uploadOptions: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  uploadOption: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  uploadOptionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  viewerHeader: {
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
  viewerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  viewerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  viewerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  documentPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  documentImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginTop: 16,
  },
  previewFileName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 8,
  },
  viewerActions: {
    padding: 20,
  },
  viewerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
  },
  viewerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  inputRow: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});