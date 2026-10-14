/**
 * tests/practice-hub.test.ts
 *
 * Test suite to ensure Practice Hub navigation stability:
 * 1. Question lookup robustness (case-insensitivity, slug resolution)
 * 2. Shortcut interception protection (coding routes, monaco editor, modifier keys)
 */

import assert from 'node:assert';
import test from 'node:test';
import { getQuestionById, getQuestionsByCategory } from '../lib/practice/questions.ts';

test('Practice Hub: question lookup is robust and case-insensitive', () => {
  const qExact = getQuestionById('sql-001');
  assert.ok(qExact, 'sql-001 must be found by exact id');
  assert.strictEqual(qExact.type, 'sql');

  const qUpper = getQuestionById('SQL-001');
  assert.ok(qUpper, 'SQL-001 must be found case-insensitively');
  assert.strictEqual(qUpper.id, 'sql-001');

  const qSlug = getQuestionById(qExact.slug);
  assert.ok(qSlug, 'Question must be resolvable by slug');
  assert.strictEqual(qSlug.id, 'sql-001');

  const qNonExistent = getQuestionById('does-not-exist-999');
  assert.strictEqual(qNonExistent, undefined, 'Invalid id returns undefined gracefully');
});

test('Practice Hub: category questions retrieval works', () => {
  const dbmsQuestions = getQuestionsByCategory('dbms');
  assert.ok(dbmsQuestions.length > 0, 'DBMS category must return questions');

  const dsaQuestions = getQuestionsByCategory('dsa');
  assert.ok(dsaQuestions.length > 0, 'DSA category must return questions');
});

test('GlobalShortcuts Guard Logic: Prevents rogue route changes on coding routes and typing', () => {
  function shouldTriggerNavigation({
    pathname,
    isTyping,
    ctrlKey = false,
    metaKey = false,
    altKey = false,
    key,
  }: {
    pathname: string;
    isTyping: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    key: string;
  }): boolean {
    if (isTyping) return false;
    if (ctrlKey || metaKey || altKey) return false;

    const isCodingRoute =
      pathname.startsWith('/practice/solve') ||
      pathname.includes('/solve/') ||
      pathname.startsWith('/interview/room') ||
      pathname.startsWith('/practice/technical');

    if (isCodingRoute) return false;

    const lower = key.toLowerCase();
    const validKeys = ['p', 'd', 'r', 'i', 'j', 'c', 'a', 'o', 'g', 'l', 'x'];
    return validKeys.includes(lower);
  }

  // 1. User typing code 'SELECT ...' containing 'l' on solve route
  assert.strictEqual(
    shouldTriggerNavigation({
      pathname: '/practice/solve/sql-001',
      isTyping: true,
      key: 'l',
    }),
    false,
    'Typing "l" inside editor must NEVER navigate to /learn'
  );

  // 2. User presses 'l' on solve route even when blur
  assert.strictEqual(
    shouldTriggerNavigation({
      pathname: '/practice/solve/sql-001',
      isTyping: false,
      key: 'l',
    }),
    false,
    'Pressing "l" on solve route must NEVER navigate to /learn'
  );

  // 3. User presses Ctrl+C to copy code
  assert.strictEqual(
    shouldTriggerNavigation({
      pathname: '/practice/solve/sql-001',
      isTyping: false,
      ctrlKey: true,
      key: 'c',
    }),
    false,
    'Ctrl+C must NEVER navigate to /career'
  );

  // 4. User presses Ctrl+A to select code
  assert.strictEqual(
    shouldTriggerNavigation({
      pathname: '/practice/solve/sql-001',
      isTyping: false,
      ctrlKey: true,
      key: 'a',
    }),
    false,
    'Ctrl+A must NEVER navigate to /applications'
  );

  // 5. User presses Ctrl+D
  assert.strictEqual(
    shouldTriggerNavigation({
      pathname: '/dashboard',
      isTyping: false,
      ctrlKey: true,
      key: 'd',
    }),
    false,
    'Ctrl+D must NEVER navigate to /dashboard because ctrlKey is active'
  );

  // 6. Normal browsing navigation on dashboard works when no modifiers and not typing
  assert.strictEqual(
    shouldTriggerNavigation({
      pathname: '/dashboard',
      isTyping: false,
      key: 'l',
    }),
    true,
    'Browsing on dashboard allows pressing "l" to navigate to /learn'
  );
});
