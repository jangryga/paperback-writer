import { HTMLAttributes, useEffect, useRef } from "react";
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
  const styles = useEditorContext().config.stylesConfig.styles;
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-[500px] w-[700px] m-auto caret-gray-300">
      <Sidebar />
      <div
        {...props}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full m-auto focus:outline-none"
        style={{ backgroundColor: styles.BgColor }}
        onSelect={() => {
          saveSelection(ref.current!, true);
        }}
        onInput={() => {
          saveSelection(ref.current!, false);
          updateEditorState(ref.current!.innerText, ref.current!);
          restoreSelection(ref.current!);
        }}
      />
    </div>
  );
}

function Sidebar() {
  const rows = useEditorContext().grid.rows;
  const context = useEditorContext();
  const currentIndex = context.selectionRow?.index ?? null;
  const styles = context.config.stylesConfig.styles;

  return (
    <div
      className="w-[60px] flex flex-col h-full"
      style={{ backgroundColor: styles.BgColor }}
    >
      <ul className="w-full">
        {rows.map((r) => (
          <li
            key={r.index}
            className="text-gray-400 text-center w-full"
            style={{
              backgroundColor:
                currentIndex === r.index ? styles.BgHighlightColor : "",
            }}
          >
            {r.index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Canvas(
  props: HTMLAttributes<HTMLDivElement> & { canvasConfig?: CanvasConfigType },
) {
  return (
    <CanvasProvider
      initialContext={{
        lexer: new LexerWrapper(props.canvasConfig?.debugMode),
        tokens: [],
        grid: { rows: [] },
        selection: null,
        selectionRow: null,
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
