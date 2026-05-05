import { generateCode, encryptSecret, decryptSecret, encryptFile, isFilePayload, parseFilePayload } from '../encryption';

describe('Encryption Utils', () => {
  describe('generateCode', () => {
    it('generates 6-digit code', () => {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('generates codes in valid range', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateCode();
        const num = parseInt(code);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1000000);
      }
    });

    it('pads with zeros', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateCode();
        expect(code).toHaveLength(6);
      }
    });
  });

  describe('encryptSecret', () => {
    it('encrypts and returns non-empty string', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('encrypted output differs from input', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      expect(encrypted).not.toBe(secret);
      expect(encrypted).not.toContain(secret);
    });

    it('different secrets produce different encryptions', async () => {
      const code = '123456';
      const encrypted1 = await encryptSecret('Secret 1', code);
      const encrypted2 = await encryptSecret('Secret 2', code);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('same secret with same code encrypts differently each time (random IV)', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted1 = await encryptSecret(secret, code);
      const encrypted2 = await encryptSecret(secret, code);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('handles empty string', async () => {
      const encrypted = await encryptSecret('', '123456');
      expect(encrypted).toBeTruthy();
    });

    it('handles special characters', async () => {
      const secret = '!@#$%^&*()_+-=[]{}|;:,.<>?/';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      expect(encrypted).toBeTruthy();
    });

    it('handles unicode characters', async () => {
      const secret = '你好世界 مرحبا بالعالم';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      expect(encrypted).toBeTruthy();
    });

    it('handles long secrets', async () => {
      const secret = 'x'.repeat(10000);
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decryptSecret', () => {
    it('decrypts with correct code', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      const decrypted = await decryptSecret(encrypted, code);
      
      expect(decrypted).toBe(secret);
    });

    it('fails with wrong code', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, '654321')).rejects.toThrow();
    });

    it('round-trip encryption/decryption for various strings', async () => {
      const testCases = [
        'simple text',
        'text with numbers 123456',
        'text with special chars !@#$%',
        'multi\nline\ntext',
        '{"json": "object"}',
        'A'.repeat(1000),
      ];

      for (const secret of testCases) {
        const code = generateCode();
        const encrypted = await encryptSecret(secret, code);
        const decrypted = await decryptSecret(encrypted, code);
        expect(decrypted).toBe(secret);
      }
    });

    it('wrong code produces error with correct message', async () => {
      const secret = 'My secret';
      const code = '123456';
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, '999999')).rejects.toThrow('Decryption failed');
    });

    it('corrupted encrypted data fails', async () => {
      const code = '123456';
      const corrupted = 'not-valid-base64-or-corrupted-data';
      
      await expect(decryptSecret(corrupted, code)).rejects.toThrow();
    });
  });

  describe('encryption security', () => {
    it('IV is different for each encryption', async () => {
      const secret = 'test';
      const code = '123456';
      
      const encrypted1 = await encryptSecret(secret, code);
      const encrypted2 = await encryptSecret(secret, code);
      
      const decrypted1 = await decryptSecret(encrypted1, code);
      const decrypted2 = await decryptSecret(encrypted2, code);
      
      expect(decrypted1).toBe(secret);
      expect(decrypted2).toBe(secret);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('code validation - empty code fails', async () => {
      const secret = 'test';
      const code = generateCode();
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, '')).rejects.toThrow();
    });

    it('code validation - wrong format fails', async () => {
      const secret = 'test';
      const code = generateCode();
      const encrypted = await encryptSecret(secret, code);
      
      await expect(decryptSecret(encrypted, 'not-a-number')).rejects.toThrow();
    });
  });

  describe('file encryption', () => {
    it('encrypts and decrypts small binary file', async () => {
      const code = '123456';
      const file = new File([new Uint8Array([1,2,3,4,5])], 'test.bin', { type: 'application/octet-stream' });
      const encrypted = await encryptFile(file, code);

      const decryptedJson = await decryptSecret(encrypted, code);
      expect(isFilePayload(decryptedJson)).toBe(true);

      const payload = parseFilePayload(decryptedJson);
      expect(payload.name).toBe('test.bin');
      expect(payload.mimeType).toBe('application/octet-stream');

      const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
      expect(Array.from(bytes)).toEqual([1,2,3,4,5]);
    });

    it('handles empty text file', async () => {
      const code = generateCode();
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      const encrypted = await encryptFile(file, code);

      const decryptedJson = await decryptSecret(encrypted, code);
      expect(isFilePayload(decryptedJson)).toBe(true);

      const payload = parseFilePayload(decryptedJson);
      expect(payload.name).toBe('empty.txt');
      const decoded = atob(payload.data);
      expect(decoded).toBe('');
    });

    it('handles large file (near 1MB limit)', async () => {
      const code = generateCode();
      const largeBuffer = new Uint8Array(900 * 1024); // 900KB
      largeBuffer.fill(0xAB);
      const file = new File([largeBuffer], 'large.bin', { type: 'application/octet-stream' });

      const encrypted = await encryptFile(file, code);
      const decryptedJson = await decryptSecret(encrypted, code);
      expect(isFilePayload(decryptedJson)).toBe(true);

      const payload = parseFilePayload(decryptedJson);
      const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
      expect(bytes.length).toBe(900 * 1024);
      expect(bytes[0]).toBe(0xAB);
    });

    it('preserves special characters in file name', async () => {
      const code = generateCode();
      const file = new File(['data'], 'my file (1) [final].txt', { type: 'text/plain' });
      const encrypted = await encryptFile(file, code);

      const decryptedJson = await decryptSecret(encrypted, code);
      const payload = parseFilePayload(decryptedJson);
      expect(payload.name).toBe('my file (1) [final].txt');
    });

    it('uses application/octet-stream when file type is empty', async () => {
      const code = generateCode();
      const file = new File(['data'], 'noextension', { type: '' });
      const encrypted = await encryptFile(file, code);

      const decryptedJson = await decryptSecret(encrypted, code);
      const payload = parseFilePayload(decryptedJson);
      expect(payload.mimeType).toBe('application/octet-stream');
    });
  });

  describe('isFilePayload', () => {
    it('returns true for valid file payload JSON', () => {
      const json = JSON.stringify({ type: 'file', name: 'f.txt', mimeType: 'text/plain', data: '' });
      expect(isFilePayload(json)).toBe(true);
    });

    it('returns false for plain text (not JSON)', () => {
      expect(isFilePayload('hello world')).toBe(false);
    });

    it('returns false for invalid JSON', () => {
      expect(isFilePayload('{invalid json')).toBe(false);
    });

    it('returns false for JSON object without type field', () => {
      expect(isFilePayload(JSON.stringify({ name: 'f.txt' }))).toBe(false);
    });

    it('returns false for JSON object with wrong type value', () => {
      expect(isFilePayload(JSON.stringify({ type: 'text', name: 'f.txt' }))).toBe(false);
    });

    it('returns false for JSON array', () => {
      expect(isFilePayload(JSON.stringify([1, 2, 3]))).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isFilePayload('')).toBe(false);
    });
  });

  describe('parseFilePayload', () => {
    it('parses valid file payload', () => {
      const payload = { type: 'file', name: 'test.txt', mimeType: 'text/plain', data: btoa('hello') };
      const result = parseFilePayload(JSON.stringify(payload));
      expect(result.name).toBe('test.txt');
      expect(result.mimeType).toBe('text/plain');
      expect(result.data).toBe(btoa('hello'));
    });

    it('throws on invalid JSON', () => {
      expect(() => parseFilePayload('{invalid')).toThrow();
    });

    it('returns object even if fields are missing (type cast)', () => {
      const result = parseFilePayload(JSON.stringify({ type: 'file' }));
      expect(result).toBeDefined();
      expect(result.name).toBeUndefined();
    });
  });
});
