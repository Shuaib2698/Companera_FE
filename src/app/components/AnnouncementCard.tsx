'use client';
import { useState } from 'react';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  targetAudience: string;
  isImportant: boolean;
  author?: { name: string };
}

interface Props {
  announcement: Announcement;
  isAdmin?: boolean;
  onEdit?: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
}

export default function AnnouncementCard({ announcement, isAdmin = false, onEdit, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(announcement);

  const handleUpdate = () => {
    if (onEdit) {
      onEdit(announcement._id, editData);
    }
    setIsEditing(false);
  };

  return (
    <div className="border p-4 rounded shadow bg-white">
      {isEditing ? (
        <div className="space-y-2">
          <input
            className="w-full border p-2"
            value={editData.title}
            onChange={e => setEditData({ ...editData, title: e.target.value })}
          />
          <textarea
            className="w-full border p-2"
            value={editData.content}
            onChange={e => setEditData({ ...editData, content: e.target.value })}
          />
          <button onClick={handleUpdate} className="bg-green-500 text-white px-3 py-1 rounded mr-2">
            Save
          </button>
          <button onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded">
            Cancel
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold">{announcement.title}</h2>
          <p>{announcement.content}</p>
          {announcement.isImportant && <p className="text-red-500 font-medium mt-2">Important</p>}
          <p className="text-sm text-gray-500 mt-1">By: {announcement.author?.name || 'Admin'}</p>

          {isAdmin && (
            <div className="mt-3 flex space-x-4">
              <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline">
                Edit
              </button>
              <button onClick={() => onDelete?.(announcement._id)} className="text-red-600 hover:underline">
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
