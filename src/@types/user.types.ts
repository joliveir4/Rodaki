// ─── User Domain Types ────────────────────────────────────────────────────────

export type UserRole = 'passenger' | 'driver';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PassengerAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Passenger extends User {
  role: 'passenger';
  driverId: string;          // Motorista responsável
  routeId: string;           // Rota associada
  monthlyFee: number;        // Mensalidade
  isActive: boolean;
  university: string;        // Faculdade/universidade
  address: PassengerAddress; // Endereço completo
}

export interface Driver extends User {
  role: 'driver';
  vehiclePlate: string;
  vehicleModel: string;
  passengerIds: string[];    // Lista de passageiros gerenciados
  pixKey: string;            // Chave PIX para pagamento
  pixKeyType: PixKeyType;
  address?: PassengerAddress; // Endereço residencial (opcional)
}

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  phone: string;
  role: UserRole;
}
