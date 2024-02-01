import { TokenType, TokenCategory, TokenKind } from "lexer-rs";
import { tokenLookup } from "./canvas_token_table";
import { CanvasConfigType } from "./canvas_context";

export function renderElement(
  token: TokenType,
  key: string,
  CSSConfig: CanvasConfigType["stylesConfig"]
) {
  const textColor =
    CSSConfig.styles[token.category as keyof typeof TokenCategory];

  switch (TokenKind[token.kind as keyof typeof TokenKind]) {
    case 1:
      console.error("Dedent detected");
      return <span />;
    case 185:
      return <span key={key} />;
    case 186 /** identifier */:
      return (
        <span
          {...(CSSConfig.useTailwind
            ? { className: textColor }
            : { style: { color: textColor } })}
          key={key}
        >
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
        <span
          {...(CSSConfig.useTailwind
            ? { className: textColor }
            : { style: { color: textColor } })}
          key={key}
        >
          {tokenLookup(TokenKind[token.kind as keyof typeof TokenKind])}
        </span>
      );
  }
}
