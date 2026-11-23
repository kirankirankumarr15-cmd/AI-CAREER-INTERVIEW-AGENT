import { NextResponse } from 'next/server';
import { nodeDb } from '@/lib/db/nodeDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subjects = nodeDb.getSubjects();
    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error('Error fetching practice subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}
