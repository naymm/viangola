import { supabase } from './supabase';
import { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Driver = Database['public']['Tables']['drivers']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];
type Fine = Database['public']['Tables']['fines']['Row'];
type Notification = Database['public']['Tables']['notifications']['Row'];

// ===== USERS =====
export const userService = {
  // Buscar perfil do usuário logado
  async getCurrentUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar perfil do usuário
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar todos os usuários (apenas para operadores)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }
};

// ===== VEHICLES =====
export const vehicleService = {
  // Buscar veículos do usuário logado
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    console.log('🔍 vehicleService.getUserVehicles - userId:', userId);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro em getUserVehicles:', error);
      throw error;
    }
    console.log('✅ getUserVehicles retornou:', data?.length || 0, 'veículos');
    return data || [];
  },

  // Buscar todos os veículos (para operadores e agentes)
  async getAllVehicles(): Promise<Vehicle[]> {
    console.log('🔍 vehicleService.getAllVehicles');
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro em getAllVehicles:', error);
      throw error;
    }
    console.log('✅ getAllVehicles retornou:', data?.length || 0, 'veículos');
    return data || [];
  },

  // Buscar veículo por ID
  async getVehicleById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar veículo por matrícula
  async getVehicleByPlate(plate: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate', plate)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Criar novo veículo
  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar veículo
  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      // Primeiro, verificar se o veículo existe
      const existingVehicle = await this.getVehicleById(id);
      if (!existingVehicle) {
        throw new Error('Veículo não encontrado');
      }

      // Remover campos que não devem ser atualizados
      const { id: _, created_at: __, updated_at: ___, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar veículo:', error);
        throw new Error(`Erro ao atualizar veículo: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Nenhum veículo foi atualizado');
      }
      
      return data;
    } catch (error) {
      console.error('Erro no updateVehicle:', error);
      throw error;
    }
  },

  // Deletar veículo
  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===== DRIVERS =====
export const driverService = {
  // Buscar condutores do usuário logado
  async getUserDrivers(userId: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar todos os condutores (para operadores e agentes)
  async getAllDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar condutor por ID
  async getDriverById(id: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar condutor por número da carta
  async getDriverByLicense(licenseNumber: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('license_number', licenseNumber)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Criar novo condutor
  async createDriver(driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driver)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar condutor
  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    try {
      // Primeiro, verificar se o condutor existe
      const existingDriver = await this.getDriverById(id);
      if (!existingDriver) {
        throw new Error('Condutor não encontrado');
      }

      // Remover campos que não devem ser atualizados
      const { id: _, created_at: __, updated_at: ___, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('drivers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar condutor:', error);
        throw new Error(`Erro ao atualizar condutor: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Nenhum condutor foi atualizado');
      }
      
      return data;
    } catch (error) {
      console.error('Erro no updateDriver:', error);
      throw error;
    }
  },

  // Deletar condutor
  async deleteDriver(id: string): Promise<void> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===== DOCUMENTS =====
export const documentService = {
  // Buscar documentos do usuário logado
  async getUserDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar documentos por veículo
  async getDocumentsByVehicle(vehiclePlate: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('vehicle_plate', vehiclePlate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar documento por ID
  async getDocumentById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Criar novo documento
  async createDocument(document: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar documento
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    try {
      // Primeiro, verificar se o documento existe
      const existingDocument = await this.getDocumentById(id);
      if (!existingDocument) {
        throw new Error('Documento não encontrado');
      }

      // Remover campos que não devem ser atualizados
      const { id: _, created_at: __, updated_at: ___, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar documento:', error);
        throw new Error(`Erro ao atualizar documento: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Nenhum documento foi atualizado');
      }
      
      return data;
    } catch (error) {
      console.error('Erro no updateDocument:', error);
      throw error;
    }
  },

  // Deletar documento
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===== FINES =====
export const fineService = {
  // Buscar multas do usuário logado
  async getUserFines(userId: string): Promise<Fine[]> {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .or(`vehicle_plate.in.(select plate from vehicles where owner_id = '${userId}')`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar todas as multas (para operadores e agentes)
  async getAllFines(): Promise<Fine[]> {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar multa por ID
  async getFineById(id: string): Promise<Fine | null> {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Criar nova multa
  async createFine(fine: Omit<Fine, 'id' | 'created_at' | 'updated_at'>): Promise<Fine> {
    const { data, error } = await supabase
      .from('fines')
      .insert(fine)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Criar nova multa e retornar o registro criado (alias para createFine)
  async createFineWithReturn(fine: Omit<Fine, 'id' | 'created_at' | 'updated_at'>): Promise<Fine> {
    return this.createFine(fine);
  },

  // Atualizar multa
  async updateFine(id: string, updates: Partial<Fine>): Promise<Fine> {
    try {
      // Primeiro, verificar se a multa existe
      const existingFine = await this.getFineById(id);
      if (!existingFine) {
        throw new Error('Multa não encontrada');
      }

      // Remover campos que não devem ser atualizados
      const { id: _, created_at: __, updated_at: ___, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('fines')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar multa:', error);
        throw new Error(`Erro ao atualizar multa: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Nenhuma multa foi atualizada');
      }
      
      return data;
    } catch (error) {
      console.error('Erro no updateFine:', error);
      throw error;
    }
  },

  // Deletar multa
  async deleteFine(id: string): Promise<void> {
    const { error } = await supabase
      .from('fines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Buscar multas pendentes por placa ou carta
  async getPendingFinesByPlateOrLicense(plate: string, license?: string): Promise<Fine[]> {
    let query = supabase
      .from('fines')
      .select('*')
      .eq('status', 'pending');
    if (plate && license) {
      query = query.or(`vehicle_plate.eq.${plate},driver_license.eq.${license}`);
    } else if (plate) {
      query = query.eq('vehicle_plate', plate);
    } else if (license) {
      query = query.eq('driver_license', license);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};

// ===== NOTIFICATIONS =====
export const notificationService = {
  // Buscar notificações do usuário logado
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Marcar notificação como lida
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  // Deletar notificação
  async deleteNotification(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===== SEARCH =====
export const searchService = {
  // Pesquisar veículos
  async searchVehicles(query: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .or(`plate.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Pesquisar condutores
  async searchDrivers(query: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .or(`name.ilike.%${query}%,license_number.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Pesquisar multas
  async searchFines(query: string): Promise<Fine[]> {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .or(`vehicle_plate.ilike.%${query}%,driver_name.ilike.%${query}%,type.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}; 