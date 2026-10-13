# PRACTICE HUB — COMPLETE TOPICS + PATTERNS CATALOG

This document serves as the **master topic taxonomy** for the Practice Hub. It is the `practice_topics_seed` and must be used as the base for every category. Google search results only *enrich* it (new questions, sources, company tags). They never replace it.

---

## HOW TO USE THIS IN THE BUILD

**Topic types (add a `topic_type` column):**
- `concept`: theory to understand
- `pattern`: a reusable problem-solving template
- `problem`: practice problem or question set
- `numerical`: calculation-based questions
- `machine_coding`: build-it tasks (frontend, LLD)
- `interview_q`: spoken/written interview question

**Every topic has:** `title`, `category_slug`, `topic_type`, `difficulty` (Beginner / Intermediate / Advanced), `description`, `tags[]`, `company_tags[]` (TCS, Infosys, Wipro, Accenture, Capgemini, Cognizant, Amazon, Microsoft, Google, startups), `source_url` (nullable).

**Card counts** ("28 / 40 Done") = number of rows in this seed (plus Google-enriched rows) vs. the student's completed rows. Never hardcode.

**Pattern view:** each category page gets two tabs: **Topics** and **Patterns**. Patterns show: pattern name, when to use it, template, example problems, and a "Practice 5 problems" button.

---

## 1. DBMS & SQL

**Concepts**
- DBMS vs file system, 3-schema architecture, data independence
- ER model: entities, attributes, relationships, cardinality, weak entity, specialization/generalization
- Relational model, keys (super, candidate, primary, alternate, foreign, composite)
- Integrity constraints (entity, referential, domain)
- Relational algebra (select, project, union, intersection, difference, cross product, join, division, rename)
- SQL categories: DDL, DML, DCL, TCL
- Joins: INNER, LEFT, RIGHT, FULL, CROSS, SELF, NATURAL
- Subqueries (scalar, multi-row, correlated), EXISTS vs IN
- Aggregates, GROUP BY, HAVING, WHERE vs HAVING
- Set operations (UNION, UNION ALL, INTERSECT, EXCEPT)
- Window functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM OVER)
- CTEs, recursive CTEs, views, materialized views
- Indexes: B-tree, B+ tree, hash, clustered vs non-clustered, composite, covering
- Query plans (EXPLAIN), query optimization, execution order
- Functional dependencies, closure, canonical cover
- Normalization: 1NF, 2NF, 3NF, BCNF, 4NF, 5NF, denormalization
- Transactions, ACID, schedules, serializability (conflict, view)
- Concurrency control: 2PL, timestamp ordering, MVCC, locks
- Isolation levels and anomalies (dirty read, non-repeatable, phantom)
- Deadlocks in DBs
- Recovery: WAL, checkpoints, undo/redo, ARIES
- Stored procedures, functions, triggers, cursors
- File organization, hashing, B+ tree numericals
- NoSQL types, CAP theorem, sharding, replication, partitioning

**Patterns (SQL)**
- Nth highest salary
- Find duplicates and delete duplicates
- Top-N per group (ROW_NUMBER + PARTITION)
- Running total and moving average
- Consecutive records / gaps and islands
- Self-join (employee-manager hierarchy)
- Anti-join (NOT EXISTS / LEFT JOIN IS NULL)
- Pivot / conditional aggregation (CASE WHEN)
- Customers who bought everything (relational division)
- Month-over-month / year-over-year change (LAG)
- Recursive hierarchy traversal

**Numericals:** candidate key finding, normal form identification, closure calculation, B+ tree order/height, serializability check.

---

## 2. DATA STRUCTURES & ALGORITHMS

**Concepts**
- Time/space complexity, Big-O, amortized analysis, recurrence relations, Master theorem
- Arrays, 2D arrays/matrices, strings
- Linked lists (singly, doubly, circular)
- Stack, queue, deque, circular queue, priority queue
- Hashing: hash map/set, collisions, chaining vs open addressing
- Recursion and backtracking
- Sorting: bubble, selection, insertion, merge, quick, heap, counting, radix, bucket
- Searching: linear, binary, ternary, exponential
- Trees: binary tree, BST, AVL, red-black (concept), heap, trie, segment tree, Fenwick tree, N-ary tree
- Tree traversals (inorder, preorder, postorder, level order, Morris)
- Graphs: representations, BFS, DFS, topological sort, cycle detection
- Shortest path: Dijkstra, Bellman-Ford, Floyd-Warshall
- MST: Kruskal, Prim; Union-Find (DSU); SCC (Kosaraju, Tarjan)
- Dynamic programming (memoization vs tabulation)
- Greedy algorithms, divide and conquer
- Bit manipulation, number theory (GCD, sieve, modular arithmetic)
- String algorithms: KMP, Rabin-Karp, Z-algorithm
- P vs NP (basic idea)

