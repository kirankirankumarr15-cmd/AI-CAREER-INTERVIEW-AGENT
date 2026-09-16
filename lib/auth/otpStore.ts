// Server-side OTP store with TTL expiration

interface StoredOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __careerpilot_otp_cache: Map<string, StoredOtp> | undefined;
}

const otpCache = globalThis.__careerpilot_otp_cache || new Map<string, StoredOtp>();
globalThis.__careerpilot_otp_cache = otpCache;

export function storeServerOtp(email: string, code: string, ttlMs = 10 * 60 * 1000): void {
  const normalized = email.trim().toLowerCase();
  otpCache.set(normalized, {
    code,
    expiresAt: Date.now() + ttlMs,
    attempts: 0,
  });
}

export function getServerOtp(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const entry = otpCache.get(normalized);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    otpCache.delete(normalized);
    return null;
  }
  return entry.code;
}

export function verifyServerOtp(
  email: string,
  enteredCode: string
): { success: boolean; error?: string } {
  const normalized = email.trim().toLowerCase();
  const entry = otpCache.get(normalized);

  if (!entry) {
    return {
      success: false,
      error: 'OTP has expired or was not requested. Please request a new code.',
    };
  }

  if (Date.now() > entry.expiresAt) {
    otpCache.delete(normalized);
    return {
      success: false,
      error: 'OTP code has expired. Please request a new code.',
    };
  }

  if (entry.attempts >= 5) {
    otpCache.delete(normalized);
    return {
      success: false,
      error: 'Too many incorrect attempts. Please request a new verification code.',
    };
  }

  entry.attempts += 1;

  if (entry.code !== enteredCode.trim()) {
    return {
      success: false,
      error: 'Invalid verification code. Please check your Gmail or retry.',
    };
  }

  // OTP verified successfully - clear it
  otpCache.delete(normalized);
  return { success: true };
}
