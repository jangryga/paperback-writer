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
      BgColor: "#1e1e1e",
      BgHighlightColor: "#252526",
      Keyword: "#569cd6",
      Dunder: "#c586c0",
      BuiltInType: "#4ec9b0",
      BuiltInFn: "#dcdcaa",
      PunctuationAndGroup: "#d4d4d4",
      Operators: "#d4d4d4",
      Comparison: "#569cd6",
      Literal: "#ce9178",
      Identifier: "#9cdcfe",
      Comment: "#6a9955",
      Whitespace: "#000000",
      Eof: "#000000",
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
