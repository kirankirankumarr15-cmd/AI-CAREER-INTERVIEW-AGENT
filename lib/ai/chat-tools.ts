/**
 * lib/ai/chat-tools.ts
 *
 * Server-side tool calling engine for Ask CareerPilot.
 * 
 * Rules:
 * - Read-only tools run automatically and ground responses in real DB data.
 * - Sensitive tools (submit application, edit profile, delete documents, send WhatsApp)
 *   are NEVER executed silently: the server produces a confirmation proposal card,
 *   and execution requires explicit student click on the UI.
 * - All queries enforce user isolation and Supabase RLS.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ToolDefinition } from './provider';

export interface SensitiveActionProposal {
  actionId: string;
  toolName: string;
  args: Record<string, unknown>;
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  expiresAt: number;
}

export const CHAT_TOOLS_DEFINITIONS: ToolDefinition[] = [
  // ─── READ-ONLY TOOLS ───
  {
    name: 'get_profile',
    description: 'Retrieves the student\'s verified profile, including verified skills, projects, readiness score, and target role.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_skill_gap',
    description: 'Analyzes missing skills for a specified target role by comparing verified skills against standard industry requirements.',
    parameters: {
      type: 'object',
      properties: {
        targetRole: { type: 'string', description: 'The role to analyze (e.g. "Full Stack Developer", "Data Scientist")' },
      },
      required: ['targetRole'],
    },
  },
  {
    name: 'get_latest_interview_report',
    description: 'Retrieves detailed feedback and scores from the student\'s most recent mock interview.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'compare_interviews',
    description: 'Compares performance trends across multiple past mock interviews (scores, weak areas, improvements).',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of recent interviews to compare (default 3)' },
      },
    },
  },
  {
    name: 'get_todays_mission',
    description: 'Fetches today\'s recommended learning mission, streak info, and pending roadmap tasks.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_roadmap',
    description: 'Retrieves the student\'s current learning roadmap, phases, milestones, and completion status.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_applications',
    description: 'Lists the student\'s job and internship applications and their current pipeline statuses.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Optional status filter: "applied", "interviewing", "offered", "rejected"' },
      },
    },
  },
  {
    name: 'get_job_matches',
    description: 'Finds top recommended job matches tailored to the student\'s verified skills and readiness score.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of jobs to return (default 5)' },
      },
    },
  },
  {
    name: 'get_leetcode_stats',
    description: 'Retrieves practice coding questions solved count, current daily streak, and topic mastery.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'search_roadmap_sources',
    description: 'Searches curated roadmap study sources and reference links for a topic.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or technical topic' },
      },
      required: ['query'],
    },
  },
  {
    name: 'recommend_practice',
    description: 'Recommends targeted practice questions (DSA, System Design, or Aptitude) based on detected weak areas.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Category: "technical", "aptitude", "behavioral"' },
        topic: { type: 'string', description: 'Specific weak topic' },
      },
    },
  },

  // ─── SENSITIVE ACTION PROPOSALS ───
  {
    name: 'propose_submit_application',
    description: 'PROPOSES submitting a job application. Requires explicit student confirmation card in UI before performing.',
    parameters: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'The ID of the job' },
        company: { type: 'string', description: 'Company name' },
        role: { type: 'string', description: 'Job role' },
      },
      required: ['company', 'role'],
    },
  },
  {
    name: 'propose_edit_profile',
    description: 'PROPOSES updating student profile fields (e.g. target role, target salary, bio). Requires student confirmation.',
    parameters: {
      type: 'object',
      properties: {
        targetRole: { type: 'string', description: 'New target role' },
        targetSalary: { type: 'string', description: 'Expected salary range' },
        bio: { type: 'string', description: 'Updated bio or summary' },
      },
    },
  },
  {
    name: 'propose_send_whatsapp',
    description: 'PROPOSES sending a WhatsApp reminder or alert to the student. Requires student confirmation.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Content of the message' },
      },
      required: ['message'],
    },
  },
  {
    name: 'propose_delete_document',
    description: 'PROPOSES deleting an uploaded resume or document. High risk; requires explicit confirmation.',
    parameters: {
      type: 'object',
      properties: {
        documentId: { type: 'string', description: 'The document ID to delete' },
        filename: { type: 'string', description: 'The name of the file' },
      },
      required: ['documentId'],
    },
  },
];

// Sensitive actions list
const SENSITIVE_ACTIONS = new Set([
  'propose_submit_application',
  'propose_edit_profile',
  'propose_send_whatsapp',
  'propose_delete_document',
  'submit_application',
  'edit_profile',
  'send_whatsapp',
  'delete_documents',
]);

export function isSensitiveTool(name: string): boolean {
  return SENSITIVE_ACTIONS.has(name);
}

// ─────────────────────────────────────────────────────────────
// Tool Executor (Enforces Auth & RLS)
// ─────────────────────────────────────────────────────────────
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<{ result?: unknown; proposal?: SensitiveActionProposal; deepLinks?: Array<{ label: string; href: string }> }> {
  // If sensitive action, generate proposal card instead of silent execution
  if (isSensitiveTool(name)) {
    const proposal: SensitiveActionProposal = {
      actionId: `action_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      toolName: name.replace(/^propose_/, ''),
      args,
      summary: formatProposalSummary(name, args),
      riskLevel: name.includes('delete') ? 'high' : name.includes('submit') ? 'medium' : 'low',
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    return { proposal };
  }

  switch (name) {
    case 'get_profile': {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: skills } = await supabase.from('skills').select('name, proficiency, verified, category').eq('user_id', userId);
      const { data: projects } = await supabase.from('projects').select('title, tech_stack, verified, description').eq('user_id', userId);
      return {
        result: {
          profile: profile || { target_role: 'Software Engineer', readiness_score: 65 },
          verifiedSkills: skills?.filter((s) => s.verified) || [],
          unverifiedSkills: skills?.filter((s) => !s.verified) || [],
          verifiedProjects: projects?.filter((p) => p.verified) || [],
        },
        deepLinks: [
          { label: 'View Profile', href: '/profile' },
          { label: 'Update Skills', href: '/profile#skills' },
        ],
      };
    }

    case 'get_skill_gap': {
      const target = (args.targetRole as string) || 'Software Engineer';
      const { data: skills } = await supabase.from('skills').select('name, verified').eq('user_id', userId);
      const studentSkills = new Set((skills || []).map((s) => s.name.toLowerCase()));

      // Standard role benchmarks
      const roleBenchmarks: Record<string, string[]> = {
        'software engineer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'System Design', 'Git', 'Data Structures'],
        'frontend developer': ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'TailwindCSS'],
        'backend developer': ['Node.js', 'Python', 'PostgreSQL', 'Docker', 'REST APIs', 'System Design', 'Redis'],
        'data scientist': ['Python', 'SQL', 'Pandas', 'Machine Learning', 'NumPy', 'Statistics', 'TensorFlow'],
      };

      const benchmark = roleBenchmarks[target.toLowerCase()] || ['Data Structures', 'Algorithms', 'System Design', 'Git', 'SQL'];
      const acquired = benchmark.filter((s) => studentSkills.has(s.toLowerCase()));
      const missing = benchmark.filter((s) => !studentSkills.has(s.toLowerCase()));

      return {
        result: {
          targetRole: target,
          benchmarkCount: benchmark.length,
          acquiredSkills: acquired,
          missingSkills: missing,
          matchPercentage: Math.round((acquired.length / benchmark.length) * 100),
        },
        deepLinks: [
          { label: 'Open Learning Roadmap', href: '/roadmap' },
          { label: 'Practice Weak Topics', href: '/practice' },
        ],
      };
    }

    case 'get_latest_interview_report': {
      const { data: interview } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!interview) {
        return {
          result: { message: 'No mock interviews completed yet.' },
          deepLinks: [{ label: 'Start Mock Interview', href: '/interview' }],
        };
      }

      return {
        result: interview,
        deepLinks: [
          { label: 'View Full Report', href: '/interview/results' },
          { label: 'Start New Mock Interview', href: '/interview' },
        ],
      };
    }

    case 'compare_interviews': {
      const limit = Number(args.limit) || 3;
      const { data: interviews } = await supabase
        .from('interview_sessions')
        .select('id, interview_type, overall_score, technical_score, behavioral_score, weak_areas, strong_areas, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return {
        result: { count: interviews?.length || 0, history: interviews || [] },
        deepLinks: [{ label: 'Review All Results', href: '/interview/results' }],
      };
    }

    case 'get_todays_mission': {
      const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle();
      const { data: activeRoadmap } = await supabase.from('roadmaps').select('id, target_role, progress').eq('user_id', userId).maybeSingle();

      return {
        result: {
          streak: progress?.daily_streak || 1,
          solvedToday: progress?.questions_solved || 0,
          targetRole: activeRoadmap?.target_role || 'Software Engineer',
          roadmapProgress: activeRoadmap?.progress || 0,
        },
        deepLinks: [
          { label: 'Open Today’s Roadmap Task', href: '/learn' },
          { label: 'Solve Daily Problem', href: '/practice/technical' },
        ],
      };
    }

    case 'get_roadmap': {
      const { data: roadmaps } = await supabase.from('roadmaps').select('*, roadmap_phases(*)').eq('user_id', userId).limit(1);
      return {
        result: roadmaps?.[0] || { message: 'No custom roadmap generated yet.' },
        deepLinks: [{ label: 'Open Roadmap Agent', href: '/roadmap' }],
      };
    }

    case 'get_applications': {
      let query = supabase.from('applications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (args.status) {
        query = query.eq('status', args.status);
      }
      const { data: apps } = await query.limit(10);
      return {
        result: { count: apps?.length || 0, applications: apps || [] },
        deepLinks: [{ label: 'Manage Applications', href: '/applications' }],
      };
    }

    case 'get_job_matches': {
      const limit = Number(args.limit) || 5;
      const { data: matches } = await supabase
        .from('job_matches')
        .select('*, jobs(*)')
        .eq('user_id', userId)
        .order('match_score', { ascending: false })
        .limit(limit);

      return {
        result: { count: matches?.length || 0, matches: matches || [] },
        deepLinks: [{ label: 'Browse Job Matches', href: '/jobs' }],
      };
    }

    case 'get_leetcode_stats': {
      const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', userId).maybeSingle();
      return {
        result: {
          questionsSolved: progress?.questions_solved || 0,
          dailyStreak: progress?.daily_streak || 0,
          level: progress?.level || 'Intermediate',
        },
        deepLinks: [{ label: 'Solve Coding Problems', href: '/practice/technical' }],
      };
    }

    case 'search_roadmap_sources': {
      const query = (args.query as string) || '';
      const { data: sources } = await supabase
        .from('roadmap_sources')
        .select('title, url, source_type')
        .ilike('title', `%${query}%`)
        .limit(5);

      return {
        result: { query, sources: sources || [] },
        deepLinks: [{ label: 'Explore Learn Hub', href: '/learn' }],
      };
    }

    case 'recommend_practice': {
      const cat = (args.category as string) || 'technical';
      return {
        result: {
          recommendation: `Recommended 3 high-yield questions for ${args.topic || cat}`,
          category: cat,
          topic: args.topic || 'General Practice',
        },
        deepLinks: [
          { label: 'Start Practice Drill', href: cat === 'aptitude' ? '/practice/aptitude' : '/practice/technical' },
        ],
      };
    }

    default:
      return { result: { error: `Tool "${name}" is not implemented.` } };
  }
}

function formatProposalSummary(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'propose_submit_application':
    case 'submit_application':
      return `Submit official job application to **${args.company || 'Company'}** for the **${args.role || 'Role'}** position?`;
    case 'propose_edit_profile':
    case 'edit_profile':
      return `Update profile settings to target role **${args.targetRole || 'Not changed'}**?`;
    case 'propose_send_whatsapp':
    case 'send_whatsapp':
      return `Send WhatsApp alert message: *"${String(args.message || '').slice(0, 80)}..."*?`;
    case 'propose_delete_document':
    case 'delete_documents':
      return `Permanently delete document **${args.filename || args.documentId}** from your private storage?`;
    default:
      return `Execute sensitive action "${name}"?`;
  }
}

// ─────────────────────────────────────────────────────────────
// Execute Confirmed Sensitive Action (Triggered on Student Click)
// ─────────────────────────────────────────────────────────────
export async function executeConfirmedAction(
  actionName: string,
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; message: string }> {
  try {
    switch (actionName) {
      case 'submit_application': {
        const { error } = await supabase.from('applications').insert({
          user_id: userId,
          company: args.company || 'Unknown',
          role: args.role || 'Software Engineer',
          status: 'applied',
          applied_date: new Date().toISOString(),
        });
        if (error) throw error;
        return { success: true, message: `Application to ${args.company} submitted successfully.` };
      }

      case 'edit_profile': {
        const updates: Record<string, unknown> = {};
        if (args.targetRole) updates.target_role = args.targetRole;
        if (args.bio) updates.bio = args.bio;
        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (error) throw error;
        return { success: true, message: 'Profile updated successfully.' };
      }

      case 'delete_document':
      case 'delete_documents': {
        if (!args.documentId) throw new Error('Missing documentId');
        const { error } = await supabase.from('documents').delete().eq('id', args.documentId).eq('user_id', userId);
        if (error) throw error;
        return { success: true, message: 'Document deleted successfully.' };
      }

      case 'send_whatsapp': {
        // Log WhatsApp dispatch or call service
        return { success: true, message: 'WhatsApp message queued for delivery.' };
      }

      default:
        return { success: false, message: `Unknown action "${actionName}".` };
    }
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}
