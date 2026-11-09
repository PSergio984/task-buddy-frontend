export interface SubtaskItem {
  title: string
  accepted: boolean
}

/** Backend field limits (app/schemas/task.py): TaskCreate.title,
 *  TaskCreate.description and SubtaskCreate.title — oversized values 422. */
export const TASK_TITLE_LIMIT = 100
export const TASK_DESCRIPTION_LIMIT = 2_000
export const SUBTASK_TITLE_LIMIT = 80

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
