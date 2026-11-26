import path from 'path';
import fs from 'fs';
import os from 'os';
import { DatabaseSync } from 'node:sqlite';
import { PRACTICE_SUBJECTS, PRACTICE_QUESTIONS, type PracticeQuestion } from '../practice/practiceBank.ts';
import { INTERVIEW_QUESTION_BANK, type InterviewBankQuestion } from '../interview/questionBank.ts';

export interface UserProgressData {
  totalSolved: number;
  totalAttempted: number;
  totalQuestions: number;
  accuracy: number;
  streak: number;
  subjectStats: Record<string, {
    subjectId: string;
    name: string;
    solved: number;
    attempted: number;
    total: number;
    accuracy: number;
  }>;
  recentActivity: Array<{
    questionId: string;
    questionTitle: string;
    subjectId: string;
    subjectName: string;
    isCorrect: boolean;
    attemptedAt: string;
  }>;
  attempts: Record<string, {
    questionId: string;
    subjectId: string;
    status: 'solved' | 'attempted';
    isCorrect: boolean;
    selectedAnswer: string | null;
    attemptsCount: number;
    attemptedAt: string;
  }>;
}

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  // Detect serverless environments (Vercel, AWS Lambda, Netlify)
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    (process.env.NODE_ENV === 'production' && !process.env.DATABASE_PATH?.startsWith('/'))
  );

  const configuredPath = process.env.DATABASE_PATH?.trim();
  const candidatePaths: string[] = [];

  // 1. In serverless, /tmp is the only guaranteed writable location
  if (isServerless) {
    candidatePaths.push(path.join(os.tmpdir(), 'careerpilot.db'));
  }

  // 2. Explicitly configured path (if not serverless)
  if (configuredPath && !isServerless) {
    candidatePaths.push(path.isAbsolute(configuredPath) ? configuredPath : path.join(process.cwd(), configuredPath));
  }

  // 3. Local data directory
  if (!isServerless) {
    candidatePaths.push(path.join(process.cwd(), 'data', 'careerpilot.db'));
  }

  // 4. Fallbacks if primary path fails or is read-only
  candidatePaths.push(path.join(os.tmpdir(), 'careerpilot.db'));
  candidatePaths.push(':memory:');

  let db: DatabaseSync | null = null;
  let lastError: Error | null = null;

  for (const candidate of candidatePaths) {
    try {
      if (candidate !== ':memory:') {
        const dir = path.dirname(candidate);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      db = new DatabaseSync(candidate);
      db.exec('PRAGMA foreign_keys = OFF;');
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      db = null;
    }
  }

  if (!db) {
    throw new Error(`Failed to initialize SQLite database: ${lastError?.message || 'unknown error'}`);
  }

  // WAL mode for high concurrency & performance (safely ignore if in-memory or unsupported)
  try {
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
    `);
  } catch {
    // Continue with default journaling if WAL is not supported on target filesystem
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'student',
      college TEXT DEFAULT 'PESITM Shivamogga',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_subjects (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      badge TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_questions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES practice_subjects(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      subtopic TEXT,
      difficulty TEXT NOT NULL,
      question_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      options TEXT, -- JSON string
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      points INTEGER DEFAULT 10,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES practice_subjects(id) ON DELETE CASCADE,
      is_correct INTEGER NOT NULL DEFAULT 0,
      selected_answer TEXT,
      attempts_count INTEGER NOT NULL DEFAULT 1,
      time_taken_seconds INTEGER NOT NULL DEFAULT 0,
      attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_question_attempt UNIQUE (user_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_practice_questions_subject ON practice_questions(subject_id);
    CREATE INDEX IF NOT EXISTS idx_practice_questions_topic ON practice_questions(topic);
    CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON practice_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_practice_attempts_subject ON practice_attempts(subject_id);
    CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_subject ON practice_attempts(user_id, subject_id);

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_role TEXT NOT NULL,
      interview_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      interviewer_mode TEXT DEFAULT 'Professional',
      company_name TEXT,
      status TEXT DEFAULT 'In Progress',
      dialog_state TEXT DEFAULT 'NOT_STARTED',
      current_question_number INTEGER DEFAULT 0,
      current_question TEXT,
      questions_asked TEXT,
      topics_covered TEXT,
      last_evaluation TEXT,
      overall_score INTEGER,
      communication_score INTEGER,
      technical_accuracy_score INTEGER,
      structure_score INTEGER,
      confidence_score INTEGER,
      feedback_summary TEXT,
      transcript TEXT,
      duration_seconds INTEGER DEFAULT 900,
      started_at TEXT,
      deadline_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_turns (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      turn_index INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      category TEXT NOT NULL,
      student_answer TEXT,
      answer_score INTEGER,
      evaluation TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      speaker TEXT NOT NULL CHECK (speaker IN ('ai', 'user', 'system')),
      message TEXT NOT NULL,
      question_number INTEGER,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_interview_turns_session ON interview_turns(session_id);
    CREATE INDEX IF NOT EXISTS idx_interview_messages_session ON interview_messages(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_interview_messages_user ON interview_messages(user_id);

    CREATE TABLE IF NOT EXISTS interview_question_bank (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      company_tag TEXT,
      interview_type TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question_text TEXT NOT NULL,
      expected_concepts TEXT,
      evaluation_criteria TEXT,
      model_answer TEXT NOT NULL,
      adaptive_harder TEXT,
      adaptive_easier TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_iqb_role ON interview_question_bank(role);
    CREATE INDEX IF NOT EXISTS idx_iqb_difficulty ON interview_question_bank(difficulty);
  `);

  // Phase 2 safe migrations for existing local DBs
  const safeAlter = (sql: string) => { try { db.exec(sql); } catch {} };
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN dialog_state TEXT DEFAULT 'NOT_STARTED'`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN current_question_number INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN current_question TEXT`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN questions_asked TEXT`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN topics_covered TEXT`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN last_evaluation TEXT`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN difficulty_policy TEXT DEFAULT 'ADAPTIVE'`);
  safeAlter(`ALTER TABLE interview_sessions ADD COLUMN initial_difficulty TEXT`);

  // Phase 4: adaptive engine tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS interview_topic_performance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      topic TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      average_score REAL NOT NULL DEFAULT 0,
      latest_score REAL NOT NULL DEFAULT 0,
      recent_scores TEXT NOT NULL DEFAULT '[]',
      level TEXT NOT NULL DEFAULT 'average',
      trend TEXT NOT NULL DEFAULT 'stable',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, session_id, topic)
    );

    CREATE TABLE IF NOT EXISTS interview_difficulty_changes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      topic TEXT,
      previous_difficulty TEXT NOT NULL,
      next_difficulty TEXT NOT NULL,
      reason TEXT,
      question_number INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_question_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      question_number INTEGER,
      question_text TEXT NOT NULL,
      topic TEXT,
      difficulty TEXT,
      source TEXT DEFAULT 'gemini',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_itp_user_session ON interview_topic_performance(user_id, session_id);
    CREATE INDEX IF NOT EXISTS idx_itp_user_topic ON interview_topic_performance(user_id, topic);
    CREATE INDEX IF NOT EXISTS idx_idc_session ON interview_difficulty_changes(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_iqh_session ON interview_question_history(session_id, created_at);
  `);

  // Seed default interview question bank if not already seeded
  const countBankStmt = db.prepare('SELECT COUNT(*) as count FROM interview_question_bank');
  const bankCount = (countBankStmt.get() as { count: number })?.count || 0;

  if (bankCount === 0) {
    const insertBankQ = db.prepare(`
      INSERT OR REPLACE INTO interview_question_bank (
        id, role, company_tag, interview_type, category, difficulty,
        question_text, expected_concepts, evaluation_criteria, model_answer,
        adaptive_harder, adaptive_easier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const q of INTERVIEW_QUESTION_BANK) {
      insertBankQ.run(
        q.id,
        q.role,
        q.companyTag || null,
        q.interviewType,
        q.category,
        q.difficulty,
        q.questionText,
        JSON.stringify(q.expectedConcepts),
        JSON.stringify(q.evaluationCriteria),
        q.modelAnswer,
        q.adaptiveHarder || null,
        q.adaptiveEasier || null
      );
    }
  }

  // Seed default subjects if not already seeded
  const countSubjectsStmt = db.prepare('SELECT COUNT(*) as count FROM practice_subjects');
  const subjectCount = (countSubjectsStmt.get() as { count: number })?.count || 0;

  if (subjectCount === 0) {
    const insertSub = db.prepare(`
      INSERT OR REPLACE INTO practice_subjects (id, code, name, description, badge, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const sub of PRACTICE_SUBJECTS) {
      insertSub.run(sub.id, sub.code, sub.name, sub.description, sub.badge, sub.displayOrder);
    }
  }

  // Seed default 70 questions if not already seeded
  const countQuestionsStmt = db.prepare('SELECT COUNT(*) as count FROM practice_questions');
  const questionCount = (countQuestionsStmt.get() as { count: number })?.count || 0;

  if (questionCount === 0) {
    const insertQ = db.prepare(`
      INSERT OR REPLACE INTO practice_questions 
      (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const q of PRACTICE_QUESTIONS) {
      insertQ.run(
        q.id,
        q.subjectId,
        q.topic,
        q.subtopic || null,
        q.difficulty,
        q.questionType,
        q.title,
        q.description,
        JSON.stringify(q.options || []),
        q.correctAnswer,
        q.explanation,
        q.points
      );
    }
  }

  // Pre-seed known institutional test accounts
  const seedUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, full_name, role, college)
    VALUES (?, ?, ?, ?, ?)
  `);
  seedUser.run('user-kiran-main', 'kirankirankumarr15@gmail.com', 'Kiran Kumar', 'student', 'PESITM Shivamogga');
  seedUser.run('user-pesitm-1', 'alex.dev@pesitm.edu.in', 'Alex Morgan', 'student', 'PESITM Shivamogga');
  seedUser.run('user-pesitm-2', 'student@pesitm.edu.in', 'PESITM Student', 'student', 'PESITM Shivamogga');
  seedUser.run('user-hod-4', 'hod@pesitm.edu.in', 'Dr. HOD Computer Science', 'hod', 'PESITM Shivamogga');

  dbInstance = db;
  return dbInstance;
}

export const nodeDb = {
  getRawDb() {
    return getDb();
  },

  syncUser(user: { id: string; email: string; fullName?: string; role?: string; college?: string }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, full_name, role, college)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        full_name = COALESCE(excluded.full_name, users.full_name),
        role = COALESCE(excluded.role, users.role)
    `);
    stmt.run(
      user.id,
      user.email.toLowerCase().trim(),
      user.fullName || user.email.split('@')[0],
      user.role || 'student',
      user.college || 'PESITM Shivamogga'
    );
  },

  getSubjects() {
    const db = getDb();
    const rows = db.prepare(`
      SELECT s.*, COUNT(q.id) as question_count
      FROM practice_subjects s
      LEFT JOIN practice_questions q ON s.id = q.subject_id
      GROUP BY s.id
      ORDER BY s.display_order ASC
    `).all() as Array<{
      id: string;
      code: string;
      name: string;
      description: string;
      badge: string;
      display_order: number;
      question_count: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      badge: r.badge,
      displayOrder: r.display_order,
      totalQuestions: r.question_count || 10,
    }));
  },

  getQuestions(subjectId?: string, topic?: string, difficulty?: string, stripAnswers: boolean = true) {
    const db = getDb();
    let query = 'SELECT * FROM practice_questions WHERE 1=1';
    const params: (string | number)[] = [];

    if (subjectId) {
      query += " AND (subject_id = ? OR (subject_id = 'dbms' AND ? = 'sql'))";
      params.push(subjectId.toLowerCase(), subjectId.toLowerCase());
    }
    if (topic && topic !== 'all') {
      query += ' AND topic = ?';
      params.push(topic);
    }
    if (difficulty && difficulty !== 'all') {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY id ASC';
    const rows = db.prepare(query).all(...params) as Array<{
      id: string;
      subject_id: string;
      topic: string;
      subtopic: string | null;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      question_type: 'mcq' | 'coding' | 'text';
      title: string;
      description: string;
      options: string;
      correct_answer: string;
      explanation: string;
      points: number;
    }>;

    return rows.map((r) => {
      let parsedOptions = [];
      try {
        parsedOptions = r.options ? JSON.parse(r.options) : [];
      } catch {}

      return {
        id: r.id,
        subjectId: r.subject_id,
        topic: r.topic,
        subtopic: r.subtopic || undefined,
        difficulty: r.difficulty,
        questionType: r.question_type,
        title: r.title,
        description: r.description,
        options: parsedOptions,
        points: r.points,
        explanation: stripAnswers ? '' : r.explanation,
        correctAnswer: stripAnswers ? '' : r.correct_answer,
      };
    });
  },

  getQuestionById(questionId: string): PracticeQuestion | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM practice_questions WHERE id = ?').get(questionId) as {
      id: string;
      subject_id: string;
      topic: string;
      subtopic: string | null;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      question_type: 'mcq' | 'coding' | 'text';
      title: string;
      description: string;
      options: string;
      correct_answer: string;
      explanation: string;
      points: number;
    } | undefined;

    if (!row) {
      // Check in-memory practice bank fallback
      const found = PRACTICE_QUESTIONS.find((q) => q.id.toLowerCase() === questionId.toLowerCase());
      if (found) return found;

      // Fallback: check general questions bank (SQL, Coding problems)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getQuestionById: getGeneralQuestionById } = require('../practice/questions.ts');
        const gq = getGeneralQuestionById(questionId);
        if (gq) {
          return {
            id: gq.id,
            subjectId: gq.category || 'dsa',
            topic: gq.topic || 'General',
            subtopic: gq.subtopic || undefined,
            difficulty: gq.difficulty || 'Medium',
            questionType: gq.type === 'sql' || gq.type === 'coding' ? 'coding' : 'mcq',
            title: gq.title,
            description: gq.description,
            options: gq.options || [],
            correctAnswer: gq.correctAnswer || '',
            explanation: gq.explanation || '',
            points: gq.points || 10,
          };
        }
      } catch {}

      return null;
    }

    let parsedOptions = [];
    try {
      parsedOptions = row.options ? JSON.parse(row.options) : [];
    } catch {}

    return {
      id: row.id,
      subjectId: row.subject_id,
      topic: row.topic,
      subtopic: row.subtopic || undefined,
      difficulty: row.difficulty,
      questionType: row.question_type,
      title: row.title,
      description: row.description,
      options: parsedOptions,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      points: row.points,
    };
  },

  recordAttempt({
    userId,
    questionId,
    subjectId,
    isCorrect,
    selectedAnswer,
    timeTakenSeconds = 0,
  }: {
    userId: string;
    questionId: string;
    subjectId: string;
    isCorrect: boolean;
    selectedAnswer?: string | null;
    timeTakenSeconds?: number;
  }) {
    const db = getDb();
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const stmt = db.prepare(`
      INSERT INTO practice_attempts (
        id, user_id, question_id, subject_id, is_correct, selected_answer, attempts_count, time_taken_seconds, attempted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
      ON CONFLICT(user_id, question_id) DO UPDATE SET
        is_correct = excluded.is_correct,
        selected_answer = excluded.selected_answer,
        attempts_count = attempts_count + 1,
        time_taken_seconds = time_taken_seconds + excluded.time_taken_seconds,
        attempted_at = datetime('now')
    `);

    stmt.run(
      id,
      userId,
      questionId,
      subjectId,
      isCorrect ? 1 : 0,
      selectedAnswer || null,
      timeTakenSeconds
    );

    return this.getUserProgress(userId);
  },

  getUserProgress(userId: string): UserProgressData {
    const db = getDb();
    const attempts = db.prepare(`
      SELECT a.*, q.title as question_title, s.name as subject_name
      FROM practice_attempts a
      LEFT JOIN practice_questions q ON a.question_id = q.id
      LEFT JOIN practice_subjects s ON a.subject_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.attempted_at DESC
    `).all(userId) as Array<{
      id: string;
      user_id: string;
      question_id: string;
      subject_id: string;
      is_correct: number;
      selected_answer: string | null;
      attempts_count: number;
      time_taken_seconds: number;
      attempted_at: string;
      question_title: string | null;
      subject_name: string | null;
    }>;

    const subjects = this.getSubjects();
    const subjectStats: UserProgressData['subjectStats'] = {};

    for (const sub of subjects) {
      subjectStats[sub.id] = {
        subjectId: sub.id,
        name: sub.name,
        solved: 0,
        attempted: 0,
        total: sub.totalQuestions || 10,
        accuracy: 0,
      };
    }

    const attemptsMap: UserProgressData['attempts'] = {};
    let totalSolved = 0;
    let totalCorrectCount = 0;
    let totalAttemptedCount = attempts.length;

    const distinctDays = new Set<string>();

    for (const att of attempts) {
      const isCorr = att.is_correct === 1;
      if (isCorr) {
        totalSolved++;
        totalCorrectCount++;
      }

      const dayStr = (att.attempted_at || '').substring(0, 10);
      if (dayStr) distinctDays.add(dayStr);

      const subId = att.subject_id;
      if (subjectStats[subId]) {
        subjectStats[subId].attempted++;
        if (isCorr) {
          subjectStats[subId].solved++;
        }
      }

      attemptsMap[att.question_id] = {
        questionId: att.question_id,
        subjectId: att.subject_id,
        status: isCorr ? 'solved' : 'attempted',
        isCorrect: isCorr,
        selectedAnswer: att.selected_answer,
        attemptsCount: att.attempts_count,
        attemptedAt: att.attempted_at,
      };
    }

    // Calculate accuracy percentages
    for (const subId of Object.keys(subjectStats)) {
      const s = subjectStats[subId];
      s.accuracy = s.attempted > 0 ? Math.round((s.solved / s.attempted) * 100) : 0;
    }

    const overallAccuracy =
      totalAttemptedCount > 0 ? Math.round((totalCorrectCount / totalAttemptedCount) * 100) : 0;

    const totalQuestions = subjects.reduce((sum, s) => sum + s.totalQuestions, 0);

    const recentActivity = attempts.slice(0, 5).map((a) => ({
      questionId: a.question_id,
      questionTitle: a.question_title || a.question_id,
      subjectId: a.subject_id,
      subjectName: a.subject_name || a.subject_id.toUpperCase(),
      isCorrect: a.is_correct === 1,
      attemptedAt: a.attempted_at,
    }));

    return {
      totalSolved,
      totalAttempted: totalAttemptedCount,
      totalQuestions,
      accuracy: overallAccuracy,
      streak: distinctDays.size,
      subjectStats,
      recentActivity,
      attempts: attemptsMap,
    };
  },

  getCohortSummary() {
    const db = getDb();
    const students = db.prepare('SELECT id, email, full_name FROM users WHERE role = "student"').all() as Array<{
      id: string;
      email: string;
      full_name: string;
    }>;

    const allAttempts = db.prepare('SELECT user_id, is_correct, subject_id FROM practice_attempts').all() as Array<{
      user_id: string;
      is_correct: number;
      subject_id: string;
    }>;

    const activeStudents = new Set(allAttempts.map((a) => a.user_id)).size;
    const totalSolved = allAttempts.filter((a) => a.is_correct === 1).length;
    const avgSolved = activeStudents > 0 ? (totalSolved / activeStudents).toFixed(1) : '0';

    return {
      totalRegisteredStudents: students.length,
      activePracticingStudents: activeStudents,
      cohortTotalSolved: totalSolved,
      cohortAverageSolved: avgSolved,
    };
  },

  getAllStudentsProgress() {
    const db = getDb();
    const students = db.prepare('SELECT id, email, full_name, college FROM users WHERE role = "student"').all() as Array<{
      id: string;
      email: string;
      full_name: string;
      college: string;
    }>;

    return students.map((s) => {
      const prog = this.getUserProgress(s.id);
      return {
        userId: s.id,
        email: s.email,
        fullName: s.full_name,
        college: s.college,
        totalSolved: prog.totalSolved,
        totalAttempted: prog.totalAttempted,
        accuracy: prog.accuracy,
        streak: prog.streak,
        subjectStats: prog.subjectStats,
      };
    });
  },

  // ─── Interview Sessions & Turns ──────────────────────────────────────────────
  saveInterviewSession(session: {
    id: string;
    userId: string;
    targetRole: string;
    interviewType: string;
    difficulty: string;
    mode?: string;
    companyName?: string;
    durationSeconds?: number;
    startedAt?: string;
    deadlineAt?: string;
    dialogState?: string;
    currentQuestionNumber?: number;
    currentQuestion?: string;
    questionsAsked?: string[];
    topicsCovered?: string[];
    difficultyPolicy?: string;
    initialDifficulty?: string;
  }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO interview_sessions (
        id, user_id, target_role, interview_type, difficulty, interviewer_mode,
        company_name, status, dialog_state, current_question_number, current_question,
        questions_asked, topics_covered, duration_seconds, started_at, deadline_at,
        difficulty_policy, initial_difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'In Progress', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.userId,
      session.targetRole,
      session.interviewType,
      session.difficulty,
      session.mode || 'Professional',
      session.companyName || null,
      session.dialogState || 'NOT_STARTED',
      session.currentQuestionNumber ?? 0,
      session.currentQuestion || null,
      session.questionsAsked ? JSON.stringify(session.questionsAsked) : JSON.stringify([]),
      session.topicsCovered ? JSON.stringify(session.topicsCovered) : JSON.stringify([]),
      session.durationSeconds || 900,
      session.startedAt || new Date().toISOString(),
      session.deadlineAt || null,
      session.difficultyPolicy || 'ADAPTIVE',
      session.initialDifficulty || session.difficulty
    );
  },

  updateInterviewSession(
    sessionId: string,
    updates: {
      status?: string;
      difficulty?: string;
      difficultyPolicy?: string;
      dialogState?: string;
      currentQuestionNumber?: number;
      currentQuestion?: string;
      questionsAsked?: string[];
      topicsCovered?: string[];
      lastEvaluation?: any;
      overallScore?: number;
      communicationScore?: number;
      technicalAccuracyScore?: number;
      structureScore?: number;
      confidenceScore?: number;
      feedbackSummary?: any;
      transcript?: any;
      completedAt?: string;
    }
  ) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE interview_sessions SET
        status = COALESCE(?, status),
        difficulty = COALESCE(?, difficulty),
        difficulty_policy = COALESCE(?, difficulty_policy),
        dialog_state = COALESCE(?, dialog_state),
        current_question_number = COALESCE(?, current_question_number),
        current_question = COALESCE(?, current_question),
        questions_asked = COALESCE(?, questions_asked),
        topics_covered = COALESCE(?, topics_covered),
        last_evaluation = COALESCE(?, last_evaluation),
        overall_score = COALESCE(?, overall_score),
        communication_score = COALESCE(?, communication_score),
        technical_accuracy_score = COALESCE(?, technical_accuracy_score),
        structure_score = COALESCE(?, structure_score),
        confidence_score = COALESCE(?, confidence_score),
        feedback_summary = COALESCE(?, feedback_summary),
        transcript = COALESCE(?, transcript),
        completed_at = COALESCE(?, completed_at)
      WHERE id = ?
    `);
    stmt.run(
      updates.status || null,
      updates.difficulty || null,
      updates.difficultyPolicy || null,
      updates.dialogState || null,
      updates.currentQuestionNumber ?? null,
      updates.currentQuestion || null,
      updates.questionsAsked ? JSON.stringify(updates.questionsAsked) : null,
      updates.topicsCovered ? JSON.stringify(updates.topicsCovered) : null,
      updates.lastEvaluation ? JSON.stringify(updates.lastEvaluation) : null,
      updates.overallScore ?? null,
      updates.communicationScore ?? null,
      updates.technicalAccuracyScore ?? null,
      updates.structureScore ?? null,
      updates.confidenceScore ?? null,
      updates.feedbackSummary ? JSON.stringify(updates.feedbackSummary) : null,
      updates.transcript ? JSON.stringify(updates.transcript) : null,
      updates.completedAt ?? null,
      sessionId
    );
  },

  getInterviewSession(sessionId: string) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM interview_sessions WHERE id = ?').get(sessionId) as any;
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      targetRole: row.target_role,
      interviewType: row.interview_type,
      difficulty: row.difficulty,
      mode: row.interviewer_mode,
      companyName: row.company_name,
      status: row.status,
      dialogState: row.dialog_state || 'NOT_STARTED',
      currentQuestionNumber: row.current_question_number ?? 0,
      currentQuestion: row.current_question || '',
      questionsAsked: row.questions_asked ? JSON.parse(row.questions_asked) : [],
      topicsCovered: row.topics_covered ? JSON.parse(row.topics_covered) : [],
      lastEvaluation: row.last_evaluation ? JSON.parse(row.last_evaluation) : null,
      difficultyPolicy: row.difficulty_policy || 'ADAPTIVE',
      initialDifficulty: row.initial_difficulty || row.difficulty,
      overallScore: row.overall_score,
      communicationScore: row.communication_score,
      technicalAccuracyScore: row.technical_accuracy_score,
      structureScore: row.structure_score,
      confidenceScore: row.confidence_score,
      feedbackSummary: row.feedback_summary ? JSON.parse(row.feedback_summary) : null,
      transcript: row.transcript ? JSON.parse(row.transcript) : [],
      durationSeconds: row.duration_seconds,
      startedAt: row.started_at,
      deadlineAt: row.deadline_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    };
  },

  getUserInterviewSessions(userId: string) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM interview_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(userId) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      targetRole: r.target_role,
      interviewType: r.interview_type,
      difficulty: r.difficulty,
      mode: r.interviewer_mode,
      status: r.status,
      overallScore: r.overall_score,
      communicationScore: r.communication_score,
      technicalAccuracyScore: r.technical_accuracy_score,
      confidenceScore: r.confidence_score,
      structureScore: r.structure_score,
      feedbackSummary: r.feedback_summary ? JSON.parse(r.feedback_summary) : null,
      completedAt: r.completed_at,
      createdAt: r.created_at,
    }));
  },

  saveInterviewTurn(turn: {
    id?: string;
    sessionId: string;
    userId: string;
    turnIndex: number;
    questionText: string;
    category: string;
    studentAnswer?: string;
    answerScore?: number;
    evaluation?: any;
  }) {
    const db = getDb();
    const turnId = turn.id || `turn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const stmt = db.prepare(`
      INSERT INTO interview_turns (
        id, session_id, user_id, turn_index, question_text, category, student_answer, answer_score, evaluation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      turnId,
      turn.sessionId,
      turn.userId,
      turn.turnIndex,
      turn.questionText,
      turn.category,
      turn.studentAnswer || null,
      turn.answerScore ?? null,
      turn.evaluation ? JSON.stringify(turn.evaluation) : null
    );
    return turnId;
  },

  getInterviewTurns(sessionId: string) {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM interview_turns WHERE session_id = ? ORDER BY turn_index ASC').all(sessionId) as any[];
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      userId: r.user_id,
      turnIndex: r.turn_index,
      questionText: r.question_text,
      category: r.category,
      studentAnswer: r.student_answer,
      answerScore: r.answer_score,
      evaluation: r.evaluation ? JSON.parse(r.evaluation) : null,
      createdAt: r.created_at,
    }));
  },

  saveInterviewMessage(message: {
    id?: string;
    sessionId: string;
    userId: string;
    speaker: 'ai' | 'user' | 'system';
    message: string;
    questionNumber?: number;
    metadata?: any;
  }) {
    const db = getDb();
    const id = message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    db.prepare(`
      INSERT INTO interview_messages (id, session_id, user_id, speaker, message, question_number, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      message.sessionId,
      message.userId,
      message.speaker,
      message.message,
      message.questionNumber ?? null,
      message.metadata ? JSON.stringify(message.metadata) : null
    );
    return id;
  },

  getInterviewMessages(sessionId: string, limit = 100) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM interview_messages
      WHERE session_id = ?
      ORDER BY created_at ASC, rowid ASC
      LIMIT ?
    `).all(sessionId, limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      userId: r.user_id,
      speaker: r.speaker,
      message: r.message,
      questionNumber: r.question_number,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      createdAt: r.created_at,
    }));
  },

  getTopicPerformance(userId: string, sessionId?: string) {
    const db = getDb();
    const rows = sessionId
      ? db.prepare('SELECT * FROM interview_topic_performance WHERE user_id = ? AND session_id = ? ORDER BY updated_at DESC').all(userId, sessionId)
      : db.prepare('SELECT * FROM interview_topic_performance WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
    return (rows as any[]).map((r) => ({
      id: r.id, userId: r.user_id, sessionId: r.session_id, topic: r.topic,
      attempts: r.attempts, averageScore: r.average_score, latestScore: r.latest_score,
      recentScores: r.recent_scores ? JSON.parse(r.recent_scores) : [],
      level: r.level, trend: r.trend, updatedAt: r.updated_at,
    }));
  },

  getRecentTopicEvaluationScores(userId: string, topic: string, limit = 3, sessionId?: string) {
    const db = getDb();
    // Use interview_turns as source of truth for evaluations
    const rows = sessionId
      ? db.prepare(`
          SELECT answer_score, evaluation, created_at, turn_index
          FROM interview_turns
          WHERE user_id = ? AND session_id = ? AND student_answer IS NOT NULL
          ORDER BY turn_index DESC LIMIT 50
        `).all(userId, sessionId)
      : db.prepare(`
          SELECT answer_score, evaluation, created_at, turn_index
          FROM interview_turns
          WHERE user_id = ? AND student_answer IS NOT NULL
          ORDER BY created_at DESC LIMIT 50
        `).all(userId);
    const out: Array<{ score: number; createdAt: string; turnIndex: number }> = [];
    for (const r of rows as any[]) {
      const ev = r.evaluation ? JSON.parse(r.evaluation) : null;
      const cat = ev?.topic || ev?.category || null;
      // if category not in evaluation, we can't perfectly match; include when topic matches loosely by checking question category is stored separately - fallback to including all recent in session
      const score = typeof ev?.overallScore === 'number' ? ev.overallScore : (typeof r.answer_score === 'number' ? r.answer_score : null);
      if (score == null) continue;
      // We'll filter by topic at caller by passing turns; simpler: return recent scored turns and let caller filter by category from turns.
      out.push({ score, createdAt: r.created_at, turnIndex: r.turn_index });
    }
    return out.slice(0, limit);
  },

  getRecentTopicEvaluationScoresByCategory(userId: string, sessionId: string, topic: string, limit = 3) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT turn_index, answer_score, evaluation, category, created_at
      FROM interview_turns
      WHERE user_id = ? AND session_id = ? AND student_answer IS NOT NULL
      ORDER BY turn_index DESC LIMIT 100
    `).all(userId, sessionId) as any[];
    const needle = topic.toLowerCase();
    const matched = rows.filter((r) => String(r.category || '').toLowerCase() === needle || String(r.category || '').toLowerCase().includes(needle) || needle.includes(String(r.category || '').toLowerCase()));
    const scores = matched.map((r) => {
      const ev = r.evaluation ? JSON.parse(r.evaluation) : null;
      return { score: typeof ev?.overallScore === 'number' ? ev.overallScore : (typeof r.answer_score === 'number' ? r.answer_score : null), turnIndex: r.turn_index, createdAt: r.created_at };
    }).filter((x) => typeof x.score === 'number');
    return scores.slice(0, limit) as Array<{ score: number; turnIndex: number; createdAt: string }>;
  },

  recordTopicPerformance(entry: { userId: string; sessionId: string; topic: string; score: number }) {
    const db = getDb();
    const topic = entry.topic.trim().slice(0, 80) || 'General';
    const existing = db.prepare('SELECT * FROM interview_topic_performance WHERE user_id = ? AND session_id = ? AND topic = ?').get(entry.userId, entry.sessionId, topic) as any;
    const prevScores = existing?.recent_scores ? JSON.parse(existing.recent_scores) : [];
    const recentScores = [...prevScores, entry.score].slice(-10);
    const avg = recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length;
    const level = avg >= 75 ? 'strong' : avg < 50 ? 'weak' : 'average';
    let trend = 'stable';
    if (recentScores.length >= 3) {
      const last = recentScores[recentScores.length - 1];
      const prevAvg = (recentScores[recentScores.length - 2] + recentScores[recentScores.length - 3]) / 2;
      if (last - prevAvg >= 8) trend = 'improving';
      else if (prevAvg - last >= 8) trend = 'declining';
    }
    const id = existing?.id || `tp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO interview_topic_performance (id, user_id, session_id, topic, attempts, average_score, latest_score, recent_scores, level, trend, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, session_id, topic) DO UPDATE SET
        attempts=excluded.attempts, average_score=excluded.average_score, latest_score=excluded.latest_score,
        recent_scores=excluded.recent_scores, level=excluded.level, trend=excluded.trend, updated_at=CURRENT_TIMESTAMP
    `).run(id, entry.userId, entry.sessionId, topic, recentScores.length, avg, entry.score, JSON.stringify(recentScores), level, trend);
    return { topic, attempts: recentScores.length, averageScore: avg, latestScore: entry.score, recentScores, level, trend };
  },

  recordDifficultyChange(entry: { sessionId: string; userId: string; topic?: string; previousDifficulty: string; nextDifficulty: string; reason?: string; questionNumber?: number }) {
    const db = getDb();
    const id = `dc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO interview_difficulty_changes (id, session_id, user_id, topic, previous_difficulty, next_difficulty, reason, question_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, entry.sessionId, entry.userId, entry.topic || null, entry.previousDifficulty, entry.nextDifficulty, entry.reason || null, entry.questionNumber ?? null);
    return id;
  },

  getLastDifficultyChange(sessionId: string) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM interview_difficulty_changes WHERE session_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1').get(sessionId) as any;
    if (!row) return null;
    return {
      id: row.id, sessionId: row.session_id, userId: row.user_id, topic: row.topic,
      previousDifficulty: row.previous_difficulty, nextDifficulty: row.next_difficulty,
      reason: row.reason, questionNumber: row.question_number, createdAt: row.created_at,
    };
  },

  recordQuestionHistory(entry: { sessionId: string; userId: string; questionNumber?: number; questionText: string; topic?: string; difficulty?: string; source?: string }) {
    const db = getDb();
    const id = `qh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO interview_question_history (id, session_id, user_id, question_number, question_text, topic, difficulty, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, entry.sessionId, entry.userId, entry.questionNumber ?? null, entry.questionText, entry.topic || null, entry.difficulty || null, entry.source || 'gemini');
    return id;
  },

  getInterviewQuestionHistory(sessionId: string) {
    const db = getDb();
    return (db.prepare('SELECT * FROM interview_question_history WHERE session_id = ? ORDER BY created_at ASC').all(sessionId) as any[]).map((r) => ({
      id: r.id, sessionId: r.session_id, userId: r.user_id, questionNumber: r.question_number,
      questionText: r.question_text, topic: r.topic, difficulty: r.difficulty, source: r.source, createdAt: r.created_at,
    }));
  },

  getInterviewBankQuestions(role?: string, interviewType?: string, difficulty?: string, companyTag?: string) {
    const db = getDb();
    let query = 'SELECT * FROM interview_question_bank WHERE 1=1';
    const params: any[] = [];

    if (role && role !== 'All') {
      query += ' AND (LOWER(role) = LOWER(?) OR role = "Software Developer (SDE)")';
      params.push(role);
    }
    if (interviewType && interviewType !== 'All-Round' && interviewType !== 'Resume-based') {
      query += ' AND LOWER(interview_type) = LOWER(?)';
      params.push(interviewType);
    }
    if (difficulty && difficulty !== 'All') {
      query += ' AND LOWER(difficulty) = LOWER(?)';
      params.push(difficulty);
    }
    if (companyTag && companyTag !== 'All') {
      query += ' AND LOWER(company_tag) = LOWER(?)';
      params.push(companyTag);
    }

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      companyTag: r.company_tag,
      interviewType: r.interview_type,
      category: r.category,
      difficulty: r.difficulty,
      questionText: r.question_text,
      expectedConcepts: r.expected_concepts ? JSON.parse(r.expected_concepts) : [],
      evaluationCriteria: r.evaluation_criteria ? JSON.parse(r.evaluation_criteria) : {},
      modelAnswer: r.model_answer,
      adaptiveHarder: r.adaptive_harder,
      adaptiveEasier: r.adaptive_easier,
    }));
  },

  getInterviewQuestionById(id: string) {
    const db = getDb();
    const r = db.prepare('SELECT * FROM interview_question_bank WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      role: r.role,
      companyTag: r.company_tag,
      interviewType: r.interview_type,
      category: r.category,
      difficulty: r.difficulty,
      questionText: r.question_text,
      expectedConcepts: r.expected_concepts ? JSON.parse(r.expected_concepts) : [],
      evaluationCriteria: r.evaluation_criteria ? JSON.parse(r.evaluation_criteria) : {},
      modelAnswer: r.model_answer,
      adaptiveHarder: r.adaptive_harder,
      adaptiveEasier: r.adaptive_easier,
    };
  },
};

export const practiceDb = nodeDb;
