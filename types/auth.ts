export type UserRole = 'operator' | 'agent' | 'citizen' | 'company';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badge?: string;
  company?: string;
  photo?: string;
  permissions: Permission[];
  createdAt: string;
  lastLogin?: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  operator: [
    { resource: 'vehicles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'drivers', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'documents', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'fines', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'agents', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'search', actions: ['read'] },
  ],
  agent: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'drivers', actions: ['read'] },
    { resource: 'documents', actions: ['read'] },
    { resource: 'fines', actions: ['create', 'read', 'update'] },
    { resource: 'search', actions: ['read'] },
  ],
  citizen: [
    { resource: 'vehicles', actions: ['create', 'read', 'update'] },
    { resource: 'documents', actions: ['create', 'read', 'update'] },
    { resource: 'fines', actions: ['read'] },
    { resource: 'profile', actions: ['read', 'update'] },
  ],
  company: [
    { resource: 'vehicles', actions: ['create', 'read', 'update'] },
    { resource: 'drivers', actions: ['create', 'read', 'update'] },
    { resource: 'documents', actions: ['create', 'read', 'update'] },
    { resource: 'fines', actions: ['read'] },
    { resource: 'fleet', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
  ],
};

export const DEMO_USERS: User[] = [
  {
    id: '1',
    name: 'Admin Sistema',
    email: 'operador@autoveritas.pt',
    role: 'operator',
    badge: 'OP001',
    permissions: ROLE_PERMISSIONS.operator,
    createdAt: '2024-01-01T00:00:00Z',
    photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'João Silva Santos',
    email: 'agente@autoveritas.pt',
    role: 'agent',
    badge: 'AG001234',
    permissions: ROLE_PERMISSIONS.agent,
    createdAt: '2024-01-15T00:00:00Z',
    photo: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'Maria João Ferreira',
    email: 'cidadao@autoveritas.pt',
    role: 'citizen',
    permissions: ROLE_PERMISSIONS.citizen,
    createdAt: '2024-02-01T00:00:00Z',
    photo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  },
  {
    id: '4',
    name: 'Carlos Manuel Costa',
    email: 'empresa@autoveritas.pt',
    role: 'company',
    company: 'TransLisboa Lda.',
    permissions: ROLE_PERMISSIONS.company,
    createdAt: '2024-02-10T00:00:00Z',
    photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  },
];