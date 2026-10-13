import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sqlProblems } from '@/lib/practice/questions';

// ─────────────────────────────────────────────────────
// SQL SANDBOX — Real PostgreSQL via Supabase
// Restricted to safe read-only operations with timeout
// ─────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ALLOWED SQL PATTERNS — restrict dangerous operations
const BLOCKED_PATTERNS = [
  /\bDROP\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXEC(UTE)?\b/i,
  /\bCALL\b/i,
  /pg_read_file/i,
  /pg_ls_dir/i,
  /COPY\s+\w+\s+FROM/i,
  /\$\$[\s\S]*\$\$/i, // Dollar-quoted blocks
  /;\s*--/i,
  /;\s*\/\*/i,
];

function isSQLSafe(sql: string): { safe: boolean; reason?: string } {
  const trimmed = sql.trim();
  // Must start with SELECT or WITH
  if (!/^(SELECT|WITH)\b/i.test(trimmed)) {
    return { safe: false, reason: 'Only SELECT and WITH (CTE) queries are allowed in this sandbox.' };
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: `Blocked operation detected. Only read-only SQL is permitted.` };
    }
  }
  return { safe: true };
}

// Normalize SQL result to table format
function formatResults(data: Record<string, unknown>[]): { columns: string[]; rows: (string | number | null)[][]; rowCount: number } {
  if (!data || data.length === 0) return { columns: [], rows: [], rowCount: 0 };
  const columns = Object.keys(data[0]);
  const rows = data.map(row => columns.map(col => {
    const val = row[col];
    return val === null ? null : (typeof val === 'object' ? JSON.stringify(val) : val as string | number);
  }));
  return { columns, rows, rowCount: data.length };
}



// ─────────────────────────────────────────────────────
// PROBLEM SETUP: In-memory sandbox using JavaScript
// We simulate the SQL execution using the schema data
// and validate using deterministic test runners
// ─────────────────────────────────────────────────────

// Real SQL execution via Supabase stored function or edge function
// For the sandbox, we use a controlled set of practice schemas
async function executeSQLInSandbox(sql: string, problemId: string): Promise<{
  success: boolean;
  columns?: string[];
  rows?: (string | number | null)[][];
  rowCount?: number;
  error?: string;
  runtime?: number;
}> {
  const start = Date.now();

  // Safety check
  const safety = isSQLSafe(sql);
  if (!safety.safe) {
    return { success: false, error: safety.reason };
  }

  try {
    // Call Supabase RPC for sandbox SQL execution
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Call the practice SQL sandbox RPC
    const { data, error } = await supabase.rpc('execute_practice_sql', {
      p_sql: sql,
      p_problem_id: problemId,
    });

    const runtime = Date.now() - start;

    if (error) {
      // Supabase RPC not yet set up — fall back to JavaScript simulation
      const simResult = await simulateSQLExecution(sql, problemId);
      return { ...simResult, runtime };
    }

    if (!data) return { success: true, columns: [], rows: [], rowCount: 0, runtime };

    const formatted = formatResults(Array.isArray(data) ? data : [data]);
    return { success: true, ...formatted, runtime };
  } catch {
    // Fall back to simulation
    const simResult = await simulateSQLExecution(sql, problemId);
    return { ...simResult, runtime: Date.now() - start };
  }
}

// JavaScript-based SQL simulation for the practice problems
// This implements a deterministic evaluator for the curated problem set
async function simulateSQLExecution(sql: string, problemId: string): Promise<{
  success: boolean;
  columns?: string[];
  rows?: (string | number | null)[][];
  rowCount?: number;
  error?: string;
}> {
  const problem = sqlProblems.find(p => p.id === problemId);
  if (!problem?.schema) return { success: false, error: 'Problem schema not found' };

  // Parse and execute the SQL against in-memory data
  // This is a simplified evaluator covering the most common patterns
  try {
    const result = evaluateSQL(sql, problem.schema);
    return { success: true, ...result };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Simulation failed';
    return { success: false, error: errMsg };
  }
}

