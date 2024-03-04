import { CanvasConfigType } from "../canvas_context";

export const defaultConfig: CanvasConfigType = {
  debugMode: false,
  stylesConfig: {
    useTailwind: false,
    styles: {
      Keyword: "#7f1d1d",
      Dunder: "#6b7280",
      BuiltInType: "#000000",
      BuiltInFn: "#4ade80",
      PunctuationAndGroup: "#eab308",
      Operators: "#1d4ed8",
      Comparison: "#ea580c",
      Literal: "#d946ef",
      Identifier: "#7f1d1d",
      Whitespace: "#000000",
      Eof: "#000000",
      Comment: "#1cda10",
      BgColor: "#10141c",
      BgHighlightColor: "#1a202c",
    },
  },
};

export const defaultTailwindColors = Object.entries(
  defaultConfig.stylesConfig.styles,
).reduce((accumulator, [key, val]) => {
  if (key !== "BgColor" && key !== "BgHighlightColor") {
    // @ts-ignore
    accumulator[key] = `text-${val}`;
  }
  return accumulator;
}, {}) as CanvasConfigType["stylesConfig"]["styles"];
