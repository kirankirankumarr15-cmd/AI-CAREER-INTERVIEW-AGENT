import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoleRequirements, RoadmapSourceItem } from './types';
import { getCachedRoleRequirements, saveRoleRequirementsCache, normalizeRoleKey } from './db';

const CURRENT_YEAR = new Date().getFullYear();

// Curated authoritative documentation links mapped to standard roles
const AUTHORITATIVE_BENCHMARKS: Record<string, Partial<RoleRequirements>> = {
  'full stack developer': {
    coreSkills: ['TypeScript', 'React.js', 'Next.js App Router', 'Node.js', 'PostgreSQL', 'REST & GraphQL APIs', 'Tailwind CSS'],
    niceToHaveSkills: ['Docker', 'Redis Caching', 'CI/CD Pipelines', 'AWS / Vercel Deployment', 'WebSockets', 'Jest / Playwright Testing'],
    toolsAndFrameworks: ['Next.js 15+', 'Prisma ORM', 'Git & GitHub', 'Postman', 'Docker', 'Zod', 'Tailwind CSS'],
    projectIdeas: [
      {
        title: 'Full-Stack Realtime SaaS Application',
        description: 'Build a production multi-tenant web app with server actions, PostgreSQL, role-based access, and Stripe/Razorpay webhooks.',
        skills: ['Next.js', 'PostgreSQL', 'TypeScript', 'Authentication'],
      },
      {
        title: 'Collaborative Document or Whiteboard Platform',
        description: 'Create a live multi-user editing workspace with WebSockets, optimistic UI updates, and conflict resolution.',
        skills: ['WebSockets', 'React.js', 'Node.js', 'Redis'],
      },
      {
        title: 'High-Performance API Gateway with Rate Limiting',
        description: 'Develop a microservices routing layer with token bucket rate limiting, JWT validation, and structured request logging.',
        skills: ['Node.js', 'Redis', 'Docker', 'Systems Design'],
      },
    ],
    interviewTopics: [
      'React Server Components (RSC) vs Client Components',
      'Database indexing, N+1 query problem, and ACID transactions',
      'JWT vs Session cookies with CSRF/CORS security',
      'Event loop, async/await microtasks, and stream processing in Node.js',
      'System design: Designing a URL shortener or rate limiter',
    ],
    certifications: [
      'AWS Certified Developer – Associate',
      'Meta Front-End & Back-End Developer Professional Certificate',
    ],
    fresherExpectations: [
      'Clean Git commit hygiene and branching strategy',
      'Ability to build and connect a CRUD API with a relational database',
      'Understanding of responsive design, accessibility, and modern React hooks',
      'Comfortable reading and debugging HTTP status codes and network requests',
    ],
    sources: [
      { url: 'https://roadmap.sh/full-stack', title: 'Roadmap.sh — Full Stack Developer Roadmap (2026)', fetchedAt: new Date().toISOString() },
      { url: 'https://developer.mozilla.org/en-US/docs/Learn', title: 'MDN Web Docs — Modern Web Development Curriculum', fetchedAt: new Date().toISOString() },
      { url: 'https://nextjs.org/docs', title: 'Next.js Official Documentation — App Router & Architecture', fetchedAt: new Date().toISOString() },
      { url: 'https://www.postgresql.org/docs/current/', title: 'PostgreSQL Official Documentation — Relational Data & Queries', fetchedAt: new Date().toISOString() },
    ],
  },
  'data analyst': {
    coreSkills: ['SQL (Complex Joins, Window Functions, CTEs)', 'Python (Pandas, NumPy)', 'Data Visualization (PowerBI / Tableau)', 'Excel / Google Sheets (VLOOKUP, Pivot Tables)', 'Exploratory Data Analysis (EDA)'],
    niceToHaveSkills: ['Statistical Modeling', 'A/B Testing Methodologies', 'dbt (Data Build Tool)', 'Snowflake / BigQuery', 'Basic Machine Learning (Scikit-Learn)'],
    toolsAndFrameworks: ['PostgreSQL', 'PowerBI', 'Tableau', 'Jupyter Notebooks', 'Git', 'Google BigQuery'],
    projectIdeas: [
      {
        title: 'E-Commerce Customer Retention & Cohort Analysis',
        description: 'Analyze real-world transactional data using SQL CTEs to calculate churn rate, customer lifetime value (LTV), and purchase cohorts.',
        skills: ['SQL', 'Window Functions', 'PowerBI', 'Cohort Analysis'],
      },
      {
        title: 'Supply Chain Anomaly Detection & Operations Dashboard',
        description: 'Clean raw logistics data with Python Pandas and build an interactive KPI dashboard with automated trend forecasting.',
        skills: ['Python', 'Pandas', 'Tableau', 'Data Cleaning'],
      },
    ],
    interviewTopics: [
      'Window functions (ROW_NUMBER vs RANK vs DENSE_RANK)',
      'Designing Star schema vs Snowflake schema for analytical queries',
      'Calculating retention rate and diagnosing sudden metric drops',
      'Difference between Type 1 and Type 2 error in A/B testing',
    ],
    certifications: [
      'Google Data Analytics Professional Certificate',
      'Microsoft Certified: Power BI Data Analyst Associate (PL-300)',
    ],
    fresherExpectations: [
      'Writing bug-free multi-table SQL queries with aggregation',
      'Transforming unstructured CSV data into clean analytical datasets',
      'Presenting business insights clearly with charts to non-technical stakeholders',
    ],
    sources: [
      { url: 'https://roadmap.sh/data-analyst', title: 'Roadmap.sh — Data Analyst Career Roadmap (2026)', fetchedAt: new Date().toISOString() },
      { url: 'https://pandas.pydata.org/docs/', title: 'Pandas Documentation — Python Data Analysis Library', fetchedAt: new Date().toISOString() },
      { url: 'https://learn.microsoft.com/en-us/power-bi/', title: 'Microsoft Power BI Official Documentation', fetchedAt: new Date().toISOString() },
    ],
  },
  'ai / machine learning engineer': {
    coreSkills: ['Python', 'PyTorch / TensorFlow', 'Mathematics (Linear Algebra, Calculus, Probability)', 'Data Preprocessing & Feature Engineering', 'Model Evaluation & Tuning', 'Scikit-Learn'],
    niceToHaveSkills: ['Transformers & HuggingFace', 'Vector Databases (Pinecone, pgvector)', 'LangChain / LlamaIndex / Agentic Systems', 'MLOps (MLflow, Docker)', 'ONNX & Model Quantization'],
    toolsAndFrameworks: ['PyTorch', 'HuggingFace', 'FastAPI', 'pgvector', 'Docker', 'Weights & Biases'],
    projectIdeas: [
      {
        title: 'Domain-Specific RAG Knowledge Engine with Re-ranking',
        description: 'Implement a semantic retrieval system with hybrid dense-sparse search, cross-encoder re-ranking, and hallucination guardrails.',
        skills: ['Python', 'pgvector', 'FastAPI', 'PyTorch', 'Embeddings'],
      },
      {
        title: 'End-to-End Computer Vision / NLP Model Deployment Pipeline',
        description: 'Fine-tune a pretrained vision transformer or LLM, containerize with Docker, and serve with low latency on FastAPI.',
        skills: ['HuggingFace', 'PyTorch', 'Docker', 'FastAPI'],
      },
    ],
    interviewTopics: [
      'Bias-variance tradeoff and regularization techniques (L1/L2, Dropout)',
      'Attention mechanism and transformer self-attention calculations',
      'Handling imbalanced datasets (SMOTE, focal loss, precision-recall curve)',
      'Quantization, pruning, and inference latency optimization',
    ],
    certifications: [
      'DeepLearning.AI Machine Learning Specialization',
      'AWS Certified Machine Learning – Specialty',
    ],
    fresherExpectations: [
      'Strong command of numpy vectorization and tensor manipulation',
      'Clear understanding of training loop, loss backpropagation, and metrics',
      'Ability to clean datasets and avoid data leakage in train/test splits',
    ],
    sources: [
      { url: 'https://roadmap.sh/ai-data-scientist', title: 'Roadmap.sh — AI & Data Science Roadmap (2026)', fetchedAt: new Date().toISOString() },
      { url: 'https://pytorch.org/docs/stable/index.html', title: 'PyTorch Official Documentation & Tutorials', fetchedAt: new Date().toISOString() },
      { url: 'https://huggingface.co/docs', title: 'Hugging Face Transformers & Datasets Documentation', fetchedAt: new Date().toISOString() },
    ],
  },
  'devops & cloud engineer': {
    coreSkills: ['Linux & Bash Scripting', 'Docker & Containerization', 'Kubernetes Orchestration', 'CI/CD (GitHub Actions, GitLab CI)', 'Infrastructure as Code (Terraform)', 'Cloud Fundamentals (AWS / Azure / GCP)'],
    niceToHaveSkills: ['Prometheus & Grafana Monitoring', 'Helm Charts', 'Service Mesh (Istio)', 'Ansible Configuration Management', 'Security & Secrets Management (HashiCorp Vault)'],
    toolsAndFrameworks: ['Linux (Ubuntu/Debian)', 'Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'AWS'],
    projectIdeas: [
      {
        title: 'Automated Multi-Environment GitOps Pipeline',
        description: 'Set up automated linting, test execution, container builds, security scanning (Trivy), and staging deployment via GitHub Actions.',
        skills: ['GitHub Actions', 'Docker', 'Terraform', 'AWS'],
      },
      {
        title: 'High-Availability Kubernetes Cluster with Monitoring',
        description: 'Deploy a replicated microservice with ingress routing, rolling updates, HPA auto-scaling, and Prometheus metric alerts.',
        skills: ['Kubernetes', 'Helm', 'Prometheus', 'Grafana'],
      },
    ],
    interviewTopics: [
      'Container lifecycle and Docker layer caching optimization',
      'Kubernetes Pod scheduling, services, ingress, and persistent volumes',
      'Terraform state management, locks, and drift detection',
      'Blue-Green vs Canary deployment strategies',
    ],
    certifications: [
      'AWS Certified Solutions Architect – Associate',
      'Certified Kubernetes Administrator (CKA)',
    ],
    fresherExpectations: [
      'Proficiency with Linux command line, networking (DNS, subnets, SSH), and permissions',
      'Writing multi-stage Dockerfiles that produce minimal secure images',
      'Configuring automated CI/CD builds on GitHub or GitLab',
    ],
    sources: [
      { url: 'https://roadmap.sh/devops', title: 'Roadmap.sh — DevOps Engineer Roadmap (2026)', fetchedAt: new Date().toISOString() },
      { url: 'https://docs.docker.com/', title: 'Docker Documentation — Containerization Engine', fetchedAt: new Date().toISOString() },
      { url: 'https://kubernetes.io/docs/home/', title: 'Kubernetes Official Documentation', fetchedAt: new Date().toISOString() },
      { url: 'https://developer.hashicorp.com/terraform/docs', title: 'Terraform Official Documentation — Infrastructure as Code', fetchedAt: new Date().toISOString() },
    ],
  },
};

/**
 * Execute targeted web search for role requirements using official Google Search API or Gemini Grounding
 */
export async function fetchLiveRoleResearch(role: string): Promise<RoleRequirements> {
  const roleKey = normalizeRoleKey(role);
  const searchQueries = [
    `${role} skills required ${CURRENT_YEAR}`,
    `${role} job description requirements ${CURRENT_YEAR}`,
    `${role} roadmap ${CURRENT_YEAR}`,
    `${role} interview topics ${CURRENT_YEAR}`,
    `${role} fresher entry-level tools ${CURRENT_YEAR}`,
  ];

  console.log(`[ROADMAP RESEARCHER] Starting server-side research for "${role}" [${roleKey}] (${CURRENT_YEAR})`);

  let liveSources: RoadmapSourceItem[] = [];
  let researchSummary = '';

  // 1. Try Google Programmable Search JSON API if configured
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (googleApiKey && searchEngineId && !googleApiKey.startsWith('AQ.')) {
    try {
      console.log(`[ROADMAP RESEARCHER] Querying Google Programmable Search API...`);
      for (const query of searchQueries.slice(0, 3)) {
        const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=3`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: { link?: string; title?: string; snippet?: string }) => {
              if (item.link && !liveSources.some((s) => s.url === item.link)) {
                liveSources.push({
                  url: item.link,
                  title: item.title || query,
                  fetchedAt: new Date().toISOString(),
                });
                researchSummary += `Source: ${item.title} (${item.link})\nSnippet: ${item.snippet}\n\n`;
              }
            });
          }
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.warn('[ROADMAP RESEARCHER] Google Search JSON API notice:', errMsg);
    }
  }

  // 2. Try Gemini with Google Search Grounding if sources not yet gathered
  const geminiKey = process.env.GEMINI_API_KEY;
  if (liveSources.length === 0 && geminiKey) {
    const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    const genAI = new GoogleGenerativeAI(geminiKey);

    for (const modelName of candidateModels) {
      try {
        console.log(`[ROADMAP RESEARCHER] Attempting live search grounding with ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} } as unknown as import('@google/generative-ai').Tool],
        });

        const prompt = `Research current industry expectations for the role: "${role}" for college students in ${CURRENT_YEAR}.
List key requirements:
1. Core essential skills
2. Modern tools & frameworks
3. Key project types demanded by hiring managers
4. Important interview topics
5. Authoritative reference URLs and docs for this role.`;

        const res = await model.generateContent(prompt);
        const text = res.response.text();
        if (text) {
          researchSummary += text;
          const candidate = res.response.candidates?.[0];
          const chunks = candidate?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            chunks.forEach((chunk: { web?: { uri?: string; title?: string } }) => {
              if (chunk.web?.uri) {
                liveSources.push({
                  url: chunk.web.uri,
                  title: chunk.web.title || `${role} Reference Source`,
                  fetchedAt: new Date().toISOString(),
                });
              }
            });
          }
          break;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[ROADMAP RESEARCHER] Model ${modelName} grounding notice:`, errMsg);
      }
    }
  }

  // 3. Fallback to Verified Industry Benchmark if search was unavailable or ratelimited
  const benchmark = findBestBenchmark(role);
  if (liveSources.length === 0 && benchmark) {
    console.log(`[ROADMAP RESEARCHER] Using authoritative 2026 benchmark data for "${role}"`);
    liveSources = benchmark.sources || [];
  }

  // 4. Synthesize structured RoleRequirements using Gemini LLM (no fake URLs permitted)
  const structuredRequirements = await synthesizeRequirementsWithLLM(
    role,
    researchSummary,
    liveSources,
    benchmark
  );

  return structuredRequirements;
}

/**
 * Match user role query to the closest authoritative benchmark
 */
function findBestBenchmark(role: string): Partial<RoleRequirements> | null {
  const norm = normalizeRoleKey(role);
  if (norm.includes('full stack') || norm.includes('web') || norm.includes('software') || norm.includes('sde')) {
    return AUTHORITATIVE_BENCHMARKS['full stack developer'];
  }
  if (norm.includes('data') || norm.includes('analyst') || norm.includes('business')) {
    return AUTHORITATIVE_BENCHMARKS['data analyst'];
  }
  if (norm.includes('ai') || norm.includes('machine learning') || norm.includes('ml') || norm.includes('deep learning')) {
    return AUTHORITATIVE_BENCHMARKS['ai / machine learning engineer'];
  }
  if (norm.includes('devops') || norm.includes('cloud') || norm.includes('infrastructure') || norm.includes('sre')) {
    return AUTHORITATIVE_BENCHMARKS['devops & cloud engineer'];
  }
  return AUTHORITATIVE_BENCHMARKS['full stack developer'];
}

/**
 * Synthesize extracted research into structured JSON
 */
async function synthesizeRequirementsWithLLM(
  role: string,
  researchSummary: string,
  sources: RoadmapSourceItem[],
  benchmark: Partial<RoleRequirements> | null
): Promise<RoleRequirements> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // If research text and Gemini are available, synthesize
  if (geminiKey && researchSummary.trim().length > 100) {
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview'];
    const genAI = new GoogleGenerativeAI(geminiKey);

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `You are a Principal Technical Recruiter and Career Systems Architect.
Normalize the live web research below into a clean, structured JSON schema for role "${role}" in ${CURRENT_YEAR}.