**Patterns (the heart of this category)**
1. Two Pointers
2. Sliding Window (fixed and variable)
3. Fast & Slow Pointers (cycle detection, middle of list)
4. Prefix Sum / Difference Array
5. Kadane's (max subarray)
6. Binary Search (on index, on answer, rotated array)
7. Monotonic Stack / Queue (next greater element, histogram)
8. Top-K Elements (heap)
9. K-way Merge
10. Merge Intervals
11. Cyclic Sort
12. In-place Linked List Reversal
13. Tree BFS (level order)
14. Tree DFS (path sum, LCA, diameter)
15. Backtracking: subsets, permutations, combinations, N-Queens, Sudoku
16. Graph BFS/DFS on grids (islands, flood fill, rotten oranges)
17. Topological Sort (course schedule)
18. Union-Find (connected components, redundant connection)
19. Shortest path (Dijkstra, 0-1 BFS)
20. Trie (prefix search, word search)
21. Bit Manipulation (XOR tricks, single number, subsets via masks)
22. Greedy (activity selection, jump game, intervals)
23. Hashing / frequency map (two sum, anagrams, subarray sum = K)
24. Matrix traversal (spiral, rotate, diagonal)

**DP Patterns**
- 0/1 Knapsack, Unbounded Knapsack, subset sum, partition equal subset
- Fibonacci / climbing stairs style
- Grid DP (unique paths, min path sum)
- LIS, LCS, edit distance
- Matrix chain / interval DP
- Palindromic DP
- DP on strings, DP on trees, DP on stocks (state machine)
- Bitmask DP, Digit DP

**Problem sets:** Easy 50 / Medium 70 / Hard 30, tagged by pattern and company.

---

## 3. OOP & SYSTEM DESIGN (LLD)

**OOP Concepts**
- Class, object, constructor, destructor, `this`
- 4 pillars: encapsulation, abstraction, inheritance, polymorphism
- Compile-time vs runtime polymorphism, overloading vs overriding
- Abstract class vs interface, access modifiers
- Inheritance types, diamond problem, composition vs inheritance
- Static, final, virtual functions, shallow vs deep copy
- Exception handling, generics, immutability
- SOLID: SRP, OCP, LSP, ISP, DIP (each with violation + fix example)
- DRY, KISS, YAGNI, Law of Demeter, coupling and cohesion
- UML: class, sequence, use case diagrams

**Design Patterns**
- *Creational:* Singleton, Factory Method, Abstract Factory, Builder, Prototype
- *Structural:* Adapter, Decorator, Facade, Proxy, Composite, Bridge, Flyweight
- *Behavioral:* Observer, Strategy, Command, State, Template Method, Iterator, Chain of Responsibility, Mediator, Memento, Visitor
- Anti-patterns: God object, spaghetti code, tight coupling

**Low-Level Design (machine design) problems**
Parking lot, elevator, library management, ATM, vending machine, tic-tac-toe, chess, snake & ladder, BookMyShow, Splitwise, LRU cache, rate limiter, logger, notification service, food delivery, hotel booking, file system, text editor (undo/redo).

**Architecture topics:** monolith vs microservices, API gateway, service discovery, saga, CQRS, event sourcing, circuit breaker, rate-limiter algorithms (token bucket, leaky bucket, fixed/sliding window).

**Pattern drill:** "Which pattern fits this scenario?" MCQs plus "refactor this code using X pattern" tasks.

---

## 4. OPERATING SYSTEMS

