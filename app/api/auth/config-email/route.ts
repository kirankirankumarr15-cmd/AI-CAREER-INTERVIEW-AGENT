import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getEmailConfigStatus, saveEmailConfig } from '@/lib/email/mailer';

export async function GET() {
  const status = getEmailConfigStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gmailUser, gmailAppPassword } = body;

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { success: false, error: 'Gmail address and 16-character App Password are required.' },
        { status: 400 }
      );
    }

    const cleanUser = gmailUser.trim();
    const cleanPass = gmailAppPassword.trim().replace(/\s+/g, '');

    // Test connection with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 8000,
    });

    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Gmail authentication test failed: ${verifyErr.message || 'Invalid credentials'}. Ensure 2-Step Verification is ON and you generated a 16-character "App Password".`,
        },
        { status: 400 }
      );
    }

    // Save credentials
    const saved = saveEmailConfig({
      gmailUser: cleanUser,
      gmailAppPassword: cleanPass,
    });

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to write email configuration.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Gmail SMTP connected and verified successfully for ${cleanUser}!`,
    });
  } catch (error: any) {
    console.error('Error in config-email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Configuration failed.' },
      { status: 500 }
    );
  }
}
