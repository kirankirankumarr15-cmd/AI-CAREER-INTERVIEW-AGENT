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
        message: `Verification code successfully sent to ${email}. Check your Gmail inbox (and Spam folder).`,
      });
    } else {
      // SMTP not configured or failed - return code for offline/fallback mode with explanation
      return NextResponse.json({
        success: true,
        delivered: false,
        email,
        code, // provided so developer/tester is never locked out
        reason: emailResult.error || 'Gmail credentials not configured yet.',
        message: isEmailConfigured()
          ? `Could not dispatch to Gmail: ${emailResult.error}. Use the temporary backup code.`
          : `Gmail SMTP is not configured in .env.local yet. A verification code has been generated.`,
      });
    }
  } catch (error: any) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while sending OTP.' },
      { status: 500 }
    );
  }
}
