import { createElement, type ComponentType } from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { expect, vi } from "vitest"

/**
 * Shared offline-draft checks for the game-list columns (habits,
 * dailies): an open form must stay mounted with its draft when the
 * connection drops — only the submit blocks. The column prop shapes
 * differ only in the list prop name ("habits"/"dailies") and their
 * labels only in the domain noun, so callers hand over those bits and
 * get back the edit- and create-draft scenarios.
 */

// The slice of either column's props the offline scenarios drive.
type OfflineColumnProps = {
  isPending: boolean
  isError: boolean
  isOnline: boolean
  writesDisabled?: boolean
  onRetry: () => void
}

type ColumnPropsFor<Row, K extends string> = {
  [P in K]: Row[] | undefined
} & OfflineColumnProps

export function offlineDraftChecks<
  Row extends { title: string },
  K extends string,
>(opts: {
  Column: ComponentType<ColumnPropsFor<Row, K>>
  /** The column's items prop — "habits"/"dailies". */
  listProp: K
  /** Rendered row — its title drives the "Edit <title>" aria-label. */
  row: Row
  /** Domain noun in the form labels — "habit"/"daily". */
  noun: string
}) {
  const { Column, listProp, row, noun } = opts
  const titleLabel = new RegExp(`^${noun}$`, "i")

  // The same element flipped offline — a draft opened while online must
  // survive the connectivity change.
  const element = (online: boolean) =>
    createElement(Column, {
      [listProp]: [row],
      isPending: false,
      isError: false,
      isOnline: online,
      writesDisabled: !online,
      onRetry: vi.fn(),
    } as ColumnPropsFor<Row, K>)

  const run = (openForm: () => void, submitName: string) => {
    const { rerender } = render(element(true))
    openForm()
    fireEvent.change(screen.getByLabelText(titleLabel), {
      target: { value: "draft title" },
    })

    rerender(element(false))

    // The form stays mounted with the draft — only the submit blocks.
    expect(screen.getByLabelText(titleLabel)).toHaveValue("draft title")
    expect(screen.getByRole("button", { name: submitName })).toBeDisabled()
  }

  return {
    /** Draft opened via the row's edit pencil. */
    edit: () =>
      run(
        () => fireEvent.click(screen.getByLabelText(`Edit ${row.title}`)),
        `Save ${noun}`
      ),
    /** Draft opened via the header's "+" create button. */
    create: () =>
      run(
        () => fireEvent.click(screen.getByLabelText(`New ${noun}`)),
        `Add ${noun}`
      ),
  }
}
