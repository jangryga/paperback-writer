import { CanvasConfigType } from "../canvas_context";
import {} from "lexer-rs";

export const defaultConfig: CanvasConfigType = {
  debugMode: false,
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
