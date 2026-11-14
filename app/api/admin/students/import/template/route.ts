/**
 * /api/admin/students/import/template
 *
 * GET: Serves the standard Student Roster CSV template.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const csvHeaders = 'student_id,full_name,email,phone,department,batch,graduation_year,course\n';
  const sampleRow1 = 'PES1UG22CS101,Aarav Sharma,aarav.cs22@pesitm.edu.in,+919876543210,Computer Science,2026 Batch,2026,B.Tech\n';
  const sampleRow2 = 'PES1UG22IS045,Bhavana Gowda,bhavana.is22@pesitm.edu.in,+919876543211,Information Science,2026 Batch,2026,B.Tech\n';

  const csvContent = csvHeaders + sampleRow1 + sampleRow2;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="careerpilot_student_import_template.csv"',
    },
  });
}

