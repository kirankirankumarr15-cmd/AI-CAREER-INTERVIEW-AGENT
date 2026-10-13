import { Question } from './questions';

export const webProblems: Question[] = [
  {
    id: 'web-001',
    number: 1,
    title: 'React Re-renders & Memoization',
    slug: 'react-re-renders',
    type: 'conceptual',
    category: 'web',
    topic: 'React',
    subtopic: 'Performance',
    difficulty: 'Medium',
    description: `Explain how React's rendering lifecycle works. When does a component re-render, and how can you prevent unnecessary re-renders using \`React.memo\`, \`useMemo\`, and \`useCallback\`?`,
    examples: [],
    hints: [
      { level: 1, text: 'Components re-render when state or props change.' },
      { level: 2, text: 'React.memo prevents re-rendering if props are deeply equal.' },
    ],
    solution: `React re-renders when state updates or a parent re-renders. Use React.memo for components, useMemo for expensive calculations, and useCallback for stable function references.`,
    explanation: 'Memoization caches values to prevent expensive re-calculations and rendering cycles in the Virtual DOM.',
    testCases: [],
    companies: ['Meta', 'Amazon', 'Netflix'],
    frequencyLevel: 'high',
    frequencyNote: 'Common frontend interview question.',
    tags: ['React', 'Web', 'Frontend'],
    roleRelevance: ['Frontend Developer'],
    points: 100,
  }
];

export const backendProblems: Question[] = [
  {
    id: 'be-001',
    number: 1,
    title: 'Design a Rate Limiter',
    slug: 'design-rate-limiter',
    type: 'conceptual',
    category: 'backend',
    topic: 'API Design',
    subtopic: 'Rate Limiting',
    difficulty: 'Hard',
    description: `How would you design a scalable rate limiter for a public API? Discuss algorithms like Token Bucket and Leaky Bucket.`,
    examples: [],
    hints: [
      { level: 1, text: 'Consider Redis for distributed state.' },
      { level: 2, text: 'Token bucket is standard for bursty traffic.' },
    ],
    solution: `I would use Redis with a Token Bucket algorithm. Each user gets a bucket with a max capacity of tokens. Tokens refill at a fixed rate.`,
    explanation: 'Redis provides atomic operations (INCR, EXPIRE) which are perfect for distributed rate limiting.',
    testCases: [],
    companies: ['Stripe', 'Uber'],
    frequencyLevel: 'high',
    frequencyNote: 'Essential backend system design concept.',
    tags: ['Backend', 'System Design', 'API'],
    roleRelevance: ['Backend Developer'],
    points: 150,
  }
];

export const cnProblems: Question[] = [
  {
    id: 'cn-001',
    number: 1,
    title: 'TCP vs UDP',
    slug: 'tcp-vs-udp',
    type: 'conceptual',
    category: 'cn',
    topic: 'Protocols',
    subtopic: 'Transport Layer',
    difficulty: 'Easy',
    description: `What is the difference between TCP and UDP? When would you choose one over the other?`,
    examples: [],
    hints: [
      { level: 1, text: 'TCP is reliable and connection-oriented.' },
      { level: 2, text: 'UDP is fast but unreliable.' },
    ],
    solution: `TCP guarantees delivery, ordering, and error checking (useful for HTTP, File transfer). UDP has no guarantees but is faster (useful for video streaming, gaming).`,
    explanation: 'TCP uses a 3-way handshake and acknowledgements. UDP just fires packets.',
    testCases: [],
    companies: ['Cisco', 'Akamai'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Fundamental networking question.',
    tags: ['Networking', 'TCP', 'UDP'],
    roleRelevance: ['Backend Developer', 'DevOps'],
    points: 50,
  }
];

export const systemDesignProblems: Question[] = [
  {
    id: 'sd-001',
    number: 1,
    title: 'Design URL Shortener',
    slug: 'design-url-shortener',
    type: 'conceptual',
    category: 'system-design',
    topic: 'System Design Basics',
    subtopic: 'Scalability',
    difficulty: 'Medium',
    description: `Design a URL shortener like bit.ly. Focus on the database schema, URL generation algorithm, and scaling reads.`,
    examples: [],
    hints: [
      { level: 1, text: 'Use Base62 encoding for the short URL.' },
      { level: 2, text: 'Use a cache like Redis to speed up redirects.' },
    ],
    solution: `Use a relational database mapping short_code to original_url. Generate short_code using Base62 encoding of an auto-incrementing integer ID. Put Redis in front for heavy read traffic.`,
    explanation: 'Base62 allows 62^7 combinations with just 7 characters, which is over 3.5 trillion URLs.',
    testCases: [],
    companies: ['Google', 'Facebook'],
    frequencyLevel: 'very-high',
    frequencyNote: 'The most common beginner system design question.',
    tags: ['System Design', 'Scaling'],
    roleRelevance: ['Backend Developer', 'Full Stack Developer'],
    points: 150,
  }
];
