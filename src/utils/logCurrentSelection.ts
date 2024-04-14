export function logCurrentSelection() {
  console.log("[CURR SELECTION]", document.getSelection()?.getRangeAt(0));
}
