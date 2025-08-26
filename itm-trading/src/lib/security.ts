// Enterprise security utilities

import { headers } from 'next/headers';
import { supabaseAdmin } from './supabase/server';

// Rate limiting store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Security configuration
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000,
  sensitiveDataFields: ['password', 'token', 'secret', 'key'],
  allowedOrigins: [
    'http://localhost:3000',
    'https://*.itm-trading.com',
    'https://*.vercel.app'
  ]
};

// Rate limiting
export function rateLimit(
  identifier: string,
  maxRequests: number = SECURITY_CONFIG.maxRequestsPerMinute,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime
    };
  }
  
  // Update existing entry
  entry.count++;
  
  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime
  };
}

// Input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Data redaction for logging
export function redactSensitiveData(data: any): any {
  if (typeof data === 'string') {
    // Check if it might be a sensitive field
    const lowerData = data.toLowerCase();
    for (const field of SECURITY_CONFIG.sensitiveDataFields) {
      if (lowerData.includes(field)) {
        return '***REDACTED***';
      }
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SECURITY_CONFIG.sensitiveDataFields.some(field => 
        lowerKey.includes(field)
      );
      
      redacted[key] = isSensitive ? '***REDACTED***' : redactSensitiveData(value);
    }
    return redacted;
  }
  
  return data;
}

// Session management
export async function validateSession(sessionToken: string): Promise<{
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
}> {
  try {
    const supabase = supabaseAdmin();
    
    // Get user from session
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
    
    if (error || !user) {
      return { valid: false };
    }
    
    // Check if session is not expired
    const expiresAt = new Date(user.last_sign_in_at!);
    expiresAt.setTime(expiresAt.getTime() + SECURITY_CONFIG.sessionTimeout);
    
    if (expiresAt < new Date()) {
      return { valid: false };
    }
    
    return {
      valid: true,
      userId: user.id,
      expiresAt
    };
  } catch (error) {
    return { valid: false };
  }
}

// IP-based security checks
export async function getClientIP(): Promise<string> {
  const headersList = headers();
  
  // Check various headers for the real IP
  const possibleHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];
  
  for (const header of possibleHeaders) {
    const value = (await headersList).get(header);
    if (value) {
      // Take the first IP if multiple are present
      return value.split(',')[0].trim();
    }
  }
  
  return 'unknown';
}

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co https://api-inference.huggingface.co;
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
}

// Audit logging
export async function logSecurityEvent(event: {
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'data_access' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  try {
    const supabase = supabaseAdmin();
    
    await supabase.from('system_logs').insert({
      level: 'INFO',
      message: `Security event: ${event.type}`,
      module: 'security',
      user_id: event.userId,
      ip_address: event.ip,
      metadata: {
        event_type: event.type,
        user_agent: event.userAgent,
        details: redactSensitiveData(event.details),
        severity: event.severity || 'medium'
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// CSRF protection
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
}

// Permission checking
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const supabase = supabaseAdmin();
    
    // Get user's role and permissions
    const { data: userRole } = await supabase
      .from('employee_profiles')
      .select(`
        user_roles (
          permissions
        )
      `)
      .eq('user_id', userId)
      .single();
    
        if (!userRole?.user_roles || !Array.isArray(userRole.user_roles) || userRole.user_roles.length === 0) {
      return false;
    }

    const permissions = userRole.user_roles[0]?.permissions;
    
    // Check if user has permission for this resource and action
    if (permissions.all === true) {
      return true;
    }
    
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) {
      return false;
    }
    
    if (resourcePermissions === 'all') {
      return true;
    }
    
    if (Array.isArray(resourcePermissions)) {
      return resourcePermissions.includes(action);
    }
    
    return resourcePermissions === action;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// Data encryption helpers (for sensitive data storage)
export async function encryptSensitiveData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate a random key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );
  
  // Export the key
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  
  // Combine key, IV, and encrypted data
  const combined = new Uint8Array(
    exportedKey.byteLength + iv.length + encrypted.byteLength
  );
  combined.set(new Uint8Array(exportedKey), 0);
  combined.set(iv, exportedKey.byteLength);
  combined.set(new Uint8Array(encrypted), exportedKey.byteLength + iv.length);
  
  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSensitiveData(encryptedData: string): Promise<string> {
  try {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract key, IV, and encrypted data
    const keyData = combined.slice(0, 32);
    const iv = combined.slice(32, 44);
    const encrypted = combined.slice(44);
    
    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    // Decode to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

export default {
  rateLimit,
  sanitizeInput,
  redactSensitiveData,
  validateSession,
  getClientIP,
  getSecurityHeaders,
  logSecurityEvent,
  generateCSRFToken,
  validateCSRFToken,
  hasPermission,
  encryptSensitiveData,
  decryptSensitiveData
};

