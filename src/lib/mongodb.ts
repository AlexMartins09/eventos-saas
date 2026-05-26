import mongoose, { Schema } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Padrão global para Next.js para manter uma conexão única ativa 
 * entre os hot-reloads em ambiente de desenvolvimento.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('[MongoDB] Conectado ao banco de dados com sucesso!');
      return mongooseInstance;
    }).catch((err) => {
      console.error('[MongoDB] Erro ao conectar ao banco de dados:', err);
      cached.promise = null;
      throw err;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// --- SCHEMA DE USUÁRIOS ---
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'PARTICIPANTE'], default: 'PARTICIPANTE' },
  created_at: { type: String, default: () => new Date().toISOString() },
});

// --- SCHEMA DE EVENTOS ---
const EventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  banner_url: { type: String },
  location: { type: String, required: true },
  event_date: { type: String, required: true },
  max_participants: { type: Number, required: true },
  is_paid: { type: Boolean, required: true, default: false },
  price: { type: Number },
  whatsapp_contact: { type: String },
  status: { type: String, enum: ['ativo', 'encerrado', 'lotado'], default: 'ativo' },
  created_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
});

// --- SCHEMA DE INSCRIÇÕES ---
const RegistrationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  event_id: { type: String, required: true },
  user_id: { type: String, required: true },
  qr_code: { type: String, required: true },
  unique_token: { type: String, required: true, unique: true },
  checkin_done: { type: Boolean, required: true, default: false },
  checkin_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
});

// Registrar ou recuperar modelos
export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoEvent = mongoose.models.Event || mongoose.model('Event', EventSchema);
export const MongoRegistration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
