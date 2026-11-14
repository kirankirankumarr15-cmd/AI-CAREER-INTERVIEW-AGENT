'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';

interface InsightItem {
  id: string;
  domain: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  evidence: string;
  recommendation: string;
  affectedCount: number;
  suggestedModule: string;
  suggestedUrl: string;
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Institutional AI Intelligence
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AI Placement Readiness Insights
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Aggregated institutional observations and evidence-based curriculum recommendations. AI analyzes trends without exposing individual PII.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
          <span>Regenerate Insights</span>
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className={`card p-6 rounded-2xl border transition-all ${
              item.severity === 'high'
                ? 'border-rose-200 bg-white'
                : item.severity === 'medium'
                ? 'border-amber-200 bg-white'
                : 'border-emerald-200 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    item.severity === 'high'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : item.severity === 'medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {item.severity} Priority
                </span>
                <span className="text-xs font-bold text-slate-500">{item.domain}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Affects ~{item.affectedCount} Students
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <strong className="text-slate-900 block font-bold">Observed Institutional Evidence:</strong>
                <p className="text-slate-600">{item.evidence}</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <strong className="block font-bold">Actionable TPO Recommendation:</strong>
                <p className="text-blue-800">{item.recommendation}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Recommended Resource: <strong className="text-slate-900">{item.suggestedModule}</strong>
              </span>
              <Link
                href={item.suggestedUrl}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Launch Practice Module</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Fairness & Explainability:</strong> Institutional AI insights are descriptive signals derived from anonymized cohort assessment data. AI never makes automated selection or rejection decisions regarding students.
        </p>
      </div>
    </div>
  );
}

