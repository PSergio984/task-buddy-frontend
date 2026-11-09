export interface SubtaskItem {
  title: string
  accepted: boolean
}

/** Card-updater factory: transform the subtask at `index` in a card's list. */
export function updateSubtaskAt<
  T extends { subtasks: { title: string; accepted: boolean }[] },
>(
  index: number,
  transform: (item: { title: string; accepted: boolean }) => {
    title: string
    accepted: boolean
  }
) {
  return (prev: T): T => ({
    ...prev,
    subtasks: prev.subtasks.map((item, itemIndex) =>
      itemIndex === index ? transform(item) : item
    ),
  })
}
