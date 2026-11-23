import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';
import { practiceDb } from '@/lib/db/nodeDb';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    const userId = authUser?.id || 'student-demo';

    // 1. Fetch from SQLite
    let sessions: any[] = [];
    try {
      sessions = practiceDb.getUserInterviewSessions(userId);
    } catch (e) {
      console.warn('[InterviewHistory] SQLite read error:', e);
    }

    // 2. If SQLite empty, attempt Supabase read
    if (sessions.length === 0) {
      try {
        const supabase = await createClient();
        const { data } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data && data.length > 0) {
          sessions = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            targetRole: d.target_role,
            interviewType: d.interview_type,
            difficulty: d.difficulty,
            status: d.status,
            overallScore: d.overall_score,
            communicationScore: d.communication_score,
            technicalAccuracyScore: d.technical_accuracy_score,
            confidenceScore: d.confidence_score,
            structureScore: d.structure_score,
            feedbackSummary: typeof d.feedback_summary === 'string' ? JSON.parse(d.feedback_summary) : d.feedback_summary,
            completedAt: d.completed_at,
            createdAt: d.created_at,
          }));
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      sessions,
      totalCount: sessions.length,
      averageScore: sessions.length > 0
        ? Math.round(sessions.reduce((acc: number, s: any) => acc + (s.overallScore || 70), 0) / sessions.length)
        : null,
    });
  } catch (error) {
    console.error('[InterviewHistory] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch interview history' }, { status: 500 });
  }
}
