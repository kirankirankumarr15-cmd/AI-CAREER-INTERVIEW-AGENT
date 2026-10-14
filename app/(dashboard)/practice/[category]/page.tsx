import { notFound } from 'next/navigation';
import { ArenaLayout } from '@/components/practice/ArenaLayout';
import { ProblemList } from '@/components/practice/ProblemList';
import { getQuestionsByCategory } from '@/lib/practice/questions';

const categoriesInfo: Record<string, { title: string; description: string; colorTheme: string }> = {
  dbms: { title: 'DBMS & SQL', description: 'Relational algebra, ACID, indexes, query plans, normalization, and joins.', colorTheme: 'indigo' },
  sql: { title: 'DBMS & SQL', description: 'Relational algebra, ACID, indexes, query plans, normalization, and joins.', colorTheme: 'indigo' },
  dsa: { title: 'Data Structures & Algorithms', description: 'Arrays, Trees, Graphs, Dynamic Programming, and complexity analysis.', colorTheme: 'violet' },
  c: { title: 'C Programming & Data Structures', description: 'Pointers, memory management (malloc/free), structs, bitwise operations, and data structures in C.', colorTheme: 'emerald' },
  java: { title: 'Java & Object-Oriented DSA', description: 'Core Java, Collections framework, generics, memory model, and data structures in Java.', colorTheme: 'orange' },
  oop: { title: 'OOP & System Design', description: 'Design patterns, SOLID principles, microservices, and rate limiters.', colorTheme: 'fuchsia' },
  os: { title: 'Operating Systems', description: 'Processes, threads, synchronization, memory management, and paging.', colorTheme: 'sky' },
  cn: { title: 'Computer Networks', description: 'OSI vs TCP/IP, HTTP, DNS, sockets, and common interview networking questions.', colorTheme: 'cyan' },
  web: { title: 'Frontend & Web', description: 'React, JavaScript, CSS layout, accessibility, and browser rendering.', colorTheme: 'emerald' },
  backend: { title: 'Backend & APIs', description: 'REST, auth, databases, caching, and production debugging patterns.', colorTheme: 'blue' },
  aptitude: { title: 'Aptitude & Reasoning', description: 'Quantitative, logical, and verbal drills used in campus placement rounds.', colorTheme: 'amber' },
  communication: { title: 'Communication', description: 'Elevator pitches, clarity, filler-word control, and spoken technical answers.', colorTheme: 'rose' },
  hr: { title: 'HR & Behavioral', description: 'STAR stories, strengths, conflict, and leadership interview questions.', colorTheme: 'orange' },
  'system-design': { title: 'System Design Basics', description: 'Scalability, databases vs caches, load balancing, and trade-off reasoning.', colorTheme: 'slate' },
};

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPracticePage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawCategoryId = resolvedParams.category || '';
  const categoryId = rawCategoryId.toLowerCase();
  const effectiveCategory = categoryId === 'sql' ? 'dbms' : categoryId;
  const meta = categoriesInfo[effectiveCategory] || {
    title: `${rawCategoryId} Practice`,
    description: `Curated practice questions and interview drills for ${rawCategoryId}.`,
    colorTheme: 'indigo',
  };

  let allQuestions = getQuestionsByCategory(effectiveCategory);
  // If specific language arena requested (e.g., C or Java), provide DSA coding problems
  if (allQuestions.length === 0 && (effectiveCategory === 'c' || effectiveCategory === 'java')) {
    allQuestions = getQuestionsByCategory('dsa');
  }
  // If still empty, provide general questions
  if (allQuestions.length === 0) {
    allQuestions = getQuestionsByCategory('dbms');
  }

  return (
    <ArenaLayout
      categoryId={categoryId}
      categoryTitle={meta.title}
      description={meta.description}
      colorTheme={meta.colorTheme}
    >
      <ProblemList questions={allQuestions} category={categoryId} />
    </ArenaLayout>
  );
}
