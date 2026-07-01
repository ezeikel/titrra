'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { trackEvent } from '@/lib/analytics';
import {
  listWeights,
  logWeight,
  type WeightRecord,
  type WeightUnit,
} from '@/lib/api';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

// Weight — quick entry + the running log. Trend chart is a future enhancement;
// for now it mirrors the mobile list-first view.
const WeightScreen = () => {
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { weights: w } = await listWeights();
      setWeights(w);
      if (w[0]) setUnit(w[0].unit);
    } catch {
      // soft-fail; empty state shows
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0 || saving) return;
    setSaving(true);
    try {
      await logWeight({ weight: n, unit });
      trackEvent('weight_logged', { unit, source: 'weight_tab' });
      toast.success('Weight logged.');
      setValue('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save weight.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold
      eyebrow="Progress"
      title="Weight"
      subtitle="Log your weight to track the trend over time."
      disclaimer
    >
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder="0.0"
            inputMode="decimal"
            className="h-14 flex-1 rounded-2xl border-2 border-border bg-white px-4 text-[20px] font-bold text-ink outline-none focus:border-teal"
          />
          <div className="flex overflow-hidden rounded-2xl border border-border">
            {(['KG', 'LB'] as WeightUnit[]).map((u) => (
              <button
                type="button"
                key={u}
                onClick={() => setUnit(u)}
                className={`px-5 py-4 text-[14px] font-bold ${
                  u === unit
                    ? 'bg-teal text-white'
                    : 'bg-white text-muted-foreground'
                }`}
              >
                {u.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !value}
          className="mt-4 w-full rounded-2xl bg-teal py-3.5 text-[15px] font-bold uppercase tracking-[1px] text-white hover:bg-teal-deep disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Log weight'}
        </button>
      </div>

      <div className="mt-8">
        <p className="text-[12px] font-bold uppercase tracking-[2px] text-muted-foreground">
          History
        </p>
        {loading ? (
          <p className="mt-3 text-[14px] text-muted-foreground">Loading…</p>
        ) : weights.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted-foreground">
            No weigh-ins yet.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {weights.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
              >
                <span className="text-[15px] font-semibold text-ink">
                  {w.weight} {w.unit.toLowerCase()}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {fmtDate(w.recordedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScreenScaffold>
  );
};

export default WeightScreen;
