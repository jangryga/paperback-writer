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
  restoreSelection,
  saveSelection as saveSelectionInternal,
  type SelectionNode,
} from "./canvas_selection";
import ReactDOMServer from "react-dom/server";

export interface CanvasConfigType {
  debugMode: Boolean;
  stylesConfig: {
    styles: Record<keyof typeof TokenCategory, string>;
    useTailwind: boolean;
  };
}

interface CanvasContextType {
  tokens: TokenType[];
  lexer: LexerWrapper;
  grid: Grid;
  selection: SelectionNode | null;
  config: CanvasConfigType;
}

type CanvasActionType =
  | { type: "SET"; payload: string }
  | { type: "SAVE_SELECTION"; payload: { element: HTMLDivElement } }
  | { type: "RESTORE_SELECTION"; payload: { element: HTMLDivElement } }
  | { type: "SET_CONFIG"; payload: { config: CanvasConfigType } };
type UseCanvasManagerResult = ReturnType<typeof useCanvasManager>;

function useCanvasManager(initialCanvasContext: CanvasContextType): {
  context: CanvasContextType;
  updateTree: (text: string) => void;
  saveSelection: (element: HTMLDivElement) => void;
  restoreState: (element: HTMLDivElement) => void;
  setConfig: (config: CanvasConfigType) => void;
} {
  const [context, dispatch] = useReducer(
    (state: CanvasContextType, action: CanvasActionType) => {
      switch (action.type) {
        case "SAVE_SELECTION": {
          const oldSelection = saveSelectionInternal(action.payload.element);
          return {
            ...state,
            selection: oldSelection,
          };
        }
        case "SET": {
          const tokens = state.lexer.tokenize(action.payload);
          const grid = griddify(tokens, state.config.stylesConfig);
          return {
            ...state,
            tokens,
            grid,
          };
        }
        case "RESTORE_SELECTION": {
          const element = action.payload.element;
          element.innerHTML = ReactDOMServer.renderToString(
            <>{state.grid.rows.map((row) => row.elements)}</>
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
    initialCanvasContext
  );

  const updateTree = useCallback((text: string) => {
    dispatch({ type: "SET", payload: text });
  }, []);

  const saveSelection = useCallback((element: HTMLDivElement) => {
    dispatch({ type: "SAVE_SELECTION", payload: { element } });
  }, []);

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
