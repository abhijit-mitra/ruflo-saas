import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-1',
  email: 'test@company.com',
  name: 'Test User',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setAuth sets user, token, and isAuthenticated to true', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token-123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('test-token-123');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('clearAuth resets everything to initial state', () => {
    // First set some auth data
    useAuthStore.getState().setAuth(mockUser, 'test-token-123');

    // Then clear it
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('setLoading toggles isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
