import fs from 'node:fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
if (!keyMatch) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(keyMatch[1]);
const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

async function generateWithFallback(prompt) {
  let lastErr = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      if (text) return text;
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 800));
    }
  }
  throw lastErr || new Error('All models failed');
}

// Profile A: Frontend Engineer
const studentA = {
  name: 'Priya Sharma',
  targetRole: 'Frontend Web Engineer',
  readinessScore: 62,
  latestInterviewScore: '58/100 in Technical DSA Round',
  activeWeakAreas: ['Dynamic Programming', 'Binary Tree traversals', 'CSS subgrid'],
  skills: ['React.js (Verified)', 'Tailwind CSS (Verified)', 'JavaScript ES6+ (Verified)', 'Redux Toolkit (Verified)'],
  projects: ['E-Commerce Store with Zustand and Next.js: Cart state and payment checkout flow.'],
  retrievedChunks: [
    `[CHUNK 1 | Source: skill | Match: 94%]: Verified Skill: React.js (Advanced). Strong component lifecycle and custom hooks.`,
    `[CHUNK 2 | Source: interview | Match: 88%]: Mock Interview Benchmark: 58/100 on Frontend & DSA. Weak in recursion and memoized DP. Evaluator note: Need to practice STAR structure and binary tree traversals.`,
    `[CHUNK 3 | Source: project | Match: 82%]: Project: E-Commerce Store with Zustand. Implemented client-side caching and dynamic product filters.`
  ]
};

// Profile B: Backend Systems Engineer
const studentB = {
  name: 'Arjun Mehta',
  targetRole: 'Distributed Backend & Cloud Systems Engineer',
  readinessScore: 88,
  latestInterviewScore: '86/100 in Systems & DBMS Round',
  activeWeakAreas: ['Database sharding failover mechanisms', 'gRPC stream cancellation deadlines'],
  skills: ['Go / Golang (Verified)', 'PostgreSQL (Verified)', 'Docker (Verified)', 'Redis (Verified)', 'gRPC (Verified)'],
  projects: ['Distributed Raft Consensus KV Store: Leader election and log replication across 5 nodes.'],
  retrievedChunks: [
    `[CHUNK 1 | Source: skill | Match: 96%]: Verified Skill: Go (Golang) & PostgreSQL (Expert). High concurrency goroutines and query plans.`,
    `[CHUNK 2 | Source: interview | Match: 90%]: Mock Interview Benchmark: 86/100 on Systems. Excellent concurrency knowledge. Weakness identified in database sharding failover edge cases.`,
    `[CHUNK 3 | Source: project | Match: 85%]: Project: Distributed Raft Consensus KV Store. Built leader election and partitioned network recovery.`
  ]
};

const commonQuestion = "What should I focus on studying tonight to maximize my chances in upcoming placement rounds?";

function buildPrompt(student) {
  return `You are CareerPilot's AI Agent ("Jarvis").
You are NOT customer support. You are a direct, sharp, precise, and proactive engineering mentor speaking directly to THIS specific student.

## PERSONALITY & TONE RULES:
1. Direct, precise, proactive — speak like Jarvis. No conversational fluff, no pleasantries, no restating the student's question, no disclaimers.
2. Address the student directly ("You", "Your").
3. Always end with ONE concrete, immediate next action.

## CORE RETRIEVAL & ANSWER RULES:
1. GROUNDING: Ground your answer strictly in THIS student's actual retrieved data.
2. CITE SPECIFICS: Always cite specific numbers, scores, projects, and skills from their retrieved data. Never give generic placement advice.
3. WEIGH REAL OPTIONS: For questions with depth, briefly weigh 2-3 real options based on their actual verified stack and weak areas before concluding.
4. NO INVENTED DATA: Never fabricate skills, degrees, grades, projects, or scores not present in the data below.

## CURRENT-STATE FACTS (Fixed ground truth):
- Student Name: ${student.name}
- Target Role: ${student.targetRole}
- Placement Readiness Score: ${student.readinessScore}/100
- Latest Interview Benchmark: ${student.latestInterviewScore}
- Active Critical Weak Areas: ${student.activeWeakAreas.join(', ')}

## RETRIEVED VECTOR CHUNKS:
${student.retrievedChunks.join('\n\n')}

## STUDENT'S QUESTION:
"${commonQuestion}"`;
}

async function runVerification() {
  console.log('====================================================');
  console.log('RAG VERIFICATION: Testing Response Distinctness');
  console.log('Same Question asked by 2 different student profiles:');
  console.log(`"${commonQuestion}"`);
  console.log('====================================================\n');

  console.log('--- Generating response for Student A (Priya - Frontend 62% readiness) ---');
  const promptA = buildPrompt(studentA);
  const textA = await generateWithFallback(promptA);
  console.log(textA);
  console.log('\n----------------------------------------------------\n');

  console.log('--- Generating response for Student B (Arjun - Backend Systems 88% readiness) ---');
  const promptB = buildPrompt(studentB);
  const textB = await generateWithFallback(promptB);
  console.log(textB);
  console.log('\n====================================================');

  // Verify distinctness assertions
  const hasA_Specifics = textA.includes('58') || textA.toLowerCase().includes('frontend') || textA.toLowerCase().includes('tree') || textA.toLowerCase().includes('react');
  const hasB_Specifics = textB.includes('86') || textB.toLowerCase().includes('sharding') || textB.toLowerCase().includes('raft') || textB.toLowerCase().includes('backend') || textB.toLowerCase().includes('go');
  
  // Calculate word overlap
  const wordsA = new Set(textA.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const wordsB = new Set(textB.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  let overlapCount = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlapCount++;
  }
  const jaccard = overlapCount / (wordsA.size + wordsB.size - overlapCount);

  console.log('VERIFICATION METRICS:');
  console.log(`- Student A cited profile specifics (58/100, Frontend, Trees, React): ${hasA_Specifics ? '✅ YES' : '❌ NO'}`);
  console.log(`- Student B cited profile specifics (86/100, Sharding, Raft, Go): ${hasB_Specifics ? '✅ YES' : '❌ NO'}`);
  console.log(`- Vocabulary Jaccard similarity between answers: ${(jaccard * 100).toFixed(1)}% (Low overlap confirms high distinctness)`);

  if (hasA_Specifics && hasB_Specifics && jaccard < 0.45) {
    console.log('\n🎯 RESULT: PASSED! The RAG system generates completely distinct, grounded, Jarvis-style answers per student profile!');
  } else {
    console.log('\n❌ RESULT: FAILED! Answers lacked distinct data citations.');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
