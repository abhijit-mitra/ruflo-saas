import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate';

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {};
    mockNext = vi.fn();
  });

  it('calls next() when body matches schema', () => {
    mockReq.body = { name: 'Alice', age: 30 };

    const middleware = validate(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('calls next(error) when validation fails', () => {
    mockReq.body = { name: '', age: -1 };

    const middleware = validate(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it('strips unknown fields from body', () => {
    mockReq.body = { name: 'Alice', age: 30, extra: 'field' };

    const middleware = validate(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.body).toEqual({ name: 'Alice', age: 30 });
  });
});
