import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createOrgSchema,
  inviteMemberSchema,
  updateUserSchema,
} from '../../../src/utils/validation';

describe('validation schemas', () => {
  describe('loginSchema', () => {
    it('accepts valid input', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'secret123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing email', () => {
      const result = loginSchema.safeParse({ password: 'secret123' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'secret123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('accepts valid input', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'StrongPass1',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('rejects password without uppercase letter', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'weakpass1',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password without number', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'WeakPassword',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8 characters', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'Ab1',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'StrongPass1',
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'user@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'bad-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('accepts valid input', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'some-reset-token',
        password: 'NewPass123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing token', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPass123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects weak password', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'some-token',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createOrgSchema', () => {
    it('accepts valid input', () => {
      const result = createOrgSchema.safeParse({
        name: 'My Organization',
      });
      expect(result.success).toBe(true);
    });

    it('accepts input with optional fields', () => {
      const result = createOrgSchema.safeParse({
        name: 'My Organization',
        domain: 'example.com',
        logoUrl: 'https://example.com/logo.png',
        settings: { theme: 'dark' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createOrgSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('inviteMemberSchema', () => {
    it('accepts valid input', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'invite@example.com',
        role: 'admin',
      });
      expect(result.success).toBe(true);
    });

    it('accepts member role', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'invite@example.com',
        role: 'member',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'invite@example.com',
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'not-email',
        role: 'admin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('accepts valid input', () => {
      const result = updateUserSchema.safeParse({
        name: 'New Name',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid avatar URL', () => {
      const result = updateUserSchema.safeParse({
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null avatar URL', () => {
      const result = updateUserSchema.safeParse({
        avatarUrl: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL for avatarUrl', () => {
      const result = updateUserSchema.safeParse({
        avatarUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('accepts empty object (all fields optional)', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
