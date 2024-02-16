import { HTMLAttributes, memo, useEffect, useRef } from "react";
import {
  useUpdateUpdateEditorState,
  useSaveEditorSelection,
  useRestoreSelection,
  CanvasProvider,
  CanvasConfigType,
  useEditorContext,
} from "./canvas_context";
import { LexerWrapper } from "lexer-rs";
import { DebugPanel } from "./canvas_debug_panel";
import { defaultConfig } from "./utils/defaults";

import "./index.css";
import { GridRow } from "./canvas_grid";

function CanvasInner({
  canvasConfig,
  ...props
}: HTMLAttributes<HTMLDivElement> & { canvasConfig: CanvasConfigType }) {
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const updateEditorState = useUpdateUpdateEditorState();
  const saveSelection = useSaveEditorSelection();
  const restoreSelection = useRestoreSelection();
  const rows = useEditorContext().grid.rows;
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-[500px] w-[700px] m-auto caret-gray-300">
      <Sidebar rows={rows} current={1} />
      <div
        {...props}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full m-auto  bg-gray-800 focus:outline-none"
        onSelect={() => {
          saveSelection(ref.current!);
        }}
        onInput={() => {
          saveSelection(ref.current!);
          updateEditorState(ref.current!.innerText);
          restoreSelection(ref.current!);
        }}
      />
    </div>
  );
}

const Sidebar = memo(function Sidebar({
  rows,
  current,
}: {
  rows: GridRow[];
  current: number;
}) {
  // const lines: number[] = [];
  // for (let i = 0; i < lineCount; i++) {
  //   lines.push(i);
  // }
  return (
    <div className="w-[60px] bg-gray-800 flex flex-col items-center h-full">
      <ul>
        {rows.map((r) => (
          <li key={r.index} className="text-gray-400">
            {r.index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
});

function Canvas(
  props: HTMLAttributes<HTMLDivElement> & { canvasConfig?: CanvasConfigType }
) {
  return (
    <CanvasProvider
      initialContext={{
        lexer: new LexerWrapper(),
        tokens: [],
        grid: { rows: [] },
        selection: null,
        config: props.canvasConfig ?? defaultConfig,
        debugger: {
          encoder: new TextEncoder(),
          input: [],
        },
      }}
    >
      {props.canvasConfig?.debugMode && (
        <>
          <DebugPanel />
        </>
      )}
      <CanvasInner
        {...props}
        canvasConfig={props.canvasConfig ?? defaultConfig}
      />
    </CanvasProvider>
  );
}

export { Canvas, CanvasConfigType };
