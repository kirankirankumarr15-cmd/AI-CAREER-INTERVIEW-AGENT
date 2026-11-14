import { vi } from 'vitest';

// Global test setup: mock external services by default to prevent accidental network/paid calls.

vi.mock('@/lib/whatsapp/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/whatsapp/client')>();
  return {
    ...actual,
    sendTextMessage: vi.fn(async () => null),
    sendTemplateMessage: vi.fn(async () => null),
  };
});

vi.mock('@/lib/email/mailer', () => ({
  sendEmail: vi.fn(async () => ({ ok: true, mocked: true })),
  sendOtpEmail: vi.fn(async () => ({ ok: true, mocked: true })),
}));

vi.mock('@/lib/ai/provider', () => ({
  generateText: vi.fn(async () => ({ text: 'mocked-response' })),
  generateObject: vi.fn(async () => ({ object: {} })),
  streamText: vi.fn(async () => ({ textStream: [] })),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      single: vi.fn(async () => ({ data: null, error: null })),
    })),
  })),
}));

// Ensure tests never send real WhatsApp messages even if a module bypasses mocks.
process.env.WHATSAPP_ACCESS_TOKEN = '';
process.env.WHATSAPP_TOKEN = '';
process.env.WHATSAPP_PHONE_NUMBER_ID = '';
process.env.WHATSAPP_VERIFY_TOKEN = 'test-verify-token';
