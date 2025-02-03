import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfWeek, endOfWeek, addDays, getWeek, getYear } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, Briefcase, CheckCircle, AlertCircle, Loader2, Calendar, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Project, Timesheet, User } from '../types';

interface ProjectWithUtilization extends Project {
  totalHours: number;
  utilization: number;
  color?: string;
}

interface ProjectUtilizationDetails {
  project: ProjectWithUtilization;
  users: {
    id: string;
    name: string;
    hours: number;
  }[];
}

const COLORS = {
  primary: '#1732ca',
  lighter: '#4a5fdb',
  light: '#7d8ce8',
  lightest: '#b0b9f5',
  dark: '#1229a1',
  darker: '#0d1f78',
  darkest: '#091550',
  pale: '#e6e9fc',
  accent: '#3d4ecc',
  muted: '#6575d4'
};

const PROJECT_COLORS = [
  COLORS.primary,
  COLORS.lighter,
  COLORS.light,
  COLORS.dark,
  COLORS.darker,
  COLORS.accent,
  COLORS.muted,
  COLORS.lightest,
  COLORS.darkest,
  COLORS.pale
];

const ProjectUtilizationModal: React.FC<{
  details: ProjectUtilizationDetails | null;
  onClose: () => void;
}> = ({ details, onClose }) => {
  if (!details) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{details.project.name} - Utilization Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Hours Used</p>
              <p className="text-2xl font-semibold">{details.project.totalHours}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Allocated Hours</p>
              <p className="text-2xl font-semibold">{details.project.allocated_hours}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Utilization</p>
              <p className="text-2xl font-semibold">{details.project.utilization.toFixed(1)}%</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Team Member Breakdown</h4>
            <div className="space-y-2">
              {details.users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1732ca]/10 rounded-lg">
                      <Users className="w-4 h-4 text-[#1732ca]" />
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span>{user.hours} hours</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-gray-600">{payload[0].value} hours</p>
      </div>
    );
  }
  return null;
};

