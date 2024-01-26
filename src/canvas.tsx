import { HTMLAttributes, useEffect, useRef } from "react";
import {
  useUpdateUpdateEditorState,
  useSaveEditorSelection,
  useRestoreSelection,
  CanvasProvider,
} from "./canvas_context";
import { LexerWrapper } from "lexer-rs";
import { DebugPanel } from "./canvas_debug_panel";

function CanvasInner({
  debugMode,
  ...props
}: HTMLAttributes<HTMLDivElement> & CanvasConfig) {
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const updateEditorState = useUpdateUpdateEditorState();
  const saveSelection = useSaveEditorSelection();
  const restoreSelection = useRestoreSelection();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div
        {...props}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full focus:outline-none"
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

function Canvas(props: HTMLAttributes<HTMLDivElement> & CanvasConfig) {
  return (
    <CanvasProvider
      initialContext={{
        lexer: new LexerWrapper(),
        tokens: [],
        grid: { rows: [] },
        selection: null,
      }}
    >
      {props.debugMode && (
        <>
          <DebugPanel />
          <div className="flex gap-2"></div>
        </>
      )}
      <CanvasInner {...props} />
    </CanvasProvider>
  );
}

interface CanvasConfig {
  debugMode: boolean;
  debuggerProps: HTMLAttributes<HTMLDivElement>;
}

export { Canvas, CanvasConfig };
