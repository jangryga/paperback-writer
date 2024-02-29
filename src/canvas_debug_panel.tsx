import { useState } from "react";
import { useEditorContext } from "./canvas_context";
import { TokenType } from "lexer-rs";
import { SelectionNode } from "./canvas_selection";

const tabs = ["Text", "Selection", "Selection Row"];

function TextTab() {
  const context = useEditorContext();
  const tokens = context.tokens;
  return (
    <>
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
    </>
  );
}

function SelectionRowTab() {
  const selectionRow = useEditorContext().selectionRow;
  return (
    <div>
      <div>Selection row: {selectionRow?.index}</div>
      <div>Highlight: {selectionRow?.highlightLine}</div>
    </div>
  );
}

function SelectionTab() {
  const selection = useEditorContext().selection;
  return (
    <div>
      {selection?.children && selection.children.length > 0 ? (
        <SelectionList node={selection} />
      ) : (
        <div>Noop</div>
      )}
    </div>
  );
}

function SelectionList({ node }: { node: SelectionNode }) {
  console.log("node: ", node);
  return null;
  return (
    <div>
      <span>{node.name.toLowerCase()}</span>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((n, idx) => (
            <li key={idx} className="ml-4">
              <SelectionNodeFirstChild node={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function test(a: "a" | "b" | "c") {
  return a;
}

let x = test();

function SelectionNodeFirstChild({ node }: { node: SelectionNode }) {
  if (node.value) return <div className="">{node.value}</div>;
  return (
    <span>
      {`<${node.name.toLowerCase()}>`}
      {/* {<SelectionNodeFirstChild node={} />} */}
      {`</${node.name.toLowerCase()}>`}
    </span>
  );
}

export function DebugPanel() {
  const context = useEditorContext();
  const gridRows = context.grid.rows;
  const [tabIdx, setTabIdx] = useState(0);

  return (
    <div className="text-gray-300">
      <div className="flex">
        <p className="mr-6">Debug view</p>
        <div className="flex gap-2">
          {tabs.map((tabName, index) => (
            <button key={tabName} onClick={() => setTabIdx(index)}>
              {tabName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 border border-[#383838] mb-2 h-[300px]">
        <div className="border-r border-[#383838] col-span-1">
          {tabs[tabIdx] === "Text" && <TextTab />}
          {tabs[tabIdx] === "Selection Row" && <SelectionRowTab />}
          {tabs[tabIdx] === "Selection" && <SelectionTab />}
        </div>
        <ul className="col-span-1 overflow-y-auto max-h-[300px]">
          {gridRows.map((row, idx) => (
            <li key={idx} className="border border-red-900 mb-1">
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
