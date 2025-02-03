import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Project, User, Client } from '../../types';

interface ProjectFormData {
  name: string;
  description: string;
  allocated_hours: number;
  assigned_users: string[];
  client_id: string;
}

interface ProjectFormProps {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  users: User[];
  clients: Client[];
  editingProject: Project | null;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  saving,
  users,
  clients,
  editingProject,
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold mb-4">
      {editingProject ? 'Edit Project' : 'Create New Project'}
    </h2>

    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
            required
          />
        </div>

        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700">
            Client
          </label>
          <select
            id="client"
            value={formData.client_id}
            onChange={e => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
            required
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
        />
      </div>

      <div>
        <label htmlFor="allocated_hours" className="block text-sm font-medium text-gray-700">
          Allocated Hours
        </label>
        <input
          type="number"
          id="allocated_hours"
          value={formData.allocated_hours}
          onChange={e => setFormData(prev => ({ ...prev, allocated_hours: parseInt(e.target.value) }))}
          min="0"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Users
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md">
          {users.map(user => (
            <label key={user.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.assigned_users.includes(user.id)}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    assigned_users: e.target.checked
                      ? [...prev.assigned_users, user.id]
                      : prev.assigned_users.filter(id => id !== user.id),
                  }));
                }}
                className="rounded border-gray-300 text-[#1732ca] focus:ring-[#1732ca]"
              />
              <span>{user.full_name || user.username}</span>
              <span className="text-sm text-gray-500 capitalize">({user.role})</span>
            </label>
          ))}
        </div>
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
          {saving ? 'Saving...' : 'Save Project'}
        </button>
      </div>
    </form>
  </div>
);