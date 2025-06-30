export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'operator' | 'agent' | 'citizen' | 'company'
          badge?: string
          company?: string
          photo?: string
          phone?: string
          address?: string
          birth_date?: string
          created_at: string
          updated_at: string
          last_login?: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'operator' | 'agent' | 'citizen' | 'company'
          badge?: string
          company?: string
          photo?: string
          phone?: string
          address?: string
          birth_date?: string
          created_at?: string
          updated_at?: string
          last_login?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'operator' | 'agent' | 'citizen' | 'company'
          badge?: string
          company?: string
          photo?: string
          phone?: string
          address?: string
          birth_date?: string
          created_at?: string
          updated_at?: string
          last_login?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate: string
          brand: string
          model: string
          year: number
          color?: string
          type: string
          owner_id: string
          insurance_expiry?: string
          circulation_expiry?: string
          inspection_expiry?: string
          status: 'active' | 'sold' | 'damaged' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plate: string
          brand: string
          model: string
          year: number
          color?: string
          type: string
          owner_id: string
          insurance_expiry?: string
          circulation_expiry?: string
          inspection_expiry?: string
          status?: 'active' | 'sold' | 'damaged' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plate?: string
          brand?: string
          model?: string
          year?: number
          color?: string
          type?: string
          owner_id?: string
          insurance_expiry?: string
          circulation_expiry?: string
          inspection_expiry?: string
          status?: 'active' | 'sold' | 'damaged' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          license_number: string
          categories: string[]
          issue_date: string
          expiry_date: string
          birth_date: string
          address?: string
          phone?: string
          email?: string
          photo?: string
          status: 'valid' | 'expiring' | 'expired' | 'suspended'
          points: number
          max_points: number
          medical_exam?: string
          company?: string
          owner_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          license_number: string
          categories: string[]
          issue_date: string
          expiry_date: string
          birth_date: string
          address?: string
          phone?: string
          email?: string
          photo?: string
          status?: 'valid' | 'expiring' | 'expired' | 'suspended'
          points?: number
          max_points?: number
          medical_exam?: string
          company?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          license_number?: string
          categories?: string[]
          issue_date?: string
          expiry_date?: string
          birth_date?: string
          address?: string
          phone?: string
          email?: string
          photo?: string
          status?: 'valid' | 'expiring' | 'expired' | 'suspended'
          points?: number
          max_points?: number
          medical_exam?: string
          company?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          type: string
          vehicle_plate: string
          file_name: string
          file_url?: string
          upload_date: string
          expiry_date?: string
          status: 'valid' | 'expiring' | 'expired'
          size?: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          vehicle_plate: string
          file_name: string
          file_url?: string
          upload_date: string
          expiry_date?: string
          status?: 'valid' | 'expiring' | 'expired'
          size?: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          vehicle_plate?: string
          file_name?: string
          file_url?: string
          upload_date?: string
          expiry_date?: string
          status?: 'valid' | 'expiring' | 'expired'
          size?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      fines: {
        Row: {
          id: string
          type: string
          vehicle_plate: string
          driver_name: string
          driver_license: string
          amount: number
          points: number
          location: string
          date: string
          time: string
          status: 'pending' | 'paid' | 'contested' | 'cancelled'
          description?: string
          agent_id?: string
          agent_name?: string
          agent_badge?: string
          photos?: string[]
          evidence?: string[]
          payment_date?: string
          contest_date?: string
          contest_reason?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          vehicle_plate: string
          driver_name: string
          driver_license: string
          amount: number
          points: number
          location: string
          date: string
          time: string
          status?: 'pending' | 'paid' | 'contested' | 'cancelled'
          description?: string
          agent_id?: string
          agent_name?: string
          agent_badge?: string
          photos?: string[]
          evidence?: string[]
          payment_date?: string
          contest_date?: string
          contest_reason?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          vehicle_plate?: string
          driver_name?: string
          driver_license?: string
          amount?: number
          points?: number
          location?: string
          date?: string
          time?: string
          status?: 'pending' | 'paid' | 'contested' | 'cancelled'
          description?: string
          agent_id?: string
          agent_name?: string
          agent_badge?: string
          photos?: string[]
          evidence?: string[]
          payment_date?: string
          contest_date?: string
          contest_reason?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'expiry' | 'fine' | 'reminder' | 'system'
          title: string
          description: string
          vehicle_plate?: string
          priority: 'high' | 'medium' | 'low'
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'expiry' | 'fine' | 'reminder' | 'system'
          title: string
          description: string
          vehicle_plate?: string
          priority?: 'high' | 'medium' | 'low'
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'expiry' | 'fine' | 'reminder' | 'system'
          title?: string
          description?: string
          vehicle_plate?: string
          priority?: 'high' | 'medium' | 'low'
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'operator' | 'agent' | 'citizen' | 'company'
      vehicle_status: 'active' | 'sold' | 'damaged' | 'inactive'
      driver_status: 'valid' | 'expiring' | 'expired' | 'suspended'
      document_status: 'valid' | 'expiring' | 'expired'
      fine_status: 'pending' | 'paid' | 'contested' | 'cancelled'
      notification_type: 'expiry' | 'fine' | 'reminder' | 'system'
      notification_priority: 'high' | 'medium' | 'low'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}