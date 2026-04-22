import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

vi.mock('../../../src/utils/token', () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock('../../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
  },
}));

import { authenticate } from '../../../src/middleware/authenticate';
import { verifyAccessToken } from '../../../src/utils/token';
import { AppError } from '../../../src/middleware/errorHandler';

const mockedVerify = vi.mocked(verifyAccessToken);

describe('authenticate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  it('calls next() and sets req.user when valid Bearer token provided', () => {
    mockReq.headers = { authorization: 'Bearer valid-token' };
    mockedVerify.mockReturnValue({ userId: 'user-123' });

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(mockReq.user).toEqual({ userId: 'user-123' });
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('passes AppError to next when no Authorization header', () => {
    mockReq.headers = {};

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('passes AppError to next when token is invalid', () => {
    mockReq.headers = { authorization: 'Bearer bad-token' };
    mockedVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('passes AppError to next when Bearer prefix is missing', () => {
    mockReq.headers = { authorization: 'Token some-token' };

    authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    const error = (mockNext as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Missing or invalid authorization header');
  });
});
