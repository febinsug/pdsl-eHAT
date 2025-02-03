import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Client } from '../../types';

interface ClientFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  editingClient: Client | null;
  formData: { name: string; description: string; };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; description: string; }>>;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  onCancel,
  saving,
  editingClient,
  formData,
  setFormData,
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold mb-4">
      {editingClient ? 'Edit Client' : 'Create New Client'}
    </h2>

    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
          Client Name
        </label>
        <input
          type="text"
          id="clientName"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
          required
        />
      </div>

      <div>
        <label htmlFor="clientDescription" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="clientDescription"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </form>
  </div>
);