import { TokenType, LexerWrapper, TokenCategory } from "lexer-rs";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { Grid, griddify } from "./canvas_grid";
import {
  getCurrentHighlightRow,
  insertAtSelection,
  restoreSelection,
  restoreSelectionToBaseCase,
  saveSelection as saveSelectionInternal,
  type SelectionNode,
} from "./canvas_selection";
import ReactDOMServer from "react-dom/server";

export interface CanvasContextType {
  tokens: TokenType[];
  lexer: LexerWrapper;
  grid: Grid;
  selection: SelectionNode | null;
  highlightRow: { index: number | null; prevIndex: number | null };
  config: CanvasConfigType;
  // shortcutManager: ShortcutManager;
  debugger: {
    encoder: TextEncoder | null;
    input: number[];
  };
}

export function setBackgroundColor(selector: string, color: string) {
  document.querySelectorAll(selector).forEach((e) => {
    if (e instanceof HTMLElement) {
      e.style.setProperty("background-color", color);
    }
  });
}

function highlightSelection(context: CanvasContextType) {
  const curr = context.highlightRow.index;
  const prev = context.highlightRow.prevIndex;
  const bgColor = context.config.stylesConfig.styles.BgColor;
  const hhColor = context.config.stylesConfig.styles.BgHighlightColor;

  if (curr === prev) return;

  if (curr !== null) {
    const currId = context.grid.rowIds[curr];
    setBackgroundColor(`.${currId}`, hhColor);
    setBackgroundColor(`#sidebar-${curr}`, hhColor);
  }

  if (prev !== null) {
    const prevId = context.grid.rowIds[prev];
    setBackgroundColor(`.${prevId}`, bgColor);
    setBackgroundColor(`#sidebar-${prev}`, bgColor);
  }
}

export interface CanvasConfigType {
  debugMode: boolean;
  stylesConfig: {
    styles: Record<
      keyof typeof TokenCategory | "BgColor" | "BgHighlightColor",
      string
    >;
  };
}

type CanvasActionType =
  | { type: "SET"; payload: { text: string; element: HTMLDivElement } }
  | {
      type: "SAVE_SELECTION";
      payload: { element: HTMLDivElement; updateHighlightRow: boolean };
    }
  | { type: "RESTORE_SELECTION"; payload: { element: HTMLDivElement } }
  | { type: "SET_CONFIG"; payload: { config: CanvasConfigType } }
  | {
      type: "__dev_UPDATE";
      payload: {
        element: HTMLDivElement;
        text: string;
        opts?: {
          forwardAtSelection: boolean;
        };
      };
    };
type UseCanvasManagerResult = ReturnType<typeof useCanvasManager>;

