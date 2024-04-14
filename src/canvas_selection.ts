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

export { saveSelection, restoreSelection, SelectionNode, setDOMRange };
