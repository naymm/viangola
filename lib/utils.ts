import { supabase } from './supabase';

// Função para formatar matrícula angolana no padrão LD-XX-XX-XX ou LDA-XX-XX-XX
export function formatAngolaPlate(plate: string): string {
  // Remove todos os caracteres não alfanuméricos
  const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Verificar se já tem o formato correto (LD ou LDA)
  if (cleanPlate.startsWith('LD')) {
    if (cleanPlate.length === 8 && cleanPlate.startsWith('LD') && !cleanPlate.startsWith('LDA')) {
      // Formato LD-XX-XX-XX
      return `${cleanPlate.slice(0, 2)}-${cleanPlate.slice(2, 4)}-${cleanPlate.slice(4, 6)}-${cleanPlate.slice(6, 8)}`;
    } else if (cleanPlate.length === 9 && cleanPlate.startsWith('LDA')) {
      // Formato LDA-XX-XX-XX
      return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3, 5)}-${cleanPlate.slice(5, 7)}-${cleanPlate.slice(7, 9)}`;
    }
  }
  
  // Se tem menos caracteres, adicionar prefixo se necessário
  let formattedPlate = cleanPlate;
  if (cleanPlate.length < 8) {
    if (!cleanPlate.startsWith('LD')) {
      // Por padrão, adiciona LD (formato mais comum)
      formattedPlate = 'LD' + cleanPlate;
    }
  } else if (cleanPlate.length === 8 && !cleanPlate.startsWith('LD')) {
    // Se tem 8 caracteres mas não começa com LD, adicionar LD
    formattedPlate = 'LD' + cleanPlate;
  }
  
  // Formatar com hífens baseado no prefixo
  if (formattedPlate.startsWith('LDA')) {
    // Formato LDA-XX-XX-XX
    if (formattedPlate.length >= 3) {
      let result = formattedPlate.slice(0, 3);
      
      if (formattedPlate.length >= 5) {
        result += '-' + formattedPlate.slice(3, 5);
        
        if (formattedPlate.length >= 7) {
          result += '-' + formattedPlate.slice(5, 7);
          
          if (formattedPlate.length >= 9) {
            result += '-' + formattedPlate.slice(7, 9);
          } else {
            result += '-' + formattedPlate.slice(7);
          }
        } else {
          result += '-' + formattedPlate.slice(5);
        }
      } else {
        result += '-' + formattedPlate.slice(3);
      }
      
      return result;
    }
  } else {
    // Formato LD-XX-XX-XX
    if (formattedPlate.length >= 2) {
      let result = formattedPlate.slice(0, 2);
      
      if (formattedPlate.length >= 4) {
        result += '-' + formattedPlate.slice(2, 4);
        
        if (formattedPlate.length >= 6) {
          result += '-' + formattedPlate.slice(4, 6);
          
          if (formattedPlate.length >= 8) {
            result += '-' + formattedPlate.slice(6, 8);
          } else {
            result += '-' + formattedPlate.slice(6);
          }
        } else {
          result += '-' + formattedPlate.slice(4);
        }
      } else {
        result += '-' + formattedPlate.slice(2);
      }
      
      return result;
    }
  }
  
  return formattedPlate;
}

// Função para limpar matrícula (remover hífens)
export function cleanPlate(plate: string): string {
  return plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

// Função para validar matrícula angolana (LD ou LDA)
export function validateAngolaPlate(plate: string): boolean {
  const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Verificar formato LD-XX-XX-XX (8 caracteres)
  if (cleanPlate.length === 8 && cleanPlate.startsWith('LD') && !cleanPlate.startsWith('LDA')) {
    // Os caracteres 3-4 e 5-6 devem ser números
    const numbers1 = cleanPlate.slice(2, 4);
    const numbers2 = cleanPlate.slice(4, 6);
    
    if (!/^\d{2}$/.test(numbers1) || !/^\d{2}$/.test(numbers2)) {
      return false;
    }
    
    // Os caracteres 7-8 devem ser letras
    const letters = cleanPlate.slice(6, 8);
    if (!/^[A-Z]{2}$/.test(letters)) {
      return false;
    }
    
    return true;
  }
  
  // Verificar formato LDA-XX-XX-XX (9 caracteres)
  if (cleanPlate.length === 9 && cleanPlate.startsWith('LDA')) {
    // Os caracteres 4-5 e 6-7 devem ser números
    const numbers1 = cleanPlate.slice(3, 5);
    const numbers2 = cleanPlate.slice(5, 7);
    
    if (!/^\d{2}$/.test(numbers1) || !/^\d{2}$/.test(numbers2)) {
      return false;
    }
    
    // Os caracteres 8-9 devem ser letras
    const letters = cleanPlate.slice(7, 9);
    if (!/^[A-Z]{2}$/.test(letters)) {
      return false;
    }
    
    return true;
  }
  
  return false;
}

export async function saveDeviceToken(userId: string, token: string, platform: string) {
  if (!userId || !token) return;
  await supabase.from('device_tokens').upsert({ user_id: userId, token, platform });
} 