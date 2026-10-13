import { NextRequest, NextResponse } from 'next/server';
import { verifyServerOtp } from '@/lib/auth/otpStore';
import { syncUserCredentials } from '@/lib/auth/userService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const password = body?.password?.trim();
    const fullName = body?.fullName?.trim() || '';
    const code = body?.code?.trim();

    if (!email || !code || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // 1. Verify 6-digit OTP
    const otpValidation = verifyServerOtp(email, code);
    if (!otpValidation.success) {
      return NextResponse.json(
        { success: false, error: otpValidation.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // 2. Synchronize user in Supabase auth.users & profiles
    const dbResult = await syncUserCredentials({
      email,
      password,
      fullName,
    });

    if (!dbResult.success) {
      console.warn('DB sync warning in register route:', dbResult.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Account verified and created successfully.',
      userId: dbResult.userId,
    });
  } catch (error: unknown) {
    console.error('Error in /api/auth/register:', error);
    const errMsg = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