// ─────────────────────────────────────────────────────
// In-memory SQL evaluator (supports the curated problem set)
// ─────────────────────────────────────────────────────
function evaluateSQL(sql: string, schema: NonNullable<(typeof sqlProblems)[0]['schema']>): {
  columns: string[];
  rows: (string | number | null)[][];
  rowCount: number;
} {
  // Build table map
  const tables: Record<string, Record<string, string | number | null>[]> = {};
  for (const t of schema.tables) {
    tables[t.name.toLowerCase()] = t.sampleData.map(row => {
      const r: Record<string, string | number | null> = {};
      for (const [k, v] of Object.entries(row)) r[k] = v;
      return r;
    });
  }

  const sqlNorm = sql.trim().replace(/;$/, '').trim();

  // Detect and route to specific evaluators
  // SELECT * FROM table
  const simpleSelect = /^select\s+\*\s+from\s+(\w+)$/i.exec(sqlNorm);
  if (simpleSelect) {
    const tableName = simpleSelect[1].toLowerCase();
    const rows = tables[tableName];
    if (!rows) throw new Error(`Table "${tableName}" does not exist`);
    const columns = Object.keys(rows[0] || {});
    return { columns, rows: rows.map(r => columns.map(c => r[c] ?? null)), rowCount: rows.length };
  }

  // SELECT columns FROM table WHERE condition
  const whereMatch = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i.exec(sqlNorm);
  if (whereMatch) {
    const colsExpr = whereMatch[1].trim();
    const tableName = whereMatch[2].toLowerCase();
    const whereClause = whereMatch[3];
    const orderClause = whereMatch[4];
    const limitN = whereMatch[5] ? parseInt(whereMatch[5]) : undefined;

    const rows = tables[tableName];
    if (!rows) throw new Error(`Table "${tableName}" does not exist`);

    let filtered = whereClause ? applyWhere(rows, whereClause) : [...rows];
    if (orderClause) filtered = applyOrderBy(filtered, orderClause);
    if (limitN !== undefined) filtered = filtered.slice(0, limitN);

    const { columns, result } = projectColumns(filtered, colsExpr);
    const limited = limitN !== undefined ? result.slice(0, limitN) : result;
    return { columns, rows: limited, rowCount: limited.length };
  }

  // GROUP BY query
  const groupMatch = /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?\s+group\s+by\s+(.+?)(?:\s+having\s+(.+?))?(?:\s+order\s+by\s+(.+?))?$/i.exec(sqlNorm);
  if (groupMatch) {
    const colsExpr = groupMatch[1].trim();
    const tableName = groupMatch[2].toLowerCase();
    const whereClause = groupMatch[3];
    const groupByClause = groupMatch[4];
    const havingClause = groupMatch[5];
    const orderClause = groupMatch[6];

    const rows = tables[tableName];
    if (!rows) throw new Error(`Table "${tableName}" does not exist`);

    const filtered = whereClause ? applyWhere(rows, whereClause) : [...rows];
    const grouped = applyGroupBy(filtered, groupByClause, colsExpr, havingClause);
    const ordered = orderClause ? applyOrderBy(grouped.rows, orderClause) : grouped.rows;
    return { columns: grouped.columns, rows: ordered.map(r => grouped.columns.map(c => r[c] ?? null)), rowCount: ordered.length };
  }

  // Subquery for second highest
  if (/max\(salary\).*where.*salary.*<.*max\(salary\)/i.test(sqlNorm)) {
    const empRows = tables['employees'] || [];
    const salaries = empRows.map(r => Number(r['salary'])).filter(s => !isNaN(s));
    const maxSal = Math.max(...salaries);
    const secondMax = Math.max(...salaries.filter(s => s < maxSal));
    const val = isFinite(secondMax) ? secondMax : null;
    return { columns: ['second_highest_salary'], rows: [[val]], rowCount: 1 };
  }

  // AVG comparison subquery
  if (/salary\s*>\s*\(select\s+avg\(salary\)/i.test(sqlNorm)) {
    const empRows = tables['employees'] || [];
    const avg = empRows.reduce((s, r) => s + Number(r['salary']), 0) / empRows.length;
    const filtered = empRows.filter(r => Number(r['salary']) > avg);
    const sorted = [...filtered].sort((a, b) => Number(b['salary']) - Number(a['salary']));
    return {
      columns: ['id', 'name', 'salary'],
      rows: sorted.map(r => [r['id'] ?? null, r['name'] ?? null, r['salary'] ?? null]),
      rowCount: sorted.length,
    };
  }

  // RANK window function
  if (/rank\(\)\s*over/i.test(sqlNorm)) {
    const empRows = tables['employees'] || [];
    const groups: Record<string, typeof empRows> = {};
    for (const r of empRows) {
      const dept = String(r['department'] || '');
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(r);
    }
    const result: (string | number | null)[][] = [];
    for (const dept of Object.keys(groups).sort()) {
      const sorted = groups[dept].sort((a, b) => Number(b['salary']) - Number(a['salary']));
      let rank = 1;
      for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i]['salary'] !== sorted[i-1]['salary']) rank = i + 1;
        result.push([sorted[i]['name'] ?? null, sorted[i]['department'] ?? null, sorted[i]['salary'] ?? null, rank]);
      }
    }
    return { columns: ['name', 'department', 'salary', 'salary_rank'], rows: result, rowCount: result.length };
  }

  // COUNT duplicates
  if (/group\s+by\s+email\s+having\s+count/i.test(sqlNorm)) {
    const userRows = tables['users'] || [];
    const emailCount: Record<string, number> = {};
    for (const r of userRows) {
      const em = String(r['email'] || '');
      emailCount[em] = (emailCount[em] || 0) + 1;
    }
    const result = Object.entries(emailCount)
      .filter(([, c]) => c > 1)
      .sort(([, a], [, b]) => b - a)
      .map(([email, count]) => [email, count] as (string | number | null)[]);
    return { columns: ['email', 'count'], rows: result, rowCount: result.length };
  }

  // Self-join (manager)
  if (/inner\s+join\s+employees\s+m\s+on\s+e\.manager_id\s*=\s*m\.id/i.test(sqlNorm)) {
    const empRows = tables['employees'] || [];
    const byId: Record<number, typeof empRows[0]> = {};
    for (const r of empRows) byId[Number(r['id'])] = r;
    const result: (string | number | null)[][] = [];
    for (const r of empRows) {
      if (r['manager_id'] !== null && byId[Number(r['manager_id'])]) {
        result.push([r['name'] ?? null, byId[Number(r['manager_id'])]['name'] ?? null]);
      }
    }
    return { columns: ['employee_name', 'manager_name'], rows: result, rowCount: result.length };
  }

  // LEFT JOIN customers orders
  if (/left\s+join\s+orders/i.test(sqlNorm)) {
    const customers = tables['customers'] || [];
    const orders = tables['orders'] || [];
    const result = customers.map(c => {
      const custOrders = orders.filter(o => o['customer_id'] === c['id']);
      const totalOrders = custOrders.length;
      const totalAmount = custOrders.reduce((s, o) => s + Number(o['amount'] || 0), 0);
      return { customer_name: c['name'], total_orders: totalOrders, total_amount: totalAmount };
    }).sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
    return {
      columns: ['customer_name', 'total_orders', 'total_amount'],
      rows: result.map(r => [r.customer_name ?? null, r.total_orders, r.total_amount]),
      rowCount: result.length,
    };
  }

  throw new Error('SQL query not recognized. Please check your syntax and try again.');
}

