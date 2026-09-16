'use client';

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  college: string;
  avatar?: string;
  provider: 'credentials' | 'google' | 'github';
  createdAt: string;
}

const STORAGE_KEY = 'careerpilot_users_v1';
const OTP_STORAGE_PREFIX = 'careerpilot_otp_';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-pesitm-1',
    email: 'alex.dev@pesitm.edu.in',
    password: 'password123',
    fullName: 'Alex Morgan',
    college: 'PESITM Shivamogga',
    provider: 'credentials',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'user-pesitm-2',
    email: 'student@pesitm.edu.in',
    password: 'pesitm2025',
    fullName: 'PESITM Student',
    college: 'PES Institute of Technology & Management',
    provider: 'credentials',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'user-kiran-3',
    email: 'kiran@gmail.com',
    password: 'password123',
    fullName: 'Kiran Kumar',
    college: 'PESITM Shivamogga',
    provider: 'credentials',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return (
    url.length > 0 &&
    !url.includes('placeholder') &&
    !url.includes('your-supabase-project')
  );
};

export const getUsers = (): UserAccount[] => {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return parsed;
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveUsers = (users: UserAccount[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to localStorage', err);
  }
};

export const findUserByEmail = (email: string): UserAccount | undefined => {
  const users = getUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.trim().toLowerCase() === normalized);
};

export const registerUser = (
  userData: Omit<UserAccount, 'id' | 'createdAt'>
): { success: boolean; user?: UserAccount; error?: string } => {
  const users = getUsers();
  const normalizedEmail = userData.email.trim().toLowerCase();

  const existingIndex = users.findIndex((u) => u.email.trim().toLowerCase() === normalizedEmail);
  if (existingIndex >= 0) {
    // Update existing
    users[existingIndex] = {
      ...users[existingIndex],
      ...userData,
      email: normalizedEmail,
    };
    saveUsers(users);
    return { success: true, user: users[existingIndex] };
  }

  const newUser: UserAccount = {
    ...userData,
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
};

export const verifyPassword = (
  email: string,
  passwordAttempt: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const normalized = email.trim().toLowerCase();
  const user = findUserByEmail(normalized);

  if (!user) {
    return {
      success: false,
      error: `No registered account found for "${email}". Please sign up first, or use a demo account below.`,
    };
  }

  if (!user.password) {
    return {
      success: false,
      error: 'This account uses OTP or OAuth verification. Please switch to OTP login mode.',
    };
  }

  if (user.password !== passwordAttempt.trim()) {
    return {
      success: false,
      error: 'Incorrect password. Please verify your credentials or click "Forgot Password?".',
    };
  }

  return { success: true, user };
};

export const updatePassword = (
  email: string,
  newPassword: string
): { success: boolean; error?: string } => {
  const users = getUsers();
  const normalized = email.trim().toLowerCase();
  const index = users.findIndex((u) => u.email.trim().toLowerCase() === normalized);

  if (index >= 0) {
    users[index].password = newPassword.trim();
    saveUsers(users);
    return { success: true };
  }

  // If user doesn't exist, create account with new password
  const newUser: UserAccount = {
    id: `user-${Date.now()}`,
    email: normalized,
    password: newPassword.trim(),
    fullName: email.split('@')[0] || 'Student User',
    college: 'PESITM Shivamogga',
    provider: 'credentials',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true };
};

export const createAndStoreOtp = (email: string): string => {
  if (typeof window === 'undefined') return '748291';
  // Generate random 6 digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const payload = {
    email: email.trim().toLowerCase(),
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
  try {
    sessionStorage.setItem(
      `${OTP_STORAGE_PREFIX}${email.trim().toLowerCase()}`,
      JSON.stringify(payload)
    );
  } catch (e) {
    console.error('SessionStorage error', e);
  }
  return code;
};

export const getActiveOtp = (email: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${OTP_STORAGE_PREFIX}${email.trim().toLowerCase()}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(`${OTP_STORAGE_PREFIX}${email.trim().toLowerCase()}`);
      return null;
    }
    return data.code;
  } catch {
    return null;
  }
};

export const verifyOtpCode = (
  email: string,
  enteredCode: string
): { success: boolean; error?: string } => {
  const normalized = email.trim().toLowerCase();
  const activeCode = getActiveOtp(normalized);

  if (!activeCode) {
    return {
      success: false,
      error: 'OTP expired or not requested yet. Please click "Resend Code".',
    };
  }

  if (activeCode !== enteredCode.trim()) {
    return {
      success: false,
      error: `Invalid OTP code. The code you entered does not match the 6-digit verification code.`,
    };
  }

  // Clear OTP once verified
  try {
    sessionStorage.removeItem(`${OTP_STORAGE_PREFIX}${normalized}`);
  } catch {}

  return { success: true };
};