export const Overview = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [projects, setProjects] = useState<ProjectWithUtilization[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projectHours, setProjectHours] = useState<{ name: string; hours: number; color: string; }[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectUtilizationDetails | null>(null);
  const [stats, setStats] = useState({
    totalHours: 0,
    activeProjects: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
  });

  const handleProjectClick = async (project: ProjectWithUtilization) => {
    try {
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select(`
          *,
          user:users!timesheets_user_id_fkey(id, username, full_name)
        `)
        .eq('project_id', project.id)
        .gte('submitted_at', startOfMonth(selectedMonth).toISOString())
        .lte('submitted_at', endOfMonth(selectedMonth).toISOString());

      if (timesheets) {
        const userHours = timesheets.reduce((acc, timesheet) => {
          const userId = timesheet.user.id;
          const userName = timesheet.user.full_name || timesheet.user.username;
          const hours = (
            timesheet.monday_hours +
            timesheet.tuesday_hours +
            timesheet.wednesday_hours +
            timesheet.thursday_hours +
            timesheet.friday_hours
          );

          if (!acc[userId]) {
            acc[userId] = { id: userId, name: userName, hours: 0 };
          }
          acc[userId].hours += hours;
          return acc;
        }, {} as Record<string, { id: string; name: string; hours: number; }>);

        setSelectedProject({
          project,
          users: Object.values(userHours).sort((a, b) => b.hours - a.hours)
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);

        let projectsQuery = supabase.from('projects').select('*');
        
        if (user.role === 'user') {
          const { data: projectUsers } = await supabase
            .from('project_users')
            .select('project_id')
            .eq('user_id', user.id);

          if (projectUsers) {
            projectsQuery = projectsQuery.in('id', projectUsers.map(pu => pu.project_id));
          }
        }

        const { data: projectsData } = await projectsQuery;

        let timesheetsQuery = supabase
          .from('timesheets')
          .select(`
            *,
            project:projects(*),
            user:users!timesheets_user_id_fkey(username, full_name)
          `)
          .gte('submitted_at', monthStart.toISOString())
          .lte('submitted_at', monthEnd.toISOString());

        if (user.role === 'user') {
          timesheetsQuery = timesheetsQuery.eq('user_id', user.id);
        }

        const { data: timesheetsData } = await timesheetsQuery;

        if (projectsData && timesheetsData) {
          setTimesheets(timesheetsData);

          const projectColorMap = projectsData.reduce((acc, project, index) => ({
            ...acc,
            [project.id]: PROJECT_COLORS[index % PROJECT_COLORS.length]
          }), {});

          const projectsWithUtilization = projectsData.map(project => {
            const projectTimesheets = timesheetsData.filter(t => t.project_id === project.id);
            const totalHours = projectTimesheets.reduce((sum, timesheet) => 
              sum + (
                timesheet.monday_hours +
                timesheet.tuesday_hours +
                timesheet.wednesday_hours +
                timesheet.thursday_hours +
                timesheet.friday_hours
              ), 0);
            const utilization = project.allocated_hours > 0 
              ? (totalHours / project.allocated_hours) * 100 
              : 0;

            return {
              ...project,
              totalHours,
              utilization,
              color: projectColorMap[project.id]
            };
          });

          // Filter out projects with 0% utilization
          const activeProjects = projectsWithUtilization.filter(project => project.utilization > 0);
          setProjects(activeProjects);

          const projectHoursData = activeProjects
            .map(project => ({
              name: project.name,
              hours: project.totalHours,
              color: project.color
            }));

          setProjectHours(projectHoursData);

          const totalHours = projectsWithUtilization.reduce((sum, project) => sum + project.totalHours, 0);
          const activeProjectsCount = projectsWithUtilization.filter(p => p.is_active && !p.completed_at).length;
          const pendingCount = timesheetsData.filter(t => t.status === 'pending').length;
          const approvedCount = timesheetsData.filter(t => t.status === 'approved').length;

          setStats({
            totalHours,
            activeProjects: activeProjectsCount,
            pendingSubmissions: pendingCount,
            approvedSubmissions: approvedCount,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedMonth]);

  const getWeeklyData = () => {
    const weeklyData: any[] = [];
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    while (currentWeekStart <= monthEnd) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1 });
      const weekYear = getYear(currentWeekStart);
      const weekLabel = `Week ${weekNumber}`;
      
      const weekTimesheets = timesheets.filter(timesheet => 
        timesheet.week_number === weekNumber &&
        timesheet.year === weekYear
      );

      if (user?.role === 'user') {
        const totalHours = weekTimesheets.reduce((sum, timesheet) => 
          sum + (
            timesheet.monday_hours +
            timesheet.tuesday_hours +
            timesheet.wednesday_hours +
            timesheet.thursday_hours +
            timesheet.friday_hours
          ), 0);

        weeklyData.push({
          week: weekLabel,
          hours: totalHours
        });
      } else {
        const weekData: any = {
          week: weekLabel
        };

        projects.forEach(project => {
          weekData[project.name] = 0;
        });

        weekTimesheets.forEach(timesheet => {
          const project = projects.find(p => p.id === timesheet.project_id);
          if (project) {
            weekData[project.name] = (weekData[project.name] || 0) + (
              timesheet.monday_hours +
              timesheet.tuesday_hours +
              timesheet.wednesday_hours +
              timesheet.thursday_hours +
              timesheet.friday_hours
            );
          }
        });

        weeklyData.push(weekData);
      }

      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeklyData;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1732ca]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-lg font-medium">
            {format(selectedMonth, 'MMMM yyyy')}
          </div>
          <button
            onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={selectedMonth >= new Date()}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-[#1732ca]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedSubmissions}</p>
            </div>
          </div>
        </div>
      </div>

      {(user?.role === 'admin' || user?.role === 'manager') ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Hours Overview</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getWeeklyData()} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barSize={32}
                    barGap={0}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    {projects.map((project, index) => (
                      <Bar 
                        key={project.id}
                        dataKey={project.name}
                        stackId="a"
                        fill={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hours by Project</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectHours}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {projectHours.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROJECT_COLORS[index % PROJECT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Utilization</h2>
            <div className="space-y-6">
              {projects.length > 0 ? (
                projects.map(project => (
                  <div 
                    key={project.id} 
                    className="space-y-2 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1732ca]/10 rounded-lg">
                          <Briefcase className="w-5 h-5 text-[#1732ca]" />
                        </div>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-500">
                            {project.totalHours} / {project.allocated_hours} hours
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{project.utilization.toFixed(1)}%</p>
                        <p className="text-sm text-gray-500">Utilization</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(project.utilization || 0, 100)}%`,
                          backgroundColor: project.utilization > 90 ? '#22c55e' : 
                                         project.utilization > 70 ? '#4ade80' : '#86efac'
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No active projects with hours logged this month</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Hours Overview</h2>
          <div className="h-[400px] max-w-4xl mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={getWeeklyData()} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="hours" 
                  fill={COLORS.primary}
                  name="Total Hours" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedProject && (
        <ProjectUtilizationModal
          details={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};