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
  getCurrentSelectionRow,
  restoreSelection,
  saveSelection as saveSelectionInternal,
  type SelectionNode,
} from "./canvas_selection";
import ReactDOMServer from "react-dom/server";

interface CanvasContextType {
  tokens: TokenType[];
  lexer: LexerWrapper;
  grid: Grid;
  selection: SelectionNode | null;
  selectionRow: { index: number | null; prevIndex: number | null };
  config: CanvasConfigType;
  debugger: {
    encoder: TextEncoder | null;
    input: number[];
  };
}

function highlightSelection(context: CanvasContextType) {
  const curr = context.selectionRow.index;
  const prev = context.selectionRow.prevIndex;
  if (curr !== null) {
    const currId = context.grid.rowIds[curr];
    document.querySelectorAll(`.${currId}`).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.setProperty(
          "background-color",
          context.config.stylesConfig.styles.BgHighlightColor,
        );
      }
    });
  }

  if (prev !== null) {
    const prevId = context.grid.rowIds[prev];
    document.querySelectorAll(`.${prevId}`).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.setProperty(
          "background-color",
          context.config.stylesConfig.styles.BgColor,
        );
      }
    });
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
      payload: { element: HTMLDivElement; updateSelectionRow: boolean };
    }
  | { type: "RESTORE_SELECTION"; payload: { element: HTMLDivElement } }
  | { type: "SET_CONFIG"; payload: { config: CanvasConfigType } };
type UseCanvasManagerResult = ReturnType<typeof useCanvasManager>;

function useCanvasManager(initialCanvasContext: CanvasContextType): {
  context: CanvasContextType;
  updateTree: (text: string, element: HTMLDivElement) => void;
  saveSelection: (element: HTMLDivElement, updateSelectionRow: boolean) => void;
  restoreState: (element: HTMLDivElement) => void;
  setConfig: (config: CanvasConfigType) => void;
} {
  const [context, dispatch] = useReducer(
    (state: CanvasContextType, action: CanvasActionType) => {
      switch (action.type) {
        case "SAVE_SELECTION": {
          const oldSelection = saveSelectionInternal(action.payload.element);
          const updateHighlight = action.payload.updateSelectionRow;
          const newSelectionRowIdx = updateHighlight
            ? getCurrentSelectionRow(oldSelection)
            : state.selectionRow.index;

          const selectionRow = {
            index: newSelectionRowIdx,
            prevIndex: state.selectionRow.index,
          };

          const newState = {
            ...state,
            selectionRow,
            selection: oldSelection,
          };

          if (updateHighlight) highlightSelection(newState);
          return newState;
        }
        case "SET": {
          let encoder = state.debugger.encoder ?? new TextEncoder();
          const utf8Input = Array.from(encoder.encode(action.payload.text));
          const tokens = state.lexer.tokenize(action.payload.text);
          const selectionRow = {
            index: getCurrentSelectionRow(state.selection),
            prevIndex: state.selectionRow.index,
          };
          const grid = griddify(tokens, state.config.stylesConfig);

          return {
            ...state,
            tokens,
            grid,
            selectionRow,
            debugger: {
              encoder: encoder,
              input: utf8Input,
            },
          };
        }
        case "RESTORE_SELECTION": {
          const element = action.payload.element;
          element.innerHTML = ReactDOMServer.renderToString(
            <>{state.grid.rows.map((row) => row.elements)}</>,
          );
          restoreSelection(element, state.selection);
          return { ...state };
        }
        case "SET_CONFIG":
          return { ...state, config: action.payload.config };
        default:
          throw new Error("unimplemented");
      }
    },
    initialCanvasContext,
  );

  const updateTree = useCallback((text: string, element: HTMLDivElement) => {
    dispatch({ type: "SET", payload: { text, element } });
  }, []);

  const saveSelection = useCallback(
    (element: HTMLDivElement, updateSelectionRow: boolean) => {
      dispatch({
        type: "SAVE_SELECTION",
        payload: { element, updateSelectionRow },
      });
    },
    [],
  );

  const restoreState = useCallback((element: HTMLDivElement) => {
    dispatch({ type: "RESTORE_SELECTION", payload: { element } });
  }, []);

  const setConfig = useCallback((config: CanvasConfigType) => {
    dispatch({ type: "SET_CONFIG", payload: { config } });
  }, []);

  return { context, updateTree, saveSelection, restoreState, setConfig };
}

const CanvasContext = createContext<UseCanvasManagerResult>({
  context: null as any,
  updateTree: (_: string) => {},
  saveSelection: () => {},
  restoreState: () => {},
  setConfig: () => {},
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
