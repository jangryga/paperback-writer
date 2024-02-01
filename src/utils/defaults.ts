import { CanvasConfigType } from "../canvas_context";

export const defaultConfig: CanvasConfigType = {
  debugMode: true,
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
    },
  },
};

export const defaultTailwindColors: CanvasConfigType["stylesConfig"]["styles"] =
  Object(defaultConfig.stylesConfig.styles).map((k, v) => ({ k: `text-${v}` }));
