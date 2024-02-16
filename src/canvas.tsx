import { HTMLAttributes, useEffect, useRef } from "react";
import {
  useUpdateUpdateEditorState,
  useSaveEditorSelection,
  useRestoreSelection,
  CanvasProvider,
  CanvasConfigType,
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
  const ref = useRef<HTMLDivElement>(null);

  return (
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
  );
}

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
