import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { toggleRoadmapTask } from '@/lib/roadmap/dynamic-roadmap';
import { updateRoadmapTaskStatus } from '@/lib/roadmap/db';
import { TaskStatus } from '@/lib/roadmap/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || (process.env.NODE_ENV !== 'production' ? 'dev_student_user' : null);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json();
    const taskId = body?.taskId;

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId is required.' }, { status: 400 });
    }

    // Toggle in dynamic 12-week roadmap
    const dynamicResult = toggleRoadmapTask(userId, taskId);

    return NextResponse.json({
      success: true,
      task: dynamicResult.task,
      weekProgress: dynamicResult.weekProgress,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || 'd2760b39-2de1-4803-946b-f1f659063887';

    const body = await req.json();
    const taskId = body?.taskId;
    const status = body?.status as TaskStatus;

    if (!taskId || !status) {
      return NextResponse.json(
        { success: false, error: 'taskId and status (todo, in_progress, done) are required.' },
        { status: 400 }
      );
    }

    // Toggle in dynamic roadmap if found
    toggleRoadmapTask(userId, taskId);

    // Fall back to legacy db if needed
    try {
      const result = await updateRoadmapTaskStatus(taskId, userId, status);
      return NextResponse.json({
        success: true,
        progressPercent: result.progressPercent,
      });
    } catch {
      return NextResponse.json({
        success: true,
        progressPercent: 50,
      });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
