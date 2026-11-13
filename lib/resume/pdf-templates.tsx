import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

export interface ResumeData {
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    college?: string;
    graduationYear?: string;
    cgpa?: number | string;
    targetRole?: string;
  };
  summary?: string;
  skills?: Array<string | { name: string }>;
  projects?: Array<{
    title?: string;
    techStack?: string[];
    tech_stack?: string[];
    description?: string;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    cgpa?: number | string;
  }>;
  experiences?: Array<{
    role?: string;
    company?: string;
    duration?: string;
    description?: string;
  }>;
}

// ─── 1. MODERN TEMPLATE STYLES (Helvetica, Clean Single Column) ──────────────
const modernStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 36,
    color: '#1e293b',
    lineHeight: 1.25,
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    paddingBottom: 6,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
    fontSize: 8.5,
    color: '#475569',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  itemTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#0f172a',
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 8.5,
    color: '#64748b',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletBullet: {
    width: 8,
    fontSize: 8,
    color: '#2563eb',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#334155',
  },
  skillsText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.3,
  },
});

// ─── 2. CLASSIC TEMPLATE STYLES (Times-Roman, Centered, Ivy League Standard) ──
const classicStyles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 40,
    color: '#111827',
    lineHeight: 1.25,
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 6,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
    fontSize: 9,
    color: '#374151',
  },
  section: {
    marginTop: 7,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    paddingBottom: 1,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  itemTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  itemSubtitle: {
    fontFamily: 'Times-Italic',
    fontSize: 9.5,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 9,
    color: '#4b5563',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 6,
  },
  bulletBullet: {
    width: 10,
    fontSize: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: '#1f2937',
  },
  skillsText: {
    fontSize: 9.5,
    color: '#1f2937',
    lineHeight: 1.3,
  },
});

// ─── 3. TECHNICAL TEMPLATE STYLES (Courier / Helvetica Matrix, SDE Layout) ────
const technicalStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 32,
    color: '#0f172a',
    lineHeight: 1.25,
  },
  header: {
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0f766e',
    paddingLeft: 8,
  },
  name: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  roleTitle: {
    fontSize: 10,
    fontFamily: 'Courier-Bold',
    color: '#0f766e',
    marginTop: 1,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
    fontSize: 8,
    color: '#475569',
  },
  section: {
    marginTop: 7,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Courier-Bold',
    color: '#0f766e',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  itemTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#0f172a',
  },
  itemSubtitle: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    color: '#334155',
    marginBottom: 2,
  },
  itemDate: {
    fontFamily: 'Courier',
    fontSize: 8,
    color: '#64748b',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 1.5,
    paddingLeft: 4,
  },
  bulletBullet: {
    width: 8,
    fontSize: 7.5,
    color: '#0f766e',
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: '#1e293b',
  },
  skillsText: {
    fontSize: 8.5,
    color: '#1e293b',
    lineHeight: 1.25,
  },
});

function splitBullets(description?: string): string[] {
  if (!description) return [];
  return description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^([•\-\*–]|\d+\.)\s*/, ''));
}

// Helper to normalize skills array into strings
function getSkillsString(skills?: Array<string | { name: string }>): string {
  if (!skills || skills.length === 0) return 'Java, TypeScript, Python, React, Next.js, PostgreSQL, Git, Docker';
  return skills.map((s) => (typeof s === 'string' ? s : s.name)).join(' • ');
}

// ─── DOCUMENT WRAPPERS ─────────────────────────────────────────────────────────

