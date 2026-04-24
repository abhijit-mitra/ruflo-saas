import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, signup, logout, forgotPassword, resetPassword, refreshToken } from '../auth';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockPost = vi.mocked(api.post);

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/login with email and password', async () => {
      const innerData = {
        user: { id: '1', email: 'test@company.com', name: 'Test' },
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
      };
      const mockResponse = { data: { data: innerData } };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await login({ email: 'test@company.com', password: 'password123' });

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@company.com',
        password: 'password123',
      });
      expect(result).toEqual(innerData);
    });
  });

  describe('signup', () => {
    it('calls POST /auth/signup with correct body', async () => {
      const signupData = {
        name: 'Test User',
        email: 'test@company.com',
        password: 'password123',
        companyName: 'Test Corp',
      };
      const innerData = {
        user: { id: '1', email: 'test@company.com', name: 'Test User' },
        accessToken: 'token-123',
        refreshToken: 'refresh-123',
      };
      const mockResponse = { data: { data: innerData } };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await signup(signupData);

      expect(mockPost).toHaveBeenCalledWith('/auth/signup', signupData);
      expect(result).toEqual(innerData);
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout', async () => {
      mockPost.mockResolvedValueOnce({ data: {} });

      await logout();

      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('forgotPassword', () => {
    it('calls POST /auth/forgot-password', async () => {
      const mockResponse = { data: { message: 'Reset email sent' } };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await forgotPassword({ email: 'test@company.com' });

      expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@company.com',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('resetPassword', () => {
    it('calls POST /auth/reset-password', async () => {
      const mockResponse = { data: { message: 'Password reset successful' } };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await resetPassword({ token: 'reset-token', password: 'newpassword123' });

      expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        password: 'newpassword123',
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('refreshToken', () => {
    it('calls POST /auth/refresh with credentials', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-token-123',
          user: { id: '1', email: 'test@company.com', name: 'Test' },
        },
      };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await refreshToken();

      expect(mockPost).toHaveBeenCalledWith('/auth/refresh', {}, { withCredentials: true });
      expect(result).toEqual(mockResponse.data);
    });
  });
});
