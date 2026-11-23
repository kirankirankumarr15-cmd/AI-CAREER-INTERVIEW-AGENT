-- ==============================================================================
-- CareerPilot AI: Placement Readiness & Practice Module Migration
-- Phase: Per-Student Persistent Practice Tracking & Subject-Wise Bank
-- Date: 2026-11-22
-- ==============================================================================

-- 1. Create practice_subjects table
CREATE TABLE IF NOT EXISTS public.practice_subjects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create practice_questions table
CREATE TABLE IF NOT EXISTS public.practice_questions (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.practice_subjects(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    subtopic TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'coding', 'text')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    options JSONB, -- Array of { label: "A", text: "..." }
    correct_answer TEXT NOT NULL, -- Evaluated exclusively server-side
    explanation TEXT NOT NULL,
    starter_code JSONB,
    test_cases JSONB,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create practice_attempts (user_progress per student)
-- UNIQUE constraint on (user_id, question_id) ensures one active state per student per question
CREATE TABLE IF NOT EXISTS public.practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.practice_subjects(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    selected_answer TEXT,
    attempts_count INTEGER NOT NULL DEFAULT 1,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    attempted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_question_attempt UNIQUE (user_id, question_id)
);

-- 4. High performance query indexes
CREATE INDEX IF NOT EXISTS idx_practice_questions_subject ON public.practice_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_topic ON public.practice_questions(topic);
CREATE INDEX IF NOT EXISTS idx_practice_questions_difficulty ON public.practice_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON public.practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_subject ON public.practice_attempts(subject_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_subject ON public.practice_attempts(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_correct ON public.practice_attempts(user_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_attempted_at ON public.practice_attempts(attempted_at DESC);

-- 5. Row Level Security (RLS)
ALTER TABLE public.practice_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

-- Subjects & Questions: readable by authenticated & public
DROP POLICY IF EXISTS "Allow authenticated read on practice_subjects" ON public.practice_subjects;
CREATE POLICY "Allow authenticated read on practice_subjects"
    ON public.practice_subjects FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on practice_questions" ON public.practice_questions;
CREATE POLICY "Allow authenticated read on practice_questions"
    ON public.practice_questions FOR SELECT
    TO authenticated, anon
    USING (true);

-- Practice Attempts Policies:
-- Students can ONLY view their own records, or Admins/TPO can view all students for analytics
DROP POLICY IF EXISTS "Students and admins view practice attempts" ON public.practice_attempts;
CREATE POLICY "Students and admins view practice attempts"
    ON public.practice_attempts FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'tpo', 'hod')
        )
    );

-- Students can INSERT only their own records with their authenticated auth.uid()
DROP POLICY IF EXISTS "Students insert own practice attempts" ON public.practice_attempts;
CREATE POLICY "Students insert own practice attempts"
    ON public.practice_attempts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Students can UPDATE only their own records
DROP POLICY IF EXISTS "Students update own practice attempts" ON public.practice_attempts;
CREATE POLICY "Students update own practice attempts"
    ON public.practice_attempts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. SEED DATA: 7 SUBJECTS
-- ==============================================================================
INSERT INTO public.practice_subjects (id, code, name, description, badge, display_order)
VALUES
    ('dsa', 'dsa', 'Data Structures & Algorithms', 'Arrays, Trees, Graphs, Dynamic Programming, and algorithmic analysis.', 'Core', 1),
    ('dbms', 'dbms', 'DBMS & SQL', 'Relational models, ACID transactions, Normalization, Joins, and SQL queries.', 'Priority 1', 2),
    ('os', 'os', 'Operating Systems', 'Processes, CPU Scheduling, Concurrency, Virtual Memory, and Deadlocks.', 'System', 3),
    ('cn', 'cn', 'Computer Networks', 'OSI model, TCP/IP stack, Routing, Protocols, Sockets, and Subnetting.', 'Networking', 4),
    ('aptitude', 'aptitude', 'Quantitative & Logical Aptitude', 'Work & Time, Speed, Percentages, Permutations, Ratios, and Puzzles.', 'Screening', 5),
    ('verbal', 'verbal', 'Verbal Ability & English', 'Grammar, Reading comprehension, Vocabulary, Sentence correction, and Idioms.', 'Verbal', 6),
    ('microcontrollers', 'microcontrollers', 'Microcontrollers & Embedded Systems', '8051, ARM Cortex, Timers, Interrupts, I2C, SPI, UART, and Embedded C.', 'Hardware & IoT', 7)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    badge = EXCLUDED.badge,
    display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 7. SEED DATA: 10 HIGH-QUALITY MCQS PER SUBJECT (70 MCQS TOTAL)
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 1: DATA STRUCTURES & ALGORITHMS (dsa)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('dsa-mcq-01', 'dsa', 'Searching', 'Binary Search', 'Easy', 'mcq',
 'Time Complexity of Binary Search',
 'What is the worst-case time complexity of Binary Search on a sorted array of size n?',
 '[{"label":"A","text":"O(n)"},{"label":"B","text":"O(log n)"},{"label":"C","text":"O(n log n)"},{"label":"D","text":"O(1)"}]'::jsonb,
 'B',
 'Binary search halves the search space at each comparison step (n -> n/2 -> n/4 ... -> 1). This yields a logarithmic time complexity of O(log n).', 10),

('dsa-mcq-02', 'dsa', 'Sorting', 'QuickSort', 'Medium', 'mcq',
 'Worst-Case Time Complexity of QuickSort',
 'In which scenario does QuickSort exhibit its worst-case time complexity of O(n^2)?',
 '[{"label":"A","text":"When the pivot chosen divides the array into two equal halves"},{"label":"B","text":"When all elements are distinct and randomly ordered"},{"label":"C","text":"When the array is already sorted and the first or last element is chosen as pivot"},{"label":"D","text":"When the array has an even number of elements"}]'::jsonb,
 'C',
 'When the array is already sorted (or reverse sorted) and the smallest or largest element is picked as the pivot, the partition produces subproblems of size 0 and n-1, leading to O(n^2) time complexity.', 10),

('dsa-mcq-03', 'dsa', 'Trees', 'Binary Search Tree', 'Easy', 'mcq',
 'Traversal of a Binary Search Tree',
 'Which traversal of a Binary Search Tree (BST) visits nodes in strictly ascending sorted order?',
 '[{"label":"A","text":"Pre-order Traversal"},{"label":"B","text":"In-order Traversal"},{"label":"C","text":"Post-order Traversal"},{"label":"D","text":"Level-order Traversal"}]'::jsonb,
 'B',
 'In-order traversal visits (Left, Root, Right). For a BST, all left descendants are smaller than root and all right descendants are larger, producing a non-decreasing sorted sequence.', 10),

('dsa-mcq-04', 'dsa', 'Graphs', 'Graph Traversal', 'Easy', 'mcq',
 'Data Structure for Breadth-First Search (BFS)',
 'Which data structure is fundamentally utilized to implement Breadth-First Search on a graph?',
 '[{"label":"A","text":"Stack"},{"label":"B","text":"Queue"},{"label":"C","text":"Priority Queue"},{"label":"D","text":"Hash Map"}]'::jsonb,
 'B',
 'BFS explores vertices level by level in FIFO order. A Queue data structure ensures nodes are processed in the order they were discovered.', 10),

('dsa-mcq-05', 'dsa', 'Linked Lists', 'Cycle Detection', 'Medium', 'mcq',
 'Floyd''s Cycle Detection Algorithm',
 'Floyd''s Tortoise and Hare algorithm detects linked list cycles using two pointers. What are their respective movement speeds?',
 '[{"label":"A","text":"Tortoise advances 1 node; Hare advances 2 nodes"},{"label":"B","text":"Tortoise advances 2 nodes; Hare advances 3 nodes"},{"label":"C","text":"Both advance at 1 node per iteration"},{"label":"D","text":"Tortoise advances 1 node; Hare advances 4 nodes"}]'::jsonb,
 'A',
 'Floyd''s cycle-finding algorithm moves the slow pointer (tortoise) by 1 step and fast pointer (hare) by 2 steps per iteration. If a cycle exists, the distance between them decreases by 1 in each step inside the loop until they collide.', 10),

('dsa-mcq-06', 'dsa', 'Trees', 'Height Balanced Trees', 'Medium', 'mcq',
 'AVL Tree Balance Factor',
 'What is the allowable balance factor for every node in an AVL tree, defined as height(left) - height(right)?',
 '[{"label":"A","text":"0 only"},{"label":"B","text":"-1, 0, or +1"},{"label":"C","text":"-2, 0, or +2"},{"label":"D","text":"Any positive integer"}]'::jsonb,
 'B',
 'An AVL tree is a strictly height-balanced binary search tree where the difference between heights of left and right subtrees (balance factor) must be -1, 0, or +1 for every node.', 10),

('dsa-mcq-07', 'dsa', 'Graphs', 'Minimum Spanning Tree', 'Medium', 'mcq',
 'Kruskal''s Algorithm Cycle Check',
 'Which data structure is used in Kruskal''s Algorithm to detect whether adding an edge creates a cycle in O(alpha(V)) time?',
 '[{"label":"A","text":"Binary Search Tree"},{"label":"B","text":"Disjoint Set Union (DSU / Union-Find)"},{"label":"C","text":"Trie"},{"label":"D","text":"Min-Heap"}]'::jsonb,
 'B',
 'Kruskal''s algorithm sorts edges by weight and uses Disjoint Set Union (DSU) with path compression and union by rank to verify in near-constant time whether two endpoints belong to the same connected component.', 10),

('dsa-mcq-08', 'dsa', 'Dynamic Programming', 'Foundations', 'Medium', 'mcq',
 'Prerequisites for Dynamic Programming',
 'What two essential properties must an algorithmic problem possess to be solved effectively with Dynamic Programming?',
 '[{"label":"A","text":"Greedy choice property and optimal substructure"},{"label":"B","text":"Overlapping subproblems and optimal substructure"},{"label":"C","text":"Divide and conquer with independent subproblems"},{"label":"D","text":"Monotonicity and strict convexity"}]'::jsonb,
 'B',
 'Dynamic programming requires overlapping subproblems (same subproblems are solved repeatedly) and optimal substructure (optimal solution to the problem can be constructed from optimal solutions to its subproblems).', 10),

('dsa-mcq-09', 'dsa', 'Stacks & Queues', 'Stack Applications', 'Easy', 'mcq',
 'Infix to Postfix Conversion',
 'Which data structure is used to evaluate postfix mathematical expressions or convert infix expressions to postfix?',
 '[{"label":"A","text":"Queue"},{"label":"B","text":"Stack"},{"label":"C","text":"Binary Tree"},{"label":"D","text":"Heap"}]'::jsonb,
 'B',
 'A Stack provides the LIFO order necessary to hold operators and operands according to operator precedence and associativity during expression evaluation and conversion.', 10),

('dsa-mcq-10', 'dsa', 'Hashing', 'Collision Resolution', 'Hard', 'mcq',
 'Load Factor in Hash Tables',
 'In a hash table with m buckets and n stored keys, what does the load factor lambda = n/m indicate, and what happens when it exceeds threshold (e.g., 0.75)?',
 '[{"label":"A","text":"It indicates the memory address; rehashing reduces table size"},{"label":"B","text":"It measures table occupancy; exceeding threshold triggers rehashing to double capacity"},{"label":"C","text":"It represents collision frequency; exceeding threshold terminates the program"},{"label":"D","text":"It determines the polynomial hash base value"}]'::jsonb,
 'B',
 'The load factor lambda = n/m is the average number of elements per bucket. When lambda exceeds a predetermined threshold (typically 0.75), rehashing is triggered: a new table with double capacity is allocated and keys are redistributed.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 2: DATABASE MANAGEMENT SYSTEMS (dbms)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('dbms-mcq-01', 'dbms', 'Transactions', 'ACID Properties', 'Easy', 'mcq',
 'Atomicity in ACID Transactions',
 'Which ACID property guarantees that all operations within a database transaction succeed or all of them are rolled back?',
 '[{"label":"A","text":"Consistency"},{"label":"B","text":"Atomicity"},{"label":"C","text":"Isolation"},{"label":"D","text":"Durability"}]'::jsonb,
 'B',
 'Atomicity ensures that all operations in a transaction execute completely or none do ("all-or-nothing"). If any statement fails, the database rolls back to its prior state.', 10),

('dbms-mcq-02', 'dbms', 'Normalization', '3NF', 'Medium', 'mcq',
 'Third Normal Form (3NF) Condition',
 'A relational table is in Third Normal Form (3NF) if it is in 2NF and has no:',
 '[{"label":"A","text":"Partial functional dependencies"},{"label":"B","text":"Transitive functional dependencies on non-prime attributes"},{"label":"C","text":"Multi-valued dependencies"},{"label":"D","text":"Composite primary keys"}]'::jsonb,
 'B',
 '3NF requires that no non-prime attribute is transitively dependent on any candidate key (if X -> Y and Y -> Z where Z is non-prime, then X -> Z is a transitive dependency).', 10),

('dbms-mcq-03', 'dbms', 'SQL', 'Filtering Groups', 'Easy', 'mcq',
 'Difference Between WHERE and HAVING',
 'Which SQL clause is used to filter aggregated groups produced by a GROUP BY clause?',
 '[{"label":"A","text":"WHERE"},{"label":"B","text":"HAVING"},{"label":"C","text":"ORDER BY"},{"label":"D","text":"FILTER"}]'::jsonb,
 'B',
 'WHERE filters individual records before any grouping or aggregation takes place. HAVING filters summary rows or groups after the GROUP BY calculation is evaluated.', 10),

('dbms-mcq-04', 'dbms', 'Indexing', 'B+ Trees', 'Medium', 'mcq',
 'Advantage of B+ Trees over B-Trees in RDBMS',
 'Why do modern relational database engines (PostgreSQL, MySQL InnoDB) prefer B+ Trees over B-Trees for disk-based indexing?',
 '[{"label":"A","text":"B+ Trees store records only in RAM"},{"label":"B","text":"Leaf nodes are linked in a linked list, enabling fast sequential range scans"},{"label":"C","text":"B+ Trees avoid balanced tree rebalancing entirely"},{"label":"D","text":"B+ Trees consume zero disk memory"}]'::jsonb,
 'B',
 'In a B+ Tree, internal nodes store only routing keys, keeping them small so more keys fit in one disk page. All real data references reside in leaf nodes, which are linked together in a doubly linked list, making range queries (e.g. BETWEEN) very efficient.', 10),

('dbms-mcq-05', 'dbms', 'Joins', 'Outer Joins', 'Easy', 'mcq',
 'Behavior of LEFT OUTER JOIN',
 'What is returned by a LEFT OUTER JOIN between table A and table B on condition A.id = B.a_id?',
 '[{"label":"A","text":"Only rows with matching values in both tables"},{"label":"B","text":"All rows from table A, with matched values from B or NULL when no match exists"},{"label":"C","text":"All rows from table B, with matching rows from A"},{"label":"D","text":"Cartesian product of all rows"}]'::jsonb,
 'B',
 'A LEFT OUTER JOIN preserves all rows from the left table (A). If a corresponding match exists in table B, its columns are populated; otherwise, NULL is returned for table B columns.', 10),

('dbms-mcq-06', 'dbms', 'Concurrency Control', 'Isolation Levels', 'Hard', 'mcq',
 'Phantom Read Phenomenon',
 'Under which SQL transaction isolation level can a Phantom Read occur?',
 '[{"label":"A","text":"Serializable"},{"label":"B","text":"Repeatable Read"},{"label":"C","text":"Snapshot Isolation"},{"label":"D","text":"Read Uncommitted and Read Committed only"}]'::jsonb,
 'B',
 'Under standard ANSI SQL, Repeatable Read locks individual read rows to prevent Non-Repeatable Reads, but range locks are not acquired, allowing concurrent transactions to insert new rows that match the query filter ("phantoms"). Only Serializable guarantees phantom prevention.', 10),

('dbms-mcq-07', 'dbms', 'Keys', 'Foreign Key Constraints', 'Easy', 'mcq',
 'Purpose of Foreign Key Constraints',
 'What fundamental database property is enforced by a FOREIGN KEY constraint?',
 '[{"label":"A","text":"Entity integrity"},{"label":"B","text":"Referential integrity"},{"label":"C","text":"Domain completeness"},{"label":"D","text":"User authentication"}]'::jsonb,
 'B',
 'Foreign keys enforce referential integrity between tables: any value in the referencing column must match an existing primary/unique key value in the referenced table or be NULL.', 10),

('dbms-mcq-08', 'dbms', 'SQL Commands', 'DDL vs DML', 'Easy', 'mcq',
 'Difference Between DELETE and TRUNCATE',
 'What is the primary operational difference between the SQL commands DELETE and TRUNCATE?',
 '[{"label":"A","text":"DELETE is DDL; TRUNCATE is DML"},{"label":"B","text":"DELETE removes rows one by one with transaction log entries; TRUNCATE deallocates data pages as DDL without row-by-row logging"},{"label":"C","text":"TRUNCATE allows a WHERE clause; DELETE does not"},{"label":"D","text":"DELETE drops the table structure from catalog"}]'::jsonb,
 'B',
 'DELETE is a DML statement that removes rows individually and records each deletion in the transaction log (allowing WHERE conditions). TRUNCATE is a DDL statement that deallocates entire data pages, making it much faster and resetting identity counters.', 10),

('dbms-mcq-09', 'dbms', 'Views & Security', 'Views', 'Medium', 'mcq',
 'Materialized Views vs Regular Views',
 'What distinguishes a Materialized View from a standard Virtual View in PostgreSQL?',
 '[{"label":"A","text":"Virtual views physically store query results on disk"},{"label":"B","text":"Materialized views physically store computed query results on disk and require refresh"},{"label":"C","text":"Materialized views cannot contain joins or aggregates"},{"label":"D","text":"Virtual views can only be queried by superusers"}]'::jsonb,
 'B',
 'A standard view is merely a saved query definition that re-runs every time it is referenced. A Materialized View computes and physically writes the result set to disk, providing fast reads for complex aggregations until refreshed (REFRESH MATERIALIZED VIEW).', 10),

('dbms-mcq-10', 'dbms', 'Transactions', 'Two-Phase Locking', 'Hard', 'mcq',
 'Strict Two-Phase Locking (Strict 2PL)',
 'In concurrency control, what distinguishes Strict Two-Phase Locking (Strict 2PL) from standard 2PL?',
 '[{"label":"A","text":"Strict 2PL releases read locks before commit"},{"label":"B","text":"Strict 2PL holds all exclusive (write) locks until transaction commits or aborts"},{"label":"C","text":"Strict 2PL prohibits shared locks entirely"},{"label":"D","text":"Strict 2PL does not guarantee serializability"}]'::jsonb,
 'B',
 'Strict 2PL requires that all exclusive locks taken by a transaction are held until the transaction finishes (commit or rollback). This prevents cascading aborts and guarantees conflict serializability and recoverability.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 3: OPERATING SYSTEMS (os)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('os-mcq-01', 'os', 'Deadlocks', 'Coffman Conditions', 'Easy', 'mcq',
 'Coffman Conditions for Deadlock',
 'Which of the following is NOT one of the four necessary Coffman conditions for a system deadlock?',
 '[{"label":"A","text":"Mutual Exclusion"},{"label":"B","text":"Hold and Wait"},{"label":"C","text":"Preemption Allowed"},{"label":"D","text":"Circular Wait"}]'::jsonb,
 'C',
 'The 4 Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlocks cannot occur because resources can be forcibly reclaimed.', 10),

('os-mcq-02', 'os', 'Process Management', 'Fork System Call', 'Medium', 'mcq',
 'Return Value of fork() in Unix',
 'In a Unix/Linux environment, what does the fork() system call return to the parent process and to the child process upon success?',
 '[{"label":"A","text":"Parent receives 0; Child receives PID of parent"},{"label":"B","text":"Parent receives PID of the newly created child; Child receives 0"},{"label":"C","text":"Both receive 0"},{"label":"D","text":"Both receive 1"}]'::jsonb,
 'B',
 'On success, fork() returns the PID of the newly spawned child process to the parent process, and returns 0 inside the child process. A negative value indicates failure.', 10),

('os-mcq-03', 'os', 'Memory Management', 'Paging and Fragmentation', 'Easy', 'mcq',
 'Fragmentation in Paging Systems',
 'Which type of fragmentation is inherently possible in a pure Paging memory management system?',
 '[{"label":"A","text":"External Fragmentation only"},{"label":"B","text":"Internal Fragmentation on the last allocated page"},{"label":"C","text":"Both Internal and External Fragmentation equally"},{"label":"D","text":"Neither internal nor external fragmentation"}]'::jsonb,
 'B',
 'Paging divides physical memory into fixed-size frames and virtual memory into pages. Because frames can be allocated anywhere, external fragmentation is eliminated. However, if a process requires memory that is not an exact multiple of the page size, the last page suffers internal fragmentation.', 10),

('os-mcq-04', 'os', 'CPU Scheduling', 'Convoy Effect', 'Easy', 'mcq',
 'Convoy Effect in CPU Scheduling',
 'Which CPU scheduling algorithm suffers severely from the Convoy Effect?',
 '[{"label":"A","text":"Round Robin (RR)"},{"label":"B","text":"First-Come First-Served (FCFS)"},{"label":"C","text":"Shortest Job First (SJF)"},{"label":"D","text":"Priority Scheduling with Preemption"}]'::jsonb,
 'B',
 'In FCFS, when a long CPU-bound process enters the CPU, all subsequent shorter I/O-bound processes are forced to wait in the ready queue, causing poor device utilization and high average waiting time (the Convoy Effect).', 10),

('os-mcq-05', 'os', 'Virtual Memory', 'Thrashing', 'Medium', 'mcq',
 'Thrashing Phenomenon in Virtual Memory',
 'What is "Thrashing" in an operating system?',
 '[{"label":"A","text":"A state where CPU spends more time swapping pages in and out than executing instructions"},{"label":"B","text":"A hardware crash caused by overheating RAM"},{"label":"C","text":"A security violation where unauthorized memory is accessed"},{"label":"D","text":"When a disk runs out of sector capacity"}]'::jsonb,
 'A',
 'Thrashing occurs when the sum of the working sets of all active processes exceeds the available physical memory. Page faults occur continuously, and the OS spends virtually all CPU cycles moving pages between RAM and swap space.', 10),

('os-mcq-06', 'os', 'Synchronization', 'Semaphores', 'Medium', 'mcq',
 'Atomic Operations on Semaphores',
 'Which two atomic operations manipulate Dijkstra''s counting semaphore?',
 '[{"label":"A","text":"start() and stop()"},{"label":"B","text":"wait() (or P) and signal() (or V)"},{"label":"C","text":"lock() and release()"},{"label":"D","text":"enqueue() and dequeue()"}]'::jsonb,
 'B',
 'Dijkstra defined wait() (originally P, from Dutch proberen "to test") which decrements the semaphore counter and blocks if negative, and signal() (originally V, from verhogen "to increment") which increments the counter and awakens a waiting process.', 10),

('os-mcq-07', 'os', 'Memory Management', 'TLB', 'Medium', 'mcq',
 'Translation Lookaside Buffer (TLB)',
 'What is the primary function of the Translation Lookaside Buffer (TLB) in CPU hardware?',
 '[{"label":"A","text":"To store process state registers during context switch"},{"label":"B","text":"A high-speed hardware cache that stores recent virtual-to-physical page number translations"},{"label":"C","text":"To store disk block pointers for file systems"},{"label":"D","text":"To arbitrate multi-core CPU bus interrupts"}]'::jsonb,
 'B',
 'The TLB is an associative memory cache inside the MMU that stores recent page table translations (virtual page number to physical frame number). A TLB hit resolves memory translation in 1 clock cycle without accessing main memory.', 10),

('os-mcq-08', 'os', 'Process States', 'Zombie vs Orphan Processes', 'Medium', 'mcq',
 'Zombie Process Definition',
 'What is a "Zombie Process" in Unix systems?',
 '[{"label":"A","text":"A process whose parent has terminated while the child is still running"},{"label":"B","text":"A process that has finished execution but whose exit status has not yet been read by parent via wait()"},{"label":"C","text":"A daemon process running in background indefinitely"},{"label":"D","text":"A process that has deadlocked on file descriptors"}]'::jsonb,
 'B',
 'When a child process exits via exit(), its memory is freed, but its PID and termination status remain in the process table so its parent can inspect it using wait() or waitpid(). Until the parent calls wait(), the process is in a zombie state.', 10),

('os-mcq-09', 'os', 'Deadlocks', 'Banker''s Algorithm', 'Hard', 'mcq',
 'Banker''s Algorithm Classification',
 'In deadlock management, what strategy does Dijkstra''s Banker''s Algorithm implement?',
 '[{"label":"A","text":"Deadlock Prevention"},{"label":"B","text":"Deadlock Avoidance"},{"label":"C","text":"Deadlock Detection and Recovery"},{"label":"D","text":"Deadlock Ignorance (Ostrich algorithm)"}]'::jsonb,
 'B',
 'Banker''s algorithm is a Deadlock Avoidance algorithm. It dynamically tests whether allocating requested resources leaves the system in a "Safe State" (a sequence where all processes can finish). If not safe, the request is deferred.', 10),

('os-mcq-10', 'os', 'Storage', 'RAID Levels', 'Medium', 'mcq',
 'RAID 5 Fault Tolerance',
 'What redundancy mechanism does RAID 5 use to survive the failure of a single drive while providing good read performance?',
 '[{"label":"A","text":"Exact mirroring of all disks (100% overhead)"},{"label":"B","text":"Block-level striping with distributed parity across all disks"},{"label":"C","text":"Dedicated parity drive on a single disk"},{"label":"D","text":"Bit-level Hamming code error correction"}]'::jsonb,
 'B',
 'RAID 5 stripes both data and parity blocks across three or more disks. Because parity is distributed across all drives rather than isolated on one (unlike RAID 4), write bottleneck is avoided and any single disk failure can be recovered by XOR parity calculation.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 4: COMPUTER NETWORKS (cn)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('cn-mcq-01', 'cn', 'OSI Model', 'Transport Layer', 'Easy', 'mcq',
 'Layer Responsible for Port Addressing and Flow Control',
 'In the 7-layer OSI reference model, which layer manages port addressing, segmentation, end-to-end reliability, and flow control?',
 '[{"label":"A","text":"Network Layer (Layer 3)"},{"label":"B","text":"Transport Layer (Layer 4)"},{"label":"C","text":"Session Layer (Layer 5)"},{"label":"D","text":"Data Link Layer (Layer 2)"}]'::jsonb,
 'B',
 'Layer 4 (Transport Layer) delivers end-to-end communication between processes on different hosts using port numbers (e.g., TCP and UDP), performing segmentation, flow control, and error recovery.', 10),

('cn-mcq-02', 'cn', 'Protocols', 'TCP Handshake', 'Easy', 'mcq',
 'TCP Three-Way Handshake Sequence',
 'What is the correct 3-step packet sequence used to establish a reliable TCP connection?',
 '[{"label":"A","text":"ACK, SYN, SYN-ACK"},{"label":"B","text":"SYN, SYN-ACK, ACK"},{"label":"C","text":"FIN, ACK, FIN-ACK"},{"label":"D","text":"HELLO, CONNECT, ACK"}]'::jsonb,
 'B',
 'To establish a connection: 1) Client sends SYN (with initial sequence number x); 2) Server responds with SYN-ACK (acknowledging x+1 and sending its ISN y); 3) Client sends ACK (acknowledging y+1). Connection is established.', 10),

('cn-mcq-03', 'cn', 'IP Addressing', 'Subnetting', 'Medium', 'mcq',
 'IPv4 Subnet Mask for /26 CIDR Prefix',
 'What is the dotted decimal subnet mask corresponding to the CIDR notation /26 in IPv4?',
 '[{"label":"A","text":"255.255.255.0"},{"label":"B","text":"255.255.255.128"},{"label":"C","text":"255.255.255.192"},{"label":"D","text":"255.255.255.224"}]'::jsonb,
 'C',
 '/26 means 26 ones followed by 6 zeros: 11111111.11111111.11111111.11000000. In decimal: 128 + 64 = 192. Thus the mask is 255.255.255.192, providing 2^(32-26) - 2 = 62 usable host addresses.', 10),

('cn-mcq-04', 'cn', 'Protocols', 'DHCP', 'Easy', 'mcq',
 'Role of DHCP Protocol',
 'What is the primary role of the Dynamic Host Configuration Protocol (DHCP) on a local network?',
 '[{"label":"A","text":"Resolving domain names to IP addresses"},{"label":"B","text":"Automatically assigning IP addresses, subnet masks, default gateway, and DNS servers to hosts"},{"label":"C","text":"Translating private IP addresses to public IPs for NAT"},{"label":"D","text":"Encrypting web traffic across routers"}]'::jsonb,
 'B',
 'DHCP operates on UDP ports 67/68 using the DORA (Discover, Offer, Request, Acknowledge) process to dynamically allocate IP configuration parameters to network devices without manual administrative setup.', 10),

('cn-mcq-05', 'cn', 'Protocols', 'ARP', 'Easy', 'mcq',
 'Address Resolution Protocol (ARP) Function',
 'Which mapping does Address Resolution Protocol (ARP) perform in a Local Area Network?',
 '[{"label":"A","text":"Resolves a 32-bit IPv4 address into a 48-bit physical MAC address"},{"label":"B","text":"Resolves a MAC address into a domain name"},{"label":"C","text":"Resolves a URL into a port number"},{"label":"D","text":"Maps IPv6 addresses to IPv4 gateways"}]'::jsonb,
 'A',
 'ARP broadcasts a request on the data link layer ("Who has IP 192.168.1.5?") to discover the hardware MAC address of the target network interface on the local subnet.', 10),

('cn-mcq-06', 'cn', 'Flow Control', 'Sliding Window', 'Medium', 'mcq',
 'TCP Sliding Window Flow Control',
 'How does the TCP receiver prevent a fast sender from overflowing its receive buffer?',
 '[{"label":"A","text":"By dropping all incoming packets after 1 MB"},{"label":"B","text":"By advertising its available receive window size (rwnd) in every ACK header"},{"label":"C","text":"By sending ICMP Quench messages to the default gateway"},{"label":"D","text":"By renegotiating the MTU size"}]'::jsonb,
 'B',
 'TCP implements flow control using the Advertised Window (rwnd). In each ACK packet, the receiver advertises how much free space remains in its receive buffer. The sender must not have more unacknowledged bytes in flight than rwnd.', 10),

('cn-mcq-07', 'cn', 'Routing', 'Dijkstra vs Bellman-Ford', 'Medium', 'mcq',
 'Link State vs Distance Vector Routing Protocols',
 'Which standard interior gateway routing protocol uses Dijkstra''s Shortest Path First algorithm with Link State Advertisements?',
 '[{"label":"A","text":"RIP (Routing Information Protocol)"},{"label":"B","text":"OSPF (Open Shortest Path First)"},{"label":"C","text":"BGP (Border Gateway Protocol)"},{"label":"D","text":"EGP (Exterior Gateway Protocol)"}]'::jsonb,
 'B',
 'OSPF is a Link-State routing protocol. Every router discovers the complete network topology via Link State Advertisements (LSAs) and calculates the shortest path tree to all destinations using Dijkstra''s SPF algorithm.', 10),

('cn-mcq-08', 'cn', 'Web Protocols', 'HTTP/2 & HTTP/3', 'Medium', 'mcq',
 'Transport Protocol in HTTP/3',
 'Which transport layer protocol does HTTP/3 utilize instead of standard TCP to eliminate Head-of-Line blocking at the transport layer?',
 '[{"label":"A","text":"SCTP"},{"label":"B","text":"QUIC (over UDP)"},{"label":"C","text":"Raw IP sockets"},{"label":"D","text":"Enhanced TCP with MPTCP"}]'::jsonb,
 'B',
 'HTTP/3 runs over QUIC (Quick UDP Internet Connections), which operates on UDP. By implementing multiplexed streams independently inside QUIC, a lost packet on one stream does not pause other parallel streams, solving TCP head-of-line blocking.', 10),

('cn-mcq-09', 'cn', 'Security', 'TLS Handshake', 'Hard', 'mcq',
 'Diffie-Hellman Key Exchange in TLS 1.3',
 'In modern TLS 1.3, why is Diffie-Hellman (ECDHE) mandated over static RSA key transport for session key exchange?',
 '[{"label":"A","text":"It requires smaller CPU clocks for symmetric encryption"},{"label":"B","text":"It provides Forward Secrecy (PFS), ensuring past recorded traffic cannot be decrypted even if server private key is leaked"},{"label":"C","text":"It avoids using digital certificates entirely"},{"label":"D","text":"It removes the need for client browser cookies"}]'::jsonb,
 'B',
 'Ephemeral Diffie-Hellman generates ephemeral key pairs for each session. Because session keys are never transmitted over the wire and are erased after use, compromising the long-term server private key later will not allow decryption of previously captured ciphertext (Perfect Forward Secrecy).', 10),

('cn-mcq-10', 'cn', 'Error Detection', 'CRC', 'Medium', 'mcq',
 'Cyclic Redundancy Check (CRC)',
 'What mathematical operation forms the foundation of Cyclic Redundancy Check (CRC) error detection on data link frames?',
 '[{"label":"A","text":"Matrix multiplication under modulo 10"},{"label":"B","text":"Polynomial binary division using modulo-2 arithmetic (XOR)"},{"label":"C","text":"One''s complement 16-bit addition"},{"label":"D","text":"Fast Fourier Transform (FFT)"}]'::jsonb,
 'B',
 'CRC treats bit sequences as polynomials with coefficients in GF(2). Modulo-2 polynomial division (using XOR operations without carries or borrows) is performed using a standardized generator polynomial, appending the remainder to verify frame integrity.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 5: QUANTITATIVE & LOGICAL APTITUDE (aptitude)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('apt-mcq-01', 'aptitude', 'Time and Work', 'Combined Work', 'Easy', 'mcq',
 'Combined Work of Two Individuals',
 'Person A can complete a task in 10 days, and Person B can complete the same task in 15 days. Working together, how many days will they take to complete the entire task?',
 '[{"label":"A","text":"5 days"},{"label":"B","text":"6 days"},{"label":"C","text":"7.5 days"},{"label":"D","text":"8 days"}]'::jsonb,
 'B',
 'Rate of A = 1/10 per day. Rate of B = 1/15 per day. Combined rate = 1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6 per day. Total time = 1 / (1/6) = 6 days.', 10),

('apt-mcq-02', 'aptitude', 'Speed, Distance & Time', 'Trains and Relative Speed', 'Easy', 'mcq',
 'Train Crossing a Stationary Pole',
 'A train 150 meters long is travelling at a uniform speed of 54 km/h. How many seconds will it take to completely pass a stationary telegraph pole?',
 '[{"label":"A","text":"8 seconds"},{"label":"B","text":"10 seconds"},{"label":"C","text":"12 seconds"},{"label":"D","text":"15 seconds"}]'::jsonb,
 'B',
 'First convert speed to m/s: 54 * (5/18) = 15 m/s. Distance to cross a point object is the train''s own length (150 m). Time = Distance / Speed = 150 / 15 = 10 seconds.', 10),

('apt-mcq-03', 'aptitude', 'Profit & Loss', 'Percentage Markup', 'Easy', 'mcq',
 'Selling Price at 25% Profit',
 'A shopkeeper purchases an item for Rs. 800 and desires a 25% profit margin. At what price must the item be sold?',
 '[{"label":"A","text":"Rs. 950"},{"label":"B","text":"Rs. 1000"},{"label":"C","text":"Rs. 1050"},{"label":"D","text":"Rs. 1100"}]'::jsonb,
 'B',
 'Profit = 25% of 800 = 0.25 * 800 = Rs. 200. Selling Price = Cost Price + Profit = 800 + 200 = Rs. 1000.', 10),

('apt-mcq-04', 'aptitude', 'Simple Interest', 'Doubling of Principal', 'Easy', 'mcq',
 'Rate of Interest for Sum Doubling in 5 Years',
 'At what annual rate of Simple Interest will an investment double itself in 5 years?',
 '[{"label":"A","text":"15% per annum"},{"label":"B","text":"20% per annum"},{"label":"C","text":"25% per annum"},{"label":"D","text":"10% per annum"}]'::jsonb,
 'B',
 'If principal P doubles to 2P, Simple Interest SI = P. Formula: SI = (P * R * T) / 100. P = (P * R * 5) / 100 -> 1 = 5R / 100 -> R = 100 / 5 = 20% per annum.', 10),

('apt-mcq-05', 'aptitude', 'Ratios & Proportions', 'Classroom Distribution', 'Easy', 'mcq',
 'Ratio Distribution of Students',
 'In a classroom of 50 students, the ratio of boys to girls is 3:2. What is the total count of female students in the class?',
 '[{"label":"A","text":"15"},{"label":"B","text":"20"},{"label":"C","text":"25"},{"label":"D","text":"30"}]'::jsonb,
 'B',
 'Total parts = 3 + 2 = 5 parts. Value of 1 part = 50 / 5 = 10 students. Number of girls = 2 parts = 2 * 10 = 20 female students.', 10),

('apt-mcq-06', 'aptitude', 'Percentages', 'Price and Consumption', 'Medium', 'mcq',
 'Consumption Reduction for Price Hike',
 'If the price of a commodity increases by 25%, by what percentage must a household reduce its consumption so that total expenditure remains unchanged?',
 '[{"label":"A","text":"25%"},{"label":"B","text":"20%"},{"label":"C","text":"16.67%"},{"label":"D","text":"15%"}]'::jsonb,
 'B',
 'Formula: Reduction % = [r / (100 + r)] * 100%. Here r = 25: [25 / (100 + 25)] * 100% = (25 / 125) * 100% = (1/5) * 100% = 20%.', 10),

('apt-mcq-07', 'aptitude', 'Permutations & Combinations', 'Word Arrangement', 'Medium', 'mcq',
 'Arrangement of Letters with Repetition',
 'In how many distinct ways can the letters of the word "LEADER" be arranged?',
 '[{"label":"A","text":"720"},{"label":"B","text":"360"},{"label":"C","text":"180"},{"label":"D","text":"120"}]'::jsonb,
 'B',
 'Word "LEADER" has 6 letters total where letter ''E'' appears twice. Number of permutations = 6! / 2! = (720) / 2 = 360 distinct arrangements.', 10),

('apt-mcq-08', 'aptitude', 'Probability', 'Two Dice Sum', 'Medium', 'mcq',
 'Probability of Sum 7 with Two Dice',
 'When two fair 6-sided dice are rolled simultaneously, what is the probability that the sum of the numbers is 7?',
 '[{"label":"A","text":"1/12"},{"label":"B","text":"1/6"},{"label":"C","text":"5/36"},{"label":"D","text":"1/4"}]'::jsonb,
 'B',
 'Total outcomes = 6 * 6 = 36. Favorable pairs giving sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 outcomes. Probability = 6 / 36 = 1/6.', 10),

('apt-mcq-09', 'aptitude', 'Number Series', 'Logical Patterns', 'Easy', 'mcq',
 'Next Term in Number Series',
 'Identify the next number in the sequence: 2, 6, 12, 20, 30, ?',
 '[{"label":"A","text":"40"},{"label":"B","text":"42"},{"label":"C","text":"44"},{"label":"D","text":"48"}]'::jsonb,
 'B',
 'Differences between consecutive terms: 6 - 2 = 4, 12 - 6 = 6, 20 - 12 = 8, 30 - 20 = 10. The difference increases by 2 each step (+4, +6, +8, +10). Next difference is +12. Next term = 30 + 12 = 42 (also n^2 + n: 1*2, 2*3, 3*4, 4*5, 5*6, 6*7 = 42).', 10),

('apt-mcq-10', 'aptitude', 'Ages', 'Linear Equations', 'Medium', 'mcq',
 'Father and Son Age Problem',
 'A father is currently 3 times as old as his son. In 5 years, the father will be 2.5 times as old as his son. What is the son''s current age?',
 '[{"label":"A","text":"10 years"},{"label":"B","text":"15 years"},{"label":"C","text":"18 years"},{"label":"D","text":"20 years"}]'::jsonb,
 'B',
 'Let son''s age = S. Father''s age F = 3S. In 5 years: F + 5 = 2.5(S + 5) -> 3S + 5 = 2.5S + 12.5 -> 0.5S = 7.5 -> S = 15 years.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 6: VERBAL ABILITY & ENGLISH (verbal)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('vrb-mcq-01', 'verbal', 'Vocabulary', 'Synonyms', 'Easy', 'mcq',
 'Synonym of METICULOUS',
 'Select the option that is most similar in meaning to the word: METICULOUS',
 '[{"label":"A","text":"Careless and hurried"},{"label":"B","text":"Showing great attention to detail; thorough and precise"},{"label":"C","text":"Aggressive and outspoken"},{"label":"D","text":"Indifferent and uninterested"}]'::jsonb,
 'B',
 '"Meticulous" means taking or showing extreme care about minute details; precise and thorough.', 10),

('vrb-mcq-02', 'verbal', 'Vocabulary', 'Antonyms', 'Easy', 'mcq',
 'Antonym of EPHEMERAL',
 'Select the word that is most opposite in meaning to: EPHEMERAL',
 '[{"label":"A","text":"Fleeting"},{"label":"B","text":"Permanent"},{"label":"C","text":"Transient"},{"label":"D","text":"Fragile"}]'::jsonb,
 'B',
 '"Ephemeral" means lasting for a very short time. Its direct antonym is "permanent" or "eternal".', 10),

('vrb-mcq-03', 'verbal', 'Grammar', 'Prepositions', 'Easy', 'mcq',
 'Preposition of Time (Since vs For)',
 'Fill in the blank with the correct preposition: "Dr. Sharma has been teaching at the engineering college _____ 2018."',
 '[{"label":"A","text":"for"},{"label":"B","text":"since"},{"label":"C","text":"from"},{"label":"D","text":"during"}]'::jsonb,
 'B',
 '"Since" is used with a specific point in time in the past until now with perfect tenses (since 2018). "For" is used with a duration or period of time (e.g., for 5 years).', 10),

('vrb-mcq-04', 'verbal', 'Idioms & Phrases', 'Idiomatic Expressions', 'Easy', 'mcq',
 'Meaning of "Bite the Bullet"',
 'What is the accepted idiomatic meaning of "to bite the bullet"?',
 '[{"label":"A","text":"To eat dangerous substances"},{"label":"B","text":"To accept or confront a difficult situation with courage"},{"label":"C","text":"To declare war on adversaries"},{"label":"D","text":"To quit before finishing a project"}]'::jsonb,
 'B',
 '"Bite the bullet" means to endure a painful, grim, or difficult situation that is unavoidable, facing it bravely.', 10),

('vrb-mcq-05', 'verbal', 'Grammar', 'Subject-Verb Agreement', 'Medium', 'mcq',
 'Subject-Verb Agreement with "Neither...nor"',
 'Choose the grammatically correct sentence:',
 '[{"label":"A","text":"Neither the professor nor the students was present in the auditorium."},{"label":"B","text":"Neither the professor nor the students were present in the auditorium."},{"label":"C","text":"Neither the professor nor the students is present in the auditorium."},{"label":"D","text":"Neither the professor nor the students has been present in the auditorium."}]'::jsonb,
 'B',
 'When two subjects are joined by "neither...nor", the verb agrees in number with the subject closest to it ("the students", which is plural), hence "were present" is grammatically correct.', 10),

('vrb-mcq-06', 'verbal', 'Vocabulary', 'One Word Substitution', 'Easy', 'mcq',
 'One Who Speaks Many Languages',
 'What is the term for an individual who is capable of speaking or writing several languages fluently?',
 '[{"label":"A","text":"Philanthropist"},{"label":"B","text":"Polyglot"},{"label":"C","text":"Omniscient"},{"label":"D","text":"Somnambulist"}]'::jsonb,
 'B',
 'A "polyglot" is someone who knows and is able to use several languages. ("Linguist" studies language structure; "Polyglot" speaks multiple).', 10),

('vrb-mcq-07', 'verbal', 'Spelling', 'Orthography', 'Easy', 'mcq',
 'Correct Spelling Identification',
 'Identify the correctly spelled word from the options below:',
 '[{"label":"A","text":"Acomodate"},{"label":"B","text":"Accommodate"},{"label":"C","text":"Acommodate"},{"label":"D","text":"Accomadate"}]'::jsonb,
 'B',
 '"Accommodate" is spelled with double ''c'' and double ''m'': A-C-C-O-M-M-O-D-A-T-E.', 10),

('vrb-mcq-08', 'verbal', 'Analogies', 'Logical Association', 'Medium', 'mcq',
 'Analogy Completion',
 'Complete the verbal analogy: CANDLE : WAX :: PAPER : ?',
 '[{"label":"A","text":"PENCIL"},{"label":"B","text":"WOOD"},{"label":"C","text":"INK"},{"label":"D","text":"BOOK"}]'::jsonb,
 'B',
 'A candle is made from wax (primary raw material). Similarly, paper is made from wood / wood pulp.', 10),

('vrb-mcq-09', 'verbal', 'Error Spotting', 'Pronoun & Quantifier Agreement', 'Medium', 'mcq',
 'Spotting Grammatical Error',
 'Identify the error in this sentence: "Each of the candidates (A) / have successfully completed (B) / their coding assessment (C) / without error (D)."',
 '[{"label":"A","text":"Part (A)"},{"label":"B","text":"Part (B) - should be ''has successfully completed''"},{"label":"C","text":"Part (C)"},{"label":"D","text":"No error"}]'::jsonb,
 'B',
 '"Each" is an indefinite singular pronoun. The auxiliary verb following "Each of the [plural noun]" must be singular: "has successfully completed", not "have".', 10),

('vrb-mcq-10', 'verbal', 'Vocabulary', 'Contextual Usage', 'Easy', 'mcq',
 'Synonym of PRAGMATIC',
 'Choose the word that best describes a person with a PRAGMATIC mindset:',
 '[{"label":"A","text":"Idealistic and detached"},{"label":"B","text":"Practical and dealing with realistic consequences"},{"label":"C","text":"Hesitant and fearful"},{"label":"D","text":"Arrogant and dismissive"}]'::jsonb,
 'B',
 '"Pragmatic" means dealing with problems in a sensible and realistic way that is based on practical rather than theoretical considerations.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- ─────────────────────────────────────────────────────────────
-- SUBJECT 7: MICROCONTROLLERS & EMBEDDED SYSTEMS (microcontrollers)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.practice_questions (id, subject_id, topic, subtopic, difficulty, question_type, title, description, options, correct_answer, explanation, points)
VALUES
('mc-mcq-01', 'microcontrollers', 'Architecture', 'Harvard vs Von Neumann', 'Easy', 'mcq',
 'Harvard Architecture Characteristics',
 'What fundamental feature distinguishes the Harvard architecture from the Von Neumann architecture in microcontrollers?',
 '[{"label":"A","text":"Harvard shares a single physical bus for both program instructions and data"},{"label":"B","text":"Harvard possesses physically separate memory spaces and distinct buses for program code and data"},{"label":"C","text":"Harvard has no registers in the CPU core"},{"label":"D","text":"Harvard microcontrollers cannot execute assembly language"}]'::jsonb,
 'B',
 'Harvard architecture separates physical memory and signal buses for instructions and data, allowing simultaneous instruction fetch and data read/write (pipelining). Von Neumann uses a shared single bus.', 10),

('mc-mcq-02', 'microcontrollers', '8051 Architecture', 'Ports', 'Easy', 'mcq',
 'I/O Ports on the Classical 8051 Microcontroller',
 'How many parallel 8-bit Input/Output ports are available on a standard 8051 microcontroller package?',
 '[{"label":"A","text":"2 ports (P0, P1)"},{"label":"B","text":"4 ports (P0, P1, P2, P3)"},{"label":"C","text":"6 ports (P0 to P5)"},{"label":"D","text":"8 ports (P0 to P7)"}]'::jsonb,
 'B',
 'The standard 40-pin 8051 features four 8-bit bidirectional parallel I/O ports: Port 0 (open-drain multiplexed address/data), Port 1, Port 2 (higher-order address bus), and Port 3 (special functions like RXD, TXD, INT0, INT1).', 10),

('mc-mcq-03', 'microcontrollers', 'Serial Communication', 'I2C Bus', 'Easy', 'mcq',
 'Signal Lines of the I2C Bus',
 'Which two signal lines are used by the I2C (Inter-Integrated Circuit) two-wire serial communication protocol?',
 '[{"label":"A","text":"TXD and RXD"},{"label":"B","text":"SDA (Serial Data) and SCL (Serial Clock)"},{"label":"C","text":"MOSI and MISO"},{"label":"D","text":"CAN_H and CAN_L"}]'::jsonb,
 'B',
 'I2C uses two bidirectional open-drain lines pulled high with resistors: SDA (Serial Data Line) and SCL (Serial Clock Line). Multiple slaves are addressed by software addresses on the bus.', 10),

('mc-mcq-04', 'microcontrollers', 'Serial Communication', 'SPI Bus', 'Medium', 'mcq',
 'Characteristics of SPI Protocol',
 'Which of the following describes the Serial Peripheral Interface (SPI) protocol accurately?',
 '[{"label":"A","text":"Asynchronous, half-duplex with start/stop bits"},{"label":"B","text":"Synchronous, full-duplex master-slave interface with dedicated chip select lines"},{"label":"C","text":"Two-wire multi-master differential bus"},{"label":"D","text":"Non-clocked single-wire interface"}]'::jsonb,
 'B',
 'SPI is a 4-wire synchronous, full-duplex protocol (MOSI, MISO, SCK, CS/SS). It supports very high clock speeds (tens of MHz) because it uses push-pull hardware clocking without protocol packet overhead.', 10),

('mc-mcq-05', 'microcontrollers', 'Timers & Interrupts', 'Interrupt Service Routine', 'Medium', 'mcq',
 'Best Practice in Interrupt Service Routines (ISRs)',
 'What is an essential architectural rule when designing an Interrupt Service Routine (ISR) in embedded systems?',
 '[{"label":"A","text":"Perform long-running while() loops and print debugging statements inside the ISR"},{"label":"B","text":"Keep the ISR as short and fast as possible; set a flag and defer heavy processing to the main loop"},{"label":"C","text":"Always invoke malloc() and free() inside the ISR"},{"label":"D","text":"Disable watchdog timers completely within each ISR"}]'::jsonb,
 'B',
 'An ISR preempts normal task execution and typically runs with other interrupts masked or at high priority. Keeping it minimal (e.g., clearing the interrupt flag, copying raw byte, setting a task flag) prevents missed interrupts and timing jitter.', 10),

('mc-mcq-06', 'microcontrollers', 'System Reliability', 'Watchdog Timer', 'Easy', 'mcq',
 'Purpose of Watchdog Timer (WDT)',
 'What is the role of a hardware Watchdog Timer in mission-critical embedded systems?',
 '[{"label":"A","text":"To measure CPU temperature in real time"},{"label":"B","text":"To automatically reset or restart the microcontroller if the firmware hangs, deadlocks, or crashes"},{"label":"C","text":"To encrypt memory bus cycles against tampering"},{"label":"D","text":"To act as a high-precision real-time clock for calendar dates"}]'::jsonb,
 'B',
 'A Watchdog Timer is an autonomous countdown timer. The main firmware must periodically "kick" or reload it. If the software deadlocks, enters an infinite loop, or hangs, the counter reaches zero and asserts a hardware system reset.', 10),

('mc-mcq-07', 'microcontrollers', 'Actuators', 'PWM', 'Easy', 'mcq',
 'Pulse Width Modulation (PWM) Principle',
 'How does Pulse Width Modulation (PWM) control the speed of a DC motor or brightness of an LED using digital outputs?',
 '[{"label":"A","text":"By changing the voltage level between 0V and 50V continuously"},{"label":"B","text":"By varying the duty cycle (ratio of ON time to total period) of a high-frequency digital square wave"},{"label":"C","text":"By changing the CPU crystal frequency"},{"label":"D","text":"By switching between UART and SPI protocols"}]'::jsonb,
 'B',
 'Digital pins can only output HIGH or LOW. By pulsing the pin at high frequency and adjusting the duty cycle (percentage of time spent HIGH), the average analog power delivered over time is accurately varied.', 10),

('mc-mcq-08', 'microcontrollers', 'ARM Cortex', 'Registers', 'Medium', 'mcq',
 'ARM Cortex-M Program Counter Register',
 'In the ARM Cortex-M processor architecture (e.g., STM32, RP2040), which core register serves as the Program Counter (PC)?',
 '[{"label":"A","text":"R0"},{"label":"B","text":"R13 (SP)"},{"label":"C","text":"R14 (LR)"},{"label":"D","text":"R15 (PC)"}]'::jsonb,
 'D',
 'In ARM 32-bit architecture: R13 is the Stack Pointer (SP), R14 is the Link Register (LR holding subroutine return addresses), and R15 is the Program Counter (PC holding the next instruction fetch address).', 10),

('mc-mcq-09', 'microcontrollers', 'Embedded C', 'Bitwise Manipulation', 'Medium', 'mcq',
 'Setting a Bit in a Hardware Register',
 'In Embedded C, which bitwise operator and expression sets (turns to 1) bit number 4 of a peripheral register REG without altering other bits?',
 '[{"label":"A","text":"REG &= ~(1 << 4);"},{"label":"B","text":"REG |= (1 << 4);"},{"label":"C","text":"REG ^= (1 << 4);"},{"label":"D","text":"REG = (1 << 4);"}]'::jsonb,
 'B',
 'Bitwise OR (|) with a mask containing a 1 at bit 4 sets that specific bit while preserving all other bits unchanged (x | 1 = 1, x | 0 = x).', 10),

('mc-mcq-10', 'microcontrollers', 'Embedded C', 'Volatile Keyword', 'Hard', 'mcq',
 'Purpose of "volatile" Keyword in Embedded C',
 'Why must hardware peripheral registers and variables shared between an ISR and main loop be declared with the "volatile" type qualifier in C?',
 '[{"label":"A","text":"To tell the compiler to store the variable in Flash ROM instead of RAM"},{"label":"B","text":"To prevent the compiler optimizer from caching the value in a CPU register or deleting reads/writes"},{"label":"C","text":"To make the variable thread-safe using mutual exclusion"},{"label":"D","text":"To ensure the variable accepts negative values"}]'::jsonb,
 'B',
 'Without `volatile`, the optimizing compiler assumes a memory location changes only through program statements in that immediate function scope and may cache it in a CPU register or optimize out polling loops (`while(!ready);`). `volatile` forces the CPU to read and write directly to physical memory on every access.', 10)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    explanation = EXCLUDED.explanation;

-- Commit confirmation
SELECT 'Successfully created practice_subjects, practice_questions, and practice_attempts tables with RLS and 70 seeded questions.' AS migration_status;