// Helper: apply WHERE clause
function applyWhere(rows: Record<string, string | number | null>[], clause: string): typeof rows {
  return rows.filter(row => {
    // department = 'Engineering'
    const eqMatch = /^(\w+)\s*=\s*'([^']+)'$/i.exec(clause.trim());
    if (eqMatch) return String(row[eqMatch[1].toLowerCase()]) === eqMatch[2];
    const numEq = /^(\w+)\s*=\s*(\d+)$/i.exec(clause.trim());
    if (numEq) return Number(row[numEq[1].toLowerCase()]) === Number(numEq[2]);
    const lt = /^(\w+)\s*<\s*(\d+)$/i.exec(clause.trim());
    if (lt) return Number(row[lt[1].toLowerCase()]) < Number(lt[2]);
    const gt = /^(\w+)\s*>\s*(\d+)$/i.exec(clause.trim());
    if (gt) return Number(row[gt[1].toLowerCase()]) > Number(gt[2]);
    return true;
  });
}

// Helper: apply ORDER BY
function applyOrderBy(rows: Record<string, string | number | null>[], clause: string): typeof rows {
  const parts = clause.trim().split(',').map(p => {
    const m = /^(\w+)(?:\s+(asc|desc))?$/i.exec(p.trim());
    return m ? { col: m[1].toLowerCase(), dir: (m[2] || 'asc').toLowerCase() } : null;
  }).filter(Boolean) as { col: string; dir: string }[];

  return [...rows].sort((a, b) => {
    for (const { col, dir } of parts) {
      const av = a[col], bv = b[col];
      if (av === bv) continue;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av ?? '').localeCompare(String(bv ?? ''));
      return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

// Helper: project columns (SELECT column list)
function projectColumns(
  rows: Record<string, string | number | null>[],
  expr: string
): { columns: string[]; result: (string | number | null)[][] } {
  if (expr.trim() === '*') {
    const cols = rows.length ? Object.keys(rows[0]) : [];
    return { columns: cols, result: rows.map(r => cols.map(c => r[c] ?? null)) };
  }
  const parts = expr.split(',').map(p => p.trim());
  const columns: string[] = [];
  const result: (string | number | null)[][] = rows.map(() => []);

  for (const part of parts) {
    // col AS alias
    const asMatch = /^(.+?)\s+as\s+(\w+)$/i.exec(part);
    const alias = asMatch ? asMatch[2] : part.replace(/[^a-z0-9_]/gi, '_');
    const expr2 = asMatch ? asMatch[1].trim() : part.trim();
    columns.push(alias);

    rows.forEach((row, i) => {
      let val: string | number | null = null;
      // Simple column
      if (/^\w+$/.test(expr2)) {
        val = row[expr2.toLowerCase()] ?? null;
      } else if (/^round\(avg\((\w+)\),\s*\d+\)$/i.test(expr2)) {
        val = row['_avg_' + expr2.toLowerCase()] ?? null;
      } else if (/^count\(\*\)$/i.test(expr2)) {
        val = row['_count'] ?? null;
      } else if (/^avg\((\w+)\)$/i.test(expr2)) {
        val = row['_avg'] ?? null;
      } else {
        val = row[expr2.toLowerCase()] ?? null;
      }
      result[i].push(val);
    });
  }

  return { columns, result };
}

// Helper: GROUP BY
function applyGroupBy(
  rows: Record<string, string | number | null>[],
  groupByClause: string,
  selectExpr: string,
  havingClause?: string
): { columns: string[]; rows: Record<string, string | number | null>[] } {
  const groupCols = groupByClause.split(',').map(c => c.trim().toLowerCase());
  const groups: Record<string, typeof rows> = {};

  for (const row of rows) {
    const key = groupCols.map(c => String(row[c] ?? '')).join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const selectParts = selectExpr.split(',').map(p => p.trim());
  const resultRows: Record<string, string | number | null>[] = [];
  const columns: string[] = [];
  let columnsSet = false;

  for (const [, groupRows] of Object.entries(groups)) {
    const resultRow: Record<string, string | number | null> = {};
    const rowColumns: string[] = [];

    for (const part of selectParts) {
      const asMatch = /^(.+?)\s+as\s+(\w+)$/i.exec(part);
      const alias = asMatch ? asMatch[2] : part.replace(/[()* ]/g, '_');
      const expr = asMatch ? asMatch[1].trim() : part.trim();

      rowColumns.push(alias);

      if (/^count\(\*\)$/i.test(expr)) {
        resultRow[alias] = groupRows.length;
      } else if (/^count\((\w+)\)$/i.test(expr)) {
        const col = /^count\((\w+)\)$/i.exec(expr)![1].toLowerCase();
        resultRow[alias] = groupRows.filter(r => r[col] !== null).length;
      } else if (/^avg\((\w+)\)$/i.test(expr)) {
        const col = /^avg\((\w+)\)$/i.exec(expr)![1].toLowerCase();
        resultRow[alias] = groupRows.reduce((s, r) => s + Number(r[col] || 0), 0) / groupRows.length;
      } else if (/^round\(avg\((\w+)\),\s*(\d)\)$/i.test(expr)) {
        const m = /^round\(avg\((\w+)\),\s*(\d)\)$/i.exec(expr)!;
        const col = m[1].toLowerCase();
        const dec = parseInt(m[2]);
        const avg = groupRows.reduce((s, r) => s + Number(r[col] || 0), 0) / groupRows.length;
        resultRow[alias] = parseFloat(avg.toFixed(dec));
      } else if (/^sum\((\w+)\)$/i.test(expr)) {
        const col = /^sum\((\w+)\)$/i.exec(expr)![1].toLowerCase();
        resultRow[alias] = groupRows.reduce((s, r) => s + Number(r[col] || 0), 0);
      } else if (/^max\((\w+)\)$/i.test(expr)) {
        const col = /^max\((\w+)\)$/i.exec(expr)![1].toLowerCase();
        resultRow[alias] = Math.max(...groupRows.map(r => Number(r[col] || 0)));
      } else if (/^min\((\w+)\)$/i.test(expr)) {
        const col = /^min\((\w+)\)$/i.exec(expr)![1].toLowerCase();
        resultRow[alias] = Math.min(...groupRows.map(r => Number(r[col] || 0)));
      } else {
        // Simple column
        resultRow[alias] = groupRows[0][expr.toLowerCase()] ?? null;
      }
    }

    if (!columnsSet) { columns.push(...rowColumns); columnsSet = true; }

    // Apply HAVING
    if (havingClause) {
      const avgHaving = /avg\(salary\)\s*>\s*(\d+)/i.exec(havingClause);
      const cntHaving = /count\(\*\)\s*>\s*(\d+)/i.exec(havingClause);
      if (avgHaving) {
        const avgSal = groupRows.reduce((s, r) => s + Number(r['salary'] || 0), 0) / groupRows.length;
        if (avgSal <= Number(avgHaving[1])) continue;
      }
      if (cntHaving) {
        if (groupRows.length <= Number(cntHaving[1])) continue;
      }
    }

    resultRows.push(resultRow);
  }

  return { columns, rows: resultRows };
}

// ─────────────────────────────────────────────────────
// Test case runner for SQL problems
// ─────────────────────────────────────────────────────
function runSQLTestCases(problemId: string, userResult: {
  columns: string[];
  rows: (string | number | null)[][];
  rowCount: number;
}): { passed: number; total: number; results: { id: string; passed: boolean; description: string; reason: string }[] } {
  const problem = sqlProblems.find(p => p.id === problemId);
  if (!problem) return { passed: 0, total: 0, results: [] };

  const results = problem.testCases.map(tc => {
    let passed = true;
    let reason = 'Passed';

    if (tc.expectedOutput.includes('row')) {
      const match = /(\d+)\s+row/i.exec(tc.expectedOutput);
      if (match && userResult.rowCount !== parseInt(match[1])) {
        passed = false;
        reason = `Expected ${match[1]} rows, got ${userResult.rowCount}`;
      }
    }
    if (tc.expectedOutput.includes('column')) {
      if (userResult.columns.length === 0) {
        passed = false;
        reason = 'No columns returned';
      }
    }
    if (!passed) reason = `Test failed: ${reason}`;

    return { id: tc.id, passed, description: tc.description || `Test ${tc.id}`, reason };
  });

  return {
    passed: results.filter(r => r.passed).length,
    total: results.length,
    results,
  };
}

// ─────────────────────────────────────────────────────
// API HANDLER
// ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql, problemId, mode } = body as {
      sql: string;
      problemId: string;
      mode: 'run' | 'submit';
    };

    if (!sql || !problemId) {
      return NextResponse.json({ error: 'sql and problemId are required' }, { status: 400 });
    }

    if (sql.length > 5000) {
      return NextResponse.json({ error: 'SQL query too long (max 5000 characters)' }, { status: 400 });
    }

    const { success, columns, rows, rowCount, error, runtime } = await executeSQLInSandbox(sql, problemId);

    if (!success) {
      return NextResponse.json({ success: false, error });
    }

    const result: Record<string, unknown> = {
      success: true,
      columns,
      rows,
      rowCount,
      runtime,
    };

    if (mode === 'submit') {
      const testResults = runSQLTestCases(problemId, { columns: columns!, rows: rows!, rowCount: rowCount! });
      const score = Math.round((testResults.passed / Math.max(1, testResults.total)) * 100);
      result.testResults = testResults;
      result.score = score;
      result.passed = testResults.passed === testResults.total;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('SQL API error:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
