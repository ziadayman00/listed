import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirmDelete,
  task,
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Delete Task</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Are you sure you want to delete &quot;{task?.title}&quot;?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-700">
            Moving to Trash allows you to restore the task later. Deleting forever removes it permanently.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row-reverse sm:space-x-2 sm:space-x-reverse mt-4">
          <Button 
            onClick={() => onConfirmDelete(task.id, false)} 
            className="w-full sm:w-auto bg-[#784e87] hover:bg-[#6b4476] text-white"
          >
            Move to Trash
          </Button>
          <Button 
            onClick={() => onConfirmDelete(task.id, true)} 
            variant="destructive" 
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Delete Forever
          </Button>
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
