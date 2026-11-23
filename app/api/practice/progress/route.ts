import { NextResponse } from 'next/server';
import { nodeDb } from '@/lib/db/nodeDb';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session. Please sign in.',
        totalSolved: 0,
        totalAttempted: 0,
        totalQuestions: 70,
        accuracy: 0,
        streak: 0,
        subjectStats: {},
        recentActivity: [],
        attempts: {},
      });
    }

    // Ensure user record exists
    nodeDb.syncUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    const progress = nodeDb.getUserProgress(user.id);

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ...progress,
    });
  } catch (error) {
    console.error('Error fetching student practice progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve progress' },
      { status: 500 }
    );
  }
}
