import * as Sentry from '@sentry/react-native';
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
import { getMe } from '@/lib/api';
import {
  configurePurchases,
  findPackage,
  getCustomerInfo,
  getOfferingsWithRetry,
  hasPro,
  missingPackageIds,
  offeringHasAllPackages,
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
      // Anchor RC's appUserID to the DB User.id so an anonymous purchase
      // reconciles with the backend (DB = entitlement source of truth). Fetch
      // it best-effort; if the identity call fails (offline), fall back to an
      // anonymous configure so the paywall still works.
      const userId = await getMe()
        .then((r) => r.userId)
        .catch(() => undefined);
      const ok = await configurePurchases(userId);
      if (!ok) {
        // No SDK key (dev / not configured) — not an error, just no IAP. Ready
        // with no offering; screens treat isPro=false as "free tier".
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const [info, current] = await withTimeout(
          Promise.all([getCustomerInfo(), getOfferingsWithRetry()]),
          BOOT_TIMEOUT_MS,
        );
        if (cancelled) return;
        applyInfo(info);
        // An offering missing any pinned package or its price (StoreKit couldn't
        // fetch a product — a subscription not available in the user's App Store
        // storefront, or a cold-launch race) is NOT a usable paywall: it would
        // render hardcoded USD fallbacks next to a real localized price. Treat it
        // as a recoverable error so the UI shows Retry instead of a live CTA over
        // a broken/wrong-currency plan list. See lib/purchases.ts.
        if (offeringHasAllPackages(current)) {
          setOffering(current);
          setError(false);
        } else {
          // Capture to Sentry (default integrations don't forward console.error)
          // WITH the missing ids, so prod tells us which storefront/product
          // gapped instead of flying blind.
          const missing = missingPackageIds(current);
          console.error('[purchases] offering incomplete', missing);
          Sentry.captureMessage(
            `purchases: offering incomplete (missing: ${missing.join(', ') || 'all'})`,
            'error',
          );
          setOffering(null);
          setError(true);
        }
      } catch (err) {
        // Configure succeeded but customer-info/offerings failed or timed out.
        // Surface it so the UI offers Retry instead of a dead CTA / spinner.
        console.error('[purchases] boot failed', err);
        Sentry.captureException(err, { tags: { area: 'purchases-boot' } });
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
