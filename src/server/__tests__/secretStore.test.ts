import { secretStore } from '../secretStore';

describe('SecretStore', () => {
  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = secretStore.generateId();
      const id2 = secretStore.generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(32);
      expect(id2).toHaveLength(32);
    });

    it('generates hex strings', () => {
      const id = secretStore.generateId();
      expect(id).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('createSecret', () => {
    it('returns id and expiresAt', () => {
      const result = secretStore.createSecret('encrypted content');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('expiresAt');
      expect(result.id).toBeTruthy();
      expect(typeof result.expiresAt).toBe('number');
    });

    it('expiresAt is in the future', () => {
      const before = Date.now();
      const result = secretStore.createSecret('encrypted content');
      const after = Date.now();
      
      expect(result.expiresAt).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 100);
      expect(result.expiresAt).toBeLessThanOrEqual(after + 5 * 60 * 1000 + 100);
    });

    it('stores secret and retrieves it', () => {
      const content = 'ZCg/wm9sWWGXW8oc1Nb8fXdT9J21nw6ciCKMueNNzzzGi88DtV==';
      const { id } = secretStore.createSecret(content);
      const retrieved = secretStore.getSecret(id);
      
      expect(retrieved).toBe(content);
    });
  });

  describe('getSecret', () => {
    it('returns null for non-existent secret', () => {
      const retrieved = secretStore.getSecret('non-existent-id-12345678901234567890');
      expect(retrieved).toBeNull();
    });

    it('deletes secret after retrieval (one-time access)', () => {
      const content = 'secret content';
      const { id } = secretStore.createSecret(content);
      
      const first = secretStore.getSecret(id);
      expect(first).toBe(content);
      
      const second = secretStore.getSecret(id);
      expect(second).toBeNull();
    });

    it('handles multiple secrets independently', () => {
      const content1 = 'secret 1';
      const content2 = 'secret 2';
      
      const { id: id1 } = secretStore.createSecret(content1);
      const { id: id2 } = secretStore.createSecret(content2);
      
      expect(secretStore.getSecret(id1)).toBe(content1);
      expect(secretStore.getSecret(id2)).toBe(content2);
    });
  });

  describe('isValid', () => {
    it('returns true for valid secret', () => {
      const { id } = secretStore.createSecret('content');
      expect(secretStore.isValid(id)).toBe(true);
    });

    it('returns false for non-existent secret', () => {
      expect(secretStore.isValid('non-existent-id-12345678901234567890')).toBe(false);
    });

    it('returns false after retrieval (one-time access)', () => {
      const { id } = secretStore.createSecret('content');
      secretStore.getSecret(id);
      expect(secretStore.isValid(id)).toBe(false);
    });
  });

  describe('expiration', () => {
    it('marks secret as expired after expiration time', async () => {
      const { id } = secretStore.createSecret('content');
      expect(secretStore.isValid(id)).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(secretStore.isValid(id)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty string content', () => {
      const { id } = secretStore.createSecret('');
      expect(secretStore.getSecret(id)).toBe('');
    });

    it('handles very long content', () => {
      const longContent = 'x'.repeat(100000);
      const { id } = secretStore.createSecret(longContent);
      expect(secretStore.getSecret(id)).toBe(longContent);
    });

    it('handles special characters in content', () => {
      const content = 'special!@#$%^&*()_+-=[]{}|;:,.<>?/\\';
      const { id } = secretStore.createSecret(content);
      expect(secretStore.getSecret(id)).toBe(content);
    });
  });
});