**Concepts**
- OS types and functions, kernel vs user mode, system calls, monolithic vs micro kernel
- Process: PCB, states, context switch, fork/exec/wait, zombie and orphan
- Threads: user vs kernel, multithreading models
- IPC: pipes, message queues, shared memory, sockets, signals
- CPU scheduling: FCFS, SJF, SRTF, Round Robin, Priority, Multilevel Queue, MLFQ
- Synchronization: race condition, critical section, mutex, semaphore, monitor, spinlock, Peterson's, test-and-set
- Classic problems: producer-consumer, readers-writers, dining philosophers
- Deadlock: 4 conditions, prevention, avoidance (Banker's), detection, recovery
- Memory management: contiguous, fragmentation, paging, segmentation, TLB
- Virtual memory, demand paging, page faults, thrashing, working set
- Page replacement: FIFO, LRU, Optimal, Clock, Belady's anomaly
- File systems: allocation (contiguous, linked, indexed), inodes, directory structure, FAT, ext4
- Disk scheduling: FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK
- I/O: DMA, interrupts, polling, spooling, buffering
- Boot process, BIOS/UEFI, virtualization, containers vs VMs
- Linux commands, permissions, process management

**Numerical patterns**
- Gantt chart: waiting time, turnaround time, response time
- Banker's algorithm safe sequence
- Page fault counting per algorithm
- Effective Access Time (with TLB)
- Page table size, multi-level paging
- Disk head movement
- Semaphore value problems

**Interview questions:** process vs thread, mutex vs semaphore, what happens on `fork()`, how deadlock is avoided, why paging, what is context switch cost.

---

## 5. COMPUTER NETWORKS

**Concepts**
- Network types, topologies, switching (circuit, packet), delays (transmission, propagation, queuing)
- OSI vs TCP/IP model, functions of each layer
- Physical/Data link: framing, MAC, ARP, Ethernet, switch vs hub, VLAN, CSMA/CD, CSMA/CA, error detection (parity, checksum, CRC), Hamming code
- Flow control: stop-and-wait, Go-Back-N, Selective Repeat
- Network layer: IPv4/IPv6, classful/CIDR, subnetting, VLSM, NAT, ICMP, DHCP
- Routing: distance vector (RIP), link state (OSPF), BGP
- Transport: TCP vs UDP, 3-way handshake, 4-way close, flow control, congestion control (slow start, AIMD), ports, sockets
- Application: HTTP/1.1, HTTP/2, HTTP/3, HTTPS/TLS, DNS (record types, resolution), SMTP, IMAP, FTP, SSH, WebSocket
- Security: symmetric vs asymmetric encryption, digital signature, certificates, firewalls, VPN, DDoS, man-in-the-middle
- CDN, proxy vs reverse proxy, load balancer (L4 vs L7)

**Classic interview questions**
- What happens when you type a URL in the browser?
- TCP vs UDP, GET vs POST, cookies vs sessions
- How does HTTPS work? What is the TLS handshake?
- How does DNS resolve a domain?
- What is a subnet mask? What is NAT?

**Numerical patterns:** subnetting and host count, CIDR ranges, throughput and delay, sliding-window efficiency, CRC calculation, Hamming code, TCP congestion window growth.

---

## 6. FRONTEND & WEB

**HTML/CSS**
- Semantic HTML, forms, accessibility (ARIA, alt text, focus, contrast)
- Box model, display, positioning, z-index, stacking context
- Flexbox, Grid, responsive design (media queries, mobile-first), specificity, cascade
- CSS variables, animations, transitions, BEM, Tailwind concepts

**JavaScript**
- Scope, hoisting, closures, `this`, call/apply/bind, prototypes
- Event loop, microtasks vs macrotasks, promises, async/await
- ES6+: destructuring, spread/rest, modules, optional chaining
- Event bubbling/capturing, delegation, debounce vs throttle
- Deep vs shallow copy, currying, memoization, `==` vs `===`
- Array methods (map/filter/reduce), TypeScript basics

**React / Next.js**
- Components, JSX, props vs state, lifting state, controlled vs uncontrolled
- Hooks: useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, custom hooks
- Virtual DOM, reconciliation, keys, re-render causes, React.memo
- Context, Redux/Zustand basics, error boundaries, Suspense, lazy loading
- Next.js: SSR, SSG, ISR, CSR, App Router, server components, API routes

**Browser & Web Platform**
- Critical rendering path, reflow vs repaint, how a browser renders a page
- Core Web Vitals, performance optimization, code splitting
- Storage: localStorage, sessionStorage, cookies, IndexedDB
- Security: XSS, CSRF, CORS, CSP; service workers, PWA

**Machine coding patterns**
Debounce/throttle, polyfills (map, bind, Promise), todo list, accordion, tabs, modal, autocomplete/typeahead, infinite scroll, star rating, pagination, image carousel, nested comments, progress bar, tic-tac-toe, form validation, drag and drop.

---

## 7. BACKEND & APIs

**Concepts**
- HTTP methods, status codes, idempotency, REST principles, GraphQL, gRPC
- API design: versioning, pagination, filtering, naming, error format
- Authentication vs authorization: sessions, JWT, refresh tokens, OAuth 2.0, OIDC, SSO, RBAC
- Password hashing (bcrypt/argon2), CORS, rate limiting, input validation
- Middleware, routing, MVC, layered architecture, dependency injection
- Databases in backend: SQL vs NoSQL, ORMs, connection pooling, N+1 problem, migrations, transactions
- Caching: Redis, cache-aside, write-through, write-back, TTL, eviction, invalidation, cache stampede
- Message queues: Kafka, RabbitMQ, pub/sub; background jobs, cron
- Webhooks, WebSockets, file uploads, pagination (offset vs cursor)
- Concurrency: Node event loop, threads, async I/O
- Testing: unit, integration, e2e, mocking
- DevOps basics: Docker, CI/CD, environment config, logging, monitoring
- Security: OWASP Top 10, SQL injection, XSS, CSRF, secrets management

**Patterns**
Repository pattern, retry with exponential backoff, idempotency keys, circuit breaker, outbox pattern, saga, CQRS, strangler fig.

**Production debugging scenarios**
Slow API, slow query, memory leak, 500 errors spike, timeouts, high CPU, DB connection exhaustion, race conditions, duplicate payments.

---

## 8. APTITUDE & REASONING

**Quantitative**
- Number system, divisibility, HCF/LCM, remainders, unit digit
- Percentages, profit & loss, discount, simple & compound interest
- Ratio & proportion, averages, mixtures & alligation, partnership
- Time & work, pipes & cisterns, time-speed-distance, trains, boats & streams
- Ages, permutations & combinations, probability, series & sequences
- Algebra, quadratic equations, simplification, surds & indices, logarithms
- Mensuration, geometry, clocks, calendars, data interpretation (tables, bar, pie, line, caselet)

**Logical Reasoning**
- Syllogisms, statements & conclusions/assumptions/arguments
- Coding-decoding, number/letter series, analogy, classification, odd one out
- Blood relations, direction sense, ranking & order
- Seating arrangement (linear, circular), puzzles (floor, day, comparison)
- Venn diagrams, data sufficiency, input-output, logical sequence
- Cubes & dice, figure series, paper folding, mirror/water images

**Verbal**
- Reading comprehension, para jumbles, sentence correction, error spotting
- Fill in the blanks, cloze test, synonyms/antonyms, idioms, one-word substitution
- Subject-verb agreement, tenses, prepositions, articles

**Technical aptitude (campus rounds)**
- Output prediction, pseudocode, debugging, basic C/Java/Python MCQs, CS fundamentals MCQs

**Shortcut patterns**
Percentage-fraction table, successive discount/percentage change, alligation cross method, component method in work problems, relative speed rules, CI-SI difference formulas, unit digit cycles, option elimination, working backwards.

---

## 9. COMMUNICATION

**Skills**
- Self-introduction (Present → Past → Future), 30-second and 2-minute elevator pitch
- Active listening, clarifying questions, structured thinking
- Filler-word control, pace, pauses, tone, volume, pronunciation
- Grammar and vocabulary for professionals, neutral accent clarity
- Explaining technical concepts simply (analogies, layered explanation, thinking aloud)
- Project explanation (problem → approach → your role → result)
- How to say "I don't know" professionally, handling interruptions and tough questions
- Body language, eye contact, camera presence for video interviews
- Telephonic interview skills
- Group Discussion (GD): opening, building, summarizing, handling aggression
- JAM (Just A Minute) speaking drills
- Presentation skills, storytelling
- Professional email writing, LinkedIn messages, follow-up and thank-you emails
- Negotiation and salary conversation basics
- Confidence building, handling nervousness

**Answer-structure patterns**
- PREP: Point, Reason, Example, Point
- STAR (see HR section)
- CAR: Context, Action, Result
- What → So What → Now What
- Pyramid principle (answer first)
- 3-point answers
- Present-Past-Future

**Practice modes (voice-based, scored by the communication analyzer)**
Read-aloud, answer-in-60-seconds, explain-this-concept, record-and-compare, filler-word challenge, speaking-speed challenge.

---

## 10. HR & BEHAVIORAL

**Core questions**
Tell me about yourself, why should we hire you, why this company, why this role, strengths, weaknesses, 5-year goals, why leaving/why now, salary expectations, relocation/shift flexibility, bond/notice period, backlogs or education gaps, hobbies, questions you'd ask the interviewer.

**Behavioral themes (each with STAR practice)**
Failure and learning, conflict with teammate, leadership, teamwork, working under pressure, tight deadlines, handling criticism/feedback, taking initiative, adaptability to change, ethical dilemma, disagreeing with a manager, mistake you made, achievement you're proud of, learning something quickly, handling multiple priorities, going above and beyond, customer/user empathy.

**Situational questions**
What would you do if a teammate isn't contributing / you disagree with your lead / you miss a deadline / you find a bug before release / you're given an unfamiliar task?

**Patterns**
- STAR (Situation, Task, Action, Result) and SOAR variant
- **Story bank:** the student builds 5–6 core stories (project, conflict, failure, leadership, learning, pressure) and maps each to multiple questions
- Weakness formula: real weakness + what you're doing about it + progress
- Why-company formula: company fact + your skill + your goal
- Competency mapping (Amazon-style leadership principles)

**Evaluation:** the AI checks whether the answer actually has all four STAR parts, specific actions ("I" not "we"), and a measurable result.

---

## 11. SYSTEM DESIGN BASICS

**Fundamentals**
- Functional vs non-functional requirements, scope clarification
- Back-of-envelope estimation (QPS, storage, bandwidth, latency numbers)
- Vertical vs horizontal scaling, stateless vs stateful services
- Load balancing (round robin, least connections, consistent hashing; L4 vs L7)
- Caching: client, CDN, server, DB cache; patterns (cache-aside, write-through, write-back); eviction (LRU, LFU, TTL)
- Databases: SQL vs NoSQL, indexing, replication (leader-follower), sharding/partitioning, consistent hashing
- CAP theorem, PACELC, consistency models (strong, eventual), ACID vs BASE
- Message queues, pub/sub, event-driven design, streams
- API gateway, reverse proxy, service discovery, rate limiting
- Monolith vs microservices
- Availability, reliability, fault tolerance, redundancy, failover, SLA/SLO
- Idempotency, retries, timeouts, backpressure
- Observability: logging, metrics, tracing
- Unique ID generation (UUID, Snowflake), Bloom filter, heartbeat, gossip

**Classic design problems (beginner → advanced)**
URL shortener, pastebin, rate limiter, key-value store, notification system, chat app, news feed, file storage (Dropbox), autocomplete/typeahead, web crawler, video streaming, ride sharing, e-commerce cart, ticket booking, distributed cache.

**Patterns**
Read-heavy vs write-heavy design, fan-out on write vs read, cache-aside, CQRS, saga, leader-follower, sharding strategies, queue-based load leveling, circuit breaker.

**Framework to teach:** Requirements → Estimation → API design → Data model → High-level design → Deep dive → Bottlenecks and trade-offs.

---

## CROSS-CATEGORY FEATURES TO ADD

1. **Company tags and filter:** TCS, Infosys, Wipro, Accenture, Capgemini, Cognizant, Amazon, Microsoft, Google, product vs service companies.
2. **Role-fit boost:** use the student's target role (Frontend/Backend/Data etc.) to mark categories as "Role Fit" and sort topics by relevance.
3. **Spaced revision:** topics marked Done reappear for revision after 3, 7, 21 days.
4. **Pattern mastery meter:** progress per pattern, not just per topic.
5. **Interview link:** every topic has an "Ask me about this in a mock interview" button that seeds the Interview Agent with that topic.
6. **Source rule:** show a source URL for every Google-fetched item. Seed items have no external source and are labeled "CareerPilot curated".
