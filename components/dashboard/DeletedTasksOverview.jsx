import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeletedTasksOverview({ onTaskRestoredOrPermanentlyDeleted }) {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeletedTasks();
  }, [onTaskRestoredOrPermanentlyDeleted]); // Re-fetch when parent signals a change

  const fetchDeletedTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/deleted-tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch deleted tasks');
      }
      const data = await response.json();
      setDeletedTasks(data);
      console.log('Fetched deleted tasks:', data); // Add this line
    } catch (err) {
      console.error('Error fetching deleted tasks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreTask = async (deletedTaskId) => {
    try {
      const response = await fetch(`/api/deleted-tasks/${deletedTaskId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const text = await response.text(); // Fallback if response is HTML
        throw new Error(`Failed to restore task: ${text}`);
      }

      const data = await response.json();

      console.log('Task restored successfully', data);
      // Trigger a refresh in the parent component and this component
      onTaskRestoredOrPermanentlyDeleted(prev => prev + 1);
    } catch (err) {
      console.error('Error restoring task:', err);
      setError(err.message);
    }
  };

  const handlePermanentDelete = async (deletedTaskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/deleted-tasks/${deletedTaskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to permanently delete task');
      }

      console.log('Task permanently deleted successfully');
      // Trigger a refresh in the parent component and this component
      onTaskRestoredOrPermanentlyDeleted(prev => prev + 1);
    } catch (err) {
      console.error('Error permanently deleting task:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-[#784e87] border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-gray-600">Loading deleted tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-center space-x-2 text-red-700">
        <XCircle className="h-5 w-5" />
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deletedTasks.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          No tasks in Trash.
        </div>
      ) : (
        deletedTasks.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{task.title}</p>
              {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Deleted: {format(parseISO(task.deletedAt), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRestoreTask(task.id)}
                className="text-[#784e87] hover:bg-[#784e87]/10"
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handlePermanentDelete(task.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Forever
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
