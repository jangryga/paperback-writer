export class ShortcutManager {
  public updateState: Function;
  public canvas: HTMLDivElement | null;

  constructor(canvas: HTMLDivElement | null, callback: Function) {
    this.updateState = callback;
    this.canvas = canvas;

    this.handler = this.handler.bind(this);
  }

  register(canvas: HTMLDivElement | null) {
    console.log("registering ", canvas);
    this.canvas = canvas;
    if (!this.canvas) return;
    this.canvas.onfocus = () => {
      console.log("ShortcutManager :: addEventListener :: keydown");
      document.addEventListener("keydown", this.handler);
    };

    this.canvas.onblur = () => {
      console.log("ShortcutManager :: removeEventListener :: keydown");
      document.removeEventListener("keydown", this.handler);
    };
  }

  handler(e: KeyboardEvent) {
    console.log(`KeyboardEvent: key='${e.key}' | code='${e.code}'`);

    const overwrites = ["Tab"];

    if (!overwrites.includes(e.key)) return;
    e.preventDefault();

    if (e.key === "Tab") {
      if (!this.canvas) {
        console.log("canvas not found");
        return;
      }
      this.updateState(this.canvas.innerText, this.canvas, {
        forwardAtSelection: true,
      });
    }
  }
}
