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

type PurchasesContextValue = {
  /** Initial customer-info fetch finished (UI can decide what to gate). */
  ready: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  monthly: PurchasesPackage | null;
  annual: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
};

const PurchasesContext = createContext<PurchasesContextValue>({
  ready: false,
  isPro: false,
  offering: null,
  monthly: null,
  annual: null,
  lifetime: null,
  purchase: async () => false,
  restore: async () => false,
});

export const usePurchases = () => useContext(PurchasesContext);

export const PurchasesProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  const applyInfo = useCallback((info: CustomerInfo) => {
    setIsPro(hasPro(info));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // TODO: anchor appUserID to the device/anon user id once auth exists, so
      // an anonymous purchase reconciles with the backend (see chunky-crayon's
      // SubscriptionContext). For the skeleton we configure anonymously.
      const ok = await configurePurchases();
      if (!ok) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const [info, current] = await Promise.all([
          getCustomerInfo(),
          getOfferings(),
        ]);
        if (cancelled) return;
        applyInfo(info);
        setOffering(current);
      } catch (err) {
        console.error('[purchases] boot failed', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyInfo]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        const info = await purchasePackage(pkg);
        applyInfo(info);
        return hasPro(info);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'userCancelled' in err &&
          (err as { userCancelled?: boolean }).userCancelled
        ) {
          return false;
        }
        console.error('[purchases] purchase failed', err);
        return false;
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
      monthly: offering ? findPackage(offering, PRO_PACKAGES.monthly) ?? null : null,
      annual: offering ? findPackage(offering, PRO_PACKAGES.annual) ?? null : null,
      lifetime: offering
        ? findPackage(offering, PRO_PACKAGES.lifetime) ?? null
        : null,
      purchase,
      restore,
    }),
    [ready, isPro, offering, purchase, restore],
  );

  return (
    <PurchasesContext.Provider value={value}>
      {children}
    </PurchasesContext.Provider>
  );
};

export default PurchasesProvider;
