import { createHash } from 'node:crypto';

export const IMPORT_FIELDS = [
  'student_id',
  'full_name',
  'email',
  'phone',
  'department',
  'batch',
  'graduation_year',
  'course',
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];
export type RowStatus = 'valid' | 'invalid' | 'duplicate';

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: ',' | ';' | '\t';
  truncated: boolean;
}

export interface ImportMapping {
  [key: string]: ImportField | '';
}

export interface RowIssue {
  field?: ImportField | 'row';
  code: string;
  message: string;
}

export interface PreviewRow {
  rowNumber: number;
  data: Record<ImportField, string>;
  status: RowStatus;
  issues: RowIssue[];
  warnings: RowIssue[];
  departmentId: string | null;
  existingAccount: boolean;
  existingRoster: boolean;
}

export interface PreviewSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  existingAccounts: number;
  missingFields: number;
}

export interface ImportContextData {
  departments: Array<{ id: string; name: string; code?: string | null }>;
  existingProfileEmails: Set<string>;
  existingRosterEmails: Set<string>;
  existingStudentIds: Set<string>;
  rosterStudentIds: Set<string>;
  forcedDepartmentId?: string | null;
}

const HEADER_ALIASES: Record<string, ImportField> = {
  studentid: 'student_id',
  student_id: 'student_id',
  studentnumber: 'student_id',
  rollnumber: 'student_id',
  rollno: 'student_id',
  usn: 'student_id',
  registrationnumber: 'student_id',
  fullname: 'full_name',
  name: 'full_name',
  studentname: 'full_name',
  email: 'email',
  emailaddress: 'email',
  emailid: 'email',
  phone: 'phone',
  mobile: 'phone',
  phonenumber: 'phone',
  contact: 'phone',
  department: 'department',
  dept: 'department',
  branch: 'department',
  batch: 'batch',
  batch_name: 'batch',
  graduationyear: 'graduation_year',
  gradyear: 'graduation_year',
  passingyear: 'graduation_year',
  yearofgraduation: 'graduation_year',
  course: 'course',
  program: 'course',
  degree: 'course',
};

export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/^\uFEFF/, '').replace(/[^a-z0-9]/g, '');
}

export function parseCsvText(text: string, maxRows = 5000): ParsedCsv {
  const input = text.replace(/^\uFEFF/, '');
  const firstLine = input.split(/\r?\n/, 1)[0] || '';
  const delimiter: ',' | ';' | '\t' = firstLine.includes('\t')
    ? '\t'
    : (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length
      ? ';'
      : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let truncated = false;

  const pushRow = () => {
    if (row.length === 1 && row[0].trim() === '') {
      row = [];
      cell = '';
      return;
    }
    rows.push([...row, cell]);
    row = [];
    cell = '';
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      pushRow();
      if (rows.length > maxRows) {
        truncated = true;
        break;
      }
    } else if (char === '\r') {
      // Ignore CR; LF handles the row boundary.
    } else {
      cell += char;
    }
  }
  if (!truncated && (cell.length > 0 || row.length > 0)) pushRow();

  const headers = (rows.shift() || []).map((h) => h.trim());
  return {
    headers,
    rows: rows.filter((r) => r.some((c) => c.trim() !== '')).slice(0, maxRows),
    delimiter,
    truncated,
  };
}

export function detectMapping(headers: string[]): ImportMapping {
  const mapping: ImportMapping = {};
  const used = new Set<ImportField>();
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const field = HEADER_ALIASES[normalized];
    if (field && !used.has(field)) {
      mapping[header] = field;
      used.add(field);
    } else {
      mapping[header] = '';
    }
  }
  return mapping;
}

export function mappedRequiredFields(mapping: ImportMapping): ImportField[] {
  const mapped = new Set(Object.values(mapping).filter(Boolean) as ImportField[]);
  return (['full_name', 'email', 'department'] as ImportField[]).filter((field) => !mapped.has(field));
}

export function mapRow(headers: string[], cells: string[], mapping: ImportMapping): Record<ImportField, string> {
  const data = Object.fromEntries(IMPORT_FIELDS.map((field) => [field, ''])) as Record<ImportField, string>;
  headers.forEach((header, index) => {
    const field = mapping[header];
    if (!field) return;
    data[field] = String(cells[index] ?? '').trim().slice(0, 500);
  });
  return data;
}

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_RE = /^[+()\-\s0-9]{7,20}$/;

