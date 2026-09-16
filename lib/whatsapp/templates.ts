// WhatsApp Cloud API — Template Definitions
// All templates must be pre-approved in Meta Business Manager before use.
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates

import type { WaTemplatePayload, WaTemplateId } from './types';

export interface TemplateParams {
  resume_ready: { studentName: string; role: string; atsScore: number; resumeUrl?: string };
  interview_report: { studentName: string; role: string; overallScore: number; confidence: number };
  job_match: { studentName: string; companyName: string; role: string; matchScore: number };
  application_update: { studentName: string; companyName: string; role: string; status: string };
  daily_practice: { studentName: string; topic: string; questionCount: number; practiceUrl?: string };
}

/**
 * Build a WhatsApp template payload.
 * Template body text parameters are positional and MUST match approved templates in Meta Business Manager.
 */
export function buildTemplate<T extends WaTemplateId>(
  templateId: T,
  params: TemplateParams[T],
  languageCode = 'en_US'
): WaTemplatePayload {
  const p = params as any;

  const bodyParams: string[] = (() => {
    switch (templateId) {
      case 'resume_ready':
        return [p.studentName, p.role, String(p.atsScore)];
      case 'interview_report':
        return [p.studentName, p.role, String(p.overallScore), String(p.confidence)];
      case 'job_match':
        return [p.studentName, p.companyName, p.role, String(p.matchScore)];
      case 'application_update':
        return [p.studentName, p.companyName, p.role, p.status];
      case 'daily_practice':
        return [p.studentName, p.topic, String(p.questionCount)];
      default:
        return [];
    }
  })();

  return {
    name: templateId,
    language: { code: languageCode },
    components: [
      {
        type: 'body',
        parameters: bodyParams.map((text) => ({ type: 'text' as const, text })),
      },
    ],
  };
}

/**
 * Human-readable template descriptions (for admin UI display only).
 */
export const TEMPLATE_DESCRIPTIONS: Record<WaTemplateId, string> = {
  resume_ready:       'Notify student when AI resume is generated and ready to download.',
  interview_report:   'Send interview performance summary after each mock session.',
  job_match:          'Alert when a high-match job opening is found.',
  application_update: 'Update student on the status of a job application.',
  daily_practice:     'Daily practice reminder with topic and question count.',
};
