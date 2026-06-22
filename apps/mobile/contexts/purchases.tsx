import { PRO_PACKAGES } from '@titrra/types';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import {
  configurePurchases,
  findPackage,
  getCustomerInfo,
  getOfferings,
  hasPro,
  purchasePackage,
  restorePurchases,
} from '@/lib/purchases';

/**
 * Outcome of a purchase attempt. `cancelled` lets the UI stay silent when the
 * user backed out of the native sheet, but surface a real error otherwise
 * (pattern from parking-ticket-pal's paywall).
 */
export type PurchaseResult =
  | { ok: true; cancelled: false }
  | { ok: false; cancelled: boolean };

type PurchasesContextValue = {
  /** Initial customer-info fetch finished (UI can decide what to gate). */
  ready: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
  /**
   * Set when the RevenueCat bootstrap (configure / customer-info / offerings)
   * failed or timed out. Lets the paywall + ProGate show "couldn't verify your
   * plan" + a Retry instead of a dead disabled CTA or an infinite spinner.
   */
  error: boolean;
  /** Re-run the bootstrap (used by the Retry affordance). */
  retry: () => void;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
};

const PurchasesContext = createContext<PurchasesContextValue>({
  ready: false,
  isPro: false,
  offering: null,
  monthly: null,
  annual: null,
  lifetime: null,
  error: false,
  retry: () => {},
  purchase: async () => ({ ok: false, cancelled: false }),
  restore: async () => false,
});

// RevenueCat's getOfferings/getCustomerInfo can hang on a flaky network. Cap
// the bootstrap so ProGate/paywall never spin forever.
const BOOT_TIMEOUT_MS = 12_000;
const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);

export const usePurchases = () => useContext(PurchasesContext);

export const PurchasesProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [error, setError] = useState(false);
  // Bumped by retry() to re-run the bootstrap effect.
  const [bootAttempt, setBootAttempt] = useState(0);

  const applyInfo = useCallback((info: CustomerInfo) => {
    setIsPro(hasPro(info));
  }, []);

  const retry = useCallback(() => {
    setReady(false);
    setError(false);
    setBootAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // TODO: anchor appUserID to the device/anon user id once auth exists, so
      // an anonymous purchase reconciles with the backend (see chunky-crayon's
      // SubscriptionContext). For the skeleton we configure anonymously.
      const ok = await configurePurchases();
      if (!ok) {
        // No SDK key (dev / not configured) — not an error, just no IAP. Ready
        // with no offering; screens treat isPro=false as "free tier".
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const [info, current] = await withTimeout(
          Promise.all([getCustomerInfo(), getOfferings()]),
          BOOT_TIMEOUT_MS,
        );
        if (cancelled) return;
        applyInfo(info);
        setOffering(current);
        setError(false);
      } catch (err) {
        // Configure succeeded but customer-info/offerings failed or timed out.
        // Surface it so the UI offers Retry instead of a dead CTA / spinner.
        console.error('[purchases] boot failed', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyInfo, bootAttempt]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
      try {
        const info = await purchasePackage(pkg);
        applyInfo(info);
        return { ok: hasPro(info), cancelled: false };
      } catch (err: unknown) {
        const cancelled = Boolean(
          err &&
            typeof err === 'object' &&
            'userCancelled' in err &&
            (err as { userCancelled?: boolean }).userCancelled,
        );
        if (!cancelled) console.error('[purchases] purchase failed', err);
        return { ok: false, cancelled };
      }
    },
    [applyInfo],
  );

  const restore = useCallback(async () => {
    try {
      const info = await restorePurchases();
      applyInfo(info);
      return hasPro(info);
    } catch (err) {
      console.error('[purchases] restore failed', err);
      return false;
    }
  }, [applyInfo]);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      ready,
      isPro,
      offering,
      monthly: offering
        ? (findPackage(offering, PRO_PACKAGES.monthly) ?? null)
        : null,
      annual: offering
        ? (findPackage(offering, PRO_PACKAGES.annual) ?? null)
        : null,
      lifetime: offering
        ? (findPackage(offering, PRO_PACKAGES.lifetime) ?? null)
        : null,
      error,
      retry,
      purchase,
      restore,
    }),
    [ready, isPro, offering, error, retry, purchase, restore],
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
};

export default PurchasesProvider;
