import { useEditorContext } from "./canvas_context";
import { TokenType } from "lexer-rs";

export function DebugPanel() {
  const context = useEditorContext();
  const tokens = context.tokens;
  const gridRows = context.grid.rows;

  return (
    <>
      <h4>Debug view</h4>
      <div className="grid grid-cols-2 border border-[#383838] mb-2 h-[300px]">
        <div className="border-r border-[#383838] col-span-1">
          <div className="border-b border-[#383838] h-[40%] overflow-y-auto">
            {context.debugger.input.join(" ")}
          </div>
          <ul className=" overflow-y-auto h-[60%] max-h-[180px]">
            {batchTokenLines(tokens).map((tokens, idx) => (
              <li key={idx} className="overflow-x-hidden">
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
        <ul className="col-span-1 overflow-y-auto max-h-[300px]">
          {gridRows.map((row, idx) => (
            <li key={idx} className="border border-red-900 mb-1">
              {row.elements}
            </li>
          ))}
        </ul>
      </div>
    </>
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
