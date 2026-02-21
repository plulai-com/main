'use client';

import { Button } from './ui/button';

interface BulkActionsProps {
  selectedIds: string[];
  onComplete: () => void;
}

export function BulkActions({ selectedIds, onComplete }: BulkActionsProps) {
  const handleBulkAction = async (action: string) => {
    switch(action) {
      case 'assign-course':
        console.log('Assign course to:', selectedIds);
        break;
      case 'send-notification':
        console.log('Send notification to:', selectedIds);
        break;
      case 'export-data':
        console.log('Export data for:', selectedIds);
        break;
    }
    onComplete();
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative inline-block text-left">
        <Button variant="outline">
          Bulk Actions ({selectedIds.length})
        </Button>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
          <div className="py-1">
            <button
              onClick={() => handleBulkAction('assign-course')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Assign Course
            </button>
            <button
              onClick={() => handleBulkAction('send-notification')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Send Notification
            </button>
            <button
              onClick={() => handleBulkAction('export-data')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}