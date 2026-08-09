import { Sparkles, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionFooterProps {
  readonly isCreate: boolean
  readonly isDirty: boolean
  readonly onClose: () => void
  readonly handleCreate: () => void
  readonly handleUpdate: () => void
  readonly setShowDeleteConfirm: (v: boolean) => void
  readonly showSaveConfirm: boolean
  readonly setShowSaveConfirm: (v: boolean) => void
  readonly isCreating?: boolean
  readonly isSaving?: boolean
  readonly isDeleting?: boolean
  readonly isValid?: boolean
}

export function ActionFooter({
  isCreate,
  isDirty,
  onClose,
  handleCreate,
  handleUpdate,
  setShowDeleteConfirm,
  showSaveConfirm,
  setShowSaveConfirm,
  isCreating = false,
  isSaving = false,
  isDeleting = false,
  isValid = true,
}: ActionFooterProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-white/5 bg-white/[0.02] px-8 py-6">
      {isCreate ? (
        <CreateModeFooter
          onCancel={onClose}
          onCreate={handleCreate}
          isDirty={isDirty}
          isValid={isValid}
          loading={isCreating}
        />
      ) : (
        <EditModeFooter
          isDirty={isDirty}
          onClose={onClose}
          setShowDeleteConfirm={setShowDeleteConfirm}
          showSaveConfirm={showSaveConfirm}
          setShowSaveConfirm={setShowSaveConfirm}
          handleUpdate={handleUpdate}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}

interface CreateModeFooterProps {
  readonly onCancel: () => void
  readonly onCreate: () => void
  readonly isDirty: boolean
  readonly isValid?: boolean
  readonly loading?: boolean
}

function CreateModeFooter({
  onCancel,
  onCreate,
  isDirty,
  isValid = true,
  loading,
}: CreateModeFooterProps) {
  return (
    <>
      <Button
        variant="ghost"
        onClick={onCancel}
        className="text-xs font-bold hover:bg-white/5"
      >
        Cancel
      </Button>
      <Button
        onClick={onCreate}
        disabled={!isDirty || !isValid || loading}
        loading={loading}
        className="h-11 gap-2 rounded-xl bg-primary px-8 text-xs font-black tracking-widest text-primary-foreground uppercase shadow-lg shadow-primary/20 hover:bg-primary/90"
      >
        Create Task <Sparkles className="h-4 w-4" />
      </Button>
    </>
  )
}

interface EditModeFooterProps {
  readonly isDirty: boolean
  readonly onClose: () => void
  readonly setShowDeleteConfirm: (v: boolean) => void
  readonly showSaveConfirm: boolean
  readonly setShowSaveConfirm: (v: boolean) => void
  readonly handleUpdate: () => void
  readonly isSaving?: boolean
  readonly isDeleting?: boolean
}

function EditModeFooter({
  isDirty,
  onClose,
  setShowDeleteConfirm,
  showSaveConfirm,
  setShowSaveConfirm,
  handleUpdate,
  isSaving = false,
  isDeleting = false,
}: EditModeFooterProps) {
  if (showSaveConfirm) {
    return (
      <div className="flex w-full items-center justify-end">
        <SaveConfirmView
          onConfirm={handleUpdate}
          onCancel={() => setShowSaveConfirm(false)}
          loading={isSaving}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full items-center justify-between">
      <Button
        variant="ghost"
        onClick={() => setShowDeleteConfirm(true)}
        className="h-11 rounded-xl px-6 text-xs font-bold text-destructive/40 transition-all hover:bg-destructive/10 hover:text-destructive"
        loading={isDeleting}
      >
        <Trash2 className="mr-2 h-4 w-4" /> Delete Task
      </Button>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={onClose}
          className="h-11 rounded-xl px-6 text-xs font-bold text-foreground/40 transition-all hover:bg-white/5 hover:text-foreground"
        >
          {isDirty ? "Cancel" : "Close"}
        </Button>
        <Button
          onClick={() => setShowSaveConfirm(true)}
          disabled={!isDirty || isSaving}
          className="flex h-11 items-center gap-2 rounded-xl bg-primary px-8 text-xs font-black tracking-widest text-primary-foreground uppercase shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:bg-primary/20 disabled:text-primary-foreground/50 disabled:opacity-50"
        >
          Update Task <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function SaveConfirmView({
  onConfirm,
  onCancel,
  loading,
}: Readonly<{
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}>) {
  return (
    <div className="flex animate-in items-center gap-2 duration-300 fade-in slide-in-from-right-2">
      <Button
        variant="ghost"
        onClick={onCancel}
        className="h-11 rounded-xl bg-white/5 px-6 text-xs font-bold transition-all hover:bg-white/10"
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        loading={loading}
        className="h-11 gap-2 rounded-xl bg-primary px-8 text-xs font-black tracking-widest text-primary-foreground uppercase shadow-lg shadow-primary/20"
      >
        <Check className="h-4 w-4" /> Confirm Update
      </Button>
    </div>
  )
}
