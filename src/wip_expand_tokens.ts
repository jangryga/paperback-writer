import { TokenType } from "lexer-rs";
import { moveSelection, SelectionNode } from "./canvas_selection";
import { invariant } from "./utils/invariant";
// import { invariant } from "./utils/invariant";

export function expandStringsOnNewlines(tokens: TokenType[], selection: SelectionNode | null) {
  invariant(selection !== null);
  let expanded: TokenType[] = [];
  let selectionChanged = false;

  for (const token of tokens) {
    if (token.kind !== "String") {
      expanded.push(token);
      continue;
    }
    if (!token.value?.includes("\n")) {
      expanded.push(token);
      continue;
    }
    const parts = token.value.split("\n");
    invariant(parts.length == 2, `Expected 2 parts, found ${parts.length}. This is an error if not pasting`);
    selectionChanged = true;
    for (let [idx, entry] of parts.entries()) {
      if (entry.startsWith("'")) entry += "'";
      else entry += '"';
      entry + expanded.push({ category: "Literal", value: entry, kind: "String" });
      if (idx === parts.length - 1) continue;
      expanded.push({ category: "Whitespace", value: "1", kind: "Whitespace" });
      expanded.push({ category: "Identifier", value: "\\", kind: "Ident" });
      expanded.push({ category: "Whitespace", value: undefined, kind: "Newline" });
    }
  }
  if (selectionChanged) selection = moveSelection(selection!);
  return { tokens: expanded, selection };
}
