// WhatsApp Cloud API — Type Definitions
// Uses ONLY the official Meta WhatsApp Business Cloud API
// No WhatsApp Web automation, unofficial libraries, or scraping

export type WaMessageType = 'text' | 'template' | 'document' | 'image';

export type WaTemplateId =
  | 'resume_ready'
  | 'interview_report'
  | 'job_match'
  | 'application_update'
  | 'daily_practice';

export interface WaTextBody {
  body: string;
}

export interface WaTemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{ type: 'text'; text: string } | { type: 'document'; document: { link: string; filename: string } }>;
}

export interface WaTemplatePayload {
  name: WaTemplateId;
  language: { code: string };
  components?: WaTemplateComponent[];
}

export interface WaMessage {
  messaging_product: 'whatsapp';
  to: string;           // E.164 format e.g. +919876543210
  type: WaMessageType;
  text?: WaTextBody;
  template?: WaTemplatePayload;
}

export interface WaApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WaWebhookEvent {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: 'messages';
    }>;
  }>;
}

export interface WaConnection {
  userId: string;
  phoneNumber: string; // E.164 format
  isVerified: boolean;
  notificationsEnabled: {
    jobAlerts: boolean;
    interviewReports: boolean;
    resumeUpdates: boolean;
    dailyPractice: boolean;
    applicationUpdates: boolean;
  };
  connectedAt: string;
}

export interface WaDeliveryStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errorCode?: string;
  errorMessage?: string;
}
