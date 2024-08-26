import { LexerWrapper, TokenType } from "lexer-rs";
import { BASE_SPAN_ID } from "./utils/defaults";
import { invariant } from "./utils/invariant";

class SelectionNode {
  public name: string;
  public children: SelectionNode[] | undefined;
  public value: string | undefined;
  public rangeMarker:
    | {
        rangeStart?: boolean;
        rangeStartOffset?: number;
        rangeEnd?: boolean;
        rangeEndOffset?: number;
      }
    | undefined;

  constructor(node: Node, domRange: Range) {
    if (domRange.startContainer === node) {
      this.rangeMarker = {
        ...this.rangeMarker,
        rangeStart: true,
        rangeStartOffset: domRange.startOffset,
      };
    }
    if (domRange.endContainer === node) {
      this.rangeMarker = {
        ...this.rangeMarker,
        rangeEnd: true,
        rangeEndOffset: domRange.endOffset,
      };
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      switch (element.tagName) {
        case "DIV":
          this.name = "DIV";
          break;
        case "BR":
          this.name = "BR";
          break;
        case "SPAN":
          this.name = "SPAN";
          break;
        default:
          throw new Error(`Unsupported element ${element.tagName}`);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const element = node as Text;
      this.name = "TEXT";
      this.value = element.textContent!;
    } else {
      throw new Error(`Unsupported node type ${node.nodeType}`);
    }

    if (node.childNodes) {
      this.children = [];
      if (!this.rangeMarker?.rangeEnd) {
        for (const ch of node.childNodes) {
          const chn = new SelectionNode(ch, domRange);
          this.children.push(chn);
          if (chn.containsEnd()) break;
        }
      }
    }
  }

  containsEnd() {
    if (this.rangeMarker?.rangeEnd) return true;
    if (this.children) {
      for (const child of this.children) {
        if (child.containsEnd()) return true;
      }
    }
    return false;
  }
}

function saveSelection(element: HTMLElement) {
  const selection = document.getSelection();
  if (!selection) return null;
  const range = selection.getRangeAt(0);

  return new SelectionNode(element, range);
}

export function getCurrentHighlightRow(
  selectionNode: SelectionNode | null
): number | null {
  const selection = document.getSelection();
  if (!selection || !selectionNode) return null;
  const range = selection.getRangeAt(0);
  if (range.startContainer !== range.endContainer) return null;
  if (selectionNode.children?.length === 0) return 0;
  return selectionNode.children!.length - 1;
}

/**
 * When there is a need for a reconciliation:
 * if there is an element <div><span>return</span></div>
 * adding a whitespace will result in:
 * ...<span>return </span>...
 * but what the renderer will produce is:
 * ...<span>return</span><span>&nbsp;</span>
 *
 * similarly, if there's a new token like in case of "return" -> "return+"
 *
 * Few things:
 * !## pevSelection tree will be only one node off the correct
 * !## if selection is not collapsed, it must be correct
 * !## restoreSelection should always have collapsed selection - restoring after dom update
 * 1. iterate at the same time over two trees: original element tree and SelectionNode tree
 * 2. get to the end of selectionTree -> this is where the end of the selection is
 * 3. check length of the node is less than the offset:
 *     - no => offset is correct
 *     - yes => use beginning of next node (have to go up one level from textNode to SPAN, then take next SPAN.text)
 */
function restoreSelection(
  node: Node,
  prevSelNode: SelectionNode | null,
  modifyOffset: boolean
): void {
  if (!prevSelNode) return;
  if (prevSelNode.rangeMarker) {
    return setDOMRange(node, node, 0, 0);
  }
  const endNodeIdx = prevSelNode.children!.length - 1;
  const fakeEndNode = prevSelNode.children![endNodeIdx];
  invariant(fakeEndNode.containsEnd(), "Expected range end.");
  invariant(node.childNodes.length >= endNodeIdx, "Selection out of range.");
  const realEndNode = node.childNodes[endNodeIdx];
  if (fakeEndNode.rangeMarker) {
    return setDOMRange(
      realEndNode,
      realEndNode,
      fakeEndNode.rangeMarker.rangeStartOffset!,
      fakeEndNode.rangeMarker.rangeEndOffset!
    );
  }
  invariant(
    typeof fakeEndNode.children !== undefined,
    "Expected children elements."
  );
  const spanIdx = fakeEndNode.children!.length - 1;
  invariant(
    fakeEndNode.children![spanIdx].containsEnd(),
    "Expected nested range end."
  );
  invariant(
    realEndNode.childNodes.length >= spanIdx,
    "Nested selection out of range."
  );
  if (fakeEndNode.children![spanIdx].rangeMarker) {
    const _node = realEndNode.childNodes[spanIdx];
    const _marker = fakeEndNode.children![spanIdx].rangeMarker;
    return setDOMRange(
      _node,
      _node,
      _marker?.rangeStartOffset!,
      _marker?.rangeEndOffset!
    );
  }
  const spanNode = realEndNode.childNodes[spanIdx];
  const textNode = spanNode.childNodes[0];
  invariant(
    !textNode || textNode?.nodeType === Node.TEXT_NODE,
    "Expected TEXT node."
  );
  const textRangeMarker =
    fakeEndNode.children![spanIdx].children![0].rangeMarker;
  invariant(
    textRangeMarker !== undefined,
    "Expected textRangeMarker to be defined."
  );
  if (!textNode) {
  }
  if (
    textNode &&
    textRangeMarker?.rangeEndOffset! > (textNode as Text).length &&
    !modifyOffset
  ) {
    console.warn(
      `Saved offset greater than text length. Walking up the tree. Offset given: ${textRangeMarker?.rangeEndOffset}, actual length: ${(textNode as Text).length}`
    );
    invariant(
      realEndNode.childNodes.length > spanIdx + 1,
      "[Reconciliation error] Expected extra child node on row <div>."
    );
    const nextSpanNode = realEndNode.childNodes[spanIdx + 1];
    const nextTextNode = nextSpanNode.childNodes[0];
    return setDOMRange(nextTextNode, nextTextNode, 1, 1);
  }

  const offset = textRangeMarker?.rangeStartOffset! - (modifyOffset ? 1 : 0);

  return setDOMRange(textNode, textNode, offset, offset);
}

export function restoreSelectionToBaseCase() {
  const baseSpan = document.getElementsByClassName(BASE_SPAN_ID)[0];
  if (!baseSpan) throw Error("Base span not found");
  setDOMRange(baseSpan.childNodes[0], baseSpan.childNodes[0], 1, 1);
}

function setDOMRange(
  nodeStart: Node,
  nodeEnd: Node,
  offsetStart: number,
  offsetEnd: number
): void {
  const domSelection = document.getSelection();
  const range = new Range();
  range.setStart(nodeStart, offsetStart);
  range.setEnd(nodeEnd, offsetEnd);
  domSelection?.removeAllRanges();
  domSelection?.addRange(range);
}

function insertAtSelection(
  tokens: TokenType[],
  insertWidth: number,
  selection: SelectionNode,
  lexer: LexerWrapper
): [TokenType[], SelectionNode] {
  console.log("tokens", tokens);
  console.log("selection", selection);
  const level1_NodeIdx = selection.children!.length - 1 ?? 1;
  console.log("selectionLineNumber", level1_NodeIdx);

  // go to token offset:
  let minTokenLineOffset = 0;
  let newlineCount = 0;
  for (const [idx, token] of tokens.entries()) {
    if (newlineCount === level1_NodeIdx) {
      minTokenLineOffset = idx;
      break;
    }
    if (token.kind === "Newline") newlineCount += 1;
  }

  console.log("minTokenLineOffset", minTokenLineOffset);

  const level1_Node = selection.children![level1_NodeIdx];
  invariant(
    typeof level1_Node !== "undefined",
    "insertAtSelection :: node undefined"
  );

  const level2_NodeIdx =
    selection.children![level1_NodeIdx].children!.length - 1;
  console.log("level2_NodeIdx", level2_NodeIdx);
  const level2_Node = level1_Node.children![level2_NodeIdx];
  invariant(
    typeof level2_Node !== "undefined",
    "insertAtSelection :: node undefined"
  );

  const tokenIdx = minTokenLineOffset + level2_NodeIdx;

  console.log("tokenIdx", tokenIdx);
  const token = tokens[tokenIdx];
  console.log("inserting into:", token);
  const rangeOffset = level2_Node.children![0].rangeMarker?.rangeStartOffset;

  console.log("rangeOffset", rangeOffset);

  if (token.category === "Whitespace") {
    token.value = (parseInt(token.value!) + insertWidth).toString();
    selection = updateSelectionOnInsert(selection, {
      type: "expand_whitespace",
      value: insertWidth,
    });
  } else {
    const strValue = token.value!;
    invariant(
      strValue !== undefined && strValue.length >= rangeOffset!,
      "insertAtSelection :: Error parsing stirng token offset"
    );
    if (rangeOffset === strValue.length) {
      // insert whitespace after token
      // TODO: if next token is a whitespace, expand it instead of inserting another whitespace
      console.log("old tokens", tokens);
      const nextToken = tokens[tokenIdx + 1];
      if (nextToken.category === "Whitespace") {
        nextToken.value = (parseInt(nextToken.value!) + insertWidth).toString();
        selection = updateSelectionOnInsert(selection, {
          type: "skip_to_next_whitespace",
          value: insertWidth,
          trailingWhitespaceLength: parseInt(nextToken.value!),
        });
      } else {
        tokens = [
          ...tokens.slice(0, tokenIdx + 1),
          {
            kind: "Whitespace",
            value: insertWidth.toString(),
            category: "Whitespace",
          },
          ...tokens.slice(tokenIdx + 1),
        ];
        selection = updateSelectionOnInsert(selection, {
          type: "insert_whitespace",
          value: insertWidth,
        });
      }
    } else {
      console.log(
        "swap current token for three new ones and update selection accordingly"
      );
    }
  }

  return [tokens, selection];
}

type InsertType =
  | "expand_whitespace"
  | "insert_whitespace"
  | "skip_to_next_whitespace";

function updateSelectionOnInsert(
  selection: SelectionNode,
  change: {
    type: InsertType;
    value?: number;
    trailingWhitespaceLength?: number;
  }
): SelectionNode {
  switch (change.type) {
    case "expand_whitespace": {
      let node = selection;
      while (node.children && node.children.length > 0) {
        node = node.children[node.children.length - 1];
      }
      invariant(
        node.rangeMarker !== undefined,
        "updateSelectionOnInsert :: missing rangeMarker"
      );
      node.rangeMarker.rangeStartOffset! += change.value as number;
      console.log(node.rangeMarker);
      return selection;
    }
    // before newline, EOF
    case "insert_whitespace": {
      appendWhitespaceToRowNode(selection, change.value!, change.value!);
      return selection;
    }
    // before whitespace
    case "skip_to_next_whitespace": {
      appendWhitespaceToRowNode(
        selection,
        change.value!,
        change.trailingWhitespaceLength!
      );
      return selection;
    }
    default:
      throw new Error(`Unimplemented :: updateSelectionOnInsert :: ${change}`);
  }
}

function appendWhitespaceToRowNode(
  root: SelectionNode,
  offset: number,
  length: number
): void {
  let prev: any = null;
  let prevprev: any = null;
  let node = root;
  while (node.children && node.children.length > 0) {
    if (prev !== null) prevprev = prev;
    prev = node;
    node = node.children[node.children.length - 1];
  }
  const span = document.createElement("span");
  span.textContent = " ".repeat(length);
  const newWhitespaceNode = new SelectionNode(span, new Range());
  invariant(
    node.rangeMarker !== undefined,
    "updateSelectionOnInsert :: missing rangeMarker"
  );
  node.rangeMarker = undefined;
  newWhitespaceNode.children![0].rangeMarker = {
    rangeEnd: true,
    rangeEndOffset: offset,
    rangeStart: true,
    rangeStartOffset: offset,
  };
  prevprev.children.push(newWhitespaceNode);
}

export {
  saveSelection,
  restoreSelection,
  SelectionNode,
  setDOMRange,
  insertAtSelection,
};
