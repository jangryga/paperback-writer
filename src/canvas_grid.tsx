import { TokenType } from "lexer-rs";
import { renderElement } from "./canvas_renderer";
import { CanvasConfigType } from "./canvas_context";

export interface GridRow {
  index: number;
  indent: number;
  elements: JSX.Element;
  id: string;
}

interface Grid {
  rows: GridRow[];
  rowIds: string[];
}

function griddify(
  tokens: TokenType[],
  CSSConfig: CanvasConfigType["stylesConfig"],
  highlight: { idx: number | null; highlightColor: string; bgColor: string },
): Grid {
  const grid: Grid = { rows: [], rowIds: [] };
  let indent = 0;
  let index = 0;

  if (tokens.length > 0 && tokens[tokens.length - 1].kind !== "Eof") {
    console.warn("Lexer error, missing EOF");
    tokens.push({ kind: "Eof", value: undefined, category: "Whitespace" });
  }

  let children: JSX.Element[] = [];
  for (const [idx, token] of tokens.entries()) {
    const key = `key-${index}-${children.length}-${idx}`;

    if (token.kind === "Dedent") continue;
    if (token.kind === "Eof") {
      const uuh =
        children.length === 0
          ? index === 0
            ? [<span className="init-xwawea23">&#8203;</span>]
            : [<br />]
          : children;
      grid.rowIds.push(key);
      grid.rows.push({
        index,
        indent,
        elements: (
          <div
            key={key}
            className={key}
            style={
              highlight.idx && grid.rows.length === highlight.idx
                ? { backgroundColor: highlight.highlightColor }
                : {}
            }
          >
            {uuh}
          </div>
        ),
        id: key,
      });
    } else if (token.kind === "Newline") {
      const elements = children.length === 0 ? [<br />] : children;
      grid.rowIds.push(key);
      grid.rows.push({
        index,
        indent,
        elements: (
          <div
            key={key}
            className={key}
            style={
              highlight.idx && grid.rows.length === highlight.idx
                ? { backgroundColor: highlight.highlightColor }
                : {}
            }
          >
            {elements}
          </div>
        ),
        id: key,
      });
      index += 1;
      children = [];
    } else {
      if (token.kind === "Indent" || token.kind === "Dedent") {
        indent +=
          token.kind === "Indent"
            ? Number.parseInt(token.value!)
            : -Number.parseInt(token.value!);
        children.push(
          renderElement(
            {
              kind: "Whitespace",
              value: indent.toString(),
              category: "Whitespace",
            },
            key,
            CSSConfig,
          ),
        );
        continue;
      }
      children.push(renderElement(token, key, CSSConfig));
    }
  }
  return grid;
}

export { griddify, type Grid };
