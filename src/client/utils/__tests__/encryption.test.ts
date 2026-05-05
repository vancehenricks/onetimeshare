import { generateCode, encryptSecret, decryptSecret } from '../encryption';

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
});
