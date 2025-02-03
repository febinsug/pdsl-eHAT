import React from 'react';
import { Edit2, Building2 } from 'lucide-react';
import type { Client, Project } from '../../types';

interface ClientListProps {
  clients: Client[];
  projects: Project[];
  onEdit: (client: Client) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  projects,
  onEdit,
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Client Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Projects
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {clients.map(client => (
          <tr key={client.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{client.name}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-500">{client.description || '-'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="flex flex-wrap gap-1">
                {projects
                  .filter(p => p.client_id === client.id)
                  .map(project => (
                    <span
                      key={project.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {project.name}
                    </span>
                  ))}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                onClick={() => onEdit(client)}
                className="text-[#1732ca] hover:text-[#1732ca]/80"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {clients.length === 0 && (
          <tr>
            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <Building2 className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm">No clients found</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);