import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-at-least-32-chars',
  },
}));

vi.mock('../../../src/config/auth', () => ({
  ACCESS_TOKEN_EXPIRY: '15m',
}));

import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../../src/utils/token';

describe('token utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('returns a valid JWT string', () => {
      const token = generateAccessToken('user-123');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('contains the userId in payload', () => {
      const token = generateAccessToken('user-123');
      const decoded = jwt.decode(token) as { userId: string };
      expect(decoded.userId).toBe('user-123');
    });
  });

  describe('verifyAccessToken', () => {
    it('decodes a valid token and returns { userId }', () => {
      const token = generateAccessToken('user-456');
      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe('user-456');
    });

    it('throws on expired token', () => {
      const token = jwt.sign(
        { userId: 'user-789' },
        'test-secret-key-that-is-at-least-32-chars-long',
        { expiresIn: '0s' }
      );

      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('throws on invalid token', () => {
      expect(() => verifyAccessToken('not-a-real-token')).toThrow();
    });

    it('throws on token signed with wrong secret', () => {
      const token = jwt.sign({ userId: 'user-789' }, 'wrong-secret');
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('hashToken', () => {
    it('returns a consistent SHA-256 hash', () => {
      const hash1 = hashToken('my-token');
      const hash2 = hashToken('my-token');
      expect(hash1).toBe(hash2);
    });

    it('returns a 64-character hex string', () => {
      const hash = hashToken('some-token');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('produces different hashes for different inputs', () => {
      const hash1 = hashToken('token-a');
      const hash2 = hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateRefreshToken', () => {
    it('returns a hex string', () => {
      const token = generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('returns a string of length 128 (64 bytes hex-encoded)', () => {
      const token = generateRefreshToken();
      expect(token).toHaveLength(128);
    });

    it('generates unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });
});
