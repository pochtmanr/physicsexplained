/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getPlayground } from "../_components/playground-meta";

export const runtime = "edge";
export const alt = "Physics playground";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Params {
  locale: string;
  slug: string;
}

export default async function OGImage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Record<string, string>;
}) {
  const meta = getPlayground(params.slug);
  if (!meta) {
    return new ImageResponse(
      (<div style={{ display: "flex", width: "100%", height: "100%" }}>404</div>),
      size,
    );
  }

  // Best-effort decode of state for subtitle text.
  let subtitle = "Physics.is";
  if (searchParams.s) {
    try {
      const padded = (searchParams.s + "===").slice(0, searchParams.s.length + ((4 - (searchParams.s.length % 4)) % 4));
      const decoded = JSON.parse(
        Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
      ) as { preset?: string; bodies?: unknown[] };
      if (decoded.preset && decoded.preset !== "custom") {
        subtitle = `${decoded.preset} preset`;
      } else if (decoded.bodies?.length) {
        subtitle = `Custom · ${decoded.bodies.length} bodies`;
      }
    } catch {
      // ignore — fall back to default subtitle
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A1D24",
          color: "#EEF2F9",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 36, color: "#6FB8C6", textTransform: "uppercase", letterSpacing: 4 }}>
          /play/{params.slug}
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 24 }}>
          {meta.slug.replace(/-/g, " ")}
        </div>
        <div style={{ fontSize: 36, color: "#B6C4D8", marginTop: 16 }}>
          {subtitle}
        </div>
        <div style={{ fontSize: 28, color: "#56687F", marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
          physics.is
        </div>
      </div>
    ),
    size,
  );
}
