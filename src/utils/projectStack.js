/** Enable the stack only when every card remains fully readable while pinned. */
export function canStackProjects(width, height, cardHeights) {
  return (
    width >= 1100 &&
    cardHeights.length > 0 &&
    cardHeights.every(
      (cardHeight, index) =>
        cardHeight > 0 && cardHeight + 105 + index * 9 + 24 <= height,
    )
  );
}
