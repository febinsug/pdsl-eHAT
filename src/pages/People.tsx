import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, AlertCircle, Loader2, CheckCircle, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User, Project } from '../types';

interface UserWithProjects extends User {
  projects: Project[];
  team?: User[];
}

interface ConfirmationDialog {
  show: boolean;
  title: string;
  message: string;
  action: () => Promise<void>;
}

interface TeamViewModalProps {
  manager: UserWithProjects;
  onClose: () => void;
}

const TeamViewModal: React.FC<TeamViewModalProps> = ({ manager, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Team Members - {manager.full_name || manager.username}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>

      {manager.team && manager.team.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manager.team.map(member => (
            <div key={member.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1732ca]/10 flex items-center justify-center">
                  <span className="text-[#1732ca] font-medium">
                    {(member.full_name || member.username)[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.full_name || member.username}</p>
                  <p className="text-sm text-gray-500">{member.email || 'No email'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No team members found</p>
        </div>
      )}
    </div>
  </div>
);

interface ProjectViewModalProps {
  user: UserWithProjects;
  onClose: () => void;
}

const ProjectViewModal: React.FC<ProjectViewModalProps> = ({ user, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Projects for {user.full_name || user.username}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>
      <div className="space-y-4">
        {user.projects.length > 0 ? (
          user.projects.map(project => (
            <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{project.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{project.description || 'No description'}</p>
              <p className="text-sm text-gray-600 mt-2">Allocated Hours: {project.allocated_hours}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No projects assigned</p>
        )}
      </div>
    </div>
  </div>
);

const UserSection: React.FC<{
  title: string;
  users: UserWithProjects[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onViewTeam?: (user: UserWithProjects) => void;
  showManagerField?: boolean;
  showTeamField?: boolean;
}> = ({ title, users, onEdit, onDelete, onViewTeam, showManagerField = false, showTeamField = false }) => {
  const [selectedUser, setSelectedUser] = useState<UserWithProjects | null>(null);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              {showManagerField && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
              )}
              {showTeamField && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Members
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projects
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.full_name || user.username}
                  </div>
                  <div className="text-sm text-gray-500">{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email || '-'}</div>
                </td>
                {showManagerField && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.manager ? (user.manager.full_name || user.manager.username) : '-'}
                    </div>
                  </td>
                )}
                {showTeamField && (
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.team && user.team.length > 0 ? (
                        <button
                          onClick={() => onViewTeam?.(user)}
                          className="inline-flex items-center gap-1 text-[#1732ca] hover:text-[#1732ca]/80"
                        >
                          <Users className="w-4 h-4" />
                          {user.team.length} member{user.team.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-gray-500">No team members</span>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="inline-flex items-center gap-1 text-sm text-[#1732ca] hover:text-[#1732ca]/80"
                  >
                    <Eye className="w-4 h-4" />
                    View ({user.projects?.length || 0})
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-[#1732ca] hover:text-[#1732ca]/80"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={showManagerField ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Users className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm">No users found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <ProjectViewModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export const People = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserWithProjects[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAssignments, setProjectAssignments] = useState<{ user_id: string; project_id: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'user' as 'user' | 'manager' | 'admin',
    password: '',
    assigned_projects: [] as string[],
    manager_id: '' as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationDialog>({
    show: false,
    title: '',
    message: '',
    action: async () => {},
  });
  const [selectedManager, setSelectedManager] = useState<UserWithProjects | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('is_active', true);

        const { data: projectUsers } = await supabase
          .from('project_users')
          .select('*');

        if (usersData) {
          const teamMap = new Map<string, User[]>();
          usersData.forEach(user => {
            if (user.manager_id) {
              const team = teamMap.get(user.manager_id) || [];
              team.push(user);
              teamMap.set(user.manager_id, team);
            }
          });

          const usersWithDetails = usersData.map(user => {
            const userProjects = projectsData?.filter(project =>
              projectUsers?.some(pu => 
                pu.user_id === user.id && pu.project_id === project.id
              )
            ) || [];

            const manager = usersData.find(u => u.id === user.manager_id);
            const team = teamMap.get(user.id) || [];

            return {
              ...user,
              projects: userProjects,
              manager: manager || undefined,
              team,
            };
          });

          setUsers(usersWithDetails);
          setProjects(projectsData || []);
          setProjectAssignments(projectUsers || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') return;

    setConfirmation({
      show: true,
      title: editingUser ? 'Update User' : 'Create User',
      message: editingUser 
        ? `Are you sure you want to update "${formData.username}"?`
        : `Are you sure you want to create user "${formData.username}"?`,
      action: async () => {
        setSaving(true);
        try {
          if (editingUser) {
            const updateData = {
              full_name: formData.full_name,
              email: formData.email,
              role: formData.role,
              manager_id: formData.manager_id || null,
              ...(formData.password ? { password_hash: formData.password } : {}),
            };

            const { error } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', editingUser.id);

            if (error) throw error;

            await supabase
              .from('project_users')
              .delete()
              .eq('user_id', editingUser.id);

            if (formData.assigned_projects.length > 0) {
              const newAssignments = formData.assigned_projects.map(projectId => ({
                project_id: projectId,
                user_id: editingUser.id,
              }));

              const { error: assignError } = await supabase
                .from('project_users')
                .insert(newAssignments);

              if (assignError) throw assignError;
            }
          } else {
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                username: formData.username,
                password_hash: formData.password,
                full_name: formData.full_name,
                email: formData.email,
                role: formData.role,
                manager_id: formData.manager_id || null,
              })
              .select()
              .single();

            if (error) throw error;

            if (newUser && formData.assigned_projects.length > 0) {
              const newAssignments = formData.assigned_projects.map(projectId => ({
                project_id: projectId,
                user_id: newUser.id,
              }));

              const { error: assignError } = await supabase
                .from('project_users')
                .insert(newAssignments);

              if (assignError) throw assignError;
            }
          }

          const { data: updatedUsers } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

          const { data: updatedAssignments } = await supabase
            .from('project_users')
            .select('*');

          if (updatedUsers) {
            const teamMap = new Map<string, User[]>();
            updatedUsers.forEach(user => {
              if (user.manager_id) {
                const team = teamMap.get(user.manager_id) || [];
                team.push(user);
                teamMap.set(user.manager_id, team);
              }
            });

            const usersWithDetails = updatedUsers.map(user => {
              const userProjects = projects.filter(project =>
                updatedAssignments?.some(pu => 
                  pu.user_id === user.id && pu.project_id === project.id
                )
              );

              const manager = updatedUsers.find(u => u.id === user.manager_id);
              const team = teamMap.get(user.id) || [];

              return {
                ...user,
                projects: userProjects,
                manager: manager || undefined,
                team,
              };
            });

            setUsers(usersWithDetails);
            setProjectAssignments(updatedAssignments || []);
          }

          setShowForm(false);
          resetForm();
        } catch (error) {
          console.error('Error saving user:', error);
          setError(error instanceof Error ? error.message : 'Failed to save user');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleEdit = async (user: User) => {
    try {
      const { data: assignments } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      setEditingUser(user);
      setFormData({
        username: user.username,
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role,
        password: '',
        assigned_projects: assignments?.map(a => a.project_id) || [],
        manager_id: user.manager_id,
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user details');
    }
  };

  const handleDelete = (user: User) => {
    setConfirmation({
      show: true,
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.full_name || user.username}"? This action cannot be undone.`,
      action: async () => {
        try {
          await supabase
            .from('project_users')
            .delete()
            .eq('user_id', user.id);

          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);

          if (error) throw error;

          setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (error) {
          console.error('Error deleting user:', error);
          setError('Failed to delete user');
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      full_name: '',
      email: '',
      role: 'user',
      password: '',
      assigned_projects: [],
      manager_id: null,
    });
    setEditingUser(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1732ca]" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">Only administrators can access this page.</p>
      </div>
    );
  }

  const managers = users.filter(u => u.role === 'manager');
  const employees = users.filter(u => u.role === 'user');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">People Management</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>

          <form onSubmit={handleCreateOrEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={!!editingUser}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca] disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'manager' | 'admin' }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'user' && (
                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-gray-700">
                    Assign Manager
                  </label>
                  <select
                    id="manager"
                    value={formData.manager_id || ''}
                    onChange={e => setFormData(prev => ({ ...prev, manager_id: e.target.value || null }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
                  >
                    <option value="">No Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name || manager.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
                  {...(!editingUser && { required: true })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Projects
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {projects.map(project => (
                  <label key={project.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.assigned_projects.includes(project.id)}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          assigned_projects: e.target.checked
                            ? [...prev.assigned_projects, project.id]
                            : prev.assigned_projects.filter(id => id !== project.id),
                        }));
                      }}
                      className="rounded border-gray-300 text-[#1732ca] focus:ring-[#1732ca]"
                    />
                    <span className="text-sm text-gray-900">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90 focus:outline-none focus:ring-2 focus:ring-[#1732ca] focus:ring-offset-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <UserSection
          title="Managers"
          users={managers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewTeam={(manager) => setSelectedManager(manager)}
          showTeamField={true}
        />

        <UserSection
          title="Employees"
          users={employees}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showManagerField={true}
        />
      </div>

      {selectedManager && (
        <TeamViewModal
          manager={selectedManager}
          onClose={() => setSelectedManager(null)}
        />
      )}

      {confirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmation.title}</h3>
            <p className="text-gray-600 mb-6">{confirmation.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmation(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await confirmation.action();
                  setConfirmation(prev => ({ ...prev, show: false }));
                }}
                className="px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};