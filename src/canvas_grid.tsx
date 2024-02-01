import { TokenType } from "lexer-rs";
import { renderElement } from "./canvas_renderer";
import { CanvasConfigType } from "./canvas_context";

interface GridRow {
  index: number;
  indent: number;
  elements: JSX.Element;
}

interface Grid {
  rows: GridRow[];
}

function griddify(
  tokens: TokenType[],
  CSSConfig: CanvasConfigType["stylesConfig"]
): Grid {
  const grid: Grid = { rows: [] };
  let indent = 0;
  let index = 0;

  if (tokens.length > 0 && tokens[tokens.length - 1].kind !== "Eof") {
    console.warn("Lexer error, missing EOF");
    tokens.push({ kind: "Eof", value: undefined, category: "Whitespace" });
  }

  let children: JSX.Element[] = [];
  for (const [idx, token] of tokens.entries()) {
    const key = `${index}-${children.length}-${idx}`;

    if (token.kind === "Eof") {
      grid.rows.push({
        index,
        indent,
        elements: (
          <div key={key}>
            {children.length === 0 && index > 0 ? [<br />] : children}
          </div>
        ),
      });
    } else if (token.kind === "Newline") {
      const elements = children.length === 0 ? [<br />] : children;
      grid.rows.push({
        index,
        indent,
        elements: <div key={key}>{elements}</div>,
      });
      index += 1;
      children = [];
    } else if (token.kind === "Indent" || token.kind === "Dedent") {
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
  return grid;
}

export { griddify, type Grid };
