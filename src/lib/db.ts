import { createClient } from '@supabase/supabase-js';
import { User, Event, Registration, UserRole, EventStatus } from './types';

// Verificar se as credenciais do Supabase estão configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Inicializar cliente do Supabase se configurado
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

console.log(`[DB] EventFlow inicializado em modo: ${isSupabaseConfigured ? 'SUPABASE REAL' : 'FALLBACK LOCAL (JSON)'}`);

// --- IMPLEMENTAÇÃO DE FALLBACK LOCAL (ARQUIVO JSON) ---
// Carregar módulos fs e path dinamicamente apenas no ambiente Node
let fs: any = null;
let path: any = null;

if (typeof window === 'undefined') {
  fs = require('fs');
  path = require('path');
}

const getLocalDbPath = () => {
  if (!path) return '';
  return path.join(process.cwd(), 'database', 'db_store.json');
};

interface LocalDB {
  users: User[];
  events: Event[];
  registrations: Registration[];
}

const defaultDB: LocalDB = {
  users: [
    {
      id: 'd3b07384-d113-4ec6-a558-7beb2d68b23f',
      name: 'Organizador Admin',
      email: 'admin@eventflow.com',
      phone: '(11) 99999-9999',
      password_hash: '$2a$10$7wQ.YskqZ8p1hW7FpU5yK.mQk99J4Z89kE7q4J5z2G2m3L2a7K8iG', // admin123
      role: 'ADMIN',
      created_at: new Date('2026-01-01').toISOString(),
    },
    {
      id: 'a1b07384-d113-4ec6-a558-7beb2d68b23f',
      name: 'Participante Teste',
      email: 'participante@gmail.com',
      phone: '(11) 98888-8888',
      password_hash: '$2a$10$7wQ.YskqZ8p1hW7FpU5yK.mQk99J4Z89kE7q4J5z2G2m3L2a7K8iG', // user123 (usando mesma hash para simplificar)
      role: 'PARTICIPANTE',
      created_at: new Date('2026-01-02').toISOString(),
    }
  ],
  events: [
    {
      id: 'e1b07384-d113-4ec6-a558-7beb2d68b23f',
      title: 'Next.js & Supabase Masterclass 2026',
      slug: 'nextjs-supabase-masterclass-2026',
      description: 'Aprenda a construir plataformas SaaS ultra velozes de ponta a ponta com Next.js App Router, TailwindCSS e Supabase. Uma imersão de 8 horas com direito a certificado e QR Code de check-in na entrada!',
      banner_url: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      location: 'Av. Paulista, 1000 - São Paulo, SP',
      event_date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 dias no futuro
      max_participants: 100,
      is_paid: false,
      status: 'ativo',
      created_by: 'd3b07384-d113-4ec6-a558-7beb2d68b23f',
      created_at: new Date().toISOString(),
    },
    {
      id: 'e2b07384-d113-4ec6-a558-7beb2d68b23f',
      title: 'SaaS Summit Brasil',
      slug: 'saas-summit-brasil',
      description: 'O maior encontro de fundadores, desenvolvedores e entusiastas de produtos de software por assinatura (SaaS) da América Latina. Palestras exclusivas sobre scale, marketing, precificação e tecnologia.',
      banner_url: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      location: 'Centro de Convenções Rebouças, São Paulo',
      event_date: new Date(Date.now() + 86400000 * 12).toISOString(), // 12 dias no futuro
      max_participants: 2, // Limite pequeno para podermos testar o status "lotado" facilmente!
      is_paid: true,
      status: 'ativo',
      created_by: 'd3b07384-d113-4ec6-a558-7beb2d68b23f',
      created_at: new Date().toISOString(),
    }
  ],
  registrations: []
};

// Ler banco de dados do arquivo JSON
const readLocalDB = (): LocalDB => {
  if (typeof window !== 'undefined' || !fs) return defaultDB;
  
  const dbPath = getLocalDbPath();
  try {
    if (!fs.existsSync(dbPath)) {
      // Criar diretório se não existir
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Criar arquivo com valores padrão
      fs.writeFileSync(dbPath, JSON.stringify(defaultDB, null, 2), 'utf-8');
      return defaultDB;
    }
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data) as LocalDB;
  } catch (error) {
    console.error('[DB] Erro ao ler banco local:', error);
    return defaultDB;
  }
};

// Escrever no banco de dados local
const writeLocalDB = (db: LocalDB) => {
  if (typeof window !== 'undefined' || !fs) return;
  const dbPath = getLocalDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('[DB] Erro ao gravar banco local:', error);
  }
};

