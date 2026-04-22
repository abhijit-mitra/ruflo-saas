import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import * as authService from '@/services/auth';
import type { LoginRequest, SignupRequest } from '@/types';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    setAuth,
    clearAuth,
    setLoading,
  } = useAuthStore();

  const login = useCallback(
    async (data: LoginRequest) => {
      setLoading(true);
      try {
        const response = await authService.login(data);
        setAuth(response.user, response.accessToken);
        navigate('/dashboard');
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    [setAuth, clearAuth, setLoading, navigate],
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      setLoading(true);
      try {
        const response = await authService.signup(data);
        setAuth(response.user, response.accessToken);
        navigate('/dashboard');
      } catch (error) {
        clearAuth();
        throw error;
      }
    },
    [setAuth, clearAuth, setLoading, navigate],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with local logout even if API call fails
    } finally {
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate]);

  const checkAuth = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await authService.refreshToken();
      setAuth(response.user, response.accessToken);
    } catch {
      clearAuth();
    }
  }, [accessToken, setAuth, clearAuth, setLoading]);

  useEffect(() => {
    checkAuth();
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    checkAuth,
  };
}
