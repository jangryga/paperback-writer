import { HTMLAttributes } from "react";
import { useEditorContext } from "./canvas_context";
import { TokenType } from "lexer-rs";

export function DebugPanel(props: HTMLAttributes<HTMLDivElement>) {
  const context = useEditorContext();
  const tokens = context.tokens;
  const gridRows = context.grid.rows;

  return (
    <div {...props}>
      <h4>Debug view</h4>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "1px solid #383838",
          marginBottom: "8px",
          height: "200px",
        }}
      >
        <div style={{ borderRight: "1px solid #383838" }}>
          <ul style={{ overflowY: "hidden", height: "70%" }}>
            {batchTokenLines(tokens).map((tokens, idx) => (
              <li key={idx} style={{ overflowX: "hidden" }}>
                {tokens
                  .map((t) => {
                    if (t.value) return `${t.kind}+${t.value}+${t.category}`;
                    return t.kind;
                  })
                  .join(" | ")}
              </li>
            ))}
          </ul>
        </div>
        <ul style={{ overflowY: "auto" }}>
          {gridRows.map((row, idx) => (
            <li
              key={idx}
              style={{ border: "1px solid #d90429", marginBottom: "4px" }}
            >
              {row.elements}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function batchTokenLines(tokens: TokenType[]): TokenType[][] {
  const elements: TokenType[][] = [];
  let current: TokenType[] = [];
  for (const t of tokens) {
    if (t.kind === "Newline") {
      elements.push(current);
      current = [t];
    } else {
      current.push(t);
    }
  }
  if (current) elements.push(current);
  return elements;
}
