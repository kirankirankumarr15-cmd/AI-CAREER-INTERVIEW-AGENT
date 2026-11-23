import { NextResponse } from 'next/server';
import { nodeDb } from '@/lib/db/nodeDb';
import { getAuthenticatedUser } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    
    // Check admin / staff permissions
    const isStaff = user && (
      user.role === 'admin' ||
      user.role === 'tpo' ||
      user.role === 'hod' ||
      user.email.toLowerCase().includes('hod@pesitm') ||
      user.email.toLowerCase().includes('admin@pesitm')
    );

    if (!isStaff) {
      return NextResponse.json(
        { error: 'Unauthorized: Placement Cell Admin credentials required' },
        { status: 403 }
      );
    }

    const cohortSummary = nodeDb.getCohortSummary();
    const studentsProgress = nodeDb.getAllStudentsProgress();

    return NextResponse.json({
      success: true,
      cohortSummary,
      students: studentsProgress,
    });
  } catch (error) {
    console.error('Error fetching admin practice analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin practice metrics' },
      { status: 500 }
    );
  }
}
