import { CanvasConfigType } from "../canvas_context";
import {} from "lexer-rs";

export const BASE_SPAN_ID = "init-xwawea23";

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export function reconcile<T extends object>(
  partial: DeepPartial<T>,
  init: T
): T {
  const out: T = { ...init };
  for (const [k, v] of Object.entries(partial)) {
    if (typeof v === "object" && v !== null) {
      // @ts-ignore
      out[k] = reconcile(v, out[k]);
    } else {
      out[k as keyof T] = v;
    }
  }
  return out;
}

export const defaultConfig: CanvasConfigType = {
  debugMode: false,
  tabSize: 4,
  stylesConfig: {
    styles: {
      Keyword: "#ff9800",
      Dunder: "#6b7280",
      BuiltInType: "#000000",
      BuiltInFn: "#4ade80",
      PunctuationAndGroup: "#bdbdbd",
      Operators: "#1d4ed8",
      Comparison: "#ea580c",
      Literal: "#d946ef",
      Identifier: "#03a9f4",
      Whitespace: "#000000",
      Eof: "#000000",
      Comment: "#1cda10",
      BgColor: "#10141c",
      BgHighlightColor: "#1a202c",
    },
  },
};

export const defaultTailwindColors = Object.entries(
  defaultConfig.stylesConfig.styles
).reduce((accumulator, [key, val]) => {
  if (key !== "BgColor" && key !== "BgHighlightColor") {
    // @ts-ignore
    accumulator[key] = `text-${val}`;
  }
  return accumulator;
}, {}) as CanvasConfigType["stylesConfig"]["styles"];
