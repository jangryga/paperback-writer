import { HTMLAttributes, useEffect, useRef, useState, memo, useMemo } from "react";
import {
  useSaveEditorSelection,
  CanvasProvider,
  CanvasConfigType,
  useEditorContext,
  setBackgroundColor,
  __dev__useUpdateState,
} from "./canvas_context";
import { LexerWrapper } from "lexer-rs";
import { DebugPanel } from "./canvas_debug_panel";
import { DeepPartial, defaultConfig, reconcile } from "./utils/defaults";

import "./index.css";
import { ShortcutManager } from "./canvas_shortcut_manager";

const CanvasInner = memo(function CanvasInner({
  canvasConfig,
  ...props
}: HTMLAttributes<HTMLDivElement> & { canvasConfig: CanvasConfigType }) {
  const saveSelection = useSaveEditorSelection();
  const updateState = __dev__useUpdateState();
  const context = useEditorContext();
  const styles = context.config.stylesConfig.styles;
  const ref = useRef<HTMLDivElement>(null);
  const [mouseDown, setMouseDown] = useState(false);
  const [firstRenderComplete, setFirstRenderComplete] = useState(false);
  const shortcutManager = useMemo(() => new ShortcutManager(ref.current!, updateState), [ref]);

  useEffect(() => {
    shortcutManager.register(ref.current);
  }, [shortcutManager]);

  useEffect(() => {
    ref.current?.focus();
    updateState("", ref.current!);
    setFirstRenderComplete(true);
  }, []);

  useEffect(() => {
    if (firstRenderComplete) {
      if (context.highlightRow.index !== null) {
        const id = context.grid.rowIds[context.highlightRow.index];
        setBackgroundColor(`.${id}`, styles.BgHighlightColor);
      } else {
        console.log("context.highlightRow.index", context.highlightRow.index);
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
            const highlightId = context.grid.rowIds[context.highlightRow.index!];
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
          saveSelection(ref.current!, true);
        }}
        onInput={() => {
          updateState(ref.current!.innerText, ref.current!);
        }}
        // onFocus={() => {
        //   document.addEventListener("keydown", (e) => {
        //     console.log(`KeyboardEvent: key='${e.key}' | code='${e.code}'`);
        //     const overwrites = ["Tab"];
        //     if (!overwrites.includes(e.key)) return;
        //     e.preventDefault();
        //     if (e.key === "Tab") {
        //       updateState(ref.current!.innerText, ref.current!, {
        //         forwardAtSelection: true,
        //       });
        //     }
        //   });
        // }}
        onBlur={() => {
          // context.shortcutManager.cleanup();
        }}
      />
    </div>
  );
});

const Sidebar = memo(function Sidebar() {
  const rows = useEditorContext().grid.rows;
  const context = useEditorContext();
  const currIndex = context.highlightRow?.index ?? null;
  const styles = context.config.stylesConfig.styles;

  return (
    <div className="w-[60px] flex flex-col h-full" style={{ backgroundColor: styles.BgColor }}>
      <ul className="w-full">
        {rows.map((r) => (
          <li
            key={r.index}
            className="text-gray-400 text-center w-full"
            id={`sidebar-${r.index}`}
            style={{
              backgroundColor: currIndex === r.index ? styles.BgHighlightColor : "",
            }}>
            {r.index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
});

function Canvas(
  props: HTMLAttributes<HTMLDivElement> & {
    config: DeepPartial<CanvasConfigType>;
  }
) {
  return (
    <CanvasProvider
      initialContext={{
        lexer: new LexerWrapper(true),
        tokens: [],
        grid: { rows: [], rowIds: [], isEmpty: false },
        selection: null,
        highlightRow: { index: 0, prevIndex: null },
        config: reconcile(props.config, defaultConfig),
        // shortcutManager: new ShortcutManager(),
        debugger: {
          encoder: new TextEncoder(),
          input: [],
        },
      }}>
      {props.config?.debugMode && (
        <>
          <DebugPanel />
        </>
      )}
      <CanvasInner {...props} canvasConfig={reconcile(props.config, defaultConfig)} />
    </CanvasProvider>
  );
}

export { Canvas, CanvasConfigType };
