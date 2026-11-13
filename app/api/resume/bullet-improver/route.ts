import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePrismJSON } from '@/lib/ai/claude';

export const dynamic = 'force-dynamic';

const BulletImproverSchema = z.object({
  bullet: z.string().min(5).max(1000),
  projectContext: z.object({
    title: z.string().min(1),
    techStack: z.array(z.string()).default([]),
    description: z.string().optional().default(''),
  }).optional(),
  providedMetrics: z.object({
    userCount: z.string().optional(),
    percentageImprovement: z.string().optional(),
    latencyOrSpeed: z.string().optional(),
    scaleMetric: z.string().optional(),
  }).optional(),
});

interface BulletSuggestionOutput {
  x_accomplished: string;
  y_measuredBy: string | null;
  z_doingWhat: string;
  needsMetricInput: boolean;
  metricPromptQuestion: string | null;
  suggestions: Array<{
    variant: 'metric_focused' | 'architecture_focused' | 'efficiency_focused';
    improvedBullet: string;
    whyBetter: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BulletImproverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bullet, projectContext, providedMetrics } = parsed.data;

    // Check if the input bullet already has verified numbers or if numbers are provided
    const hasExistingMetric = /\b\d+(?:\.\d+)?%|\b\d+x\b|\b\d+\+\b|\b\d{2,}\b|\$\d+/i.test(bullet);
    const hasProvidedMetrics = Boolean(
      providedMetrics?.userCount ||
      providedMetrics?.percentageImprovement ||
      providedMetrics?.latencyOrSpeed ||
      providedMetrics?.scaleMetric
    );

    const systemPrompt = `You are the PRISM AI Technical Resume Mentor.
You transform raw engineering bullet points into high-impact Google XYZ statements:
"Accomplished [X] as measured by [Y], by doing [Z]"

CRITICAL RULES:
1. STRICT TRUTHFULNESS: NEVER hallucinate, fabricate, or invent numbers, percentages, company names, or technologies.
2. If the bullet lacks measurable metrics and the student did not provide them, DO NOT invent them. Explicitly set "needsMetricInput": true and provide a specific clarifying question (e.g., "By what percentage did query response times improve?", "How many concurrent requests or users did this handle?").
3. Use only verified tech stack items from the project context.
4. Each bullet MUST start with a strong past-tense action verb (e.g., "Engineered", "Optimized", "Architected", "Automated", "Benchmarked").
5. Return strictly valid JSON matching the requested structure.`;

    const userPrompt = `Input Bullet: "${bullet}"

Project Context:
- Project Title: ${projectContext?.title || 'Engineering Project'}
- Verified Tech Stack: ${projectContext?.techStack?.join(', ') || 'Standard Web Stack'}
- Project Description: ${projectContext?.description || 'Software Engineering Project'}

Student-Provided Metrics:
${
  hasProvidedMetrics
    ? JSON.stringify(providedMetrics, null, 2)
    : 'None provided yet. If measurable data is missing, prompt the student for it.'
}

Produce 3 distinct XYZ improvements:
1. "metric_focused" (emphasizes quantified throughput, percentage reduction, or user scale)
2. "architecture_focused" (emphasizes design patterns, modularity, and clean decoupling)
3. "efficiency_focused" (emphasizes latency reduction, resource optimization, or automation)

Return JSON in this format:
{
  "x_accomplished": "Summary of achievement",
  "y_measuredBy": "Metric or null if missing",
  "z_doingWhat": "Technical methodology and tools",
  "needsMetricInput": ${!hasExistingMetric && !hasProvidedMetrics},
  "metricPromptQuestion": ${!hasExistingMetric && !hasProvidedMetrics ? '"Specific question asking for student metric"' : 'null'},
  "suggestions": [
    {
      "variant": "metric_focused",
      "improvedBullet": "Engineered [X] resulting in [Y] by implementing [Z]",
      "whyBetter": "Explanation of structural improvement"
    },
    {
      "variant": "architecture_focused",
      "improvedBullet": "Architected [X] achieving [Y] utilizing [Z]",
      "whyBetter": "Explanation of structural improvement"
    },
    {
      "variant": "efficiency_focused",
      "improvedBullet": "Optimized [X] improving [Y] via [Z]",
      "whyBetter": "Explanation of structural improvement"
    }
  ]
}`;

    const output = await generatePrismJSON<BulletSuggestionOutput>({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 1200,
      jsonMode: true,
    });

    return NextResponse.json({
      success: true,
      originalBullet: bullet,
      ...output,
    });
  } catch (err: unknown) {
    console.error('Error in /api/resume/bullet-improver:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

