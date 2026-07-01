'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  listSideEffects,
  logSideEffect,
  type SideEffectRecord,
  type SideEffectType,
} from '@/lib/api';

const TYPES: { type: SideEffectType; label: string }[] = [
  { type: 'NAUSEA', label: 'Nausea' },
  { type: 'CONSTIPATION', label: 'Constipation' },
  { type: 'DIARRHEA', label: 'Diarrhea' },
  { type: 'FATIGUE', label: 'Fatigue' },
  { type: 'REFLUX', label: 'Reflux' },
  { type: 'HEADACHE', label: 'Headache' },
  { type: 'INJECTION_SITE_REACTION', label: 'Injection site' },
  { type: 'OTHER', label: 'Other' },
];

const LABEL: Record<SideEffectType, string> = Object.fromEntries(
  TYPES.map((t) => [t.type, t.label]),
) as Record<SideEffectType, string>;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

// Side effects — log a symptom with a 1–5 severity, then review the history so
// patterns become visible.
const EffectsScreen = () => {
  const [logs, setLogs] = useState<SideEffectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<SideEffectType>('NAUSEA');
  const [severity, setSeverity] = useState(2);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { sideEffects } = await listSideEffects();
      setLogs(sideEffects);
    } catch {
      // soft-fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await logSideEffect({ type, severity });
      trackEvent('side_effect_logged', {
        type,
        severity,
        source: 'effects_tab',
      });
      toast.success('Logged.');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold
      eyebrow="Symptoms"
      title="Side effects"
      subtitle="Log what you're feeling and how strong it is — spot patterns over time."
      disclaimer
    >
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          Symptom
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.type}
              onClick={() => setType(t.type)}
              className={`rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors ${
                type === t.type
                  ? 'border-teal bg-accent text-teal-deep'
                  : 'border-border bg-white text-ink hover:bg-mist'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          Severity
        </p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setSeverity(n)}
              className={`size-11 rounded-xl border-2 text-[16px] font-bold transition-colors ${
                n === severity
                  ? 'border-teal bg-teal text-white'
                  : 'border-border bg-white text-ink hover:bg-mist'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-teal py-3.5 text-[15px] font-bold uppercase tracking-[1px] text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Log side effect'}
        </button>
      </div>

      <div className="mt-8">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          History
        </p>
        {loading ? (
          <p className="mt-3 text-[14px] text-muted-foreground">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted-foreground">
            Nothing logged yet.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {logs.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
              >
                <span className="text-[15px] font-semibold text-ink">
                  {LABEL[l.type] ?? l.type}
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    · severity {l.severity}
                  </span>
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {fmtDate(l.occurredAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScreenScaffold>
  );
};

export default EffectsScreen;
