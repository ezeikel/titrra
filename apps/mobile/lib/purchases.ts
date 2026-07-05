import { DEFAULT_OFFERING, PRO_ENTITLEMENT, PRO_PACKAGES } from '@titrra/types';
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

// The `development` variant (…app.dev) has NO RevenueCat app registered — RC
// only has the prod (…app) and internal/preview (…app.internal) apps. So in dev
// the .env.local keys are the PROD keys, whose bundle id (…app) mismatches the
// dev bundle (…app.dev). Configuring RC anyway produces the noisy "offerings
// could not be fetched from App Store Connect (or the StoreKit Configuration
// file)" LogBox on the simulator (a StoreKit scheme config only applies when
// launched from Xcode, not via expo-dev-client / simctl). Skip RC entirely in
// dev so local + simulator testing stays clean; preview/production configure
// normally. (Same pattern as go-unbeaten.)
const RC_ENABLED =
  (process.env.EXPO_PUBLIC_ENVIRONMENT ?? 'development') !== 'development';

let configured = false;

/**
 * Configure RevenueCat once at startup. No-ops in dev (no RC app for the .dev
 * bundle) or when no key is set, so the app never hard-depends on IAP.
 */
export const configurePurchases = async (userId?: string): Promise<boolean> => {
  if (configured) return true;
  if (!RC_ENABLED) {
    // dev variant — IAP intentionally inert (no .dev RevenueCat app exists).
    return false;
  }
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

/**
 * True when the offering has usable packages. RevenueCat can resolve an
 * offering whose `availablePackages` is EMPTY when StoreKit hasn't finished its
 * async product request yet (cold launch / flaky network) — the offering shell
 * comes back but with no products attached. Treating that as "loaded" leaves the
 * paywall with a live CTA backed by null packages (→ "Plans are loading…" on
 * tap, with no way to recover). So callers must check this, not just non-null.
 * See https://rev.cat/why-are-offerings-empty
 */
export const offeringHasPackages = (
  offering: PurchasesOffering | null,
): offering is PurchasesOffering =>
  !!offering && offering.availablePackages.length > 0;

/**
 * Fetch offerings, retrying with backoff while the result is empty. StoreKit's
 * product request is async and can lose the race with the first getOfferings()
 * call right after configure(); a retry moments later usually populates it.
 * Throws (like getOfferings) on a hard SDK/config error so the caller's catch
 * can surface Retry. Returns a non-empty offering, or null if still empty after
 * all attempts (caller treats null as recoverable, not silent success).
 */
export const getOfferingsWithRetry = async (
  attempts = 3,
  delayMs = 800,
): Promise<PurchasesOffering | null> => {
  let last: PurchasesOffering | null = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await getOfferings();
    if (offeringHasPackages(last)) return last;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  return offeringHasPackages(last) ? last : null;
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
