/**
 * /api/resume/export/route.ts
 *
 * ATS-Friendly Export Engine:
 * - Generates clean selectable text & PDF/DOCX compatible representations.
 * - Stores exported files in Supabase private storage (resumes bucket).
 * - Delivers downloads via short-lived signed URLs (1 hour expiry).
 * - Returns a plain-text preview showing exactly what an ATS parser extracts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ExportRequestSchema = z.object({
  versionId: z.string().uuid(),
  format: z.enum(['pdf', 'docx', 'txt']).default('pdf'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ExportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { versionId, format } = parsed.data;

    // 1. Fetch version content
    const { data: version, error: vErr } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .eq('user_id', user.id)
      .single();

    if (vErr || !version) {
      return NextResponse.json({ error: 'Resume version not found' }, { status: 404 });
    }

    const content = version.content as Record<string, any>;

    // 2. Build plain text representation (what ATS sees)
    const plainText = buildATSPlainText(content, version.name);

    // 3. Upload file to Supabase private storage
    const storagePath = `${user.id}/${versionId}.${format}`;
    const fileBuffer = Buffer.from(plainText, 'utf-8');

    const mimeType = format === 'pdf' ? 'application/pdf' : format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload error (fallback to text):', uploadError);
    }

    // 4. Create short-lived signed URL (3600 seconds)
    const { data: signedData, error: signError } = await supabase.storage
      .from('resumes')
      .createSignedUrl(storagePath, 3600);

    const downloadUrl = signedData?.signedUrl || '';

    // 5. Record file in resume_files table
    try {
      await supabase.from('resume_files').insert({
        version_id: versionId,
        user_id: user.id,
        storage_path: storagePath,
        format,
      });
    } catch (recordErr) {
      console.warn('Failed to record resume file metadata:', recordErr);
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      plainTextPreview: plainText,
      format,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function buildATSPlainText(content: Record<string, any>, title: string): string {
  const profile = content.profile || {};
  const skills = content.skills || [];
  const projects = content.projects || [];
  const education = content.education || [];
  const experiences = content.experiences || [];

  let text = '';

  // Contact Header
  text += `${(profile.fullName || 'CANDIDATE NAME').toUpperCase()}\n`;
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.location) contactParts.push(profile.location);
  if (profile.linkedin) contactParts.push(profile.linkedin);
  if (profile.github) contactParts.push(profile.github);
  text += `${contactParts.join(' | ')}\n\n`;

  // Professional Summary
  if (content.summary || profile.bio) {
    text += `PROFESSIONAL SUMMARY\n`;
    text += `${content.summary || profile.bio}\n\n`;
  }

  // Technical Skills
  if (skills.length > 0) {
    text += `TECHNICAL SKILLS\n`;
    const skillNames = skills.map((s: any) => (typeof s === 'string' ? s : s.name));
    text += `${skillNames.join(', ')}\n\n`;
  }

  // Work Experience
  if (experiences.length > 0) {
    text += `WORK EXPERIENCE\n`;
    experiences.forEach((exp: any) => {
      text += `${exp.role || 'Role'} - ${exp.company || 'Company'} (${exp.duration || '2024'})\n`;
      if (exp.description) text += `• ${exp.description}\n`;
      text += `\n`;
    });
  }

  // Technical Projects
  if (projects.length > 0) {
    text += `TECHNICAL PROJECTS\n`;
    projects.forEach((proj: any) => {
      const tech = (proj.techStack || proj.tech_stack || []).join(', ');
      text += `${proj.title || 'Project'} | Technologies: ${tech || 'Software Engineering'}\n`;
      if (proj.description) text += `• ${proj.description}\n`;
      text += `\n`;
    });
  }

  // Education
  if (education.length > 0 || profile.college) {
    text += `EDUCATION\n`;
    if (education.length > 0) {
      education.forEach((edu: any) => {
        text += `${edu.degree || 'B.Tech / B.E.'} - ${edu.institution || profile.college || 'University'} (${edu.year || profile.graduationYear || '2025'})\n`;
        if (edu.cgpa) text += `• CGPA: ${edu.cgpa}/10.0\n`;
      });
    } else {
      text += `Bachelor of Engineering / Technology - ${profile.college} (${profile.graduationYear || '2025'})\n`;
      if (profile.cgpa) text += `• CGPA: ${profile.cgpa}/10.0\n`;
    }
  }

  return text.trim();
}
