import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { UserProfile } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export interface DecodedToken {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try to get token from cookies
  const cookieToken = request.cookies.get('authToken');
  if (cookieToken) {
    return cookieToken.value;
  }

  return null;
}

export function getUserFromToken(token: string): UserProfile | null {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT id, email, name, currency, timezone FROM users WHERE id = ?
  `).get(decoded.userId) as any;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    currency: user.currency,
    timezone: user.timezone,
  };
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const token = getTokenFromRequest(request);

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = getUserFromToken(token);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Attach user to request
    (request as any).user = user;

    return handler(request, ...args);
  };
}

export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}

export function getCurrentUser(request: NextRequest): UserProfile | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }
  return getUserFromToken(token);
}
