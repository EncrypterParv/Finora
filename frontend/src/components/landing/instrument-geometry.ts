import * as k from "@/lib/anatomy/iso-kit";

// Anatomy concept: a desktop accounting machine. Paper enters a sorting bed;
// categorized rollers feed a calendar platen; the linear scale projects a daily pace.
// Parts: 4 feet, base, inset, 4 screws, 2 rails, 4 stops, 8 rollers,
// 8 roller collars, 5 sheets, 12 ledger rules, 7 calendar bars, 6 separator
// combs, linear scale housing, cursor, face, slider, ticks and removable lid.
const P = k.fitProjection(
  k.boxCorners({ x: -150, y: -90, w: 300, d: 180, r: 2 }, -20, 145),
  680,
  500,
  { pad: 45, azimuth: 42, elevation: 32 },
);
const S = (p: k.SolidPaths, tone: k.Tone = "mid") => k.solidSvg(p, { tone });
const L = (d: string, tone: k.LineTone = "lo") => k.lineSvg(d, { tone });
const slab = (
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  h: number,
  tone: k.Tone = "mid",
) => S(k.slabOf({ x, y, w, d, r: 2 }, z, h, P, 5, 0.5), tone);
const screws = (x: number, y: number, z: number) =>
  slab(x - 1.5, y - 1.5, 3, 3, z, 1, "lo") +
  L(k.lineOnTop([x - 1, y], [x + 1, y], z + 1, P));
let base = "";
for (const [x, y] of k.corners({ x: -150, y: -90, w: 300, d: 180, r: 2 }, 15))
  base += slab(x - 6, y - 6, 12, 12, -19, 9, "lo");
base += slab(-150, -90, 300, 180, -10, 10);
base += L(
  k.planOutline({ x: -144, y: -84, w: 288, d: 168, r: 2 }, 0, P),
  "faint",
);
for (const [x, y] of k.corners({ x: -150, y: -90, w: 300, d: 180, r: 2 }, 9))
  base += screws(x, y, 0);
for (const y of [-66, 62]) {
  base += slab(-136, y, 272, 5, 0, 8);
  for (const x of [-130, 128]) base += slab(x, y - 2, 7, 9, 8, 6);
}
const ruler = k.topTicks(-125, 125, 5, 5, 77, 0.6, [3, 5], P);
base += slab(-130, 75, 260, 9, 0, 0.6) + L(ruler.minor) + L(ruler.major, "mid");
let input = slab(-127, -55, 74, 110, 10, 13);
input += '<g class="machine-paper">';
for (let i = 0; i < 5; i++) {
  input += slab(-120 + i * 2, -45 + i * 2, 55, 83, 24 + i * 2, 1, "lo");
}
for (let i = 0; i < 12; i++)
  input += L(
    k.lineOnTop([-105, -28 + i * 4], [-70, -28 + i * 4], 33, P),
    "faint",
  );
input += "</g>";
for (let i = 0; i < 4; i++) {
  const x = -119 + i * 17;
  input += slab(x, -56, 5, 110, 35, 5);
  input += screws(x + 2.5, -49, 40) + screws(x + 2.5, 47, 40);
}
let pattern = slab(-43, -54, 89, 109, 10, 12);
for (let i = 0; i < 8; i++) {
  const x = -36 + i * 10;
  pattern += slab(x, -45, 6, 92, 23, 6);
  pattern += slab(x - 1, -48, 8, 5, 23, 9) + slab(x - 1, 45, 8, 5, 23, 9);
}
pattern += '<g class="machine-sorter">';
for (let i = 0; i < 6; i++)
  pattern += slab(-43, -40 + i * 16, 89, 2, 33, 4, "lo");
pattern += "</g>";
let forecast = slab(58, -55, 70, 110, 10, 12);
for (let i = 0; i < 7; i++) {
  forecast +=
    `<g class="machine-column" style="--column-delay:${i * 110}ms">` +
    slab(63 + i * 8, -40, 5, 60, 22, [9, 18, 12, 25, 21, 36, 31][i], "lo") +
    "</g>";
}
forecast += slab(65, 25, 60, 27, 22, 9, "lo");
forecast += slab(69, 29, 52, 19, 31, 1, "hi");
const ticks = k.topTicks(72, 118, 2, 5, 31, 32.2, [3, 6], P);
forecast += L(ticks.minor) + L(ticks.major, "mid");
forecast +=
  '<g class="machine-cursor">' + slab(96, 29, 3, 19, 32, 2, "hi") + "</g>";
forecast += slab(115, 53, 10, 8, 22, 6);
let lid = slab(-139, -76, 278, 148, 69, 6, "lo");
lid += L(
  k.planOutline({ x: -131, y: -68, w: 262, d: 132, r: 2 }, 75, P),
  "faint",
);
for (const [x, y] of k.corners({ x: -139, y: -76, w: 278, d: 148, r: 2 }, 7))
  lid += screws(x, y, 75);
for (let i = 0; i < 16; i++)
  lid += L(k.lineOnTop([-110 + i * 6, -48], [-110 + i * 6, -26], 75, P), "lo");
lid += k.faceTextSvg(k.topMatrix([60, 20], 75, P), "FINORA", {
  size: 7,
  tone: "hi",
  anchor: "middle",
});
export const instrumentArt = { base, input, pattern, forecast, lid };
