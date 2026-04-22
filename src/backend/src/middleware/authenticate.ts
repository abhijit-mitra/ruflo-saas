import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import '../types';
import { AppError } from './errorHandler';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token'));
  }
}
