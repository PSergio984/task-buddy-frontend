import { Sparkles, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionFooterProps {
  readonly isCreate: boolean
  readonly isDirty: boolean
  readonly onOpenChange: (v: boolean) => void
  readonly handleCreate: () => void
  readonly handleUpdate: () => void
  readonly showDeleteConfirm: boolean
  readonly setShowDeleteConfirm: (v: boolean) => void
  readonly handleDelete: () => void
  readonly showSaveConfirm: boolean
  readonly setShowSaveConfirm: (v: boolean) => void
  readonly isCreating?: boolean
  readonly isSaving?: boolean
  readonly isDeleting?: boolean
}

export function ActionFooter({
  isCreate, isDirty, onOpenChange, handleCreate, handleUpdate,
  showDeleteConfirm, setShowDeleteConfirm, handleDelete,
  showSaveConfirm, setShowSaveConfirm,
  isCreating = false, isSaving = false, isDeleting = false
}: ActionFooterProps) {
  return (
    <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
      {isCreate ? (
        <CreateModeFooter 
          onCancel={() => onOpenChange(false)} 
          onCreate={handleCreate} 
          isDirty={isDirty} 
          loading={isCreating}
        />
      ) : (
        <EditModeFooter 
          isDirty={isDirty}
          onOpenChange={onOpenChange}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
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
  readonly loading?: boolean
}

function CreateModeFooter({ onCancel, onCreate, isDirty, loading }: CreateModeFooterProps) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} className="text-xs font-bold hover:bg-white/5">
        Cancel
      </Button>
      <Button
        onClick={onCreate}
        disabled={!isDirty || loading}
        loading={loading}
        className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 rounded-xl text-xs font-black uppercase tracking-widest gap-2"
      >
        Create Task <Sparkles className="h-4 w-4" />
      </Button>
    </>
  )
}

interface EditModeFooterProps {
  readonly isDirty: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly showDeleteConfirm: boolean
  readonly setShowDeleteConfirm: (v: boolean) => void
  readonly handleDelete: () => void
  readonly showSaveConfirm: boolean
  readonly setShowSaveConfirm: (v: boolean) => void
  readonly handleUpdate: () => void
  readonly isCreating?: boolean
  readonly isSaving?: boolean
  readonly isDeleting?: boolean
}

function EditModeFooter({ 
  isDirty, onOpenChange, showDeleteConfirm, setShowDeleteConfirm, handleDelete,
  showSaveConfirm, setShowSaveConfirm, handleUpdate,
  isSaving = false, isDeleting = false
}: EditModeFooterProps) {
  if (showDeleteConfirm) {
    return (
      <div className="flex items-center justify-start w-full">
        <DeleteConfirmView onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} loading={isDeleting} />
      </div>
    )
  }

  if (showSaveConfirm) {
    return (
      <div className="flex items-center justify-end w-full">
        <SaveConfirmView onConfirm={handleUpdate} onCancel={() => setShowSaveConfirm(false)} loading={isSaving} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={() => setShowDeleteConfirm(true)}
        className="text-xs font-bold text-destructive/40 hover:text-destructive hover:bg-destructive/10 h-11 px-6 rounded-xl transition-all"
      >
        <Trash2 className="h-4 w-4 mr-2" /> Delete Task
      </Button>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="text-xs font-bold text-foreground/40 hover:text-foreground hover:bg-white/5 h-11 px-6 rounded-xl transition-all"
        >
          {isDirty ? "Cancel" : "Close"}
        </Button>
        <Button
          onClick={() => setShowSaveConfirm(true)}
          disabled={!isDirty || isSaving}
          className="text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:bg-primary/20 disabled:text-primary-foreground/50 h-11 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
        >
          Update Task <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function DeleteConfirmView({ onConfirm, onCancel, loading }: Readonly<{ onConfirm: () => void; onCancel: () => void; loading?: boolean }>) {
  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
      <Button
        variant="destructive"
        onClick={onConfirm}
        loading={loading}
        className="text-xs font-black uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-destructive/20 gap-2"
      >
        <Check className="h-4 w-4" /> Confirm Delete
      </Button>
      <Button
        variant="ghost"
        onClick={onCancel}
        className="text-xs font-bold hover:bg-white/10 h-11 px-6 rounded-xl bg-white/5 transition-all"
      >
        Cancel
      </Button>
    </div>
  )
}

function SaveConfirmView({ onConfirm, onCancel, loading }: Readonly<{ onConfirm: () => void; onCancel: () => void; loading?: boolean }>) {
  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
      <Button
        variant="ghost"
        onClick={onCancel}
        className="text-xs font-bold hover:bg-white/10 h-11 px-6 rounded-xl bg-white/5 transition-all"
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        loading={loading}
        className="text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground h-11 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2"
      >
        <Check className="h-4 w-4" /> Confirm Update
      </Button>
    </div>
  )
}