export function validateCsvRows(
  parsed: ParsedCsv,
  mapping: ImportMapping,
  context: ImportContextData
): { rows: PreviewRow[]; summary: PreviewSummary } {
  const seenEmails = new Set<string>();
  const seenStudentIds = new Set<string>();
  const rows: PreviewRow[] = [];

  parsed.rows.forEach((cells, index) => {
    const data = mapRow(parsed.headers, cells, mapping);
    const issues: RowIssue[] = [];
    const warnings: RowIssue[] = [];
    const email = data.email.toLowerCase();

    if (!data.full_name) issues.push({ field: 'full_name', code: 'REQUIRED', message: 'Full name is required.' });
    if (!email) issues.push({ field: 'email', code: 'REQUIRED', message: 'Email is required.' });
    else if (!EMAIL_RE.test(email)) issues.push({ field: 'email', code: 'INVALID_EMAIL', message: 'Email format is invalid.' });

    if (data.phone && !PHONE_RE.test(data.phone)) {
      issues.push({ field: 'phone', code: 'INVALID_PHONE', message: 'Phone number format is invalid.' });
    }

    if (data.graduation_year) {
      const year = Number(data.graduation_year);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        issues.push({ field: 'graduation_year', code: 'INVALID_YEAR', message: 'Graduation year must be between 2000 and 2100.' });
      }
    }

    let departmentId: string | null = context.forcedDepartmentId || null;
    if (!departmentId) {
      if (!data.department) {
        issues.push({ field: 'department', code: 'REQUIRED', message: 'Department is required.' });
      } else {
        const match = context.departments.find(
          (d) =>
            d.name.toLowerCase() === data.department.toLowerCase() ||
            (d.code && d.code.toLowerCase() === data.department.toLowerCase())
        );
        if (!match) {
          issues.push({
            field: 'department',
            code: 'DEPARTMENT_NOT_FOUND',
            message: `Department "${data.department}" is not configured for this institution.`,
          });
        } else {
          departmentId = match.id;
        }
      }
    }

    if (email && seenEmails.has(email)) {
      issues.push({ field: 'email', code: 'DUPLICATE_IN_FILE', message: 'Duplicate email within this file.' });
    }
    if (data.student_id && seenStudentIds.has(data.student_id.toLowerCase())) {
      issues.push({ field: 'student_id', code: 'DUPLICATE_ID_IN_FILE', message: 'Duplicate student ID within this file.' });
    }
    if (email) seenEmails.add(email);
    if (data.student_id) seenStudentIds.add(data.student_id.toLowerCase());

    const existingRoster =
      Boolean(email && context.existingRosterEmails.has(email)) ||
      Boolean(data.student_id && context.rosterStudentIds.has(data.student_id.toLowerCase()));
    if (existingRoster) {
      issues.push({ code: 'DUPLICATE_ROSTER', message: 'A roster record with this email or student ID already exists.' });
    }

    const existingAccount = Boolean(email && context.existingProfileEmails.has(email));
    if (existingAccount) {
      warnings.push({
        code: 'EXISTING_ACCOUNT',
        message: 'An account already exists. Its existing profile values will not be overwritten.',
      });
    }

    if (data.student_id && context.existingStudentIds.has(data.student_id.toLowerCase())) {
      warnings.push({
        code: 'STUDENT_ID_IN_USE',
        message: 'This student ID is already recorded on an existing profile.',
      });
    }

    const status: RowStatus = issues.some((i) => i.code.startsWith('DUPLICATE'))
      ? 'duplicate'
      : issues.length
        ? 'invalid'
        : 'valid';

    rows.push({
      rowNumber: index + 2,
      data,
      status,
      issues,
      warnings,
      departmentId,
      existingAccount,
      existingRoster,
    });
  });

  const summary: PreviewSummary = {
    totalRows: rows.length,
    validRows: rows.filter((r) => r.status === 'valid').length,
    invalidRows: rows.filter((r) => r.status === 'invalid').length,
    duplicateRows: rows.filter((r) => r.status === 'duplicate').length,
    existingAccounts: rows.filter((r) => r.existingAccount).length,
    missingFields: rows.filter((r) => r.issues.some((i) => i.code === 'REQUIRED')).length,
  };

  return { rows, summary };
}

export function buildCsvTemplate(): string {
  return [
    'student_id,full_name,email,phone,department,batch,graduation_year,course',
    '1RV21CS001,Ananya Rao,ananya.rao@example.edu.in,+919876543210,Computer Science & Engineering,2022-2026,2026,B.Tech CSE',
    '1RV21CS002,Rahul Kumar,rahul.kumar@example.edu.in,,Information Science & Engineering,2022-2026,2026,B.Tech ISE',
  ].join('\r\n');
}

export function sanitizeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const trimmed = text.replace(/\u0000/g, '');
  if (/^[=+\-@\t\r]/.test(trimmed)) return `'${trimmed}`;
  if (/[",\n\r]/.test(trimmed)) return `"${trimmed.replace(/"/g, '""')}"`;
  return trimmed;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
  ].join('\r\n');
}

export function buildErrorReportCsv(
  rows: Array<{ rowNumber: number; email: string; code: string; message: string }>
): string {
  return `\uFEFF${toCsv(
    ['Row', 'Email', 'Error Code', 'Message'],
    rows.map((r) => [r.rowNumber, r.email, r.code, r.message])
  )}`;
}

export function hashImportPayload(
  organizationId: string,
  actorUserId: string,
  rows: Array<Record<string, unknown>>
): string {
  const canonical = rows.map((row) =>
    IMPORT_FIELDS.map((field) => String(row[field] ?? '').trim().toLowerCase()).join('|')
  );
  return createHash('sha256')
    .update(`${organizationId}|${actorUserId}|${canonical.join('\n')}`)
    .digest('hex');
}

export function rowsForCommit(rows: PreviewRow[]): Array<Record<string, unknown>> {
  return rows
    .filter((row) => row.status === 'valid')
    .map((row) => ({
      rowNumber: row.rowNumber,
      student_id_number: row.data.student_id,
      full_name: row.data.full_name,
      email: row.data.email.toLowerCase(),
      phone: row.data.phone || null,
      department_id: row.departmentId,
      batch_name: row.data.batch || null,
      graduation_year: row.data.graduation_year ? Number(row.data.graduation_year) : null,
      course: row.data.course || null,
    }));
}
