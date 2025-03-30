import { TokenType } from "lexer-rs";
import { SelectionNode } from "./canvas_selection";
// import { invariant } from "./utils/invariant";

export function expandStringTokens(tokens: TokenType[], _selection: SelectionNode | null) {
  let expanded: TokenType[] = [];
  console.log("Pre", tokens);

  for (const token of tokens) {
    if (token.kind !== "String") {
      expanded.push(token);
      continue;
    }
    if (!token.value?.includes("\n")) {
      console.log("not found");
      expanded.push(token);
      continue;
    }
    const parts = token.value.split("\n");
    if (parts.length != 2) console.log(`Expected 2 parts, found ${parts.length}. This is an error if not pasting`);
    for (let [idx, entry] of parts.entries()) {
      if (entry.startsWith("\\")) entry += "'";
      else entry += '"';
      entry + expanded.push({ category: "Literal", value: entry, kind: "String" });
      if (idx === parts.length - 1) continue;
      expanded.push({ category: "Whitespace", value: "1", kind: "Whitespace" });
      expanded.push({ category: "Identifier", value: "\\", kind: "Ident" });
      expanded.push({ category: "Whitespace", value: undefined, kind: "Newline" });
    }
  }
  return expanded;
  console.log("Post", tokens);
  console.log("Prerender selection", _selection);
}
