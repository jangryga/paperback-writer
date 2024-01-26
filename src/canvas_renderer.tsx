import { TokenType, TokenCategory, TokenKind } from "lexer-rs";
import { tokenLookup } from "./canvas_token_table";

const style = [
  "text-red-900",
  "text-gray-500",
  "text-black",
  "text-green-400",
  "text-yellow-600",
  "text-blue-700",
  "text-orang800",
  "text-magenta-500",
  "text-red-200",
  "text-black",
  "text-black",
];

export function renderElement(token: TokenType, key: string) {
  const className =
    style[TokenCategory[token.category as keyof typeof TokenCategory]];

  switch (TokenKind[token.kind as keyof typeof TokenKind]) {
    case 1:
      console.error("Dedent detected");
      return <span />;
    case 185:
      return <span key={key} />;
    case 186 /** identifier */:
      return (
        <span className={className} key={key}>
          {token.value}
        </span>
      );
    case 187 /** newline */:
      return <br />;
    case 188 /** whitespace */:
      return (
        <span key={key}>{"\u00A0".repeat(Number.parseInt(token.value!))}</span>
      );
    default:
      return (
        <span className={className} key={key}>
          {tokenLookup(TokenKind[token.kind as keyof typeof TokenKind])}
        </span>
      );
  }
}
