import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { updateRoadmapTaskStatus } from '@/lib/roadmap/db';
import { TaskStatus } from '@/lib/roadmap/types';

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const result = await updateRoadmapTaskStatus(taskId, userId, status);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update task status.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      progressPercent: result.progressPercent,
    });
  } catch (error: unknown) {
    console.error('Error updating task status:', error);
    const errMsg = error instanceof Error ? error.message : 'Server error updating task.';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
