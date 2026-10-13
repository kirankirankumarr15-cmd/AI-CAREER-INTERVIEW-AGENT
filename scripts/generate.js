import fs from 'node:fs';

const dsaTopics = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Sorting & Searching', 'Hash Tables'];
const difficulties = ['Easy', 'Medium', 'Hard'];

let newQuestions = [];

// Generate DSA problems
for (let i = 0; i < 50; i++) {
  const topic = dsaTopics[i % dsaTopics.length];
  const difficulty = difficulties[i % difficulties.length];
  
  newQuestions.push(`  {
    id: 'dsa-gen-${i}',
    number: ${100 + i},
    title: 'Practice Problem ${topic} ${i}',
    slug: 'practice-problem-${i}',
    type: 'coding',
    category: 'dsa',
    topic: '${topic}',
    subtopic: 'Core Algorithms',
    difficulty: '${difficulty}',
    description: 'Solve the fundamental ${topic} problem. Optimize for time and space complexity.',
    examples: [],
    hints: [{ level: 1, text: 'Consider edge cases.' }],
    solution: '// Complete the solution here.',
    explanation: 'Optimal approach uses appropriate data structures.',
    testCases: [],
    companies: ['Amazon', 'Microsoft'],
    frequencyLevel: 'high',
    frequencyNote: 'Common in technical rounds.',
    tags: ['${topic}', 'Algorithms'],
    roleRelevance: ['Software Engineer'],
    points: ${difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 150},
  }`);
}

// Generate System Design problems
const sdTopics = ['Microservices', 'Load Balancing', 'Databases', 'Caching', 'Message Queues'];
for (let i = 0; i < 20; i++) {
  const topic = sdTopics[i % sdTopics.length];
  newQuestions.push(`  {
    id: 'sd-gen-${i}',
    number: ${200 + i},
    title: 'Design ${topic} Architecture',
    slug: 'design-${topic.toLowerCase().replace(' ', '-')}-${i}',
    type: 'conceptual',
    category: 'system-design',
    topic: '${topic}',
    subtopic: 'Architecture',
    difficulty: 'Hard',
    description: 'Design a scalable system focusing on ${topic}. Discuss trade-offs.',
    examples: [],
    hints: [{ level: 1, text: 'Use distributed principles.' }],
    solution: 'Architecture Diagram & Explanation.',
    explanation: '${topic} is critical for scaling.',
    testCases: [],
    companies: ['Google', 'Meta'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Standard system design question.',
    tags: ['System Design', '${topic}'],
    roleRelevance: ['Senior Engineer'],
    points: 150,
  }`);
}

const fileContent = `
import { Question } from './questions';

export const generatedProblems: Question[] = [
${newQuestions.join(',\n')}
];
`;

fs.writeFileSync('lib/practice/generated-questions.ts', fileContent);
console.log('Successfully generated questions!');
