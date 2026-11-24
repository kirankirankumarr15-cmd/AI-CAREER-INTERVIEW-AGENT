export interface InterviewBankQuestion {
  id: string;
  role: string;
  companyTag?: string;
  interviewType: 'Technical' | 'HR' | 'Project' | 'DSA' | 'Behavioral';
  category: 'Introduction' | 'DSA' | 'DBMS & SQL' | 'OS & Concurrency' | 'System Design' | 'Project Architecture' | 'STAR Behavioral' | 'Closing';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questionText: string;
  expectedConcepts: string[];
  evaluationCriteria: {
    technicalAccuracy: string;
    communication: string;
    structure: string;
    problemSolving: string;
  };
  modelAnswer: string;
  adaptiveHarder: string;
  adaptiveEasier: string;
}

export const INTERVIEW_QUESTION_BANK: InterviewBankQuestion[] = [
  // ─── SOFTWARE DEVELOPER (SDE) ──────────────────────────────────────────────
  {
    id: 'sde-dsa-01',
    role: 'Software Developer (SDE)',
    companyTag: 'Amazon',
    interviewType: 'Technical',
    category: 'DSA',
    difficulty: 'Intermediate',
    questionText: 'Can you explain how a Hash Map handles hash collisions internally? Compare Chaining with Open Addressing and analyze their worst-case time complexities.',
    expectedConcepts: ['Hash function', 'Buckets / array index', 'Chaining (linked list / red-black tree)', 'Open Addressing (linear/quadratic probing)', 'Load factor & rehashing', 'O(1) average vs O(N) worst-case'],
    evaluationCriteria: {
      technicalAccuracy: 'Correctly identifies that chaining uses linked lists/trees while open addressing probes next available slots. Mentions load factor threshold (0.75).',
      communication: 'Presents concepts clearly using precise data structure terminology without excessive pauses.',
      structure: 'Defines hash collision first, details chaining, details open addressing, then compares time complexities.',
      problemSolving: 'Explains trade-offs: cache locality in open addressing vs memory overhead and clustering in chaining.',
    },
    modelAnswer: 'A hash map converts keys to bucket indices using a hash function. When two distinct keys hash to the same index, a collision occurs. In Separate Chaining, each bucket stores a linked list or balanced binary search tree (like Java 8 TreeMap at threshold 8) of colliding entries. In Open Addressing, all elements reside directly in the array; collisions are resolved by probing alternative slots using linear probing, quadratic probing, or double hashing. Average lookup is O(1); worst-case degrades to O(N) if clustering or bad distribution occurs. Rehashing occurs when the load factor exceeds 0.75.',
    adaptiveHarder: 'Great answer. If an attacker intentionally generates colliding keys to launch a Denial of Service attack on your Hash Map, how do modern language runtimes like Java, Go, or Python protect against it?',
    adaptiveEasier: 'That is on the right track. Can you start with the basic definition: what is a collision, and why can two different strings produce the same hash code?',
  },
  {
    id: 'sde-dbms-01',
    role: 'Software Developer (SDE)',
    companyTag: 'Microsoft',
    interviewType: 'Technical',
    category: 'DBMS & SQL',
    difficulty: 'Intermediate',
    questionText: 'Explain the four ACID properties in relational databases. How does a database engine ensure Atomicity and Durability during a sudden server crash?',
    expectedConcepts: ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'Write-Ahead Logging (WAL)', 'Transaction commit', 'Undo/Redo logs', 'Crash recovery (ARIES)'],
    evaluationCriteria: {
      technicalAccuracy: 'Accurately defines all 4 ACID properties and attributes crash recovery to Write-Ahead Logging (WAL) and undo/redo logs.',
      communication: 'Speaks with confidence and logical flow from definition to crash mechanics.',
      structure: 'Breaks down ACID acronym systematically, then addresses server recovery.',
      problemSolving: 'Explains the actual disk I/O mechanism: logs flushed before dirty pages.',
    },
    modelAnswer: 'ACID ensures reliable database transactions: Atomicity guarantees all-or-nothing execution; Consistency maintains database constraints and invariants; Isolation prevents concurrent transactions from interfering; Durability guarantees committed changes persist across crashes. During a sudden crash, Atomicity and Durability are guaranteed through Write-Ahead Logging (WAL). Changes are written sequentially to an append-only log on non-volatile disk before data pages are updated in buffer pool. During restart recovery, the engine reads the WAL: it redoes all committed transactions and undoes uncommitted or in-flight transactions.',
    adaptiveHarder: 'Excellent breakdown. Now suppose two concurrent transactions read and update account balances simultaneously. How does Isolation level "Read Committed" differ from "Repeatable Read" and "Serializable", and what are phantom reads?',
    adaptiveEasier: 'Good start. Could you briefly state what each letter in A-C-I-D stands for and why transactions are essential in banking applications?',
  },
  {
    id: 'sde-os-01',
    role: 'Software Developer (SDE)',
    companyTag: 'General Tech',
    interviewType: 'Technical',
    category: 'OS & Concurrency',
    difficulty: 'Intermediate',
    questionText: 'What is the difference between a process and a thread? Explain how context switching works and why thread switching is typically faster than process switching.',
    expectedConcepts: ['Process address space (code, data, heap, stack)', 'Thread shared memory (shared heap/code, private stack)', 'PCB vs TCB', 'Memory Management Unit / Page tables', 'TLB (Translation Lookaside Buffer) flush'],
    evaluationCriteria: {
      technicalAccuracy: 'Notes that processes have isolated virtual address spaces while threads share heap and code. Identifies TLB invalidation as the key cost of process context switching.',
      communication: 'Uses crisp computer systems terminology.',
      structure: 'Compares process vs thread definitions, defines context switch, then details architectural cost.',
      problemSolving: 'Highlights cache misses and memory paging implications.',
    },
    modelAnswer: 'A process is an executing program instance with its own isolated virtual address space, containing code, data, heap, stack, file descriptors, and a Process Control Block (PCB). A thread is the smallest schedulable unit of CPU execution within a process; threads of the same process share the heap, data, and open files, but possess their own program counter and stack. Context switching involves saving registers and CPU state to switch tasks. Thread switching within the same process is significantly faster because the virtual memory address space remains unchanged, avoiding costly Page Table switching and Translation Lookaside Buffer (TLB) cache flushes.',
    adaptiveHarder: 'Spot on. What are the 4 Coffman conditions required for a deadlock to occur in a multithreaded environment, and how can you design software to prevent them?',
    adaptiveEasier: 'Can you describe in simple terms: if you open two browser windows versus having two tabs in the same window, how is memory shared?',
  },
  {
    id: 'sde-sysdesign-01',
    role: 'Software Developer (SDE)',
    companyTag: 'Google',
    interviewType: 'Technical',
    category: 'System Design',
    difficulty: 'Advanced',
    questionText: 'Imagine you are designing a URL shortening service like Bitly handling 500 million new URLs per month. How would you generate unique short keys, and how would you design the storage and caching layer for low-latency redirection?',
    expectedConcepts: ['Base62 encoding', 'Unique ID generation (Snowflake / Auto-increment range / MD5/SHA256 truncate)', 'Read vs Write ratio (heavy read)', 'Redis caching (LRU)', 'Database schema (id, shortKey, longUrl, createdAt)', 'Horizontal scaling & CDN'],
    evaluationCriteria: {
      technicalAccuracy: 'Proposes Base62 [a-zA-Z0-9] encoding. Calculates key length (7 chars = 3.5 trillion URLs). Mentions Redis cache with LRU eviction for 80/20 rule.',
      communication: 'Structures response like a real architectural design interview: estimations, API design, storage, caching, bottleneck resolution.',
      structure: 'Systematic: Requirements -> Key Generation -> Database Choice -> Caching & Scale.',
      problemSolving: 'Considers collision avoidance and high read-to-write ratios (e.g. 100:1).',
    },
    modelAnswer: 'For 500M URLs/month, 7-character Base62 encoding yields 62^7 (~3.5 trillion) unique combinations, lasting decades. To avoid collision bottlenecks, we generate unique 64-bit distributed IDs using a Twitter Snowflake or ZooKeeper range allocation service, then encode the integer into Base62. For storage, a NoSQL key-value store (like DynamoDB or Cassandra) or partitioned PostgreSQL indexed on short_key offers fast lookups. Since URL redirect services have a ~100:1 read-to-write ratio, we place a distributed Redis cache in front of the database caching the top 20% hottest URLs (80/20 rule) with an LRU eviction policy, serving redirects in sub-5ms.',
    adaptiveHarder: 'How would you handle URL expiration and automatic cleanup of billions of expired rows without locking the active database tables?',
    adaptiveEasier: 'Let us simplify: how would you convert a long URL into a 6-character string, and where would you store the mapping so it can be quickly looked up?',
  },

  // ─── BACKEND DEVELOPER ─────────────────────────────────────────────────────
  {
    id: 'backend-api-01',
    role: 'Backend Developer',
    companyTag: 'Amazon',
    interviewType: 'Technical',
    category: 'System Design',
    difficulty: 'Intermediate',
    questionText: 'What is API idempotency? How would you design an idempotent POST /payments/checkout endpoint so a user is never double-charged even if their mobile app retries the network request multiple times?',
    expectedConcepts: ['Idempotency definition', 'Idempotency Key (UUID/token in HTTP headers)', 'Distributed locks (Redis SETNX)', 'Database unique constraints', 'Transaction state machine (PENDING, SUCCESS, FAILED)', 'Atomic status check'],
    evaluationCriteria: {
      technicalAccuracy: 'Specifies Idempotency-Key header sent by client, Redis lock/cache or database uniqueness to detect duplicated requests and return cached response.',
      communication: 'Clear explanation of distributed network failure modes (timeout vs dropped ACK).',
      structure: 'Explains the problem (network retry vs double execution), then architectural solution.',
      problemSolving: 'Addresses concurrency: what happens if two identical requests hit the server at the exact same millisecond.',
    },
    modelAnswer: 'An operation is idempotent if executing it multiple times produces the exact same outcome as executing it once. In a payment system, the client generates a unique idempotency key (e.g., UUID v4) sent in headers. When the backend receives the request, it checks an Idempotency store (Redis or DB table) with an atomic distributed lock (Redis SETNX with TTL). If the key is already processing, the duplicate returns a 409 Conflict or waits. If completed, the server immediately returns the previously cached response without re-triggering the payment gateway. The payment record also enforces a unique database constraint on idempotency_key.',
    adaptiveHarder: 'If the third-party payment gateway itself goes down or returns a 504 Gateway Timeout, how do you reconcile whether the customer card was actually debited before failing the transaction?',
    adaptiveEasier: 'What does idempotent mean, and why can network timeouts cause duplicate orders in online shopping apps?',
  },
  {
    id: 'backend-db-01',
    role: 'Backend Developer',
    companyTag: 'TCS',
    interviewType: 'Technical',
    category: 'DBMS & SQL',
    difficulty: 'Intermediate',
    questionText: 'When a database query becomes slow in production, what steps do you take to diagnose and optimize it? Explain how database indexing works using B-Trees and when an index might NOT be used by the query optimizer.',
    expectedConcepts: ['EXPLAIN / EXPLAIN ANALYZE', 'Table scan vs Index scan', 'B-Tree leaf nodes & balanced height', 'Index selectivity / cardinality', 'Composite index order (leftmost prefix)', 'Functions on indexed columns (e.g. WHERE LOWER(email))'],
    evaluationCriteria: {
      technicalAccuracy: 'Mentions EXPLAIN ANALYZE, B-Tree traversal, index cardinality, and common pitfalls like wrapping indexed columns in functions or leading wildcards (LIKE "%abc").',
      communication: 'Diagnostic, step-by-step troubleshooting mindset.',
      structure: 'Diagnosis steps -> B-Tree mechanism -> Scenarios where index is ignored.',
      problemSolving: 'Demonstrates real production engineering experience.',
    },
    modelAnswer: 'I start by running EXPLAIN ANALYZE to inspect the query execution plan, identifying Seq Scans, disk spills, or slow joins. Relational databases use B-Trees where keys are ordered and balanced, providing O(log N) lookup down to leaf pages containing row pointers. An index will NOT be used if: 1) Low selectivity (e.g. boolean flag where table scan is faster); 2) Functions wrapped around indexed columns (e.g. WHERE YEAR(date)); 3) Leading wildcard LIKE queries (WHERE name LIKE "%smith"); 4) Violating composite index leftmost prefix rule; 5) Outdated database table statistics requiring an ANALYZE command.',
    adaptiveHarder: 'What is a Covering Index, and how does Index-Only Scan eliminate random I/O from heap pages?',
    adaptiveEasier: 'Can you explain the difference between searching an entire book page by page versus using the alphabetical index at the back of the book?',
  },

  // ─── FRONTEND DEVELOPER ────────────────────────────────────────────────────
  {
    id: 'fe-react-01',
    role: 'Frontend Developer',
    companyTag: 'Microsoft',
    interviewType: 'Technical',
    category: 'System Design',
    difficulty: 'Intermediate',
    questionText: 'How does React Virtual DOM and the reconciliation algorithm work under the hood? What are the key optimizations introduced in React 18 Concurrent Rendering?',
    expectedConcepts: ['Virtual DOM tree diffing', 'Fiber architecture', 'O(N) heuristic diffing rules (component type & keys)', 'Reconciliation vs Commit phase', 'Concurrent mode (time slicing & interruptible rendering)', 'useTransition / useDeferredValue'],
    evaluationCriteria: {
      technicalAccuracy: 'Explains Fiber tree, diffing heuristics (keys & element types), and concurrent rendering allowing high-priority user input to interrupt background UI renders.',
      communication: 'Speaks fluently about modern frontend architecture.',
      structure: 'Virtual DOM basics -> Reconciliation heuristics -> Fiber -> React 18 Concurrency.',
      problemSolving: 'Explains why keys are crucial in lists and the consequences of using array index as key.',
    },
    modelAnswer: 'React maintains an in-memory Virtual DOM representing the UI. When state changes, a new VDOM tree is created and diffed against the previous tree using a heuristic O(N) algorithm: elements of different types tear down the old tree, while stable keys allow matching children across renders. React Fiber represents work as a linked list of fibers allowing interruptible rendering. In React 18, Concurrent Mode enables cooperative multitasking and time-slicing: React can pause an expensive background component render to prioritize an urgent user keystroke or click, preventing main thread UI freezes.',
    adaptiveHarder: 'If you have a dashboard rendering a live table of 10,000 rows with 60 FPS streaming updates, how do you prevent re-rendering bottlenecks using virtualization, memoization, and web workers?',
    adaptiveEasier: 'What is the Virtual DOM in React, and why is updating the real browser DOM directly slower?',
  },

  // ─── HR & STAR BEHAVIORAL ──────────────────────────────────────────────────
  {
    id: 'hr-star-01',
    role: 'Software Developer (SDE)',
    companyTag: 'General Tech',
    interviewType: 'HR',
    category: 'STAR Behavioral',
    difficulty: 'Intermediate',
    questionText: 'Tell me about a time when you had a technical disagreement with a teammate or team lead. How did you handle the situation, and what was the outcome?',
    expectedConcepts: ['STAR method (Situation, Task, Action, Result)', 'Objective data / benchmarking vs ego', 'Active listening', 'Respectful communication', 'Collaborative resolution', 'Learning / team benefit'],
    evaluationCriteria: {
      technicalAccuracy: 'Structures narrative cleanly with STAR framework. Does not blame others.',
      communication: 'Demonstrates professional emotional intelligence and mature conflict management.',
      structure: 'Follows Situation -> Task -> Action -> Result.',
      problemSolving: 'Used technical benchmarks, proofs-of-concept, or data to make the decision.',
    },
    modelAnswer: 'In our capstone project, our team was divided between using MongoDB vs PostgreSQL for our e-commerce platform. My teammate favored MongoDB for rapid prototyping, while I was concerned about ACID compliance for order transactions and stock consistency. Rather than arguing opinions, I built a quick prototype benchmark demonstrating how concurrent checkouts in MongoDB resulted in overselling inventory without complex application-level locks. We reviewed the findings together, agreed to use PostgreSQL for transactions and Redis for the cart, and delivered the project on time with zero double-booking bugs.',
    adaptiveHarder: 'If your team lead had insisted on MongoDB despite your data, how would you have handled disagreeing and committing to their decision?',
    adaptiveEasier: 'Could you tell me about a time you worked on a group project and had to make a decision together?',
  },
  {
    id: 'hr-star-02',
    role: 'Software Developer (SDE)',
    companyTag: 'Infosys',
    interviewType: 'HR',
    category: 'STAR Behavioral',
    difficulty: 'Beginner',
    questionText: 'Why do you want to join our organization, and where do you see your technical trajectory evolving over the next 3 to 5 years?',
    expectedConcepts: ['Company alignment / values', 'Growth mindset', 'Engineering excellence', 'Continuous learning', 'Contributions to engineering teams', 'Mentorship & architecture goals'],
    evaluationCriteria: {
      technicalAccuracy: 'Clear self-awareness and realistic career planning.',
      communication: 'Articulate, enthusiastic, genuine delivery.',
      structure: 'Present interest -> near-term skill mastery -> long-term technical leadership.',
      problemSolving: 'Aligns personal career trajectory with business goals.',
    },
    modelAnswer: 'I am excited about this opportunity because your team tackles engineering challenges at massive scale, particularly in distributed cloud systems and AI integration. Over the next 1 to 2 years, my focus is to achieve deep mastery in production-grade backend architecture, write clean testable code, and take end-to-end ownership of core microservices. In 3 to 5 years, I aspire to grow into a Senior Software Engineer, mentoring junior developers, designing robust scalable system architectures, and contributing to strategic product decisions.',
    adaptiveHarder: 'How do you proactively keep your technical skills current with fast-evolving technologies like generative AI and serverless cloud architectures?',
    adaptiveEasier: 'What motivated you to pursue software engineering as your career?',
  },

  // ─── PROJECT ARCHITECTURE ──────────────────────────────────────────────────
  {
    id: 'proj-arch-01',
    role: 'Software Developer (SDE)',
    companyTag: 'General Tech',
    interviewType: 'Project',
    category: 'Project Architecture',
    difficulty: 'Intermediate',
    questionText: 'Pick the most challenging technical project listed on your resume. Walk me through the architecture, explain your specific contributions, and describe the hardest bug or bottleneck you encountered.',
    expectedConcepts: ['Component architecture', 'Tech stack justification', 'Data flow diagram', 'Personal ownership', 'Debugging methodology', 'Measurable metrics (latency, throughput, users)'],
    evaluationCriteria: {
      technicalAccuracy: 'Explains real architecture without hand-waving. Clearly delineates personal contribution from group work.',
      communication: 'Concise yet thorough explanation of problem, diagnosis, and fix.',
      structure: 'Project overview -> Architecture -> Challenging bug -> Solution -> Impact.',
      problemSolving: 'Shows disciplined engineering mindset in diagnosing root cause.',
    },
    modelAnswer: 'In my Distributed Task Queue project, I designed a background job processing pipeline using Node.js, Redis, and PostgreSQL. The API server enqueues media jobs into Redis BullMQ queues, while multiple worker nodes process tasks concurrently. The hardest issue was memory leaks under high concurrent load: workers crashed after processing ~2,000 video files. Using Chrome DevTools heap snapshots, I discovered that file streams were not being properly closed on aborted uploads. By converting to piped pipeline streams with explicit cleanup listeners and backpressure handling, memory usage remained stable at 120MB, processing over 50,000 files without failures.',
    adaptiveHarder: 'If your worker count needed to automatically scale up from 2 nodes to 50 nodes during peak traffic spikes, how would you architect the autoscaling trigger and health checks?',
    adaptiveEasier: 'Can you give a brief 1-minute summary of what your project does and which programming languages you used to build it?',
  },
];

export function getQuestionsForTrack(
  role: string,
  interviewType: string,
  difficulty: string,
  companyTag?: string
): InterviewBankQuestion[] {
  // 1. Exact match by role and interviewType
  let matched = INTERVIEW_QUESTION_BANK.filter((q) => {
    const roleMatches = q.role.toLowerCase() === role.toLowerCase() || q.role === 'Software Developer (SDE)';
    const typeMatches = interviewType === 'All-Round' || q.interviewType.toLowerCase() === interviewType.toLowerCase() || interviewType === 'Resume-based';
    return roleMatches && typeMatches;
  });

  // Filter or sort by company if specified
  if (companyTag && companyTag !== 'All') {
    const companyMatches = matched.filter(q => q.companyTag?.toLowerCase() === companyTag.toLowerCase());
    if (companyMatches.length > 0) matched = companyMatches;
  }

  // Filter or sort by difficulty
  const diffMatches = matched.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  if (diffMatches.length >= 3) return diffMatches;

  return matched.length > 0 ? matched : INTERVIEW_QUESTION_BANK;
}