function useCanvasManager(initialCanvasContext: CanvasContextType): {
  context: CanvasContextType;
  updateTree: (text: string, element: HTMLDivElement) => void;
  saveSelection: (element: HTMLDivElement, updateHighlightRow: boolean) => void;
  restoreState: (element: HTMLDivElement) => void;
  setConfig: (config: CanvasConfigType) => void;
  __dev__updateState: (
    text: string,
    element: HTMLDivElement,
    opts?: {
      forwardAtSelection: boolean;
    }
  ) => void;
} {
  const [context, dispatch] = useReducer(
    (state: CanvasContextType, action: CanvasActionType) => {
      switch (action.type) {
        case "__dev_UPDATE": {
          // SAVE_SELECTION
          let preRerenderSelection = saveSelectionInternal(
            action.payload.element
          );
          // SET
          let text = action.payload.text;
          let encoder = state.debugger.encoder ?? new TextEncoder();
          const utf8Input = Array.from(encoder.encode(text));
          let tokens = state.lexer.tokenize(text);
          if (action.payload.opts?.forwardAtSelection) {
            [tokens, preRerenderSelection] = insertAtSelection(
              tokens,
              "    ",
              preRerenderSelection!,
              state.lexer
            );
          }
          const highlightRow = {
            index: getCurrentHighlightRow(preRerenderSelection),
            prevIndex: state.highlightRow.index,
          };
          const grid = griddify(tokens, state.config.stylesConfig, {
            idx: highlightRow.index,
            bgColor: state.config.stylesConfig.styles.BgColor,
            highlightColor: state.config.stylesConfig.styles.BgHighlightColor,
          });
          // RESTORE_SELECTION
          const element = action.payload.element;
          element.innerHTML = ReactDOMServer.renderToString(
            <>{grid.rows.map((row) => row.elements)}</>
          );
          if (grid.isEmpty) {
            restoreSelectionToBaseCase();
          } else {
            let modifyOffset = false;
            // remove extra span text in first row (zero width is removed by lexer)
            if (state.grid.isEmpty && grid.rows.length === 1) {
              modifyOffset = true;
            }
            restoreSelection(element, preRerenderSelection, modifyOffset);
          }
          // ret
          return {
            ...state,
            tokens,
            grid,
            highlightRow,
            selection: preRerenderSelection,
            debugger: {
              encoder: encoder,
              input: utf8Input,
            },
          };
        }
        case "SAVE_SELECTION": {
          const preRerenderSelection = saveSelectionInternal(
            action.payload.element
          );
          const updateHighlight = action.payload.updateHighlightRow;
          const newHighlightRowIdx = updateHighlight
            ? getCurrentHighlightRow(preRerenderSelection)
            : state.highlightRow.index;
          const highlightRow = {
            index: newHighlightRowIdx,
            prevIndex: state.highlightRow.index,
          };
          const newState = {
            ...state,
            highlightRow,
            selection: preRerenderSelection,
          };
          if (updateHighlight) highlightSelection(newState);

          return newState;
        }
        case "SET": {
          let encoder = state.debugger.encoder ?? new TextEncoder();
          const utf8Input = Array.from(encoder.encode(action.payload.text));
          const tokens = state.lexer.tokenize(action.payload.text);
          const highlightRow = {
            index: getCurrentHighlightRow(state.selection),
            prevIndex: state.highlightRow.index,
          };
          const grid = griddify(tokens, state.config.stylesConfig, {
            idx: highlightRow.index,
            bgColor: state.config.stylesConfig.styles.BgColor,
            highlightColor: state.config.stylesConfig.styles.BgHighlightColor,
          });
          return {
            ...state,
            tokens,
            grid,
            highlightRow,
            debugger: {
              encoder: encoder,
              input: utf8Input,
            },
          };
        }

        case "RESTORE_SELECTION": {
          const element = action.payload.element;
          element.innerHTML = ReactDOMServer.renderToString(
            <>{state.grid.rows.map((row) => row.elements)}</>
          );
          restoreSelection(element, state.selection, false);
          return { ...state };
        }
        case "SET_CONFIG":
          return { ...state, config: action.payload.config };
        default:
          throw new Error("unimplemented");
      }
    },
    initialCanvasContext
  );

  const updateTree = useCallback((text: string, element: HTMLDivElement) => {
    dispatch({ type: "SET", payload: { text, element } });
  }, []);

  const saveSelection = useCallback(
    (element: HTMLDivElement, updateHighlightRow: boolean) => {
      dispatch({
        type: "SAVE_SELECTION",
        payload: { element, updateHighlightRow },
      });
    },
    []
  );

  const restoreState = useCallback((element: HTMLDivElement) => {
    dispatch({ type: "RESTORE_SELECTION", payload: { element } });
  }, []);

  const setConfig = useCallback((config: CanvasConfigType) => {
    dispatch({ type: "SET_CONFIG", payload: { config } });
  }, []);

  const __dev__updateState = useCallback(
    (
      text: string,
      element: HTMLDivElement,
      opts?: {
        forwardAtSelection: boolean;
      }
    ) => {
      dispatch({
        type: "__dev_UPDATE",
        payload: { text, element, opts },
      });
    },
    []
  );

  return {
    context,
    updateTree,
    saveSelection,
    restoreState,
    setConfig,
    __dev__updateState,
  };
}

const CanvasContext = createContext<UseCanvasManagerResult>({
  context: null as any,
  updateTree: (_: string) => {},
  saveSelection: () => {},
  restoreState: () => {},
  setConfig: () => {},
  __dev__updateState: () => {},
});

export const CanvasProvider = ({
  initialContext,
  children,
}: {
  initialContext: CanvasContextType;
  children: ReactNode;
}) => (
  <CanvasContext.Provider value={useCanvasManager(initialContext)}>
    {children}
  </CanvasContext.Provider>
);

export const useUpdateUpdateEditorState =
  (): UseCanvasManagerResult["updateTree"] => {
    const { updateTree } = useContext(CanvasContext);
    return updateTree;
  };

export const useSaveEditorSelection =
  (): UseCanvasManagerResult["saveSelection"] => {
    const { saveSelection } = useContext(CanvasContext);
    return saveSelection;
  };

export const useEditorContext = (): UseCanvasManagerResult["context"] => {
  const { context } = useContext(CanvasContext);
  return context;
};

export const useRestoreSelection =
  (): UseCanvasManagerResult["restoreState"] => {
    const { restoreState } = useContext(CanvasContext);
    return restoreState;
  };

export const useSetCanvasConfig = (): UseCanvasManagerResult["setConfig"] => {
  const { setConfig } = useContext(CanvasContext);
  return setConfig;
};

export const __dev__useUpdateState =
  (): UseCanvasManagerResult["__dev__updateState"] => {
    const { __dev__updateState } = useContext(CanvasContext);
    return __dev__updateState;
  };
