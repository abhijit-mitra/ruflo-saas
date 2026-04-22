import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  domain: z.string().optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  settings: z.record(z.unknown()).optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
