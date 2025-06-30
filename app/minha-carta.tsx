import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, Save, Edit3 } from 'lucide-react-native';

export default function MinhaCartaScreen() {
  const { user } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    license_number: '',
    categories: '',
    issue_date: '',
    expiry_date: '',
  });

  useEffect(() => {
    if (user) fetchDriver();
  }, [user]);

  const fetchDriver = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    if (data) {
      setDriver(data);
      setForm({
        license_number: data.license_number || '',
        categories: data.categories || '',
        issue_date: data.issue_date || '',
        expiry_date: data.expiry_date || '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.license_number || !/^LD-\d{6}$/.test(form.license_number)) {
      Alert.alert('Erro', 'Número da carta inválido. Use LD-XXXXXX');
      return;
    }
    if (!form.categories) {
      Alert.alert('Erro', 'Informe as categorias');
      return;
    }
    if (!form.issue_date || !form.expiry_date) {
      Alert.alert('Erro', 'Informe as datas');
      return;
    }
    setLoading(true);
    let result;
    // Converter categorias para array se necessário
    const categoriesArray = form.categories.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (driver) {
      // Atualizar
      result = await supabase.from('drivers').update({
        license_number: form.license_number,
        categories: categoriesArray,
        issue_date: form.issue_date,
        expiry_date: form.expiry_date,
      }).eq('id', driver.id);
    } else {
      // Verificar se já existe carta para este usuário
      const { data: existing, error: fetchError } = await supabase
        .from('drivers')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (existing) {
        setLoading(false);
        Alert.alert('Atenção', 'Você já possui uma carta cadastrada. Só é possível editar.');
        fetchDriver();
        return;
      }
      // Criar
      result = await supabase.from('drivers').insert({
        owner_id: user.id,
        user_id: user.id,
        name: user.name,
        address: user.address,
        phone: user.phone,
        email: user.email,
        license_number: form.license_number,
        categories: categoriesArray,
        issue_date: form.issue_date,
        expiry_date: form.expiry_date,
        status: 'active',
      });
    }
    setLoading(false);
    if (result.error) {
      Alert.alert('Erro', 'Não foi possível salvar a carta: ' + result.error.message);
    } else {
      Alert.alert('Sucesso', 'Dados da carta salvos!');
      setEditing(false);
      fetchDriver();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Minha Carta de Condução</Text>
        <View style={styles.cardShadow}>
          <View style={styles.cardContent}>
            <View style={styles.row}>
              <Text style={styles.label}>Nome</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.value}>{user.phone || '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>{user.address || '-'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Número da Carta</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.license_number}
                  onChangeText={t => {
                    const numbers = t.replace(/\D/g, '');
                    setForm(f => ({ ...f, license_number: `LD-${numbers.slice(0,6)}` }));
                  }}
                  placeholder="LD-XXXXXX"
                  maxLength={9}
                />
              ) : (
                <Text style={styles.value}>{driver?.license_number || '-'}</Text>
              )}
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Categorias</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.categories}
                  onChangeText={t => setForm(f => ({ ...f, categories: t }))}
                  placeholder="Ex: B,C"
                />
              ) : (
                <Text style={styles.value}>{driver?.categories || '-'}</Text>
              )}
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data de Emissão</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.issue_date}
                  onChangeText={t => setForm(f => ({ ...f, issue_date: t }))}
                  placeholder="AAAA-MM-DD"
                />
              ) : (
                <Text style={styles.value}>{driver?.issue_date || '-'}</Text>
              )}
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data de Validade</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.expiry_date}
                  onChangeText={t => setForm(f => ({ ...f, expiry_date: t }))}
                  placeholder="AAAA-MM-DD"
                />
              ) : (
                <Text style={styles.value}>{driver?.expiry_date || '-'}</Text>
              )}
            </View>
          </View>
        </View>
        {editing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            <Save size={20} color="#fff" />
            <Text style={styles.saveButtonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
            <Edit3 size={20} color="#2563EB" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 28, color: '#1E293B', textAlign: 'center', letterSpacing: 0.5 },
  cardShadow: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 32 },
  cardContent: { padding: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  label: { fontSize: 14, color: '#64748B', fontWeight: '500', flex: 1 },
  value: { fontSize: 16, color: '#1E293B', fontWeight: 'bold', flex: 1, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 8, fontSize: 16, flex: 1, textAlign: 'right', backgroundColor: '#F1F5F9' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 8, padding: 16, justifyContent: 'center', marginBottom: 12 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E7EF', borderRadius: 8, padding: 16, justifyContent: 'center', marginBottom: 12 },
  editButtonText: { color: '#2563EB', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  loadingText: { fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 40 },
}); 