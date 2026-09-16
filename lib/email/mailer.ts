import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailCredentials {
  gmailUser?: string;
  gmailAppPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  fromName?: string;
}

// Check runtime config file as well as process.env
function getEmailConfig(): EmailCredentials {
  let fileConfig: EmailCredentials = {};
  try {
    const configPath = path.join(process.cwd(), '.email-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(raw);
    }
  } catch {}

  const gmailUser =
    fileConfig.gmailUser ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_SERVER_USER ||
    process.env.SMTP_USER;

  const gmailAppPassword =
    fileConfig.gmailAppPassword ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.EMAIL_SERVER_PASSWORD ||
    process.env.SMTP_PASS;

  const smtpHost =
    fileConfig.smtpHost ||
    process.env.SMTP_HOST ||
    (gmailUser ? 'smtp.gmail.com' : undefined);

  const smtpPort =
    fileConfig.smtpPort ||
    (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465);

  const smtpSecure =
    fileConfig.smtpSecure ??
    (process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465);

  return {
    gmailUser,
    gmailAppPassword,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser: gmailUser,
    smtpPass: gmailAppPassword,
    fromName: fileConfig.fromName || process.env.EMAIL_FROM_NAME || 'CareerPilot AI',
  };
}

export function isEmailConfigured(): boolean {
  const config = getEmailConfig();
  return Boolean(
    config.gmailUser &&
      config.gmailUser.includes('@') &&
      config.gmailAppPassword &&
      config.gmailAppPassword.length >= 8
  );
}

export function getEmailConfigStatus(): {
  configured: boolean;
  gmailUser?: string;
  provider: string;
} {
  const config = getEmailConfig();
  const configured = isEmailConfigured();
  return {
    configured,
    gmailUser: config.gmailUser && config.gmailUser.includes('@') ? maskEmail(config.gmailUser) : undefined,
    provider: config.smtpHost || 'smtp.gmail.com',
  };
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : name;
  return `${maskedName}@${parts[1]}`;
}

export function saveEmailConfig(credentials: {
  gmailUser: string;
  gmailAppPassword: string;
}): boolean {
  try {
    const configPath = path.join(process.cwd(), '.email-config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          gmailUser: credentials.gmailUser.trim(),
          gmailAppPassword: credentials.gmailAppPassword.trim().replace(/\s+/g, ''),
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          smtpSecure: true,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );
    return true;
  } catch (err) {
    console.error('Failed to save .email-config.json', err);
    return false;
  }
}

export async function sendOtpEmail({
  to,
  code,
  purpose = 'login',
}: {
  to: string;
  code: string;
  purpose?: 'login' | 'reset' | 'signup';
}): Promise<{
  success: boolean;
  delivered: boolean;
  error?: string;
  info?: any;
}> {
  const config = getEmailConfig();

  if (!config.gmailUser || !config.gmailAppPassword) {
    return {
      success: true,
      delivered: false,
      error:
        'Gmail SMTP credentials are not configured yet. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local or app settings.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost || 'smtp.gmail.com',
      port: config.smtpPort || 465,
      secure: config.smtpSecure ?? true,
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPassword,
      },
      connectionTimeout: 10000,
    });

    const actionText =
      purpose === 'reset'
        ? 'Password Reset'
        : purpose === 'signup'
        ? 'Account Registration'
        : 'Sign In & Authentication';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CareerPilot AI — Verification Code</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
    .container { max-width: 540px; margin: 40px auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #1f2937; }
    .logo-badge { display: inline-flex; align-items: center; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 9999px; padding: 6px 16px; color: #818cf8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 36px 32px; }
    .h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 16px 0 8px 0; text-align: center; }
    .subtitle { font-size: 14px; color: #9ca3af; text-align: center; margin-bottom: 28px; line-height: 1.5; }
    .otp-card { background: #0f172a; border: 1px dashed #6366f1; border-radius: 14px; padding: 24px 16px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 12px; font-weight: 600; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
    .otp-code { font-size: 38px; font-weight: 800; color: #38bdf8; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
    .expiry { font-size: 13px; color: #64748b; margin-top: 10px; }
    .notice-box { background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; border-radius: 6px; padding: 12px 16px; margin: 24px 0 16px 0; }
    .notice-text { font-size: 13px; color: #cbd5e1; margin: 0; line-height: 1.5; }
    .footer { background: #090d16; padding: 20px 32px; text-align: center; border-top: 1px solid #1f2937; }
    .footer-text { font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">⚡ CareerPilot AI — PESITM</div>
      <h1 class="h1">${actionText} Verification</h1>
      <p class="subtitle">Use the one-time passcode below to verify your identity and access your dashboard.</p>
    </div>
    <div class="content">
      <p style="font-size: 14px; color: #e2e8f0; margin-top: 0;">Hello,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
        We received a request to verify your account (<strong style="color: #f1f5f9;">${to}</strong>) on CareerPilot AI.
      </p>
      
      <div class="otp-card">
        <div class="otp-label">Your 6-Digit OTP Code</div>
        <div class="otp-code">${code}</div>
        <div class="expiry">⏱️ Valid for 10 minutes (Single use only)</div>
      </div>

      <div class="notice-box">
        <p class="notice-text">
          🔒 <strong>Security Warning:</strong> Never share this verification code with anyone. CareerPilot AI and PESITM staff will never ask for your code.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        If you did not request this verification code, please disregard this email. Your account remains secure.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">
        PES Institute of Technology and Management (PESITM) • AI Career Pilot System<br>
        Automated Security Dispatch • Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.gmailUser}>`,
      to,
      subject: `[${code}] Your CareerPilot AI Verification Code`,
      text: `Your CareerPilot AI verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
      html: htmlContent,
    });

    return {
      success: true,
      delivered: true,
      info,
    };
  } catch (err: any) {
    console.error('Failed to send OTP email via Nodemailer:', err);
    return {
      success: false,
      delivered: false,
      error: err.message || 'SMTP delivery failed.',
    };
  }
}
