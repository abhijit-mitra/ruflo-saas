import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { ACCESS_TOKEN_EXPIRY } from '../config/auth';
import { TokenPayload } from '../types';

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
