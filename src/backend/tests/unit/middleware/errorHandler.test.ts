import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { AppError, errorHandler } from '../../../src/middleware/errorHandler';

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext = vi.fn() as NextFunction;

describe('AppError', () => {
  it('sets correct status, code, and message', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    expect(error.name).toBe('AppError');
  });

  it('supports optional details', () => {
    const error = new AppError(400, 'BAD_REQUEST', 'Bad request', {
      field: 'email',
    });
    expect(error.details).toEqual({ field: 'email' });
  });
});

describe('errorHandler', () => {
  let res: Response;

  beforeEach(() => {
    res = createMockRes();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('sends correct JSON for AppError', () => {
    const error = new AppError(409, 'CONFLICT', 'Already exists');
    errorHandler(error, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'CONFLICT',
        message: 'Already exists',
        details: undefined,
      },
    });
  });

  it('handles ZodError with validation details', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: ['email'],
        message: 'Required',
      },
    ];
    const zodError = new ZodError(issues);

    errorHandler(zodError, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ field: 'email', message: 'Required' }],
      },
    });
  });

  it('handles unknown errors as 500', () => {
    const error = new Error('Something unexpected');

    errorHandler(error, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  it('handles AppError with details', () => {
    const error = new AppError(422, 'UNPROCESSABLE', 'Invalid data', {
      fields: ['name'],
    });

    errorHandler(error, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNPROCESSABLE',
        message: 'Invalid data',
        details: { fields: ['name'] },
      },
    });
  });
});