// --- CLIENTE DB EXPORTADO (UNIFICADO) ---
export const db = {
  // --- OPERAÇÕES DE USERS ---
  async getUserByEmail(email: string): Promise<User | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) console.error('[Supabase] Erro ao buscar usuário por email:', error);
      return data;
    } else {
      const local = readLocalDB();
      return local.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) console.error('[Supabase] Erro ao buscar usuário por ID:', error);
      return data;
    } else {
      const local = readLocalDB();
      return local.users.find(u => u.id === id) || null;
    }
  },

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      if (error) {
        console.error('[Supabase] Erro ao criar usuário:', error);
        throw error;
      }
      return data;
    } else {
      const local = readLocalDB();
      local.users.push(newUser);
      writeLocalDB(local);
      return newUser;
    }
  },

  // --- OPERAÇÕES DE EVENTS ---
  async getEvents(): Promise<Event[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) console.error('[Supabase] Erro ao listar eventos:', error);
      return data || [];
    } else {
      const local = readLocalDB();
      // Atualizar status automático se atingiu o máximo de participantes
      for (const ev of local.events) {
        const regsCount = local.registrations.filter(r => r.event_id === ev.id).length;
        const now = new Date();
        const evDate = new Date(ev.event_date);
        
        if (evDate < now) {
          ev.status = 'encerrado';
        } else if (regsCount >= ev.max_participants) {
          ev.status = 'lotado';
        } else {
          ev.status = 'ativo';
        }
      }
      writeLocalDB(local);
      return local.events;
    }
  },

  async getEventBySlug(slug: string): Promise<Event | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) console.error('[Supabase] Erro ao buscar evento por slug:', error);
      return data;
    } else {
      const events = await this.getEvents();
      return events.find(e => e.slug === slug) || null;
    }
  },

  async getEventById(id: string): Promise<Event | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) console.error('[Supabase] Erro ao buscar evento por ID:', error);
      return data;
    } else {
      const events = await this.getEvents();
      return events.find(e => e.id === id) || null;
    }
  },

  async createEvent(event: Omit<Event, 'id' | 'created_at' | 'status'> & { status?: EventStatus }): Promise<Event> {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      status: event.status || 'ativo',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()
        .single();
      if (error) {
        console.error('[Supabase] Erro ao criar evento:', error);
        throw error;
      }
      return data;
    } else {
      const local = readLocalDB();
      local.events.push(newEvent);
      writeLocalDB(local);
      return newEvent;
    }
  },

  async updateEvent(id: string, eventUpdate: Partial<Omit<Event, 'id' | 'created_at'>>): Promise<Event> {
    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .update(eventUpdate)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('[Supabase] Erro ao atualizar evento:', error);
        throw error;
      }
      return data;
    } else {
      const local = readLocalDB();
      const idx = local.events.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Evento não encontrado');
      
      local.events[idx] = {
        ...local.events[idx],
        ...eventUpdate
      };
      
      writeLocalDB(local);
      return local.events[idx];
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('[Supabase] Erro ao excluir evento:', error);
        return false;
      }
      return true;
    } else {
      const local = readLocalDB();
      const initialLength = local.events.length;
      local.events = local.events.filter(e => e.id !== id);
      local.registrations = local.registrations.filter(r => r.event_id !== id); // Excluir inscrições órfãs
      writeLocalDB(local);
      return local.events.length < initialLength;
    }
  },

  // --- OPERAÇÕES DE REGISTRATIONS ---
  async getRegistrationsByEventId(eventId: string): Promise<Registration[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          user:users(id, name, email, phone)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) console.error('[Supabase] Erro ao buscar inscrições por evento:', error);
      return data || [];
    } else {
      const local = readLocalDB();
      const regs = local.registrations.filter(r => r.event_id === eventId);
      return regs.map(r => {
        const u = local.users.find(usr => usr.id === r.user_id);
        return {
          ...r,
          user: u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : undefined
        };
      });
    }
  },

  async getRegistrationsByUserId(userId: string): Promise<Registration[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) console.error('[Supabase] Erro ao buscar inscrições do usuário:', error);
      return data || [];
    } else {
      const local = readLocalDB();
      const regs = local.registrations.filter(r => r.user_id === userId);
      return regs.map(r => {
        const ev = local.events.find(event => event.id === r.event_id);
        return {
          ...r,
          event: ev
        };
      });
    }
  },

  async getRegistrationById(id: string): Promise<Registration | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*),
          user:users(id, name, email, phone)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) console.error('[Supabase] Erro ao buscar inscrição por ID:', error);
      return data;
    } else {
      const local = readLocalDB();
      const r = local.registrations.find(reg => reg.id === id);
      if (!r) return null;
      const ev = local.events.find(e => e.id === r.event_id);
      const u = local.users.find(usr => usr.id === r.user_id);
      return {
        ...r,
        event: ev,
        user: u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : undefined
      };
    }
  },

  async getRegistrationByToken(token: string): Promise<Registration | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*),
          user:users(id, name, email, phone)
        `)
        .eq('unique_token', token)
        .maybeSingle();
      if (error) console.error('[Supabase] Erro ao buscar inscrição por token:', error);
      return data;
    } else {
      const local = readLocalDB();
      const r = local.registrations.find(reg => reg.unique_token === token);
      if (!r) return null;
      const ev = local.events.find(e => e.id === r.event_id);
      const u = local.users.find(usr => usr.id === r.user_id);
      return {
        ...r,
        event: ev,
        user: u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : undefined
      };
    }
  },

  async createRegistration(registration: Omit<Registration, 'id' | 'created_at' | 'unique_token' | 'checkin_done' | 'checkin_at'>): Promise<Registration> {
    const newReg: Registration = {
      ...registration,
      id: crypto.randomUUID(),
      unique_token: crypto.randomUUID(),
      checkin_done: false,
      checkin_at: null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .insert([newReg])
        .select()
        .single();
      if (error) {
        console.error('[Supabase] Erro ao criar inscrição:', error);
        throw error;
      }
      return data;
    } else {
      const local = readLocalDB();
      
      // Validar email único no evento
      const user = local.users.find(u => u.id === registration.user_id);
      if (!user) throw new Error('Usuário não encontrado');
      
      const alreadyRegistered = local.registrations.some(
        r => r.event_id === registration.event_id && r.user_id === registration.user_id
      );
      
      if (alreadyRegistered) {
        throw new Error('Você já está inscrito neste evento!');
      }

      // Validar capacidade de vagas
      const ev = local.events.find(e => e.id === registration.event_id);
      if (!ev) throw new Error('Evento não encontrado');
      
      const count = local.registrations.filter(r => r.event_id === registration.event_id).length;
      if (count >= ev.max_participants) {
        throw new Error('Desculpe, este evento já está lotado!');
      }

      local.registrations.push(newReg);
      
      // Atualizar status do evento automaticamente
      if (count + 1 >= ev.max_participants) {
        ev.status = 'lotado';
      }

      writeLocalDB(local);
      return newReg;
    }
  },

  async updateRegistrationCheckin(registrationId: string, checkinDone: boolean, checkinAt: string | null): Promise<Registration> {
    if (supabase) {
      const { data, error } = await supabase
        .from('registrations')
        .update({
          checkin_done: checkinDone,
          checkin_at: checkinAt
        })
        .eq('id', registrationId)
        .select()
        .single();
      if (error) {
        console.error('[Supabase] Erro ao atualizar checkin:', error);
        throw error;
      }
      return data;
    } else {
      const local = readLocalDB();
      const idx = local.registrations.findIndex(r => r.id === registrationId);
      if (idx === -1) throw new Error('Inscrição não encontrada');
      
      local.registrations[idx] = {
        ...local.registrations[idx],
        checkin_done: checkinDone,
        checkin_at: checkinAt
      };
      
      writeLocalDB(local);
      return local.registrations[idx];
    }
  },

  // --- STATS PARA O DASHBOARD ---
  async getDashboardStats(): Promise<{
    totalEvents: number;
    activeEvents: number;
    totalRegistrations: number;
    confirmedCheckins: number;
    registrationsPerEvent: { title: string; count: number }[];
    checkinRatio: { label: string; count: number }[];
  }> {
    if (supabase) {
      // Obter dados em paralelo via Supabase
      const [eventsRes, regsRes] = await Promise.all([
        supabase.from('events').select('id, title, status'),
        supabase.from('registrations').select('id, event_id, checkin_done')
      ]);

      const events = eventsRes.data || [];
      const regs = regsRes.data || [];

      const totalEvents = events.length;
      const activeEvents = events.filter(e => e.status === 'ativo').length;
      const totalRegistrations = regs.length;
      const confirmedCheckins = regs.filter(r => r.checkin_done).length;

      // Calcular inscrições por evento
      const regCountMap: Record<string, number> = {};
      regs.forEach(r => {
        regCountMap[r.event_id] = (regCountMap[r.event_id] || 0) + 1;
      });

      const registrationsPerEvent = events.map(e => ({
        title: e.title,
        count: regCountMap[e.id] || 0
      })).slice(0, 5); // Limitar a top 5

      const checkinRatio = [
        { label: 'Presentes', count: confirmedCheckins },
        { label: 'Faltantes', count: totalRegistrations - confirmedCheckins }
      ];

      return {
        totalEvents,
        activeEvents,
        totalRegistrations,
        confirmedCheckins,
        registrationsPerEvent,
        checkinRatio
      };
    } else {
      const local = readLocalDB();
      const totalEvents = local.events.length;
      const activeEvents = local.events.filter(e => e.status === 'ativo').length;
      const totalRegistrations = local.registrations.length;
      const confirmedCheckins = local.registrations.filter(r => r.checkin_done).length;

      const registrationsPerEvent = local.events.map(e => {
        const count = local.registrations.filter(r => r.event_id === e.id).length;
        return {
          title: e.title,
          count
        };
      }).slice(0, 5);

      const checkinRatio = [
        { label: 'Presentes', count: confirmedCheckins },
        { label: 'Faltantes', count: totalRegistrations - confirmedCheckins }
      ];

      return {
        totalEvents,
        activeEvents,
        totalRegistrations,
        confirmedCheckins,
        registrationsPerEvent,
        checkinRatio
      };
    }
  }
};