LIVE RESEARCH NOTES:
${researchSummary.slice(0, 4000)}

CRITICAL RULES:
- ONLY output a valid JSON object. Do not include markdown code block syntax.
- Do NOT fabricate fake URLs. All resources must reference real tools, frameworks, and official docs.
- Target expectations suitable for college students & fresh graduates entering industry in ${CURRENT_YEAR}.

REQUIRED JSON STRUCTURE:
{
  "coreSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill3", "skill4"],
  "toolsAndFrameworks": ["tool1", "tool2"],
  "projectIdeas": [
    { "title": "Project Name", "description": "Specific buildable description", "skills": ["skill1", "skill2"] }
  ],
  "interviewTopics": ["topic1", "topic2"],
  "certifications": ["cert1"],
  "fresherExpectations": ["expectation1", "expectation2"]
}`;

        const res = await model.generateContent(prompt);
        const text = res.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);

        return {
          role,
          roleKey: normalizeRoleKey(role),
          fetchedAt: now.toISOString(),
          expiresAt,
          isLive: true,
          coreSkills: Array.isArray(parsed.coreSkills) ? parsed.coreSkills : benchmark?.coreSkills || [],
          niceToHaveSkills: Array.isArray(parsed.niceToHaveSkills) ? parsed.niceToHaveSkills : benchmark?.niceToHaveSkills || [],
          toolsAndFrameworks: Array.isArray(parsed.toolsAndFrameworks) ? parsed.toolsAndFrameworks : benchmark?.toolsAndFrameworks || [],
          projectIdeas: Array.isArray(parsed.projectIdeas) ? parsed.projectIdeas : benchmark?.projectIdeas || [],
          interviewTopics: Array.isArray(parsed.interviewTopics) ? parsed.interviewTopics : benchmark?.interviewTopics || [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : benchmark?.certifications || [],
          fresherExpectations: Array.isArray(parsed.fresherExpectations) ? parsed.fresherExpectations : benchmark?.fresherExpectations || [],
          sources,
        };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[ROADMAP RESEARCHER] Synthesis failed on ${modelName}:`, errMsg);
      }
    }
  }

  // Fallback to high-quality benchmark data
  return {
    role,
    roleKey: normalizeRoleKey(role),
    fetchedAt: now.toISOString(),
    expiresAt,
    isLive: false,
    coreSkills: benchmark?.coreSkills || ['Software Engineering', 'Problem Solving', 'Git'],
    niceToHaveSkills: benchmark?.niceToHaveSkills || ['Docker', 'Cloud Basics'],
    toolsAndFrameworks: benchmark?.toolsAndFrameworks || ['VS Code', 'Git', 'Linux'],
    projectIdeas: benchmark?.projectIdeas || [
      {
        title: `${role} Capstone System`,
        description: `Build an end-to-end production application demonstrating core ${role} workflows.`,
        skills: benchmark?.coreSkills?.slice(0, 3) || ['Software Design'],
      },
    ],
    interviewTopics: benchmark?.interviewTopics || ['DSA & Problem Solving', 'System Architecture', 'Behavioral STAR'],
    certifications: benchmark?.certifications || ['Industry Standard Specialization'],
    fresherExpectations: benchmark?.fresherExpectations || [
      'Strong fundamentals in target programming languages',
      'Version control collaboration and clean documentation',
    ],
    sources: sources.length > 0 ? sources : (benchmark?.sources || [
      { url: 'https://roadmap.sh', title: 'Roadmap.sh — Community Developer Roadmaps', fetchedAt: now.toISOString() },
    ]),
  };
}

/**
 * Get or refresh role research (with 14-day cache check)
 */
export async function getOrResearchRole(
  role: string,
  forceRefresh = false
): Promise<RoleRequirements> {
  if (!forceRefresh) {
    const cached = await getCachedRoleRequirements(role);
    if (cached) {
      console.log(`[ROADMAP RESEARCHER] Returning fresh cache for "${role}" (fetched at ${cached.fetchedAt})`);
      return cached;
    }
  }

  // Live research and store in database
  const fresh = await fetchLiveRoleResearch(role);
  try {
    const cacheId = await saveRoleRequirementsCache(fresh);
    fresh.cacheId = cacheId;
  } catch (err) {
    console.warn('[ROADMAP RESEARCHER] Cache save error:', err);
  }
  return fresh;
}
