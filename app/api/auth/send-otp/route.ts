import { NextRequest, NextResponse } from 'next/server';
import { storeServerOtp } from '@/lib/auth/otpStore';
import { sendOtpEmail, isEmailConfigured } from '@/lib/email/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim();
    const purpose = body?.purpose || 'login';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // Generate verified 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in server-side cache (10 min TTL)
    storeServerOtp(email, code);
    console.log(`[AUTH OTP DISPATCH] Generated 6-digit code for ${email}: ${code}`);

    // Attempt live email dispatch via Nodemailer
    const emailResult = await sendOtpEmail({
      to: email,
      code,
      purpose,
    });

    if (emailResult.delivered) {
      return NextResponse.json({
        success: true,
        delivered: true,
        email,
        message: `Verification code successfully sent to ${email}. Check your inbox (and Spam folder).`,
      });
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DEV LOG] Email dispatch failed: ${emailResult.error || 'SMTP unconfigured'}. Code for ${email} is ${code}`);
      }
      return NextResponse.json(
        {
          success: false,
          delivered: false,
          email,
          error: isEmailConfigured()
            ? `Could not dispatch verification email: ${emailResult.error}. Please retry.`
            : `Email dispatch is not configured. Please contact the administrator.`,
        },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error while sending OTP.';
    console.error('Error in send-otp route:', error);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
