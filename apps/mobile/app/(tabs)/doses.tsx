import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorRetry } from '@/components/ErrorRetry';
import { Icon } from '@/components/Icon';
import { ProBadge } from '@/components/ProBadge';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { type DoseRecord, listDoses } from '@/lib/api';
import { type InjectionSite, SITE_LABELS } from '@/lib/rotation';

// Human "3 May", "Yesterday", "Today" for a dose timeline row.
const formatDay = (iso: string): string => {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Doses / History — the dose-log timeline (spec §3). Pro layers the
// medication-level (pharmacokinetic) curve on top; the basic log is free. The
// titration ladder is its own Pro screen, reachable from here and from Today.
const Doses = () => {
  const router = useRouter();
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { doses: rows } = await listDoses();
      setDoses(rows);
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
      subtitle="Every shot you've logged, with site and mg. Your titration ladder and medication-level curve live here on Pro."
      disclaimer
    >
      {/* Titration ladder entry (Pro) — always available */}
      <Pressable
        onPress={() => router.push('/titration')}
        accessibilityRole="button"
        accessibilityLabel="Open titration ladder"
        className="flex-row items-center justify-between rounded-2xl border border-border bg-sand p-4 active:bg-mist"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-sans-semibold text-[15px] text-ink">
              Titration ladder
            </Text>
            <ProBadge />
          </View>
          <Text className="mt-0.5 font-sans text-[13px] text-muted">
            Your planned dose schedule and where you are on it.
          </Text>
        </View>
        <Icon icon="chevron-right" size={16} color="#5a6b69" />
      </Pressable>

      {/* Timeline */}
      <View className="mt-7">
        <Text className="font-sans-semibold text-[13px] uppercase tracking-[2px] text-muted">
          Dose history
        </Text>

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#0d9488" />
            <Text className="mt-3 font-sans text-[13px] text-muted">
              Loading your doses…
            </Text>
          </View>
        ) : error ? (
          <View className="mt-3">
            <ErrorRetry message={error} onRetry={load} retrying={loading} />
          </View>
        ) : doses.length === 0 ? (
          <View className="mt-3">
            <EmptyState
              icon="syringe"
              title="No doses logged yet"
              body="Log your first shot from the Today tab — it'll appear here with the site and dose."
            />
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {doses.map((d) => (
              <View
                key={d.id}
                className="flex-row items-center justify-between rounded-xl border border-border bg-sand px-4 py-3.5"
              >
                <View className="flex-row items-center gap-3">
                  <View className="size-9 items-center justify-center rounded-full bg-accent">
                    <Icon icon="syringe" size={15} color="#0d9488" />
                  </View>
                  <View>
                    <Text className="font-sans-semibold text-[15px] text-ink">
                      {d.doseMg} mg
                    </Text>
                    {d.injectionSite ? (
                      <Text className="font-sans text-[12px] text-muted">
                        {SITE_LABELS[d.injectionSite as InjectionSite]}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Text className="font-sans text-[12px] text-muted">
                  {formatDay(d.takenAt)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenScaffold>
  );
};

export default Doses;
