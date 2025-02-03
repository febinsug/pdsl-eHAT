import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, Users, Loader2, CheckCircle, XCircle, AlertCircle, Clock, X, Building2, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { ProjectForm } from '../components/projects/ProjectForm';
import { ClientForm } from '../components/projects/ClientForm';
import { ProjectList } from '../components/projects/ProjectList';
import { ClientList } from '../components/projects/ClientList';
import { ConfirmationDialog } from '../components/shared/ConfirmationDialog';
import type { Project, User, Timesheet, Client } from '../types';

interface ProjectFormData {
  name: string;
  description: string;
  allocated_hours: number;
  assigned_users: string[];
  client_id: string;
}

interface ProjectDetails {
  project: Project;
  users: User[];
  timesheets: Timesheet[];
  totalHoursUsed: number;
  hoursRemaining: number;
}

const ProjectDetailsModal = ({ details, onClose }: { details: ProjectDetails; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{details.project.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Project Details</h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm">
              <span className="font-medium">Description:</span> {details.project.description || 'No description'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Hours:</span> {details.totalHoursUsed} used of {details.project.allocated_hours} allocated
            </p>
            <p className="text-sm">
              <span className="font-medium">Remaining:</span> {details.hoursRemaining} hours
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Team Members</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              {details.users.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1732ca]/10 flex items-center justify-center">
                    <span className="text-[#1732ca] font-medium">
                      {(user.full_name || user.username)[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Timesheets</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-4">
              {details.timesheets.map(timesheet => (
                <div key={timesheet.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Week {timesheet.week_number}, {timesheet.year}
                    </p>
                    <p className="text-xs text-gray-500">
                      {timesheet.total_hours} hours
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    timesheet.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : timesheet.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {timesheet.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                    {timesheet.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {timesheet.status === 'pending' && <Clock className="w-3 h-3" />}
                    {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                  </span>
                </div>
              ))}
              {details.timesheets.length === 0 && (
                <p className="text-sm text-gray-500 text-center">No timesheets found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Projects = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    allocated_hours: 0,
    assigned_users: [],
    client_id: '',
  });
  const [clientFormData, setClientFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showClients, setShowClients] = useState(false);
  const [confirmation, setConfirmation] = useState({
    show: false,
    title: '',
    message: '',
    action: async () => {},
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const [projectsResponse, usersResponse, clientsResponse] = await Promise.all([
          supabase
            .from('projects')
            .select(`
              *,
              client:clients(*)
            `)
            .order('created_at', { ascending: false }),
          supabase
            .from('users')
            .select('*')
            .neq('role', 'admin'),
          supabase
            .from('clients')
            .select('*')
            .order('name')
        ]);

        if (projectsResponse.data) {
          const activeProjects = projectsResponse.data.filter(p => p.is_active && !p.completed_at);
          const completed = projectsResponse.data.filter(p => p.completed_at);
          setProjects(activeProjects);
          setCompletedProjects(completed);
        }
        setUsers(usersResponse.data || []);
        setClients(clientsResponse.data || []);
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setConfirmation({
      show: true,
      title: editingProject ? 'Update Project' : 'Create Project',
      message: editingProject 
        ? `Are you sure you want to update "${formData.name}"?`
        : `Are you sure you want to create project "${formData.name}"?`,
      action: async () => {
        setSaving(true);
        setError('');

        try {
          if (editingProject) {
            const { error: updateError } = await supabase
              .from('projects')
              .update({
                name: formData.name,
                description: formData.description,
                allocated_hours: formData.allocated_hours,
                client_id: formData.client_id,
                updated_at: new Date().toISOString(),
              })
              .eq('id', editingProject.id);

            if (updateError) throw updateError;

            await supabase
              .from('project_users')
              .delete()
              .eq('project_id', editingProject.id);

            if (formData.assigned_users.length > 0) {
              await supabase
                .from('project_users')
                .insert(
                  formData.assigned_users.map(userId => ({
                    project_id: editingProject.id,
                    user_id: userId,
                  }))
                );
            }
          } else {
            const { data: newProject, error: createError } = await supabase
              .from('projects')
              .insert({
                name: formData.name,
                description: formData.description,
                allocated_hours: formData.allocated_hours,
                client_id: formData.client_id,
                created_by: user.id,
                is_active: true,
              })
              .select()
              .single();

            if (createError) throw createError;

            if (newProject && formData.assigned_users.length > 0) {
              await supabase
                .from('project_users')
                .insert(
                  formData.assigned_users.map(userId => ({
                    project_id: newProject.id,
                    user_id: userId,
                  }))
                );
            }
          }

          const { data: updatedProjects } = await supabase
            .from('projects')
            .select(`
              *,
              client:clients(*)
            `)
            .order('created_at', { ascending: false });

          if (updatedProjects) {
            const activeProjects = updatedProjects.filter(p => p.is_active && !p.completed_at);
            const completed = updatedProjects.filter(p => p.completed_at);
            setProjects(activeProjects);
            setCompletedProjects(completed);
          }
          setShowForm(false);
          resetForm();
        } catch (error) {
          console.error('Error saving project:', error);
          setError(error instanceof Error ? error.message : 'Failed to save project');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleEdit = async (project: Project) => {
    try {
      const { data: assignments } = await supabase
        .from('project_users')
        .select('user_id')
        .eq('project_id', project.id);

      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        allocated_hours: project.allocated_hours,
        assigned_users: assignments?.map(a => a.user_id) || [],
        client_id: project.client_id || '',
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      setError(error instanceof Error ? error.message : 'Failed to load project details');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      allocated_hours: 0,
      assigned_users: [],
      client_id: '',
    });
    setEditingProject(null);
    setError('');
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name,
      description: client.description || '',
    });
    setShowClientForm(true);
  };

  const handleCreateOrEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setConfirmation({
      show: true,
      title: editingClient ? 'Update Client' : 'Create Client',
      message: editingClient 
        ? `Are you sure you want to update "${clientFormData.name}"?`
        : `Are you sure you want to create client "${clientFormData.name}"?`,
      action: async () => {
        setSaving(true);
        setError('');

        try {
          if (editingClient) {
            const { error: updateError } = await supabase
              .from('clients')
              .update({
                name: clientFormData.name,
                description: clientFormData.description,
                updated_at: new Date().toISOString(),
              })
              .eq('id', editingClient.id);

            if (updateError) throw updateError;
          } else {
            const { error: createError } = await supabase
              .from('clients')
              .insert({
                name: clientFormData.name,
                description: clientFormData.description,
                created_by: user.id,
              });

            if (createError) throw createError;
          }

          const { data: updatedClients } = await supabase
            .from('clients')
            .select('*')
            .order('name');

          setClients(updatedClients || []);
          setShowClientForm(false);
          setEditingClient(null);
          setClientFormData({ name: '', description: '' });
        } catch (error) {
          console.error('Error saving client:', error);
          setError(error instanceof Error ? error.message : 'Failed to save client');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const fetchProjectDetails = async (project: Project) => {
    try {
      const [usersResponse, timesheetsResponse] = await Promise.all([
        supabase
          .from('project_users')
          .select('user:users(*)')
          .eq('project_id', project.id),
        supabase
          .from('timesheets')
          .select('*')
          .eq('project_id', project.id)
          .order('submitted_at', { ascending: false })
          .limit(10)
      ]);

      const users = usersResponse.data?.map(pu => pu.user) || [];
      const timesheets = timesheetsResponse.data || [];

      const totalHoursUsed = timesheets.reduce((sum, ts) => 
        sum + (ts.monday_hours + ts.tuesday_hours + ts.wednesday_hours + ts.thursday_hours + ts.friday_hours), 0
      );

      setSelectedProject({
        project,
        users,
        timesheets,
        totalHoursUsed,
        hoursRemaining: project.allocated_hours - totalHoursUsed
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Failed to load project details');
    }
  };

  const handleCompleteProject = (project: Project) => {
    setConfirmation({
      show: true,
      title: 'Complete Project',
      message: `Are you sure you want to mark "${project.name}" as complete? This will archive the project and move it to the completed projects section.`,
      action: async () => {
        try {
          const { error } = await supabase
            .from('projects')
            .update({ 
              is_active: false,
              completed_at: new Date().toISOString()
            })
            .eq('id', project.id);

          if (error) throw error;

          setProjects(prev => prev.filter(p => p.id !== project.id));
          setCompletedProjects(prev => [{ ...project, completed_at: new Date().toISOString() }, ...prev]);
        } catch (error) {
          console.error('Error completing project:', error);
          setError('Failed to complete project');
        }
      },
    });
  };

  const handleArchiveProject = (project: Project) => {
    setConfirmation({
      show: true,
      title: 'Archive Project',
      message: `Are you sure you want to archive "${project.name}"?`,
      action: async () => {
        try {
          const { error } = await supabase
            .from('projects')
            .update({ is_active: false })
            .eq('id', project.id);

          if (error) throw error;

          setProjects(prev =>
            prev.map(p =>
              p.id === project.id ? { ...p, is_active: false } : p
            )
          );
        } catch (error) {
          console.error('Error archiving project:', error);
          setError('Failed to archive project');
        }
      },
    });
  };

  const handleReactivateProject = (project: Project) => {
    setConfirmation({
      show: true,
      title: 'Reactivate Project',
      message: `Are you sure you want to reactivate "${project.name}"? This will make the project active again.`,
      action: async () => {
        try {
          const { error } = await supabase
            .from('projects')
            .update({ 
              is_active: true,
              completed_at: null
            })
            .eq('id', project.id);

          if (error) throw error;

          setCompletedProjects(prev => prev.filter(p => p.id !== project.id));
          setProjects(prev => [...prev, { ...project, is_active: true, completed_at: null }]);
        } catch (error) {
          console.error('Error reactivating project:', error);
          setError('Failed to reactivate project');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1732ca]" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">Only administrators and managers can access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
        <div className="flex gap-3">
          {!showForm && !showClientForm && (
            <>
              <button
                onClick={() => setShowClients(!showClients)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Building2 className="w-5 h-5" />
                {showClients ? 'Show Projects' : 'Show Clients'}
              </button>
              {showClients ? (
                <button
                  onClick={() => setShowClientForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90"
                >
                  <Plus className="w-5 h-5" />
                  New Client
                </button>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90"
                >
                  <Plus className="w-5 h-5" />
                  New Project
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {showClientForm && (
        <ClientForm
          formData={clientFormData}
          setFormData={setClientFormData}
          onSubmit={handleCreateOrEditClient}
          onCancel={() => {
            setShowClientForm(false);
            setEditingClient(null);
            setClientFormData({ name: '', description: '' });
          }}
          saving={saving}
          editingClient={editingClient}
        />
      )}

      {showForm && (
        <ProjectForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setShowForm(false);
            resetForm();
          }}
          saving={saving}
          users={users}
          clients={clients}
          editingProject={editingProject}
        />
      )}

      {showClients ? (
        <ClientList
          clients={clients}
          projects={projects}
          onEdit={handleEditClient}
        />
      ) : (
        <div className="space-y-8">
          <ProjectList
            title="Active Projects"
            projects={projects}
            onEdit={handleEdit}
            onArchive={handleArchiveProject}
            onComplete={handleCompleteProject}
            onSelect={fetchProjectDetails}
          />

          {completedProjects.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Completed Projects</h2>
              </div>
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
                      Completed Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedProjects.map(project => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.client?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{project.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.completed_at && new Date(project.completed_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleReactivateProject(project)}
                          className="inline-flex items-center gap-1 text-[#1732ca] hover:text-[#1732ca]/80"
                          title="Reactivate project"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span className="text-sm">Reactivate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedProject && (
        <ProjectDetailsModal
          details={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <ConfirmationDialog
        show={confirmation.show}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={async () => {
          await confirmation.action();
          setConfirmation(prev => ({ ...prev, show: false }));
        }}
        onCancel={() => setConfirmation(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};