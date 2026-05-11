import { Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionFooterProps {
  readonly isCreate: boolean
  readonly isDirty: boolean
  readonly onOpenChange: (v: boolean) => void
  readonly handleCreate: () => void
  readonly showDeleteConfirm: boolean
  readonly setShowDeleteConfirm: (v: boolean) => void
  readonly handleDelete: () => void
}

export function ActionFooter({
  isCreate, isDirty, onOpenChange, handleCreate,
  showDeleteConfirm, setShowDeleteConfirm, handleDelete
}: ActionFooterProps) {
  return (
    <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
      {isCreate ? (
        <CreateModeFooter 
          onCancel={() => onOpenChange(false)} 
          onCreate={handleCreate} 
          isDirty={isDirty} 
        />
      ) : (
        <EditModeFooter 
          onOpenChange={onOpenChange}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
        />
      )}
    </div>
  )
}

interface CreateModeFooterProps {
  readonly onCancel: () => void
  readonly onCreate: () => void
  readonly isDirty: boolean
}

function CreateModeFooter({ onCancel, onCreate, isDirty }: CreateModeFooterProps) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel} className="text-xs font-bold hover:bg-white/5">
        Cancel
      </Button>
      <Button
        onClick={onCreate}
        disabled={!isDirty}
        className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 rounded-xl text-xs font-black uppercase tracking-widest gap-2"
      >
        Create Task <Sparkles className="h-4 w-4" />
      </Button>
    </>
  )
}

interface EditModeFooterProps {
  readonly onOpenChange: (open: boolean) => void
  readonly showDeleteConfirm: boolean
  readonly setShowDeleteConfirm: (v: boolean) => void
  readonly handleDelete: () => void
}

function EditModeFooter({ onOpenChange, showDeleteConfirm, setShowDeleteConfirm, handleDelete }: EditModeFooterProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {showDeleteConfirm ? (
        <DeleteConfirmView onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs font-bold text-destructive/40 hover:text-destructive hover:bg-destructive/10 h-11 px-6 rounded-xl transition-all"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete Task
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={() => onOpenChange(false)}
        className="text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 h-11 px-8 rounded-xl transition-all"
      >
        Done
      </Button>
    </div>
  )
}

interface DeleteConfirmViewProps {
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

function DeleteConfirmView({ onConfirm, onCancel }: DeleteConfirmViewProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        onClick={onConfirm}
        className="text-xs font-black uppercase tracking-widest h-11 px-8 rounded-xl"
      >
        Confirm Delete
      </Button>
      <Button
        variant="ghost"
        onClick={onCancel}
        className="text-xs font-bold hover:bg-white/5 h-11 px-6 rounded-xl"
      >
        Cancel
      </Button>
    </div>
  )
}
