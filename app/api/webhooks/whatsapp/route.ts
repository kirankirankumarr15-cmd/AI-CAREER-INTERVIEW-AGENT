// WhatsApp Cloud API — Webhook Handler
// Handles GET (challenge verification) and POST (incoming messages & delivery statuses)

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookChallenge } from '@/lib/whatsapp/client';
import { sendTextMessage } from '@/lib/whatsapp/client';
import type { WaWebhookEvent } from '@/lib/whatsapp/types';

/* ── GET: Meta Webhook Verification ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const result = verifyWebhookChallenge(mode, token, challenge);
  if (result) {
    return new Response(result, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/* ── POST: Incoming Messages & Status Updates ── */
export async function POST(req: NextRequest) {
  try {
    const body: WaWebhookEvent = await req.json();

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const { messages, statuses } = change.value;

        // Handle incoming messages (natural language commands)
        for (const msg of messages ?? []) {
          if (msg.type === 'text' && msg.text?.body) {
            await handleIncomingCommand(msg.from, msg.text.body.trim().toLowerCase());
          }
        }

        // Handle delivery status callbacks (log only)
        for (const status of statuses ?? []) {
          console.info('[WhatsApp] Delivery status:', status.id, status.status, status.recipient_id);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[WhatsApp] Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/* ── Command Router ── */
async function handleIncomingCommand(from: string, text: string) {
  if (text === 'resume') {
    // CONFIRM gate before any action
    await sendTextMessage(from,
      '📄 You requested your AI Resume.\n\nReply *CONFIRM* to generate and receive your latest resume link, or *CANCEL* to abort.'
    );
    return;
  }

  if (text === 'confirm') {
    await sendTextMessage(from,
      '✅ Resume generation confirmed. Your AI resume will be sent here once generated.\n\nHead to CareerPilot → AI Resume to generate now.'
    );
    return;
  }

  if (text === 'cancel') {
    await sendTextMessage(from, '❌ Action cancelled. No changes were made.');
    return;
  }

  if (text === 'interview' || text === 'practice') {
    await sendTextMessage(from,
      '🎙️ Ready for a mock interview?\n\nVisit CareerPilot AI → Mock Interview to start your personalized session. Your results will be sent here when complete.'
    );
    return;
  }

  if (text === 'jobs' || text === 'job') {
    await sendTextMessage(from,
      '💼 Job matching is running in the background based on your verified profile. You\'ll receive alerts here when high-match roles are found.'
    );
    return;
  }

  if (text === 'help' || text === 'hi' || text === 'hello') {
    await sendTextMessage(from,
      '👋 *CareerPilot AI* — WhatsApp Commands\n\n' +
      '📄 *resume* — Request your AI resume\n' +
      '🎙️ *interview* — Interview tips & start session\n' +
      '💼 *jobs* — Job match status\n' +
      '📊 *progress* — Your readiness score\n\n' +
      'Sensitive actions require *CONFIRM* before executing.'
    );
    return;
  }

  if (text === 'progress') {
    await sendTextMessage(from,
      '📊 Log in to CareerPilot AI to see your full readiness breakdown across Technical, Communication, Confidence, and DSA dimensions.'
    );
    return;
  }

  // Unrecognized command
  await sendTextMessage(from,
    'I didn\'t recognize that command. Reply *help* to see all available commands.'
  );
}