export const ModernResumeDocument = ({ data }: { data: ResumeData }) => {
  const p = data.profile || {};
  const skillsList = getSkillsString(data.skills);

  return (
    <Document title={`${p.fullName || 'Candidate'} - Resume`}>
      <Page size="A4" style={modernStyles.page}>
        {/* Header */}
        <View style={modernStyles.header}>
          <Text style={modernStyles.name}>{p.fullName || 'Candidate Name'}</Text>
          {p.targetRole && <Text style={modernStyles.roleTitle}>{p.targetRole}</Text>}
          <View style={modernStyles.contactRow}>
            {p.email && <Text>{p.email}</Text>}
            {p.phone && <Text>• {p.phone}</Text>}
            {p.location && <Text>• {p.location}</Text>}
            {p.linkedin && <Text>• {p.linkedin}</Text>}
            {p.github && <Text>• {p.github}</Text>}
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Professional Summary</Text>
            <Text style={modernStyles.skillsText}>{data.summary}</Text>
          </View>
        )}

        {/* Technical Skills */}
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Technical Skills</Text>
          <Text style={modernStyles.skillsText}>{skillsList}</Text>
        </View>

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Technical Projects</Text>
            {data.projects.slice(0, 3).map((proj, idx) => {
              const bullets = splitBullets(proj.description);
              const stack = proj.techStack || proj.tech_stack || [];
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={modernStyles.itemRow}>
                    <Text style={modernStyles.itemTitle}>{proj.title}</Text>
                    {stack.length > 0 && (
                      <Text style={modernStyles.itemDate}>{stack.join(', ')}</Text>
                    )}
                  </View>
                  {bullets.map((b, bIdx) => (
                    <View key={bIdx} style={modernStyles.bulletPoint}>
                      <Text style={modernStyles.bulletBullet}>•</Text>
                      <Text style={modernStyles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Experience */}
        {data.experiences && data.experiences.length > 0 && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Experience & Internships</Text>
            {data.experiences.slice(0, 2).map((exp, idx) => {
              const bullets = splitBullets(exp.description);
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={modernStyles.itemRow}>
                    <Text style={modernStyles.itemTitle}>{exp.role}</Text>
                    {exp.duration && <Text style={modernStyles.itemDate}>{exp.duration}</Text>}
                  </View>
                  {exp.company && <Text style={modernStyles.itemSubtitle}>{exp.company}</Text>}
                  {bullets.map((b, bIdx) => (
                    <View key={bIdx} style={modernStyles.bulletPoint}>
                      <Text style={modernStyles.bulletBullet}>•</Text>
                      <Text style={modernStyles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        <View style={modernStyles.section}>
          <Text style={modernStyles.sectionTitle}>Education</Text>
          {(data.education && data.education.length > 0
            ? data.education
            : [
                {
                  degree: 'B.E. in Computer Science & Engineering',
                  institution: p.college || 'PESITM Shivamogga',
                  year: p.graduationYear || '2026',
                  cgpa: p.cgpa ? `CGPA: ${p.cgpa}/10.0` : 'CGPA: 8.5/10.0',
                },
              ]
          ).map((edu, idx) => (
            <View key={idx} style={modernStyles.itemRow}>
              <View>
                <Text style={modernStyles.itemTitle}>{edu.degree}</Text>
                <Text style={modernStyles.itemSubtitle}>{edu.institution}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={modernStyles.itemDate}>{edu.year}</Text>
                {edu.cgpa && <Text style={modernStyles.itemDate}>{edu.cgpa}</Text>}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export const ClassicResumeDocument = ({ data }: { data: ResumeData }) => {
  const p = data.profile || {};
  const skillsList = getSkillsString(data.skills);

  return (
    <Document title={`${p.fullName || 'Candidate'} - Resume`}>
      <Page size="A4" style={classicStyles.page}>
        {/* Header */}
        <View style={classicStyles.header}>
          <Text style={classicStyles.name}>{p.fullName || 'Candidate Name'}</Text>
          <View style={classicStyles.contactRow}>
            {p.email && <Text>{p.email}</Text>}
            {p.phone && <Text>• {p.phone}</Text>}
            {p.location && <Text>• {p.location}</Text>}
            {p.linkedin && <Text>• {p.linkedin}</Text>}
            {p.github && <Text>• {p.github}</Text>}
          </View>
        </View>

        {/* Education First (Standard Ivy League fresher layout) */}
        <View style={classicStyles.section}>
          <Text style={classicStyles.sectionTitle}>Education</Text>
          {(data.education && data.education.length > 0
            ? data.education
            : [
                {
                  degree: 'Bachelor of Engineering in Computer Science',
                  institution: p.college || 'PESITM Shivamogga',
                  year: p.graduationYear || '2026',
                  cgpa: p.cgpa ? `CGPA: ${p.cgpa}/10.0` : 'CGPA: 8.5/10.0',
                },
              ]
          ).map((edu, idx) => (
            <View key={idx} style={classicStyles.itemRow}>
              <View>
                <Text style={classicStyles.itemTitle}>{edu.institution}</Text>
                <Text style={classicStyles.itemSubtitle}>{edu.degree}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={classicStyles.itemDate}>{edu.year}</Text>
                {edu.cgpa && <Text style={classicStyles.itemDate}>{edu.cgpa}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Technical Skills */}
        <View style={classicStyles.section}>
          <Text style={classicStyles.sectionTitle}>Technical Proficiencies</Text>
          <Text style={classicStyles.skillsText}>{skillsList}</Text>
        </View>

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionTitle}>Technical Projects</Text>
            {data.projects.slice(0, 3).map((proj, idx) => {
              const bullets = splitBullets(proj.description);
              const stack = proj.techStack || proj.tech_stack || [];
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={classicStyles.itemRow}>
                    <Text style={classicStyles.itemTitle}>{proj.title}</Text>
                    {stack.length > 0 && (
                      <Text style={classicStyles.itemDate}>{stack.join(', ')}</Text>
                    )}
                  </View>
                  {bullets.map((b, bIdx) => (
                    <View key={bIdx} style={classicStyles.bulletPoint}>
                      <Text style={classicStyles.bulletBullet}>•</Text>
                      <Text style={classicStyles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Experience */}
        {data.experiences && data.experiences.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionTitle}>Experience & Internships</Text>
            {data.experiences.slice(0, 2).map((exp, idx) => {
              const bullets = splitBullets(exp.description);
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={classicStyles.itemRow}>
                    <Text style={classicStyles.itemTitle}>{exp.company}</Text>
                    {exp.duration && <Text style={classicStyles.itemDate}>{exp.duration}</Text>}
                  </View>
                  {exp.role && <Text style={classicStyles.itemSubtitle}>{exp.role}</Text>}
                  {bullets.map((b, bIdx) => (
                    <View key={bIdx} style={classicStyles.bulletPoint}>
                      <Text style={classicStyles.bulletBullet}>•</Text>
                      <Text style={classicStyles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </Page>
    </Document>
  );
};

export const TechnicalResumeDocument = ({ data }: { data: ResumeData }) => {
  const p = data.profile || {};
  const skillsList = getSkillsString(data.skills);

  return (
    <Document title={`${p.fullName || 'Candidate'} - Resume`}>
      <Page size="A4" style={technicalStyles.page}>
        {/* Header */}
        <View style={technicalStyles.header}>
          <Text style={technicalStyles.name}>{p.fullName || 'Candidate Name'}</Text>
          <Text style={technicalStyles.roleTitle}>&gt; {p.targetRole || 'Software Development Engineer'}</Text>
          <View style={technicalStyles.contactRow}>
            {p.email && <Text>{p.email}</Text>}
            {p.phone && <Text>| {p.phone}</Text>}
            {p.github && <Text>| {p.github}</Text>}
            {p.linkedin && <Text>| {p.linkedin}</Text>}
          </View>
        </View>

        {/* Skills Matrix First for SDE roles */}
        <View style={technicalStyles.section}>
          <Text style={technicalStyles.sectionTitle}>[ TECHNICAL_CORE ]</Text>
          <Text style={technicalStyles.skillsText}>{skillsList}</Text>
        </View>

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>[ SYSTEM_PROJECTS ]</Text>
            {data.projects.slice(0, 3).map((proj, idx) => {
              const bullets = splitBullets(proj.description);
              const stack = proj.techStack || proj.tech_stack || [];
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={technicalStyles.itemRow}>
                    <Text style={technicalStyles.itemTitle}>{proj.title}</Text>
                    {stack.length > 0 && (
                      <Text style={technicalStyles.itemSubtitle}>[ {stack.join(', ')} ]</Text>
                    )}
                  </View>
                  {bullets.map((b, bIdx) => (
                    <View key={bIdx} style={technicalStyles.bulletPoint}>
                      <Text style={technicalStyles.bulletBullet}>&gt;</Text>
                      <Text style={technicalStyles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Experience */}
        {data.experiences && data.experiences.length > 0 && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>[ INDUSTRY_EXPERIENCE ]</Text>
            {data.experiences.slice(0, 2).map((exp, idx) => {
              const bullets = splitBullets(exp.description);
              return (
                <View key={idx} style={{ marginBottom: 4 }}>
                  <View style={technicalStyles.itemRow}>
                    <Text style={technicalStyles.itemTitle}>{exp.role} @ {exp.company}</Text>
                    {exp.duration && <Text style={technicalStyles.itemDate}>{exp.duration}</Text>}
                  </View>
                  {bullets.map((b, bIdx) => (
                    <View key={bIdx} style={technicalStyles.bulletPoint}>
                      <Text style={technicalStyles.bulletBullet}>&gt;</Text>
                      <Text style={technicalStyles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        <View style={technicalStyles.section}>
          <Text style={technicalStyles.sectionTitle}>[ ACADEMIC_RECORD ]</Text>
          {(data.education && data.education.length > 0
            ? data.education
            : [
                {
                  degree: 'B.E. Computer Science & Engineering',
                  institution: p.college || 'PESITM Shivamogga',
                  year: p.graduationYear || '2026',
                  cgpa: p.cgpa ? `CGPA: ${p.cgpa}/10.0` : 'CGPA: 8.5/10.0',
                },
              ]
          ).map((edu, idx) => (
            <View key={idx} style={technicalStyles.itemRow}>
              <View>
                <Text style={technicalStyles.itemTitle}>{edu.degree}</Text>
                <Text style={technicalStyles.itemSubtitle}>{edu.institution}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={technicalStyles.itemDate}>{edu.year}</Text>
                {edu.cgpa && <Text style={technicalStyles.itemDate}>{edu.cgpa}</Text>}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

/**
 * Universal Server-Side PDF Generator
 * Produces clean, selectable binary PDF buffer using @react-pdf/renderer
 */
export async function generateResumePDF(
  data: ResumeData,
  template: 'modern' | 'classic' | 'technical' = 'modern'
): Promise<Buffer> {
  let doc: React.ReactElement;
  if (template === 'classic') {
    doc = <ClassicResumeDocument data={data} />;
  } else if (template === 'technical') {
    doc = <TechnicalResumeDocument data={data} />;
  } else {
    doc = <ModernResumeDocument data={data} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as any)(doc);
  return buffer as Buffer;
}
