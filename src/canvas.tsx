import { HTMLAttributes, useEffect, useRef, useState, memo } from "react";
import {
  useUpdateUpdateEditorState,
  useSaveEditorSelection,
  useRestoreSelection,
  CanvasProvider,
  CanvasConfigType,
  useEditorContext,
  setBackgroundColor,
} from "./canvas_context";
import { LexerWrapper } from "lexer-rs";
import { DebugPanel } from "./canvas_debug_panel";
import { defaultConfig } from "./utils/defaults";

import "./index.css";
import { setDOMRange } from "./canvas_selection";

function CanvasInner({
  canvasConfig,
  ...props
}: HTMLAttributes<HTMLDivElement> & { canvasConfig: CanvasConfigType }) {
  const updateEditorState = useUpdateUpdateEditorState();
  const saveSelection = useSaveEditorSelection();
  const restoreSelection = useRestoreSelection();
  // const initState = useInitState();
  const context = useEditorContext();
  const styles = context.config.stylesConfig.styles;
  const ref = useRef<HTMLDivElement>(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [firstRenderComplete, setFirstRenderComplete] = useState(false);

  useEffect(() => {
    ref.current?.focus();
    saveSelection(ref.current!, false);
    updateEditorState("", ref.current!);
    restoreSelection(ref.current!);
    setFirstRenderComplete(true);
  }, []);

  useEffect(() => {
    if (firstRenderComplete) {
      if (context.highlightRow.index !== null) {
        const id = context.grid.rowIds[context.highlightRow.index];
        setBackgroundColor(`.${id}`, styles.BgHighlightColor);
      }
    }
  }, [firstRenderComplete]);

  return (
    <div className="flex h-[500px] w-[700px] m-auto caret-white text-lg">
      <Sidebar />
      <div
        {...props}
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => {
          setMouseDown(false);
        }}
        onMouseMove={() => {
          if (mouseDown) {
            if (!context.highlightRow.index) return;
            const highlightId =
              context.grid.rowIds[context.highlightRow.index!];
            const sidebarId = `#sidebar-${context.highlightRow.index!}`;
            setBackgroundColor(sidebarId, styles.BgColor);
            setBackgroundColor(`.${highlightId}`, styles.BgColor);
          }
        }}
        ref={ref}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full m-auto focus:outline-none"
        style={{ backgroundColor: styles.BgColor }}
        onSelect={() => {
          console.log("run");
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

const Sidebar = memo(function Sidebar() {
  const rows = useEditorContext().grid.rows;
  const context = useEditorContext();
  const currIndex = context.highlightRow?.index ?? null;
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
            id={`sidebar-${r.index}`}
            style={{
              backgroundColor:
                currIndex === r.index ? styles.BgHighlightColor : "",
            }}
          >
            {r.index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
});

function Canvas(
  props: HTMLAttributes<HTMLDivElement> & { canvasConfig?: CanvasConfigType },
) {
  return (
    <CanvasProvider
      initialContext={{
        lexer: new LexerWrapper(true),
        tokens: [],
        grid: { rows: [], rowIds: [] },
        selection: null,
        highlightRow: { index: 0, prevIndex: null },
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
