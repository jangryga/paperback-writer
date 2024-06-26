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
  isEmpty: boolean;
}

function griddify(
  tokens: TokenType[],
  CSSConfig: CanvasConfigType["stylesConfig"],
  highlight: { idx: number | null; highlightColor: string; bgColor: string }
): Grid {
  const grid: Grid = { rows: [], rowIds: [], isEmpty: false };
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
      if (index === 0 && children.length === 0) {
        grid.isEmpty = true;
      }
      const innerElements =
        children.length === 0
          ? index === 0
            ? [
                <span className="init-xwawea23" key="key-span">
                  &#8203;
                </span>,
              ]
            : // todo: does this every run?
              [<br key="key-br-1" />]
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
              highlight.idx !== null && grid.rows.length === highlight.idx
                ? { backgroundColor: highlight.highlightColor }
                : {}
            }
          >
            {innerElements}
          </div>
        ),
        id: key,
      });
    } else if (token.kind === "Newline") {
      const elements =
        children.length === 0 ? [<br key="key-br-2" />] : children;
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
            CSSConfig
          )
        );
        continue;
      }
      children.push(renderElement(token, key, CSSConfig));
    }
  }
  return grid;
}

export { griddify, type Grid };
