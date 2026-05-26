export type UserRole = 'ADMIN' | 'PARTICIPANTE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export type EventStatus = 'ativo' | 'encerrado' | 'lotado';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  banner_url?: string;
  location: string;
  event_date: string;
  max_participants: number;
  is_paid: boolean;
  price?: number;
  whatsapp_contact?: string;
  status: EventStatus;
  created_by: string;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  qr_code: string;
  unique_token: string;
  checkin_done: boolean;
  checkin_at?: string | null;
  created_at: string;
  
  // Relações opcionais úteis para o frontend
  event?: Event;
  user?: Omit<User, 'password_hash'>;
}

export interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  exp: number;
}
