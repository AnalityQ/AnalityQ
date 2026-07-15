import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("branding AnalityQ", () => {
  it("używa właściwego znaku A zamiast tekstowego znaku Q", () => {
    const html = renderToStaticMarkup(<Logo href="" />);
    expect(html).toContain("/branding/analityq-mark-compact-clean.png");
    expect(html).toContain("Anality");
    expect(html).not.toContain(">Q</span><span");
  });

  it("znak marki ma rzeczywisty kanał przezroczystości", async () => {
    const file = path.join(process.cwd(), "public", "branding", "analityq-mark-clean.png");
    expect(fs.existsSync(file)).toBe(true);
    const metadata = await sharp(file).metadata();
    expect(metadata.hasAlpha).toBe(true);
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(info.width - 1, info.height - 1)).toBe(0);
  });

  it("nie zawiera poziomego artefaktu nad znakiem", async () => {
    const file = path.join(process.cwd(), "public", "branding", "analityq-mark-compact-clean.png");
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const safeTopRows = Math.floor(info.height * 0.07);
    let maxAlpha = 0;
    for (let y = 0; y < safeTopRows; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        maxAlpha = Math.max(maxAlpha, data[(y * info.width + x) * info.channels + 3]);
      }
    }
    expect(maxAlpha).toBe(0);
  });
});
