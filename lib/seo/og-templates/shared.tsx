import { ImageResponse } from "next/og";
import { isRtlLocale } from "@/i18n/config";

export const OG_SIZE = { width: 1200, height: 630 } as const;

interface CardArgs {
  locale: string;
  eyebrow: string;          // top-right tag, e.g. "§ 16 OSCILLATIONS"
  title: string;            // big centered text
  subtitle?: string;        // small line below
}

const BG = "#0F1115";
const FG_PRIMARY = "#F5F7FA";
const FG_SECONDARY = "#9AA3B2";
const ACCENT = "#7DD3FC";

export function renderCard({ locale, eyebrow, title, subtitle }: CardArgs): ImageResponse {
  const dir: "ltr" | "rtl" = isRtlLocale(locale) ? "rtl" : "ltr";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: "60px 80px",
          fontFamily: "Inter, system-ui",
          direction: dir,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: FG_SECONDARY,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: FG_PRIMARY, fontWeight: 700 }}>physics</span>
          <span>{eyebrow}</span>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: dir === "rtl" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.05,
              color: FG_PRIMARY,
              fontWeight: 700,
              letterSpacing: -1.5,
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 24,
                fontSize: 32,
                color: FG_SECONDARY,
                lineHeight: 1.3,
                maxWidth: 1000,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: dir === "rtl" ? "flex-start" : "flex-end",
            color: ACCENT,
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          physics.it.com
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
