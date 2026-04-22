export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface OrgMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user: User;
  organization: Organization;
  joinedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
