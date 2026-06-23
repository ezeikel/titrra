import type { ReactNode } from 'react';

type ScreenScaffoldProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Show the App Store Health & Fitness compliance disclaimer at the foot. */
  disclaimer?: boolean;
  children?: ReactNode;
};

// Shared screen chrome — premium-health styling mirroring the mobile
// ScreenScaffold (Bricolage display title, warm sand surface, generous rhythm).
export const ScreenScaffold = ({
  eyebrow,
  title,
  subtitle,
  disclaimer,
  children,
}: ScreenScaffoldProps) => (
  <div className="mx-auto w-full max-w-md px-6 pb-24 pt-8">
    <p className="text-[12px] font-bold uppercase tracking-[3px] text-teal">
      {eyebrow}
    </p>
    <h1 className="mt-2.5 font-heading text-[34px] font-bold leading-[38px] text-ink">
      {title}
    </h1>
    <p className="mt-2.5 text-[15px] leading-[23px] text-muted-foreground">
      {subtitle}
    </p>

    <div className="mt-7">{children}</div>

    {disclaimer ? (
      <p className="mt-10 text-[11px] leading-[16px] text-muted-foreground/70">
        For tracking and education only. Not medical advice. Titrra never
        recommends a dose change — talk to your healthcare provider.
      </p>
    ) : null}
  </div>
);

export default ScreenScaffold;
