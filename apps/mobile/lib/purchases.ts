import {
  DEFAULT_OFFERING,
  PRO_ENTITLEMENT,
  PRO_PACKAGES,
} from '@titrra/types';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// These ids MUST match the RevenueCat dashboard config exactly (also exported
// from @titrra/types so web + mobile agree):
//   - entitlement attached to the products → PRO_ENTITLEMENT ('titrra_pro')
//   - offering shown to users ("current")  → DEFAULT_OFFERING ('default')
//   - packages inside that offering         → PRO_PACKAGES ($rc_monthly /
//     $rc_annual / $rc_lifetime)
// See docs/GLP1-RESEARCH-AND-SPEC.md §4.

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;

/**
 * Configure RevenueCat once at startup. No-ops when no key is set (local dev
 * before the dashboard exists) so the app never hard-depends on IAP.
 */
export const configurePurchases = async (userId?: string): Promise<boolean> => {
  if (configured) return true;
  if (!API_KEY) {
    console.warn(
      '[purchases] no RevenueCat key for',
      Platform.OS,
      '— IAP disabled',
    );
    return false;
  }

  // A non-dev build that falls back to a `test_`-prefixed key is pointed at the
  // RevenueCat test store — purchases would never reach the real store. Fail
  // loudly (Sentry captures console.error in prod) rather than ship a dead
  // paywall.
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development';
  if (environment !== 'development' && API_KEY.startsWith('test_')) {
    console.error(
      `[purchases] FATAL: ${environment} build is using a TEST API key for ${Platform.OS}. ` +
        'Set the real EXPO_PUBLIC_REVENUECAT_*_KEY in the EAS environment.',
    );
  }

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  await Purchases.configure({ apiKey: API_KEY, appUserID: userId });
  configured = true;
  return true;
};

/** Fetch the current ("default") offering, or null if unavailable. */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  const offerings = await Purchases.getOfferings();
  return offerings.all[DEFAULT_OFFERING] ?? offerings.current ?? null;
};

/** True when the customer holds the active Pro entitlement. */
export const hasPro = (info: CustomerInfo): boolean =>
  info.entitlements.active[PRO_ENTITLEMENT] !== undefined;

export const getCustomerInfo = (): Promise<CustomerInfo> =>
  Purchases.getCustomerInfo();

/** Purchase a specific package (monthly / annual / lifetime). */
export const purchasePackage = async (
  pkg: PurchasesPackage,
): Promise<CustomerInfo> => {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
};

export const restorePurchases = (): Promise<CustomerInfo> =>
  Purchases.restorePurchases();

/** Pull a package out of the offering by its RevenueCat id, pinned (not [0]). */
export const findPackage = (
  offering: PurchasesOffering,
  id: (typeof PRO_PACKAGES)[keyof typeof PRO_PACKAGES],
): PurchasesPackage | undefined =>
  offering.availablePackages.find((p) => p.identifier === id);
