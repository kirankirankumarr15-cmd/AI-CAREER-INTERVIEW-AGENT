import { NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/ai/gemini';

export async function POST(req: Request) {
  try {
    const { code, language, title, description, examples } = await req.json();

    if (!code || code.trim().length < 10 || code.includes('// Your code here')) {
      return NextResponse.json({
        passed: false,
        output: 'Compilation Error: No implementation found. Please write your solution before running.'
      });
    }

    const prompt = `You are a Code Execution Engine for a platform like LeetCode.
You need to evaluate the student's code against the provided problem.
Do not actually run the code if it's unsafe, just analyze if the logic works for the examples and edge cases.
If the logic is clearly wrong, incomplete, or empty, return passed: false.

Problem Title: ${title}
Problem Description: ${description}
Language: ${language}
Examples: ${JSON.stringify(examples)}

Student Code:
\`\`\`${language}
${code}
\`\`\`

Return a JSON object with:
- "passed": boolean (true if the code appears correct and solves the problem, false otherwise)
- "output": string (If passed, show something like "Test Case 1: Passed\\nTest Case 2: Passed". If failed, explain which testcase failed and why, or show a compilation error/stack trace style message.)
`;

    const fallbackResponse = {
      passed: false,
      output: 'SyntaxError: Unexpected end of input or failed to evaluate.'
    };

    const evaluation = await callGeminiJSON(prompt, fallbackResponse);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Code Evaluation API Error:', error);
    return NextResponse.json({ passed: false, output: 'Internal Server Error during execution.' }, { status: 500 });
  }
}
