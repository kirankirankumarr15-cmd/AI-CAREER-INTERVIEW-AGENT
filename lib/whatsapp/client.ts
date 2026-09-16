// WhatsApp Cloud API — Client
// Official Meta WhatsApp Business Cloud API only.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

import type { WaMessage, WaApiResponse, WaDeliveryStatus, WaTemplateId } from './types';
import type { TemplateParams } from './templates';
import { buildTemplate } from './templates';

const WA_API_BASE = 'https://graph.facebook.com/v19.0';

function getCredentials() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return { token, phoneId, configured: !!(token && phoneId) };
}

/**
 * Low-level: send any WaMessage payload to the Cloud API.
 */
async function sendMessage(message: WaMessage): Promise<WaApiResponse | null> {
  const { token, phoneId, configured } = getCredentials();

  if (!configured) {
    console.warn('[WhatsApp] Credentials not configured — message not sent:', message.type);
    return null;
  }

  const response = await fetch(`${WA_API_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    console.error('[WhatsApp] API error:', response.status, errBody);
    throw new Error(`WhatsApp API returned ${response.status}`);
  }

  return response.json() as Promise<WaApiResponse>;
}

/**
 * Send a plain text message.
 */
export async function sendTextMessage(to: string, text: string): Promise<WaApiResponse | null> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
}

/**
 * Send a pre-approved template message.
 */
export async function sendTemplateMessage<T extends WaTemplateId>(
  to: string,
  templateId: T,
  params: TemplateParams[T]
): Promise<WaApiResponse | null> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: buildTemplate(templateId, params),
  });
}

/**
 * Returns true if WhatsApp Cloud API credentials are present.
 * Use this to show/hide the WhatsApp settings card in the UI.
 */
export function isWhatsAppConfigured(): boolean {
  return getCredentials().configured;
}

/**
 * Verify a webhook challenge from Meta (GET request).
 */
export function verifyWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null
): string | null {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
}
