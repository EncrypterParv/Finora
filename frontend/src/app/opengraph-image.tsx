import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Finora — See your money take shape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [serif, italic, sans] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/instrument-serif.ttf")),
    readFile(join(process.cwd(), "public/fonts/instrument-serif-italic.ttf")),
    readFile(join(process.cwd(), "public/fonts/dm-sans-medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "58px 70px",
          color: "#2d211d",
          background: "#f7f2e6",
          fontFamily: "Instrument Serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -90,
            bottom: -260,
            width: 760,
            height: 760,
            borderRadius: 760,
            border: "1px solid #dbb98d",
            background: "#f2e9d9",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, letterSpacing: "-1px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, background: "#2d211d", color: "#f7f2e6", fontFamily: "Arial", fontWeight: 700, fontSize: 26 }}>F</div>
          <span style={{ fontWeight: 600 }}>finora</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900, position: "relative" }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: "-4px" }}>See your money</div>
          <div style={{ fontSize: 82, lineHeight: 1.08, fontFamily: "Instrument Serif Italic", color: "#bd4d08", letterSpacing: "-4px" }}>take shape.</div>
          <div style={{ marginTop: 26, fontFamily: "DM Sans", fontSize: 23, lineHeight: 1.5, color: "#665b52", maxWidth: 730 }}>
            A clear view of what you spend, what you save, and what you can plan for.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e6d9c6", paddingTop: 18, fontFamily: "DM Sans", fontSize: 16, color: "#766b61", letterSpacing: "1px" }}>
          <span>PERSONAL FINANCE, PUT IN PERSPECTIVE</span>
          <span>finora-sem3.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Instrument Serif Italic", data: italic, style: "normal", weight: 400 },
        { name: "DM Sans", data: sans, style: "normal", weight: 500 },
      ],
    },
  );
}
