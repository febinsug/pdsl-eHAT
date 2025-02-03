import React from 'react';
import { Edit2, Archive, CheckCircle, XCircle, Users, Check } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectListProps {
  title?: string;
  projects: Project[];
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onComplete: (project: Project) => void;
  onSelect: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  title = "Projects",
  projects,
  onEdit,
  onArchive,
  onComplete,
  onSelect,
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {title && (
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    )}
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Project Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Client
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Allocated Hours
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {projects.map(project => (
          <tr 
            key={project.id} 
            className={`${!project.is_active ? 'bg-gray-50' : ''} hover:bg-gray-50 cursor-pointer`}
            onClick={() => onSelect(project)}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{project.name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{project.client?.name || '-'}</div>
            </td>
            <td className="px-6 py-4">
              <div className="text-sm text-gray-500">{project.description || '-'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{project.allocated_hours} hours</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.is_active 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {project.is_active ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Archived
                  </>
                )}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="text-[#1732ca] hover:text-[#1732ca]/80"
                  title="Edit project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {project.is_active && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete(project);
                      }}
                      className="text-green-600 hover:text-green-700"
                      title="Mark as complete"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(project);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                      title="Archive project"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
        {projects.length === 0 && (
          <tr>
            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <Users className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm">No projects found</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);