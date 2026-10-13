// CareerPilot Practice Hub — Question Database
// All questions are original, curated educational content
import { webProblems, backendProblems, cnProblems, systemDesignProblems } from './more-questions';
import { generatedProblems } from './generated-questions';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type QuestionType = 'sql' | 'coding' | 'conceptual' | 'aptitude' | 'hr';
export type QuestionStatus = 'unsolved' | 'attempted' | 'solved' | 'mastered';

export type FrequencyLevel = 'very-high' | 'high' | 'medium' | 'low';

export interface TestCase {
  id: string;
  input?: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

export interface SqlSchema {
  tables: {
    name: string;
    columns: { name: string; type: string; constraints?: string }[];
    sampleData: Record<string, string | number | null>[];
  }[];
}

export interface Hint {
  level: 1 | 2 | 3 | 4;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  title: string;
  slug: string;
  type: QuestionType;
  category: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  description: string;
  examples: { input?: string; output: string; explanation?: string }[];
  constraints?: string[];
  hints: Hint[];
  solution: string;
  explanation: string;
  expectedComplexity?: string;
  starterCode?: Record<string, string>;
  schema?: SqlSchema;
  referenceSolution?: string;
  testCases: TestCase[];
  companies: string[];
  frequencyLevel: FrequencyLevel;
  frequencyNote: string;
  tags: string[];
  roleRelevance: string[];
  points: number;
}

// ─────────────────────────────────────────────────────
// SQL / DBMS PROBLEMS
// ─────────────────────────────────────────────────────

export const sqlProblems: Question[] = [
  {
    id: 'sql-001',
    number: 1,
    title: 'Select All Employees',
    slug: 'select-all-employees',
    type: 'sql',
    category: 'dbms',
    topic: 'SQL Basics',
    subtopic: 'SELECT',
    difficulty: 'Easy',
    description: `Write a SQL query to retrieve all columns and all rows from the \`employees\` table.\n\nThis is the foundational SELECT statement — the most used SQL command.`,
    examples: [
      { output: 'All rows and columns from employees table', explanation: 'SELECT * returns every column; no WHERE clause returns every row.' }
    ],
    constraints: ['Return all rows, all columns', 'Order does not matter'],
    hints: [
      { level: 1, text: 'Use the SELECT statement to retrieve data from a table.' },
      { level: 2, text: 'The asterisk (*) is a wildcard that means "all columns".' },
      { level: 3, text: 'Syntax: SELECT * FROM table_name;' },
      { level: 4, text: 'SELECT * FROM employees;' },
    ],
    solution: 'SELECT * FROM employees;',
    explanation: 'SELECT * FROM employees retrieves every column (id, name, department, salary, hire_date) and every row. The asterisk wildcard selects all columns. In production, it\'s better to explicitly list columns for performance and clarity.',
    testCases: [
      { id: 'tc-1', expectedOutput: '5 rows returned', isHidden: false, description: 'All employee rows' },
      { id: 'tc-2', expectedOutput: '5 columns per row', isHidden: true, description: 'All columns present' },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'hire_date', type: 'DATE' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
    frequencyLevel: 'high',
    frequencyNote: 'Frequently referenced across indexed interview and preparation sources.',
    tags: ['SELECT', 'Basics', 'Foundational'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Full Stack Developer'],
    points: 50,
    referenceSolution: 'SELECT * FROM employees;',
  },
  {
    id: 'sql-002',
    number: 2,
    title: 'Filter by Department',
    slug: 'filter-by-department',
    type: 'sql',
    category: 'dbms',
    topic: 'SQL Basics',
    subtopic: 'WHERE',
    difficulty: 'Easy',
    description: `Write a SQL query to find all employees who work in the **Engineering** department.\n\nReturn: \`id\`, \`name\`, \`salary\``,
    examples: [
      { output: 'Alice Johnson, Carol White, Eve Davis', explanation: 'Three employees are in Engineering.' }
    ],
    constraints: ['Return only Engineering employees', 'Return columns: id, name, salary'],
    hints: [
      { level: 1, text: 'Use WHERE clause to filter rows based on a condition.' },
      { level: 2, text: 'String comparisons use single quotes around the value.' },
      { level: 3, text: 'SELECT specific columns, then FROM employees WHERE department = ...' },
      { level: 4, text: "SELECT id, name, salary FROM employees WHERE department = 'Engineering';" },
    ],
    solution: "SELECT id, name, salary FROM employees WHERE department = 'Engineering';",
    explanation: "The WHERE clause filters rows. String literals require single quotes. Using = for exact match returns only Engineering employees. This demonstrates column projection (selecting specific columns) combined with row filtering.",
    testCases: [
      { id: 'tc-1', expectedOutput: '3 rows', isHidden: false, description: 'Three Engineering employees' },
      { id: 'tc-2', expectedOutput: 'columns: id, name, salary only', isHidden: true },
      { id: 'tc-3', expectedOutput: 'No Marketing or HR rows', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'hire_date', type: 'DATE' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['TCS', 'Infosys', 'Wipro', 'Cognizant'],
    frequencyLevel: 'high',
    frequencyNote: 'Frequently referenced across indexed interview and preparation sources.',
    tags: ['WHERE', 'Filtering', 'SELECT'],
    roleRelevance: ['Backend Developer', 'Data Analyst'],
    points: 60,
    referenceSolution: "SELECT id, name, salary FROM employees WHERE department = 'Engineering';",
  },
  {
    id: 'sql-003',
    number: 3,
    title: 'Count Employees Per Department',
    slug: 'count-employees-per-department',
    type: 'sql',
    category: 'dbms',
    topic: 'Aggregation',
    subtopic: 'GROUP BY',
    difficulty: 'Easy',
    description: `Write a SQL query to find the **number of employees in each department**.\n\nReturn: \`department\`, \`employee_count\`\nOrder by employee_count descending.`,
    examples: [
      { output: 'Engineering: 3, Marketing: 1, HR: 1', explanation: 'GROUP BY aggregates rows per department.' }
    ],
    constraints: ['Use GROUP BY', 'Order by count descending', 'Alias the count column as employee_count'],
    hints: [
      { level: 1, text: 'GROUP BY groups rows with the same department value together.' },
      { level: 2, text: 'COUNT(*) counts rows within each group.' },
      { level: 3, text: 'Use ORDER BY column DESC for descending order.' },
      { level: 4, text: 'SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;' },
    ],
    solution: 'SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;',
    explanation: 'GROUP BY creates a group for each unique department value. COUNT(*) counts rows in each group. AS renames the column. ORDER BY ... DESC sorts the results largest-first. This pattern (SELECT group_col, AGG() FROM table GROUP BY group_col) is the core aggregation pattern.',
    testCases: [
      { id: 'tc-1', expectedOutput: 'Engineering: 3', isHidden: false },
      { id: 'tc-2', expectedOutput: 'Results ordered descending', isHidden: true },
      { id: 'tc-3', expectedOutput: 'Correct column aliases', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'hire_date', type: 'DATE' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['Amazon', 'Microsoft', 'TCS', 'Infosys', 'Wipro'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Frequently referenced across indexed interview and preparation sources. Very common in SQL interviews.',
    tags: ['GROUP BY', 'COUNT', 'Aggregation', 'ORDER BY'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Data Engineer'],
    points: 80,
    referenceSolution: 'SELECT department, COUNT(*) AS employee_count FROM employees GROUP BY department ORDER BY employee_count DESC;',
  },
  {
    id: 'sql-004',
    number: 4,
    title: 'Second Highest Salary',
    slug: 'second-highest-salary',
    type: 'sql',
    category: 'dbms',
    topic: 'Subqueries',
    subtopic: 'Subquery',
    difficulty: 'Medium',
    description: `Write a SQL query to find the **second highest salary** from the \`employees\` table.\n\nIf there is no second highest salary (e.g., only one distinct salary), return NULL.\n\nReturn the result in a column named \`second_highest_salary\`.`,
    examples: [
      { input: 'Salaries: 92000, 85000, 78000, 62000, 55000', output: '85000', explanation: 'The second distinct highest salary after 92000 is 85000.' }
    ],
    constraints: ['Handle case where second salary does not exist — return NULL', 'Result column must be named second_highest_salary'],
    hints: [
      { level: 1, text: 'Think about how to exclude the maximum salary and find the next maximum.' },
      { level: 2, text: 'Use a subquery: SELECT MAX(salary) WHERE salary < (SELECT MAX(salary)...)' },
      { level: 3, text: 'Wrap in a SELECT to return NULL if no second salary exists.' },
      { level: 4, text: 'SELECT MAX(salary) AS second_highest_salary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);' },
    ],
    solution: 'SELECT MAX(salary) AS second_highest_salary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);',
    explanation: 'The inner subquery finds the maximum salary. The outer query finds the maximum salary that is strictly less than the inner maximum — this gives the second highest. If no such salary exists, MAX returns NULL. This is one of the most commonly asked SQL interview questions.',
    testCases: [
      { id: 'tc-1', expectedOutput: '85000', isHidden: false, description: 'Second highest salary' },
      { id: 'tc-2', expectedOutput: 'NULL when only one salary exists', isHidden: true },
      { id: 'tc-3', expectedOutput: 'Column named second_highest_salary', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'hire_date', type: 'DATE' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys', 'Wipro', 'Cognizant'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Extremely frequently referenced across indexed interview sources. One of the most asked SQL questions.',
    tags: ['Subquery', 'MAX', 'Salary', 'Classic'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Data Engineer', 'Software Engineer'],
    points: 120,
    referenceSolution: 'SELECT MAX(salary) AS second_highest_salary FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);',
  },
  {
    id: 'sql-005',
    number: 5,
    title: 'Employees With Above Average Salary',
    slug: 'employees-above-average-salary',
    type: 'sql',
    category: 'dbms',
    topic: 'Subqueries',
    subtopic: 'Scalar Subquery',
    difficulty: 'Easy',
    description: `Write a SQL query to find all employees whose salary is **above the average salary**.\n\nReturn: \`id\`, \`name\`, \`salary\`\nOrder by salary descending.`,
    examples: [
      { output: 'Carol White: 92000, Alice: 85000, Eve: 78000', explanation: 'Average is 74400, so three employees qualify.' }
    ],
    constraints: ['Use a subquery or aggregate comparison', 'Order by salary descending'],
    hints: [
      { level: 1, text: 'AVG() calculates the average of a column.' },
      { level: 2, text: 'Use a subquery in the WHERE clause: WHERE salary > (SELECT AVG(salary) ...)' },
      { level: 3, text: 'The subquery returns a single value (scalar) to compare against.' },
      { level: 4, text: 'SELECT id, name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC;' },
    ],
    solution: 'SELECT id, name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC;',
    explanation: 'The scalar subquery (SELECT AVG(salary) FROM employees) computes the average once. Each row\'s salary is then compared against this value. This pattern is very common in data analysis interviews.',
    testCases: [
      { id: 'tc-1', expectedOutput: '3 rows', isHidden: false },
      { id: 'tc-2', expectedOutput: 'Ordered by salary descending', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'hire_date', type: 'DATE' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['TCS', 'Infosys', 'Cognizant', 'Wipro'],
    frequencyLevel: 'high',
    frequencyNote: 'Frequently referenced across indexed interview and preparation sources.',
    tags: ['Subquery', 'AVG', 'WHERE', 'Scalar'],
    roleRelevance: ['Backend Developer', 'Data Analyst'],
    points: 90,
    referenceSolution: 'SELECT id, name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC;',
  },
  {
    id: 'sql-006',
    number: 6,
    title: 'Department Average Salary',
    slug: 'department-average-salary',
    type: 'sql',
    category: 'dbms',
    topic: 'Aggregation',
    subtopic: 'GROUP BY + HAVING',
    difficulty: 'Medium',
    description: `Write a SQL query to find departments where the **average salary exceeds 70,000**.\n\nReturn: \`department\`, \`avg_salary\` (rounded to 2 decimal places)\nOrder by avg_salary descending.`,
    examples: [
      { output: 'Engineering: 85000.00', explanation: 'Only Engineering has avg > 70000.' }
    ],
    constraints: ['Use HAVING to filter groups', 'Round avg_salary to 2 decimal places', 'Alias as avg_salary'],
    hints: [
      { level: 1, text: 'HAVING filters groups after aggregation, WHERE filters rows before.' },
      { level: 2, text: 'ROUND(value, decimal_places) rounds numbers.' },
      { level: 3, text: 'GROUP BY department, then HAVING AVG(salary) > 70000' },
      { level: 4, text: 'SELECT department, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 70000 ORDER BY avg_salary DESC;' },
    ],
    solution: 'SELECT department, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 70000 ORDER BY avg_salary DESC;',
    explanation: 'HAVING is the GROUP BY equivalent of WHERE — it filters after aggregation. WHERE happens before grouping. ROUND(value, 2) limits decimal places. The key insight: you CANNOT use WHERE with aggregated values; use HAVING.',
    testCases: [
      { id: 'tc-1', expectedOutput: 'Engineering: 85000.00', isHidden: false },
      { id: 'tc-2', expectedOutput: '1 row only', isHidden: true },
      { id: 'tc-3', expectedOutput: 'avg_salary rounded to 2 decimals', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'hire_date', type: 'DATE' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['Amazon', 'TCS', 'Infosys', 'Microsoft'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Very frequently referenced. HAVING vs WHERE is a classic interview question.',
    tags: ['HAVING', 'GROUP BY', 'AVG', 'ROUND', 'Aggregation'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Data Engineer'],
    points: 120,
    referenceSolution: 'SELECT department, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department HAVING AVG(salary) > 70000 ORDER BY avg_salary DESC;',
  },
  {
    id: 'sql-007',
    number: 7,
    title: 'Employee and Manager JOIN',
    slug: 'employee-manager-join',
    type: 'sql',
    category: 'dbms',
    topic: 'Joins',
    subtopic: 'INNER JOIN',
    difficulty: 'Medium',
    description: `The \`employees\` table has a \`manager_id\` column referencing another employee.\n\nWrite a SQL query to show each employee's name and their **manager's name**.\n\nReturn: \`employee_name\`, \`manager_name\`\nExclude employees without a manager.`,
    examples: [
      { output: 'Alice → Carol (manager)', explanation: 'Self-join matches employee rows to their manager rows.' }
    ],
    constraints: ['Use a self-join', 'Only include employees who have a manager', 'Alias columns clearly'],
    hints: [
      { level: 1, text: 'A self-join joins a table to itself — useful for hierarchical data.' },
      { level: 2, text: 'Use two aliases: e for employee, m for manager.' },
      { level: 3, text: 'Join condition: e.manager_id = m.id' },
      { level: 4, text: 'SELECT e.name AS employee_name, m.name AS manager_name FROM employees e INNER JOIN employees m ON e.manager_id = m.id;' },
    ],
    solution: 'SELECT e.name AS employee_name, m.name AS manager_name FROM employees e INNER JOIN employees m ON e.manager_id = m.id;',
    explanation: 'A self-join treats the same table as two separate entities by using aliases. e represents the employee, m represents the manager. INNER JOIN ensures we only get employees who have a manager (manager_id IS NOT NULL with a matching row).',
    testCases: [
      { id: 'tc-1', expectedOutput: 'employee_name and manager_name columns', isHidden: false },
      { id: 'tc-2', expectedOutput: 'Correct manager matched', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
          { name: 'manager_id', type: 'INTEGER', constraints: 'REFERENCES employees(id)' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, manager_id: 3 },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, manager_id: null },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, manager_id: null },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, manager_id: 3 },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, manager_id: 3 },
        ],
      }],
    },
    companies: ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Self-join is a very frequently asked SQL pattern in technical interviews.',
    tags: ['INNER JOIN', 'Self Join', 'Hierarchical', 'Alias'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Software Engineer'],
    points: 150,
    referenceSolution: 'SELECT e.name AS employee_name, m.name AS manager_name FROM employees e INNER JOIN employees m ON e.manager_id = m.id;',
  },
  {
    id: 'sql-008',
    number: 8,
    title: 'Rank Employees by Salary',
    slug: 'rank-employees-by-salary',
    type: 'sql',
    category: 'dbms',
    topic: 'Window Functions',
    subtopic: 'RANK',
    difficulty: 'Hard',
    description: `Write a SQL query to rank employees by salary within their department.\n\nUse the **RANK()** window function.\n\nReturn: \`name\`, \`department\`, \`salary\`, \`salary_rank\`\nOrder by department, then salary_rank.`,
    examples: [
      { output: 'Carol White, Engineering, 92000, rank 1', explanation: 'RANK() assigns 1 to highest salary within each department.' }
    ],
    constraints: ['Rank within each department separately (PARTITION BY)', 'RANK by salary descending (highest = rank 1)', 'Use RANK() not DENSE_RANK()'],
    hints: [
      { level: 1, text: 'Window functions operate on a "window" of rows without collapsing them like GROUP BY.' },
      { level: 2, text: 'RANK() OVER (PARTITION BY col ORDER BY col DESC)' },
      { level: 3, text: 'PARTITION BY department means ranking restarts for each department.' },
      { level: 4, text: 'SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank FROM employees ORDER BY department, salary_rank;' },
    ],
    solution: 'SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank FROM employees ORDER BY department, salary_rank;',
    explanation: 'RANK() is a window function that assigns ranks without collapsing rows. PARTITION BY department restarts ranking for each department. ORDER BY salary DESC makes rank 1 = highest. RANK() skips numbers on ties (1,2,2,4), unlike DENSE_RANK() (1,2,2,3). Window functions are increasingly tested in backend/data interviews.',
    testCases: [
      { id: 'tc-1', expectedOutput: 'Carol White rank 1 in Engineering', isHidden: false },
      { id: 'tc-2', expectedOutput: 'Ranks restart per department', isHidden: true },
      { id: 'tc-3', expectedOutput: 'Ordered by department then rank', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'employees',
        columns: [
          { name: 'id', type: 'INTEGER' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'department', type: 'VARCHAR(50)' },
          { name: 'salary', type: 'DECIMAL(10,2)' },
        ],
        sampleData: [
          { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 85000, hire_date: '2021-03-15' },
          { id: 2, name: 'Bob Smith', department: 'Marketing', salary: 62000, hire_date: '2020-07-01' },
          { id: 3, name: 'Carol White', department: 'Engineering', salary: 92000, hire_date: '2019-11-20' },
          { id: 4, name: 'David Brown', department: 'HR', salary: 55000, hire_date: '2022-01-10' },
          { id: 5, name: 'Eve Davis', department: 'Engineering', salary: 78000, hire_date: '2021-09-05' },
        ],
      }],
    },
    companies: ['Amazon', 'Microsoft', 'Google', 'Adobe', 'Flipkart'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Window functions are very frequently asked in data/backend interviews at top companies.',
    tags: ['RANK', 'Window Functions', 'PARTITION BY', 'ORDER BY'],
    roleRelevance: ['Backend Developer', 'Data Engineer', 'Data Analyst', 'Software Engineer'],
    points: 200,
    referenceSolution: 'SELECT name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank FROM employees ORDER BY department, salary_rank;',
  },
  {
    id: 'sql-009',
    number: 9,
    title: 'Find Duplicate Emails',
    slug: 'find-duplicate-emails',
    type: 'sql',
    category: 'dbms',
    topic: 'Aggregation',
    subtopic: 'GROUP BY + HAVING',
    difficulty: 'Easy',
    description: `Given a \`users\` table, write a SQL query to find all **email addresses that appear more than once** (duplicates).\n\nReturn: \`email\`, \`count\`\nOrder by count descending.`,
    examples: [
      { input: 'alice@ex.com appears twice', output: 'alice@ex.com, 2', explanation: 'Duplicate emails appear more than once in the table.' }
    ],
    constraints: ['Return only emails with count > 1', 'Include the count', 'Order by count descending'],
    hints: [
      { level: 1, text: 'Group by email to count occurrences.' },
      { level: 2, text: 'Use HAVING COUNT(*) > 1 to filter groups with duplicates.' },
      { level: 3, text: 'SELECT email, COUNT(*) AS count FROM users GROUP BY email HAVING COUNT(*) > 1' },
      { level: 4, text: 'SELECT email, COUNT(*) AS count FROM users GROUP BY email HAVING COUNT(*) > 1 ORDER BY count DESC;' },
    ],
    solution: 'SELECT email, COUNT(*) AS count FROM users GROUP BY email HAVING COUNT(*) > 1 ORDER BY count DESC;',
    explanation: 'This is a classic deduplication query. GROUP BY email groups all rows per unique email. COUNT(*) > 1 in HAVING ensures we only see duplicates. Very commonly used in data cleaning and ETL pipelines.',
    testCases: [
      { id: 'tc-1', expectedOutput: 'Only duplicate emails', isHidden: false },
      { id: 'tc-2', expectedOutput: 'Ordered by count descending', isHidden: true },
    ],
    schema: {
      tables: [{
        name: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
          { name: 'name', type: 'VARCHAR(100)' },
          { name: 'email', type: 'VARCHAR(150)' },
        ],
        sampleData: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
          { id: 3, name: 'Alice Duplicate', email: 'alice@example.com' },
          { id: 4, name: 'Carol', email: 'carol@example.com' },
          { id: 5, name: 'Bob2', email: 'bob@example.com' },
          { id: 6, name: 'Bob3', email: 'bob@example.com' },
        ],
      }],
    },
    companies: ['LeetCode classic', 'Amazon', 'Microsoft', 'TCS', 'Infosys'],
    frequencyLevel: 'very-high',
    frequencyNote: 'One of the most frequently asked SQL interview questions across all companies.',
    tags: ['GROUP BY', 'HAVING', 'COUNT', 'Duplicates', 'Classic'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Data Engineer'],
    points: 100,
    referenceSolution: 'SELECT email, COUNT(*) AS count FROM users GROUP BY email HAVING COUNT(*) > 1 ORDER BY count DESC;',
  },
  {
    id: 'sql-010',
    number: 10,
    title: 'Orders with Customer Names (LEFT JOIN)',
    slug: 'orders-with-customer-names',
    type: 'sql',
    category: 'dbms',
    topic: 'Joins',
    subtopic: 'LEFT JOIN',
    difficulty: 'Medium',
    description: `You have two tables: \`customers\` and \`orders\`.\n\nWrite a SQL query to show all customers and their order total (if any orders exist).\n\nReturn: \`customer_name\`, \`total_orders\`, \`total_amount\`\nCustomers with no orders should show 0 for both totals.\nOrder by total_amount descending.`,
    examples: [
      { output: 'Alice: 2 orders, $350 | Carol: 0 orders, $0', explanation: 'LEFT JOIN keeps all customers even if they have no orders.' }
    ],
    constraints: ['Use LEFT JOIN', 'Use COALESCE to convert NULL totals to 0', 'Alias columns appropriately'],
    hints: [
      { level: 1, text: 'LEFT JOIN returns all rows from the left (customers) table, even without a match.' },
      { level: 2, text: 'COALESCE(value, 0) replaces NULL with 0.' },
      { level: 3, text: 'COUNT(orders.id) gives 0 for customers with no orders when combined with GROUP BY.' },
      { level: 4, text: 'SELECT c.name AS customer_name, COUNT(o.id) AS total_orders, COALESCE(SUM(o.amount), 0) AS total_amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_amount DESC;' },
    ],
    solution: 'SELECT c.name AS customer_name, COUNT(o.id) AS total_orders, COALESCE(SUM(o.amount), 0) AS total_amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_amount DESC;',
    explanation: 'LEFT JOIN is the workhorse of SQL — keeps all left table rows. COALESCE handles NULL from SUM when no orders exist. Grouping by both c.id AND c.name ensures uniqueness. This pattern is extremely common in e-commerce and reporting queries.',
    testCases: [
      { id: 'tc-1', expectedOutput: 'All customers shown including zero-order ones', isHidden: false },
      { id: 'tc-2', expectedOutput: 'NULL replaced with 0', isHidden: true },
      { id: 'tc-3', expectedOutput: 'Ordered by total_amount descending', isHidden: true },
    ],
    schema: {
      tables: [
        {
          name: 'customers',
          columns: [
            { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
            { name: 'name', type: 'VARCHAR(100)' },
            { name: 'email', type: 'VARCHAR(150)' },
          ],
          sampleData: [
            { id: 1, name: 'Alice', email: 'alice@ex.com' },
            { id: 2, name: 'Bob', email: 'bob@ex.com' },
            { id: 3, name: 'Carol', email: 'carol@ex.com' },
          ],
        },
        {
          name: 'orders',
          columns: [
            { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY' },
            { name: 'customer_id', type: 'INTEGER', constraints: 'REFERENCES customers(id)' },
            { name: 'amount', type: 'DECIMAL(10,2)' },
            { name: 'order_date', type: 'DATE' },
          ],
          sampleData: [
            { id: 1, customer_id: 1, amount: 150, order_date: '2024-01-05' },
            { id: 2, customer_id: 1, amount: 200, order_date: '2024-02-10' },
            { id: 3, customer_id: 2, amount: 75, order_date: '2024-01-20' },
          ],
        },
      ],
    },
    companies: ['Amazon', 'Flipkart', 'TCS', 'Infosys', 'Razorpay'],
    frequencyLevel: 'very-high',
    frequencyNote: 'LEFT JOIN with NULL handling is a top-3 most asked SQL interview topic.',
    tags: ['LEFT JOIN', 'COALESCE', 'GROUP BY', 'SUM', 'COUNT', 'Multi-table'],
    roleRelevance: ['Backend Developer', 'Data Analyst', 'Full Stack Developer'],
    points: 150,
    referenceSolution: 'SELECT c.name AS customer_name, COUNT(o.id) AS total_orders, COALESCE(SUM(o.amount), 0) AS total_amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name ORDER BY total_amount DESC;',
  },
];

// ─────────────────────────────────────────────────────
// DSA PROBLEMS
// ─────────────────────────────────────────────────────

export const dsaProblems: Question[] = [
  {
    id: 'dsa-001',
    number: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    type: 'coding',
    category: 'dsa',
    topic: 'Arrays',
    subtopic: 'Hashing',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.\n\nYou may assume exactly one solution exists, and you may not use the same element twice.\n\nReturn the answer in any order.`,
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10^4', '-10^9 ≤ nums[i] ≤ 10^9', '-10^9 ≤ target ≤ 10^9', 'Exactly one valid answer'],
    hints: [
      { level: 1, text: 'Brute force: check every pair — O(n²). Can you do better?' },
      { level: 2, text: 'Use a HashMap to store each number\'s index as you iterate.' },
      { level: 3, text: 'For each number, check if (target - number) is already in the map.' },
      { level: 4, text: 'HashMap approach: for each nums[i], check if map.contains(target - nums[i]). If yes, return [map.get(target - nums[i]), i]. Else, put nums[i] → i in map.' },
    ],
    solution: `// Java - O(n) time, O(n) space
import java.util.HashMap;
public int[] twoSum(int[] nums, int target) {
    HashMap<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }
        map.put(nums[i], i);
    }
    return new int[]{};
}`,
    explanation: 'The HashMap approach trades space for time. For each element, we check if its complement (target - element) was already seen. If yes, we found the pair. If no, we store the current element\'s index for future lookups. O(n) time, O(n) space.',
    expectedComplexity: 'Time: O(n) | Space: O(n)',
    starterCode: {
      c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your C code here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    return result;
}`,
      java: `import java.util.*;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        
    }
};`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false, description: 'Basic case' },
      { id: 'tc-2', input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false, description: 'Adjacent elements' },
      { id: 'tc-3', input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true, description: 'Duplicate values' },
      { id: 'tc-4', input: '[1,2,3,4,5]\n9', expectedOutput: '[3,4]', isHidden: true, description: 'Larger array' },
    ],
    companies: ['Amazon', 'Google', 'Microsoft', 'TCS', 'Infosys', 'Adobe'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Most frequently asked coding interview problem. Referenced across all major coding platforms and company interview reports.',
    tags: ['Array', 'HashMap', 'Two Pass', 'Classic', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'Full Stack Developer', 'SDE'],
    points: 100,
  },
  {
    id: 'dsa-002',
    number: 2,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    type: 'coding',
    category: 'dsa',
    topic: 'Stack',
    subtopic: 'Stack',
    difficulty: 'Easy',
    description: `Given a string \`s\` containing only the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, and \`]\`, determine if the input string is **valid**.\n\nAn input string is valid if:\n1. Open brackets are closed by the same type of brackets.\n2. Open brackets are closed in the correct order.\n3. Every close bracket has a corresponding open bracket.`,
    examples: [
      { input: 's = "()"', output: 'true', explanation: 'Single pair, correctly closed.' },
      { input: 's = "()[]{}"', output: 'true', explanation: 'Three pairs, all correctly closed in order.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatched bracket type.' },
    ],
    constraints: ['1 ≤ s.length ≤ 10^4', 's consists of parentheses characters only'],
    hints: [
      { level: 1, text: 'Use a stack data structure — LIFO property matches bracket nesting.' },
      { level: 2, text: 'Push opening brackets. Pop and check when you see a closing bracket.' },
      { level: 3, text: 'Use a map: ) → (, } → {, ] → [. If stack top doesn\'t match, invalid.' },
      { level: 4, text: 'Stack-based: for \'(\', \'{\', \'[\' push. For \')\', \'}\', \']\' check stack not empty and top matches, else false. At end, stack should be empty.' },
    ],
    solution: `// Java - O(n) time, O(n) space
import java.util.*;
public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return stack.isEmpty();
}`,
    explanation: 'Stack-based approach: push opening brackets, pop for closing brackets. If closing bracket doesn\'t match top of stack, invalid. At end, stack must be empty. Classic stack application.',
    expectedComplexity: 'Time: O(n) | Space: O(n)',
    starterCode: {
      c: `#include <stdbool.h>
#include <string.h>

bool isValid(char* s) {
    // Your C code here
    
    return true;
}`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Your code here
        
    }
};`,
      javascript: `var isValid = function(s) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '()', expectedOutput: 'true', isHidden: false },
      { id: 'tc-2', input: '()[]{}"', expectedOutput: 'true', isHidden: false },
      { id: 'tc-3', input: '(]', expectedOutput: 'false', isHidden: false },
      { id: 'tc-4', input: ']', expectedOutput: 'false', isHidden: true },
      { id: 'tc-5', input: '((', expectedOutput: 'false', isHidden: true },
    ],
    companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'TCS', 'Infosys'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Very frequently asked stack question across all major companies.',
    tags: ['Stack', 'String', 'Classic', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 100,
  },
  {
    id: 'dsa-003',
    number: 3,
    title: 'Maximum Subarray (Kadane\'s Algorithm)',
    slug: 'maximum-subarray',
    type: 'coding',
    category: 'dsa',
    topic: 'Arrays',
    subtopic: 'Dynamic Programming / Kadane\'s',
    difficulty: 'Medium',
    description: `Given an integer array \`nums\`, find the subarray with the **largest sum** and return that sum.\n\nA subarray is a contiguous part of an array.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1', explanation: 'Single element.' },
      { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: 'Entire array sums to 23.' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10^5', '-10^4 ≤ nums[i] ≤ 10^4'],
    hints: [
      { level: 1, text: 'Brute force is O(n²) or O(n³). Think greedy.' },
      { level: 2, text: 'Kadane\'s insight: if running sum goes negative, restart from current element.' },
      { level: 3, text: 'Track currentSum and maxSum. At each element: currentSum = max(nums[i], currentSum + nums[i])' },
      { level: 4, text: 'int maxSum = nums[0], currentSum = nums[0]; for i=1 to n-1: currentSum = Math.max(nums[i], currentSum + nums[i]); maxSum = Math.max(maxSum, currentSum);' },
    ],
    solution: `// Java - O(n) time, O(1) space
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}`,
    explanation: 'Kadane\'s Algorithm: at each position, decide whether to extend the existing subarray or start fresh. If currentSum + nums[i] < nums[i], starting fresh is better. This is essentially dynamic programming where we only need the previous state.',
    expectedComplexity: 'Time: O(n) | Space: O(1)',
    starterCode: {
      c: `int maxSubArray(int* nums, int numsSize) {
    // Your C code here
    
    return 0;
}`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
        
    }
};`,
      javascript: `var maxSubArray = function(nums) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
      { id: 'tc-2', input: '[1]', expectedOutput: '1', isHidden: false },
      { id: 'tc-3', input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: false },
      { id: 'tc-4', input: '[-1,-2,-3,-4]', expectedOutput: '-1', isHidden: true, description: 'All negatives — return max single element' },
    ],
    companies: ['Amazon', 'Microsoft', 'Google', 'Infosys', 'TCS', 'PhonePe'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Kadane\'s algorithm is a must-know. Frequently asked across all company levels.',
    tags: ['Array', 'Kadane', 'Dynamic Programming', 'Greedy', 'Classic'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 150,
  },
  {
    id: 'dsa-004',
    number: 4,
    title: 'Reverse a Linked List',
    slug: 'reverse-linked-list',
    type: 'coding',
    category: 'dsa',
    topic: 'Linked Lists',
    subtopic: 'Reversal',
    difficulty: 'Easy',
    description: `Given the head of a singly linked list, **reverse the list**, and return the reversed list.\n\nYou should reverse in-place, not create a new list.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'List reversed in place.' },
      { input: 'head = [1,2]', output: '[2,1]' },
      { input: 'head = []', output: '[]', explanation: 'Empty list remains empty.' },
    ],
    constraints: ['0 ≤ Number of nodes ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
    hints: [
      { level: 1, text: 'Think about what 3 pointers you need: prev, curr, next.' },
      { level: 2, text: 'Iterative approach: maintain prev=null, curr=head, traverse and reverse each pointer.' },
      { level: 3, text: 'At each step: save next = curr.next, point curr.next = prev, move prev = curr, curr = next.' },
      { level: 4, text: 'ListNode prev = null; ListNode curr = head; while(curr != null) { ListNode next = curr.next; curr.next = prev; prev = curr; curr = next; } return prev;' },
    ],
    solution: `// Java - O(n) time, O(1) space
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
    explanation: 'Three-pointer iterative reversal. prev tracks the new "previous" node, curr is current, next saves the original next before we overwrite it. At the end, prev points to the new head.',
    expectedComplexity: 'Time: O(n) | Space: O(1)',
    starterCode: {
      java: `// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}
class Solution {
    public ListNode reverseList(ListNode head) {
        // Your code here
        
    }
}`,
      python: `# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head):
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Your code here
        
    }
};`,
      javascript: `var reverseList = function(head) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
      { id: 'tc-2', input: '[1,2]', expectedOutput: '[2,1]', isHidden: false },
      { id: 'tc-3', input: '[]', expectedOutput: '[]', isHidden: true },
      { id: 'tc-4', input: '[1]', expectedOutput: '[1]', isHidden: true },
    ],
    companies: ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys', 'Zoho'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Reverse linked list is a fundamental must-know. Appears across all interview levels.',
    tags: ['Linked List', 'Two Pointer', 'In-place', 'Classic', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 100,
  },
  {
    id: 'dsa-005',
    number: 5,
    title: 'Binary Search',
    slug: 'binary-search',
    type: 'coding',
    category: 'dsa',
    topic: 'Binary Search',
    subtopic: 'Classic Binary Search',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` sorted in **ascending order**, and an integer \`target\`, return the **index** of target. If target doesn't exist, return \`-1\`.\n\nYou must write an algorithm with **O(log n)** runtime.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: 'nums[4] = 9.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 is not in nums.' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10^4', '-10^4 ≤ nums[i], target ≤ 10^4', 'All values in nums are unique', 'nums is sorted in ascending order'],
    hints: [
      { level: 1, text: 'Binary search halves the search space at each step — O(log n).' },
      { level: 2, text: 'Maintain left and right pointers. Calculate mid = (left + right) / 2.' },
      { level: 3, text: 'If nums[mid] == target, return mid. If target < nums[mid], search left half. Else search right half.' },
      { level: 4, text: 'int left=0, right=n-1; while(left<=right) { int mid=left+(right-left)/2; if(nums[mid]==target) return mid; else if(nums[mid]<target) left=mid+1; else right=mid-1; }' },
    ],
    solution: `// Java - O(log n) time, O(1) space
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2; // Avoid overflow
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    explanation: 'Classic binary search. Note: use left + (right - left) / 2 instead of (left + right) / 2 to avoid integer overflow. The loop invariant: if target exists, it\'s in [left, right]. When left > right, target not found.',
    expectedComplexity: 'Time: O(log n) | Space: O(1)',
    starterCode: {
      java: `class Solution {
    public int search(int[] nums, int target) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Your code here
        
    }
};`,
      javascript: `var search = function(nums, target) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', isHidden: false },
      { id: 'tc-2', input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', isHidden: false },
      { id: 'tc-3', input: '[5]\n5', expectedOutput: '0', isHidden: true },
      { id: 'tc-4', input: '[5]\n-5', expectedOutput: '-1', isHidden: true },
    ],
    companies: ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'FAANG'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Binary search is a fundamental algorithm. Appears in almost every coding interview.',
    tags: ['Binary Search', 'Array', 'Classic', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 100,
  },
  {
    id: 'dsa-006',
    number: 6,
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    type: 'coding',
    category: 'dsa',
    topic: 'Dynamic Programming',
    subtopic: 'DP - 1D',
    difficulty: 'Easy',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.\n\nEach time you can either climb **1 or 2 steps**.\n\nIn how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2 — two ways.' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1 — three ways.' },
    ],
    constraints: ['1 ≤ n ≤ 45'],
    hints: [
      { level: 1, text: 'Think about the last step: you either came from step n-1 (taking 1 step) or n-2 (taking 2 steps).' },
      { level: 2, text: 'This is Fibonacci! ways(n) = ways(n-1) + ways(n-2).' },
      { level: 3, text: 'Base cases: ways(1) = 1, ways(2) = 2.' },
      { level: 4, text: 'int a=1, b=2; for(i from 3 to n) { int c=a+b; a=b; b=c; } return n==1?a:b;' },
    ],
    solution: `// Java - O(n) time, O(1) space
public int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) {
        int c = a + b;
        a = b;
        b = c;
    }
    return b;
}`,
    explanation: 'Classic DP problem isomorphic to Fibonacci. The number of ways to reach step n equals ways(n-1) + ways(n-2) because you can arrive from step n-1 (1 step) or n-2 (2 steps). Space-optimized to O(1) by only keeping last two values.',
    expectedComplexity: 'Time: O(n) | Space: O(1)',
    starterCode: {
      java: `class Solution {
    public int climbStairs(int n) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    int climbStairs(int n) {
        // Your code here
        
    }
};`,
      javascript: `var climbStairs = function(n) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '2', expectedOutput: '2', isHidden: false },
      { id: 'tc-2', input: '3', expectedOutput: '3', isHidden: false },
      { id: 'tc-3', input: '1', expectedOutput: '1', isHidden: true },
      { id: 'tc-4', input: '10', expectedOutput: '89', isHidden: true },
    ],
    companies: ['Amazon', 'Microsoft', 'Google', 'TCS', 'Zoho', 'Infosys'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Introduction to dynamic programming. One of the most frequently asked beginner DP problems.',
    tags: ['Dynamic Programming', 'Fibonacci', 'Classic', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 100,
  },
  {
    id: 'dsa-007',
    number: 7,
    title: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    type: 'coding',
    category: 'dsa',
    topic: 'Strings',
    subtopic: 'String Matching',
    difficulty: 'Easy',
    description: `Write a function to find the **longest common prefix** string amongst an array of strings.\n\nIf there is no common prefix, return an empty string \`""\`.`,
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"', explanation: '"fl" is the longest common prefix.' },
      { input: 'strs = ["dog","racecar","car"]', output: '""', explanation: 'No common prefix.' },
    ],
    constraints: ['1 ≤ strs.length ≤ 200', '0 ≤ strs[i].length ≤ 200', 'strs[i] consists of only lowercase English letters'],
    hints: [
      { level: 1, text: 'Use the first string as the reference prefix.' },
      { level: 2, text: 'For each subsequent string, trim the prefix until it matches the start.' },
      { level: 3, text: 'Or: scan character by character across all strings simultaneously.' },
      { level: 4, text: 'String prefix = strs[0]; for each str: while(!str.startsWith(prefix)) prefix = prefix.substring(0, prefix.length()-1);' },
    ],
    solution: `// Java - O(S) where S = total characters
public String longestCommonPrefix(String[] strs) {
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (!strs[i].startsWith(prefix)) {
            prefix = prefix.substring(0, prefix.length() - 1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}`,
    explanation: 'Horizontal scan: start with strs[0] as prefix, compare against each string, shrink prefix until it matches. Efficient and clean approach. Alternative: vertical scan (character by character).',
    expectedComplexity: 'Time: O(S) | Space: O(1)',
    starterCode: {
      java: `class Solution {
    public String longestCommonPrefix(String[] strs) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def longestCommonPrefix(self, strs: List[str]) -> str:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        // Your code here
        
    }
};`,
      javascript: `var longestCommonPrefix = function(strs) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '["flower","flow","flight"]', expectedOutput: '"fl"', isHidden: false },
      { id: 'tc-2', input: '["dog","racecar","car"]', expectedOutput: '""', isHidden: false },
      { id: 'tc-3', input: '["a"]', expectedOutput: '"a"', isHidden: true },
      { id: 'tc-4', input: '["","b"]', expectedOutput: '""', isHidden: true },
    ],
    companies: ['Amazon', 'Google', 'TCS', 'Infosys', 'Wipro'],
    frequencyLevel: 'high',
    frequencyNote: 'Frequently referenced in string manipulation interview sections.',
    tags: ['String', 'Prefix', 'Classic'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 100,
  },
  {
    id: 'dsa-008',
    number: 8,
    title: 'Number of Islands',
    slug: 'number-of-islands',
    type: 'coding',
    category: 'dsa',
    topic: 'Graphs',
    subtopic: 'BFS/DFS',
    difficulty: 'Medium',
    description: `Given an \`m x n\` 2D binary grid where \`'1'\` represents land and \`'0'\` represents water, return the **number of islands**.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.`,
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1', explanation: 'One connected island.' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3', explanation: 'Three separate islands.' },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 ≤ m, n ≤ 300', 'grid[i][j] is "0" or "1"'],
    hints: [
      { level: 1, text: 'Use DFS or BFS to traverse connected land cells.' },
      { level: 2, text: 'Mark visited land cells to avoid double-counting.' },
      { level: 3, text: 'For each unvisited land cell, increment island count and DFS to mark all connected cells.' },
      { level: 4, text: 'Iterate grid: if grid[r][c]==\'1\': count++, DFS(r,c) to mark connected cells as visited (grid[r][c]=\'0\').' },
    ],
    solution: `// Java - DFS approach O(m*n) time, O(m*n) space
public int numIslands(char[][] grid) {
    int count = 0;
    for (int r = 0; r < grid.length; r++) {
        for (int c = 0; c < grid[0].length; c++) {
            if (grid[r][c] == '1') {
                count++;
                dfs(grid, r, c);
            }
        }
    }
    return count;
}
private void dfs(char[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0'; // Mark visited
    dfs(grid, r+1, c);
    dfs(grid, r-1, c);
    dfs(grid, r, c+1);
    dfs(grid, r, c-1);
}`,
    explanation: 'Classic BFS/DFS flood fill. Each time we find an unvisited \'1\', we have a new island. DFS marks all connected land as visited. The pattern: iterate, trigger BFS/DFS on unvisited nodes, count triggers.',
    expectedComplexity: 'Time: O(m×n) | Space: O(m×n)',
    starterCode: {
      java: `class Solution {
    public int numIslands(char[][] grid) {
        // Your code here
        
    }
}`,
      python: `class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        # Your code here
        pass`,
      cpp: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // Your code here
        
    }
};`,
      javascript: `var numIslands = function(grid) {
    // Your code here
    
};`,
    },
    testCases: [
      { id: 'tc-1', input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1', isHidden: false },
      { id: 'tc-2', input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3', isHidden: false },
      { id: 'tc-3', input: '[["0"]]', expectedOutput: '0', isHidden: true },
      { id: 'tc-4', input: '[["1"]]', expectedOutput: '1', isHidden: true },
    ],
    companies: ['Amazon', 'Google', 'Microsoft', 'Flipkart', 'Adobe'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Graph BFS/DFS is heavily tested. Number of Islands is the most common graph problem in interviews.',
    tags: ['Graph', 'DFS', 'BFS', 'Flood Fill', 'Matrix', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE'],
    points: 150,
  },
];

// ─────────────────────────────────────────────────────
// CONCEPTUAL QUESTIONS (OS, CN, OOP, Java)
// ─────────────────────────────────────────────────────

export const conceptualQuestions: Question[] = [
  {
    id: 'java-001',
    number: 1,
    title: 'Explain HashMap Internal Working',
    slug: 'hashmap-internal-working',
    type: 'conceptual',
    category: 'java',
    topic: 'Java Collections',
    subtopic: 'HashMap',
    difficulty: 'Medium',
    description: `Explain the **internal working of HashMap** in Java.\n\nCover:\n- How keys are stored\n- How put() and get() work\n- What happens during hash collision\n- What is the load factor\n- When does rehashing happen`,
    examples: [],
    hints: [
      { level: 1, text: 'HashMap uses an array of buckets (nodes/linked lists).' },
      { level: 2, text: 'Hash function converts key to bucket index. Collisions handled by chaining (linked list / treeified).' },
      { level: 3, text: 'Load factor = 0.75 by default. Rehashing doubles capacity when threshold exceeded.' },
      { level: 4, text: 'Java 8+ converts bucket linked list to Red-Black Tree when bucket size >= 8 (treeification).' },
    ],
    solution: `HashMap stores data in an array of Node<K,V> buckets.

PUT operation:
1. hash(key) → index = hash & (capacity-1)
2. If bucket empty, insert new node
3. If collision: compare keys (equals()), update if same key, else add to chain

GET operation:
1. Compute hash → bucket index
2. Traverse linked list in bucket using equals()
3. Return value if found, null otherwise

Collision handling (Java 8+):
- Linked list (chaining) when bucket size < 8
- Treeified to Red-Black Tree when bucket size >= 8
- TREEIFY_THRESHOLD = 8, UNTREEIFY_THRESHOLD = 6

Load factor = 0.75 (75% full triggers resize)
Rehashing: new capacity = 2x, all keys re-hashed

Key rule: If you override equals(), you MUST override hashCode().`,
    explanation: 'HashMap is backed by an array. Hash collisions are handled via separate chaining. Java 8 optimized performance by converting long chains to Red-Black Trees.',
    testCases: [],
    companies: ['Amazon', 'Google', 'Microsoft', 'TCS', 'Infosys', 'Zoho'],
    frequencyLevel: 'very-high',
    frequencyNote: 'One of the most frequently asked Java interview questions at all levels.',
    tags: ['HashMap', 'Collections', 'Java 8', 'Hashing', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Java Developer', 'Software Engineer', 'SDE'],
    points: 150,
  },
  {
    id: 'os-001',
    number: 1,
    title: 'Explain Deadlock and Its Conditions',
    slug: 'deadlock-conditions',
    type: 'conceptual',
    category: 'os',
    topic: 'Operating Systems',
    subtopic: 'Deadlock',
    difficulty: 'Medium',
    description: `Explain **deadlock** in operating systems.\n\nCover:\n- What is deadlock?\n- The 4 necessary conditions (Coffman conditions)\n- How to prevent, avoid, or detect deadlock\n- Real-world example`,
    examples: [],
    hints: [
      { level: 1, text: 'Deadlock = processes permanently blocked, each waiting for resources held by others.' },
      { level: 2, text: 'Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.' },
      { level: 3, text: 'Prevention: break at least one condition. Avoidance: Banker\'s Algorithm.' },
      { level: 4, text: 'Classic example: Process A holds resource R1 and waits for R2. Process B holds R2 and waits for R1.' },
    ],
    solution: `DEADLOCK: A condition where processes are permanently blocked, each waiting for a resource held by another.

4 NECESSARY CONDITIONS (Coffman Conditions):
1. Mutual Exclusion: Resources are non-shareable (one process at a time)
2. Hold and Wait: Process holding a resource can request more
3. No Preemption: Resources can't be forcibly taken
4. Circular Wait: Circular chain of processes, each waiting for next

PREVENTION (break one condition):
- Remove Mutual Exclusion → allow sharing (not always possible)
- No Hold and Wait → require all resources upfront
- Allow Preemption → OS can preempt resources
- No Circular Wait → impose ordering on resource requests

AVOIDANCE:
- Banker's Algorithm: grant only if system remains in safe state

DETECTION & RECOVERY:
- Resource allocation graph
- Kill processes or rollback

REAL EXAMPLE:
Thread 1: lock(A) → try to lock(B)
Thread 2: lock(B) → try to lock(A)
→ Deadlock! (common in database transactions)`,
    explanation: 'Deadlock occurs when 4 conditions are simultaneously satisfied. Prevention breaks conditions at design time. Avoidance uses runtime algorithms like Banker\'s.',
    testCases: [],
    companies: ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Deadlock is the single most asked OS topic in technical interviews.',
    tags: ['Deadlock', 'OS', 'Coffman Conditions', 'Must Know'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'SDE', 'Systems Developer'],
    points: 150,
  },
  {
    id: 'cn-001',
    number: 1,
    title: 'OSI Model — 7 Layers',
    slug: 'osi-model-layers',
    type: 'conceptual',
    category: 'cn',
    topic: 'Computer Networks',
    subtopic: 'OSI Model',
    difficulty: 'Easy',
    description: `Explain the **OSI (Open Systems Interconnection) model**.\n\nFor each of the 7 layers, explain:\n- Layer number and name\n- What it does\n- Example protocols/technologies`,
    examples: [],
    hints: [
      { level: 1, text: 'Mnemonic: "Please Do Not Throw Sausage Pizza Away" (Physical, Data Link, Network, Transport, Session, Presentation, Application).' },
      { level: 2, text: 'Layers 1-3 are network-focused; Layers 5-7 are application-focused; Layer 4 (Transport) bridges them.' },
      { level: 3, text: 'HTTP is Application layer. TCP/UDP is Transport. IP is Network. Ethernet is Data Link.' },
      { level: 4, text: 'In practice, TCP/IP model collapses OSI into 4 layers: Network Access, Internet, Transport, Application.' },
    ],
    solution: `OSI MODEL — 7 LAYERS (Bottom to Top):

Layer 1 — PHYSICAL
- Bits transmission over physical medium
- Cables, WiFi, fiber, hubs
- Protocols: IEEE 802.3, IEEE 802.11

Layer 2 — DATA LINK
- Node-to-node data transfer, MAC addressing, error detection
- Ethernet frames, switches, bridges
- Protocols: Ethernet, PPP, ARP (some models)

Layer 3 — NETWORK
- IP addressing, routing between networks
- Routers, IP packets
- Protocols: IP, ICMP, OSPF, BGP

Layer 4 — TRANSPORT
- End-to-end communication, reliability, flow control
- Port numbers
- Protocols: TCP (reliable), UDP (fast, unreliable)

Layer 5 — SESSION
- Session management, establishment, termination
- Authentication
- Protocols: NetBIOS, PPTP

Layer 6 — PRESENTATION
- Data format, encryption, compression
- TLS/SSL, JPEG, ASCII, UTF-8
- Protocols: SSL/TLS, MIME

Layer 7 — APPLICATION
- User-facing network services
- HTTP, FTP, DNS, SMTP, WebSocket
- Protocols: HTTP/HTTPS, DNS, SMTP, SSH, FTP

KEY POINTS:
- Data encapsulation: each layer adds its header
- TCP/IP model: combines Layers 5+6+7 into Application; Layers 1+2 into Network Access
- DNS: Layer 7 (Application)
- TCP: Layer 4 (Transport) — reliable, ordered
- UDP: Layer 4 — unreliable but fast`,
    explanation: 'OSI is a conceptual framework for understanding network communication. TCP/IP is the practical implementation. Understanding layers helps debug network issues.',
    testCases: [],
    companies: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture', 'Amazon'],
    frequencyLevel: 'very-high',
    frequencyNote: 'OSI model is asked in virtually every technical interview for backend/network roles.',
    tags: ['OSI', 'Networking', 'Must Know', 'Classic'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'DevOps Engineer', 'Cloud Engineer'],
    points: 120,
  },
  {
    id: 'oop-001',
    number: 1,
    title: 'SOLID Principles Explained',
    slug: 'solid-principles',
    type: 'conceptual',
    category: 'oop',
    topic: 'OOP & Design',
    subtopic: 'SOLID',
    difficulty: 'Medium',
    description: `Explain the **5 SOLID principles** of object-oriented design.\n\nFor each principle:\n- State the principle\n- Explain what it means\n- Give a real code example of violation and fix`,
    examples: [],
    hints: [
      { level: 1, text: 'S=Single Responsibility, O=Open/Closed, L=Liskov Substitution, I=Interface Segregation, D=Dependency Inversion.' },
      { level: 2, text: 'SRP: One class, one reason to change. OCP: Open for extension, closed for modification.' },
      { level: 3, text: 'LSP: Subclasses should be substitutable for base classes. ISP: Don\'t force clients to implement interfaces they don\'t use.' },
      { level: 4, text: 'DIP: Depend on abstractions, not concretions. High-level modules shouldn\'t depend on low-level ones.' },
    ],
    solution: `S — Single Responsibility Principle (SRP)
"A class should have only one reason to change."
VIOLATION: UserService that handles auth + DB + email
FIX: Split into AuthService, UserRepository, EmailService

O — Open/Closed Principle (OCP)
"Open for extension, closed for modification."
VIOLATION: if/else chains for new shapes in AreaCalculator
FIX: Shape interface with area() method; each shape implements it

L — Liskov Substitution Principle (LSP)
"Subtypes must be substitutable for base types."
VIOLATION: Square extends Rectangle but breaks setWidth/setHeight
FIX: Don't inherit from Rectangle; use a common Shape interface

I — Interface Segregation Principle (ISP)
"Clients shouldn't implement interfaces they don't use."
VIOLATION: Animal interface with fly() — penguins can't fly
FIX: Separate Flyable, Swimmable, Walkable interfaces

D — Dependency Inversion Principle (DIP)
"Depend on abstractions, not concretions."
VIOLATION: OrderService directly uses MySQLDatabase class
FIX: OrderService depends on DatabaseInterface; inject implementation

SOLID leads to:
- Easier testing (inject mocks)
- Easier changes (modify one class without breaking others)
- Better code reuse`,
    explanation: 'SOLID principles guide you to write maintainable, extensible, testable code. They\'re foundational for clean architecture and design patterns.',
    testCases: [],
    companies: ['Amazon', 'Microsoft', 'Google', 'Flipkart', 'Razorpay', 'PhonePe'],
    frequencyLevel: 'very-high',
    frequencyNote: 'SOLID is asked in virtually every senior-level and mid-level technical interview.',
    tags: ['SOLID', 'OOP', 'Design', 'Must Know', 'Architecture'],
    roleRelevance: ['Backend Developer', 'Software Engineer', 'Full Stack Developer', 'SDE'],
    points: 150,
  },
];

// ─────────────────────────────────────────────────────
// APTITUDE QUESTIONS
// ─────────────────────────────────────────────────────

export const aptitudeQuestions: Question[] = [
  {
    id: 'apt-001',
    number: 1,
    title: 'Train Speed Calculation',
    slug: 'train-speed',
    type: 'aptitude',
    category: 'aptitude',
    topic: 'Speed, Distance & Time',
    subtopic: 'Trains',
    difficulty: 'Easy',
    description: `A train 120 m long crosses a platform 180 m long in **20 seconds**.\n\nFind the speed of the train in **km/h**.`,
    examples: [
      { output: '54 km/h', explanation: 'Total distance = 120+180 = 300m. Speed = 300/20 = 15 m/s = 54 km/h.' }
    ],
    hints: [
      { level: 1, text: 'When a train crosses a platform, total distance = length of train + length of platform.' },
      { level: 2, text: 'Speed = Distance / Time' },
      { level: 3, text: 'To convert m/s to km/h: multiply by 18/5' },
      { level: 4, text: 'Distance = 120+180 = 300m. Speed = 300/20 = 15 m/s = 15 × 18/5 = 54 km/h' },
    ],
    solution: 'Total distance = 120 + 180 = 300 m\nTime = 20 s\nSpeed = 300/20 = 15 m/s\nIn km/h: 15 × (18/5) = 54 km/h\n\nAnswer: 54 km/h',
    explanation: 'When a train crosses a platform, it must travel its own length plus the platform length. The conversion factor from m/s to km/h is 18/5 (multiply by 3.6).',
    testCases: [
      { id: 'tc-1', expectedOutput: '54 km/h', isHidden: false },
    ],
    companies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Train problems appear in virtually every campus placement aptitude test.',
    tags: ['Speed', 'Distance', 'Time', 'Trains', 'Aptitude'],
    roleRelevance: ['All Roles — Campus Placement'],
    points: 50,
  },
  {
    id: 'apt-002',
    number: 2,
    title: 'Compound Interest Problem',
    slug: 'compound-interest',
    type: 'aptitude',
    category: 'aptitude',
    topic: 'Interest',
    subtopic: 'Compound Interest',
    difficulty: 'Medium',
    description: `Find the **compound interest** on Rs. 8,000 at 10% per annum for 2 years, compounded annually.`,
    examples: [
      { output: 'Rs. 1,680', explanation: 'CI = P[(1 + r/100)^t - 1] = 8000[(1.1)^2 - 1] = 8000 × 0.21 = 1680' }
    ],
    hints: [
      { level: 1, text: 'Compound Interest formula: CI = P[(1 + r/100)^t - 1]' },
      { level: 2, text: 'P = 8000, r = 10, t = 2' },
      { level: 3, text: '(1.1)^2 = 1.21. Amount = 8000 × 1.21 = 9680' },
      { level: 4, text: 'CI = 9680 - 8000 = 1680' },
    ],
    solution: 'P = 8000, r = 10%, t = 2 years\nAmount = P(1 + r/100)^t = 8000 × (1.1)^2 = 8000 × 1.21 = 9680\nCI = Amount - P = 9680 - 8000 = Rs. 1,680\n\nAnswer: Rs. 1,680',
    explanation: 'Compound interest is calculated on the principal + accumulated interest. Formula: A = P(1 + r/100)^t. CI = A - P.',
    testCases: [
      { id: 'tc-1', expectedOutput: 'Rs. 1680', isHidden: false },
    ],
    companies: ['TCS', 'Infosys', 'Wipro', 'Capgemini'],
    frequencyLevel: 'high',
    frequencyNote: 'Compound interest appears frequently in campus placement aptitude rounds.',
    tags: ['Compound Interest', 'Interest', 'Finance', 'Aptitude'],
    roleRelevance: ['All Roles — Campus Placement'],
    points: 75,
  },
];

// ─────────────────────────────────────────────────────
// HR QUESTIONS
// ─────────────────────────────────────────────────────

export const hrQuestions: Question[] = [
  {
    id: 'hr-001',
    number: 1,
    title: 'Tell Me About Yourself',
    slug: 'tell-me-about-yourself',
    type: 'hr',
    category: 'hr',
    topic: 'HR & Behavioral',
    subtopic: 'Introduction',
    difficulty: 'Easy',
    description: `This is typically the **first question in every interview**.\n\nCraft a compelling 60-90 second professional introduction covering:\n- Background and education\n- Key skills and experience\n- Relevant projects or achievements\n- Why you\'re excited about this opportunity`,
    examples: [],
    hints: [
      { level: 1, text: 'Structure: Present → Past → Future. Don\'t just list your resume.' },
      { level: 2, text: 'Highlight 2-3 relevant skills with brief evidence. End with enthusiasm for this role.' },
      { level: 3, text: 'Keep to 60-90 seconds. Practice out loud.' },
      { level: 4, text: 'Template: "I\'m a [role] with [X years/degree] in [field]. I\'ve worked on [project/skill] achieving [outcome]. I\'m excited about [company] because [specific reason]."' },
    ],
    solution: `FRAMEWORK:

1. PRESENT: "I'm a Computer Science final year student at [University], with strong skills in Java, backend development, and SQL."

2. PAST (relevant project): "I built a full-stack inventory management system using Spring Boot and PostgreSQL. It reduced manual tracking time by 40% for 50+ users."

3. SKILLS: "My strengths are backend APIs, database design, and solving complex problems — I've solved 200+ DSA problems."

4. FUTURE (why this role): "I'm excited about [Company] because of your microservices architecture and focus on scalable systems — this aligns perfectly with my career goals."

5. CLOSE: "I'd love to contribute to your engineering team and grow as a backend developer."

AVOID:
- Reading your resume
- Talking about personal life irrelevant to the role
- Going longer than 90 seconds
- Starting with "I was born in..."`,
    explanation: 'Tell me about yourself is your 60-second pitch. Structure = Present skills, past evidence, future enthusiasm. Practice it until it sounds natural, not memorized.',
    testCases: [],
    companies: ['TCS', 'Infosys', 'Wipro', 'Amazon', 'Microsoft', 'Google', 'All companies'],
    frequencyLevel: 'very-high',
    frequencyNote: 'Asked in 100% of interviews. Preparation is mandatory.',
    tags: ['HR', 'Introduction', 'Behavioral', 'Must Know'],
    roleRelevance: ['All Roles'],
    points: 100,
  },
];

// ─────────────────────────────────────────────────────
// COMBINED EXPORT
// ─────────────────────────────────────────────────────

export const allQuestions: Question[] = [
  ...sqlProblems,
  ...dsaProblems,
  ...conceptualQuestions,
  ...aptitudeQuestions,
  ...hrQuestions,
  ...webProblems,
  ...backendProblems,
  ...cnProblems,
  ...systemDesignProblems,
  ...generatedProblems,
];

export function getQuestionsByCategory(category: string): Question[] {
  return allQuestions.filter(q => q.category === category);
}

export function getQuestionById(id: string): Question | undefined {
  return allQuestions.find(q => q.id === id);
}

export function getQuestionBySlug(slug: string): Question | undefined {
  return allQuestions.find(q => q.slug === slug);
}

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return allQuestions.filter(q => q.difficulty === difficulty);
}

export function getQuestionsByCompany(company: string): Question[] {
  return allQuestions.filter(q => q.companies.includes(company));
}

export function getHighFrequencyQuestions(): Question[] {
  return allQuestions.filter(q => q.frequencyLevel === 'very-high' || q.frequencyLevel === 'high');
}

export const CATEGORY_META = {
  dbms: { label: 'DBMS & SQL', color: 'indigo', totalQuestions: sqlProblems.length },
  dsa: { label: 'DSA', color: 'violet', totalQuestions: dsaProblems.length },
  java: { label: 'Java & Programming', color: 'orange', totalQuestions: conceptualQuestions.filter(q => q.category === 'java').length },
  oop: { label: 'OOP & System Design', color: 'fuchsia', totalQuestions: conceptualQuestions.filter(q => q.category === 'oop').length },
  os: { label: 'Operating Systems', color: 'sky', totalQuestions: conceptualQuestions.filter(q => q.category === 'os').length },
  cn: { label: 'Computer Networks', color: 'cyan', totalQuestions: conceptualQuestions.filter(q => q.category === 'cn').length },
  aptitude: { label: 'Aptitude', color: 'amber', totalQuestions: aptitudeQuestions.length },
  hr: { label: 'HR & Behavioral', color: 'rose', totalQuestions: hrQuestions.length },
};
