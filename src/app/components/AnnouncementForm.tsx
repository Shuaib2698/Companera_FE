'use client';
import { useState } from 'react';

interface AnnouncementFormProps {
  onSubmit: (data: any) => void;
}

export default function AnnouncementForm({ onSubmit }: AnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'all',
    isImportant: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ title: '', content: '', targetAudience: 'all', isImportant: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded shadow bg-white">
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Announcement Title"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        name="content"
        value={formData.content}
        onChange={handleChange}
        placeholder="Content"
        className="w-full border p-2 rounded"
        required
      />
      <select
        name="targetAudience"
        value={formData.targetAudience}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="all">All</option>
        <option value="employee">Employee</option>
      </select>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="isImportant"
          checked={formData.isImportant}
          onChange={handleChange}
        />
        <span>Mark as Important</span>
      </label>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Post Announcement
      </button>
    </form>
  );
}
