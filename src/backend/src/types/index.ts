// Augment Passport's User type so req.user has userId
declare global {
  namespace Express {
    interface User {
      userId: string;
    }
  }
}

export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
