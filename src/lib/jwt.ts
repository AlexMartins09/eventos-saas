import { JWTPayload } from './types';

const SECRET_KEY_STR = process.env.JWT_SECRET || 'fallback_secret_key_event_flow_2026_change_in_production';

// Utilitários para conversão Base64URL (Edge-safe)
function arrayBufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Obter chave criptográfica do segredo
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET_KEY_STR);
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Assina um payload gerando um token JWT seguro
 */
export async function signJWT(payload: Omit<JWTPayload, 'exp'>, expiresInSeconds: number = 604800): Promise<string> {
  const key = await getCryptoKey();
  const encoder = new TextEncoder();
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: JWTPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  
  const encodedHeader = arrayBufferToBase64Url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = arrayBufferToBase64Url(encoder.encode(JSON.stringify(fullPayload)));
  
  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    dataToSign
  );
  
  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Valida um token JWT e decodifica seu payload. Retorna null se inválido ou expirado.
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    
    // Validar assinatura
    const dataToVerify = encoder.encode(`${encodedHeader}.${encodedPayload}`);
    const signatureBuffer = base64UrlToArrayBuffer(encodedSignature);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      dataToVerify
    );
    
    if (!isValid) {
      console.warn('[JWT] Assinatura inválida detectada.');
      return null;
    }
    
    // Decodificar payload
    const decoder = new TextDecoder();
    const decodedBytes = base64UrlToArrayBuffer(encodedPayload);
    const payloadStr = decoder.decode(decodedBytes);
    const payload = JSON.parse(payloadStr) as JWTPayload;
    
    // Verificar expiração
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn('[JWT] Token expirado.');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[JWT] Falha ao verificar token:', error);
    return null;
  }
}
