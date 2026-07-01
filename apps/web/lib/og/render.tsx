import { ImageResponse } from 'next/og';
import { OG_COLORS, OG_HEIGHT, OG_WIDTH } from '@/lib/og/constants';
import { loadOgFonts } from '@/lib/og/fonts';

// Reusable OG card renderer. Kept in a shared module so the site default and
// (later) per-post/programmatic routes render the same brand card. satori
// requires every multi-child container to declare display:'flex'.

export async function renderSiteOG({
  title,
  subtitle,
  eyebrow = 'GLP-1 & shot tracker',
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}): Promise<ImageResponse> {
  // Step the title down for long strings so it never overflows the card.
  const titleSize = title.length > 50 ? 60 : title.length > 32 ? 72 : 84;

  try {
    const fonts = await loadOgFonts();
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: OG_COLORS.sand,
          padding: '72px 80px',
          fontFamily: 'Inter',
        }}
      >
        {/* Top: wordmark + eyebrow */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                width: 20,
                height: 20,
                borderRadius: 6,
                backgroundColor: OG_COLORS.teal,
              }}
            />
            <div
              style={{
                fontFamily: 'Bricolage',
                fontWeight: 800,
                fontSize: 34,
                color: OG_COLORS.ink,
              }}
            >
              Titrra
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: OG_COLORS.tealDeep,
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Middle: headline + subtitle */}
        <div
          style={{ display: 'flex', flexDirection: 'column', maxWidth: 960 }}
        >
          <div
            style={{
              fontFamily: 'Bricolage',
              fontWeight: 800,
              fontSize: titleSize,
              lineHeight: 1.05,
              color: OG_COLORS.ink,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 24,
                fontSize: 30,
                lineHeight: 1.35,
                color: OG_COLORS.muted,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Bottom: url */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 600,
            color: OG_COLORS.tealDeep,
          }}
        >
          titrra.com
        </div>
      </div>,
      {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: fonts.map((f) => ({
          name: f.name,
          data: f.data,
          weight: f.weight,
          style: f.style,
        })),
      },
    );
  } catch (err) {
    console.error('[og] render failed, using text fallback:', err);
    // Text-only brand fallback — no custom fonts, so it can never throw on a
    // font fetch.
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: OG_COLORS.sand,
          color: OG_COLORS.ink,
          fontSize: 72,
          fontWeight: 700,
        }}
      >
        Titrra
      </div>,
      { width: OG_WIDTH, height: OG_HEIGHT },
    );
  }
}
