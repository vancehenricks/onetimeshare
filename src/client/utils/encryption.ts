// Generate a random 6-digit code (000000-999999)
export function generateCode(): string {
  const code = Math.floor(Math.random() * 1000000);
  return code.toString().padStart(6, '0');
}

// Safe base64 encoding for large buffers (avoids call stack limits)
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Derive encryption key from 6-digit code
async function deriveKey(code: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt secret with 6-digit code
export async function encryptSecret(secret: string, code: string): Promise<string> {
  const key = await deriveKey(code);
  
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    secretData
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(new Uint8Array(iv), 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return uint8ToBase64(combined);
}

// Decrypt secret with 6-digit code
export async function decryptSecret(encryptedData: string, code: string): Promise<string> {
  const key = await deriveKey(code);
  
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  try {
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    throw new Error('Decryption failed. Invalid code or corrupted data.');
  }
}

export interface FilePayload {
  type: 'file';
  name: string;
  mimeType: string;
  data: string; // base64-encoded raw file bytes
}

// Encrypt a File object; the result is stored the same way as text secrets
export async function encryptFile(file: File, code: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBase64 = uint8ToBase64(new Uint8Array(arrayBuffer));

  const payload: FilePayload = {
    type: 'file',
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    data: fileBase64,
  };

  return encryptSecret(JSON.stringify(payload), code);
}

// Returns true when decrypted content is a file payload
export function isFilePayload(content: string): boolean {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return parsed?.type === 'file';
  } catch {
    return false;
  }
}

export function parseFilePayload(content: string): FilePayload {
  return JSON.parse(content) as FilePayload;
}
