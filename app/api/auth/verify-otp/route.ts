import { NextRequest, NextResponse } from 'next/server';
import { verifyServerOtp } from '@/lib/auth/otpStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const code = body?.code?.trim();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit code are required.' },
        { status: 400 }
      );
    }

    const result = verifyServerOtp(email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid OTP code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error: unknown) {
    console.error('Error in verify-otp route:', error);
    const errMsg = error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
