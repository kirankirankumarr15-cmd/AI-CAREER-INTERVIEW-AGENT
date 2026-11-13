'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Database, RefreshCw, X } from 'lucide-react';

interface HealthSummary {
  database: {
    connected: boolean;
    error?: string | null;
  };
  environment: string;
}

export function DatabaseStatusBanner() {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth({
        database: {
          connected: Boolean(data?.database?.connected),
          error: data?.database?.error,
        },
        environment: data?.environment || 'development',
      });
    } catch {
      setHealth({
        database: { connected: false, error: 'Health endpoint unreachable' },
        environment: 'development',
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (!health || health.database.connected || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs flex items-center justify-between gap-3 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-bold shrink-0">Database Disconnected:</span>
        <span className="truncate text-amber-800 dark:text-amber-300">
          Cloud Supabase is offline. Operating in local sandbox mode. Data is not persisted to production.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={checkHealth}
          disabled={checking}
          className="p-1 hover:bg-amber-500/20 rounded transition-colors text-amber-700 dark:text-amber-300"
          title="Retry database connection"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
        </button>
        <Link
          href="/api/health"
          target="_blank"
          className="font-bold underline hover:text-amber-950 dark:hover:text-white text-[11px]"
        >
          System Health
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-500/20 rounded transition-colors"
          title="Dismiss warning"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

