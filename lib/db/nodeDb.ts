import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { PRACTICE_SUBJECTS, PRACTICE_QUESTIONS, type PracticeQuestion } from '../practice/practiceBank.ts';

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

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'careerpilot.db');
  const db = new DatabaseSync(dbPath);

  // WAL mode for high concurrency & performance
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = OFF;

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

    CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_interview_turns_session ON interview_turns(session_id);
  `);

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
  }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO interview_sessions (
        id, user_id, target_role, interview_type, difficulty, interviewer_mode,
        company_name, status, duration_seconds, started_at, deadline_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'In Progress', ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.userId,
      session.targetRole,
      session.interviewType,
      session.difficulty,
      session.mode || 'Professional',
      session.companyName || null,
      session.durationSeconds || 900,
      session.startedAt || new Date().toISOString(),
      session.deadlineAt || null
    );
  },

  updateInterviewSession(
    sessionId: string,
    updates: {
      status?: string;
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
      updates.overallScore ?? null,
      updates.communicationScore ?? null,
      updates.technicalAccuracyScore ?? null,
      updates.structureScore ?? null,
      updates.confidenceScore ?? null,
      updates.feedbackSummary ? JSON.stringify(updates.feedbackSummary) : null,
      updates.transcript ? JSON.stringify(updates.transcript) : null,
      updates.completedAt || new Date().toISOString(),
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
};

export const practiceDb = nodeDb;
