import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserPayload } from '../types/express';

/**
 * Signs a JWT token containing the user payload.
 */
export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '1d', // Expire in 1 day
  });
}

/**
 * Verifies a JWT token and returns the payload, throwing an error if invalid.
 */
export function verifyToken(token: string): UserPayload {
  return jwt.verify(token, config.JWT_SECRET) as UserPayload;
}
