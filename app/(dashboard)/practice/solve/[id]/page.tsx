'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { getQuestionById, Question } from '@/lib/practice/questions';
import { usePracticeStore } from '@/store/usePracticeStore';
import { ArrowLeft, Play, Check, Lightbulb, BookOpen, Clock, Activity, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function getInitialCode(q: Question, lang: string): string {
  if (q.type === 'sql' || lang === 'sql') {
    return q.starterCode?.sql || '-- Write your SQL query here\n\nSELECT * FROM ...';
  }
  if (q.starterCode && q.starterCode[lang]) {
    return q.starterCode[lang];
  }
  switch (lang) {
    case 'c':
      return `#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <string.h>\n\n// Solution for: ${q.title}\nint solve() {\n    // Write your C solution here\n    \n    return 0;\n}\n`;
    case 'java':
      return `import java.util.*;\n\n// Solution for: ${q.title}\nclass Solution {\n    public void solve() {\n        // Write your Java solution here\n        \n    }\n}\n`;
    case 'cpp':
      return `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\n// Solution for: ${q.title}\nclass Solution {\npublic:\n    void solve() {\n        // Write your C++ solution here\n        \n    }\n};\n`;
    case 'python':
      return `# Solution for: ${q.title}\nclass Solution:\n    def solve(self):\n        # Write your Python solution here\n        pass\n`;
    case 'javascript':
    default:
      return `/**\n * Solution for: ${q.title}\n */\nfunction solve() {\n    // Write your JavaScript solution here\n    \n}\n`;
  }
}

export default function SolvePage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const question = getQuestionById(id);
  const { recordAttempt } = usePracticeStore();

  const [language, setLanguage] = useState<string>(() => {
    return question?.type === 'sql' ? 'sql' : 'java';
  });
  const [code, setCode] = useState<string>('');
  const userEditsRef = useRef<Record<string, string>>({});
  const initializedIdRef = useRef<string>('');

  const [activeTab, setActiveTab] = useState<'description' | 'solution'>('description');
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  // Initialize once per problem ID
  useEffect(() => {
    if (question && initializedIdRef.current !== question.id) {
      initializedIdRef.current = question.id;
      const initialLang = question.type === 'sql' ? 'sql' : 'java';
      setLanguage(initialLang);
      const starter = getInitialCode(question, initialLang);
      setCode(starter);
      userEditsRef.current[initialLang] = starter;
    }
  }, [question]);

  const handleLanguageChange = (newLang: string) => {
    if (!question) return;
    // Save current code
    userEditsRef.current[language] = code;
    setLanguage(newLang);

    // Restore cached edit or provide starter code
    if (userEditsRef.current[newLang]) {
      setCode(userEditsRef.current[newLang]);
    } else {
      const freshStarter = getInitialCode(question, newLang);
      userEditsRef.current[newLang] = freshStarter;
      setCode(freshStarter);
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode ?? '';
    setCode(val);
    userEditsRef.current[language] = val;
  };

  if (!question) {
    return notFound();
  }

  const handleRunCode = async () => {
    setConsoleTab('result');
    setIsRunning(true);
    setOutput('Running test cases...');
    
    try {
      const res = await fetch('/api/code/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          title: question.title,
          description: question.description,
          examples: question.examples,
        })
      });
      const data = await res.json();
      
      setOutput(data.output);
      
      if (data.passed) {
        recordAttempt(question.id, question.category, question.topic, true, 100, 0, 120, question.points);
      }
    } catch {
      setOutput('Error connecting to execution server.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0f172a] text-slate-300 font-sans -m-6 sm:-m-8">
      {/* Top Navbar */}
      <div className="h-12 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500">#{question.number.toString().padStart(3, '0')}</span>
            <span className="text-sm font-bold text-slate-200">{question.title}</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              question.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-400/10' :
              question.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
              'text-rose-400 bg-rose-400/10'
            }`}>
              {question.difficulty}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isRunning ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button 
            onClick={handleRunCode}
            className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Submit
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Description */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col bg-[#0f172a] overflow-hidden">
          <div className="flex items-center gap-1 border-b border-slate-800 px-2 pt-2 bg-[#1e293b]">
            <button 
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-colors ${
                activeTab === 'description' ? 'bg-[#0f172a] text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Description
            </button>
            <button 
              onClick={() => setActiveTab('solution')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-2 rounded-t-lg transition-colors ${
                activeTab === 'solution' ? 'bg-[#0f172a] text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" /> Solution
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-sm text-slate-300 leading-relaxed">
            {activeTab === 'description' ? (
              <div className="space-y-6">
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-slate-800 prose-pre:text-slate-300">
                  <ReactMarkdown>{question.description}</ReactMarkdown>
                </div>
                
                {question.examples.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <h3 className="text-sm font-bold text-slate-200">Examples:</h3>
                    {question.examples.map((ex, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-800/50">
                        {ex.input && (
                          <div className="mb-2">
                            <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Input:</span>
                            <code className="block mt-1 text-slate-300 bg-slate-900 px-2 py-1 rounded">{ex.input}</code>
                          </div>
                        )}
                        <div className="mb-2">
                          <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Output:</span>
                          <code className="block mt-1 text-slate-300 bg-slate-900 px-2 py-1 rounded">{ex.output}</code>
                        </div>
                        {ex.explanation && (
                          <div>
                            <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Explanation:</span>
                            <p className="mt-1 text-slate-400 text-sm">{ex.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-xl p-5">
                  <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Optimal Solution
                  </h3>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{question.explanation}</ReactMarkdown>
                  </div>
                </div>
                {question.solution && (
                  <div className="bg-[#1e293b] rounded-xl overflow-hidden border border-slate-800">
                    <div className="bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Reference Code
                    </div>
                    <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
                      <code>{question.solution}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor & Output */}
        <div className="w-1/2 flex flex-col bg-[#1e293b]">
          {/* Editor Toolbar */}
          <div className="h-10 border-b border-slate-800 bg-[#1e293b] flex items-center px-4 shrink-0">
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded px-2.5 py-1 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="c">C (GCC 13)</option>
              <option value="java">Java (OpenJDK 21)</option>
              <option value="cpp">C++ (G++ 17)</option>
              <option value="python">Python 3.12</option>
              <option value="javascript">JavaScript (Node.js 20)</option>
              <option value="sql">SQL (PostgreSQL 16)</option>
            </select>
          </div>
          
          {/* Editor Container */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language={language === 'c' ? 'c' : language === 'cpp' ? 'cpp' : language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
              }}
            />
          </div>
          
          {/* Output / Console Panel */}
          <div className="h-[280px] border-t border-slate-800 bg-[#1e293b] flex flex-col shrink-0">
            <div className="flex items-center gap-2 px-2 pt-2 bg-[#1e293b] border-b border-slate-800">
              <button 
                onClick={() => setConsoleTab('testcase')}
                className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 rounded-t-lg transition-colors ${
                  consoleTab === 'testcase' ? 'bg-[#0f172a] text-slate-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Testcase
              </button>
              <button 
                onClick={() => setConsoleTab('result')}
                className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 rounded-t-lg transition-colors ${
                  consoleTab === 'result' ? 'bg-[#0f172a] text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Activity className="h-3.5 w-3.5" /> Test Result
              </button>
            </div>
            
            <div className="flex-1 bg-[#0f172a] overflow-hidden flex flex-col">
              {consoleTab === 'testcase' ? (
                <div className="p-4 h-full flex flex-col">
                  {question.examples.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                        {question.examples.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveTestCase(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                              activeTestCase === i 
                                ? 'bg-slate-700 text-white' 
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                      
                      {question.examples[activeTestCase] && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                          {question.examples[activeTestCase].input && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Input</label>
                              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm font-mono text-slate-300">
                                {question.examples[activeTestCase].input}
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Expected Output</label>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm font-mono text-slate-300">
                              {question.examples[activeTestCase].output}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                       No testcases available for this problem.
                     </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
                  {output ? (
                    <div className="text-slate-300 whitespace-pre-wrap">{output}</div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                      Run your code to see output here.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
