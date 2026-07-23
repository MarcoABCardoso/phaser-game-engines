export function gateDialogueInput(intent, { dialogueOpen, waitingForInteractRelease }) {
  if (!dialogueOpen && !waitingForInteractRelease) {
    return { intent, waitingForInteractRelease: false };
  }
  return {
    intent: { ...intent, move: { x: 0, y: 0 }, actions: {} },
    waitingForInteractRelease: waitingForInteractRelease
      && Boolean(intent.actions?.interact?.down),
  };
}
