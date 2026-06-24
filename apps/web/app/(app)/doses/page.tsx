'use client';

import { SITE_LABELS } from '@titrra/types';
import { useCallback, useEffect, useState } from 'react';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { type DoseRecord, listDoses } from '@/lib/api';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// Doses history — the full log of every shot, newest first.
const DosesScreen = () => {
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { doses: d } = await listDoses();
      setDoses(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your doses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenScaffold
      eyebrow="History"
      title="Your doses"
      subtitle="Every shot you've logged — newest first."
      disclaimer
    >
      {loading ? (
        <p className="text-[14px] text-muted-foreground">Loading…</p>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-[14px] text-ink">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-2 text-[14px] font-semibold text-teal hover:underline"
          >
            Try again
          </button>
        </div>
      ) : doses.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">
          No doses logged yet. Log your first shot on the Today tab.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {doses.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
            >
              <span className="text-[15px] font-semibold text-ink">
                {d.doseMg} mg
                {d.injectionSite ? (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    · {SITE_LABELS[d.injectionSite]}
                  </span>
                ) : null}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {fmtDate(d.takenAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </ScreenScaffold>
  );
};

export default DosesScreen;
