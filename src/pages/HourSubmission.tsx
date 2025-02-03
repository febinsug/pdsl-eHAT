import React, { useState, useEffect } from 'react';
import { startOfWeek, endOfWeek, format, addDays, subWeeks, addWeeks, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Project, Timesheet } from '../types';
import { ChevronLeft, ChevronRight, Loader2, Calendar, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface TimesheetWithProject extends Timesheet {
  project: Project;
}

export const HourSubmission = () => {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [hours, setHours] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedTimesheets, setSubmittedTimesheets] = useState<TimesheetWithProject[]>([]);
  const [availableWeeks, setAvailableWeeks] = useState<{ weekNumber: number; year: number; startDate: Date }[]>([]);
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetWithProject | null>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekNumber = parseInt(format(weekStart, 'w'));
  const year = parseInt(format(weekStart, 'yyyy'));

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const weeks = [];
    const currentDate = new Date();
    const startDate = subWeeks(currentDate, 12);
    
    for (let i = 0; i < 17; i++) {
      const date = addWeeks(startDate, i);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      weeks.push({
        weekNumber: parseInt(format(weekStart, 'w')),
        year: parseInt(format(weekStart, 'yyyy')),
        startDate: weekStart,
      });
    }
    setAvailableWeeks(weeks);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user's projects
        const { data: projectUsers } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', user.id);

        if (projectUsers) {
          const projectIds = projectUsers.map(pu => pu.project_id);
          const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds)
            .eq('is_active', true);

          setProjects(projects || []);
        }

        // Fetch existing timesheets for the selected week
        const { data: timesheets } = await supabase
          .from('timesheets')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_number', weekNumber)
          .eq('year', year);

        // Map timesheet data to hours state
        const hoursMap: Record<string, Record<string, number>> = {};
        timesheets?.forEach(timesheet => {
          if (timesheet.status !== 'approved') { // Only load non-approved timesheets for editing
            hoursMap[timesheet.project_id] = {
              monday_hours: timesheet.monday_hours,
              tuesday_hours: timesheet.tuesday_hours,
              wednesday_hours: timesheet.wednesday_hours,
              thursday_hours: timesheet.thursday_hours,
              friday_hours: timesheet.friday_hours,
            };
          }
        });
        setHours(hoursMap);

        // Fetch submitted timesheets with project details
        const { data: submittedData } = await supabase
          .from('timesheets')
          .select(`
            *,
            project:projects(*)
          `)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(10);

        setSubmittedTimesheets(submittedData as TimesheetWithProject[] || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, weekNumber, year]);

  const handleHourChange = (projectId: string, day: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 24) return;

    setHours(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [`${day}_hours`]: numValue,
      },
    }));
  };

  const validateHours = () => {
    const hasHours = Object.values(hours).some(projectHours => 
      Object.values(projectHours).some(value => value > 0)
    );

    if (!hasHours) {
      setError('Please enter hours before submitting.');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    setError('');
    if (!validateHours()) return;
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Prepare timesheet data
      const timesheetData = Object.entries(hours)
        .filter(([_, projectHours]) => Object.values(projectHours).some(value => value > 0))
        .map(([projectId, projectHours]) => ({
          user_id: user.id,
          project_id: projectId,
          week_number: weekNumber,
          year: year,
          ...projectHours,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          rejection_reason: null, // Clear any previous rejection reason when resubmitting
        }));

      if (timesheetData.length === 0) {
        throw new Error('No hours to submit');
      }

      // Delete existing timesheets for this week
      const { error: deleteError } = await supabase
        .from('timesheets')
        .delete()
        .eq('user_id', user.id)
        .eq('week_number', weekNumber)
        .eq('year', year);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error('Failed to update existing timesheets');
      }

      // Insert new timesheets
      const { error: insertError } = await supabase
        .from('timesheets')
        .insert(timesheetData);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to submit timesheets');
      }

      // Refresh submitted timesheets
      const { data: submittedData } = await supabase
        .from('timesheets')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      setSubmittedTimesheets(submittedData as TimesheetWithProject[] || []);
      setSuccess(true);
      setShowConfirmation(false);
      setHours({});
      setEditingTimesheet(null);
    } catch (error) {
      console.error('Error saving timesheets:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit hours');
    } finally {
      setSaving(false);
    }
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [selectedYear, selectedWeek] = e.target.value.split('-').map(Number);
    const selectedWeekData = availableWeeks.find(
      w => w.year === selectedYear && w.weekNumber === selectedWeek
    );
    if (selectedWeekData) {
      setSelectedDate(selectedWeekData.startDate);
    }
  };

  const calculateTotalHours = (timesheet: Timesheet) => {
    return (
      timesheet.monday_hours +
      timesheet.tuesday_hours +
      timesheet.wednesday_hours +
      timesheet.thursday_hours +
      timesheet.friday_hours
    );
  };

  const calculateWeeklyTotal = (projectHours: Record<string, number>) => {
    return Object.values(projectHours).reduce((sum, hours) => sum + (hours || 0), 0);
  };

  const handleEditTimesheet = (timesheet: TimesheetWithProject) => {
    if (timesheet.status === 'approved') {
      setError('Approved timesheets cannot be edited');
      return;
    }

    // Set the week and year to match the timesheet being edited
    const selectedWeekData = availableWeeks.find(
      w => w.weekNumber === timesheet.week_number && w.year === timesheet.year
    );
    if (selectedWeekData) {
      setSelectedDate(selectedWeekData.startDate);
    }

    // Load the timesheet data into the form
    setHours({
      [timesheet.project_id]: {
        monday_hours: timesheet.monday_hours,
        tuesday_hours: timesheet.tuesday_hours,
        wednesday_hours: timesheet.wednesday_hours,
        thursday_hours: timesheet.thursday_hours,
        friday_hours: timesheet.friday_hours,
      },
    });
    setEditingTimesheet(timesheet);
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
        <h1 className="text-2xl font-bold text-gray-900">Hour Submission</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(prev => addDays(prev, -7))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <select
              value={`${year}-${weekNumber}`}
              onChange={handleWeekChange}
              className="appearance-none bg-white pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1732ca] focus:border-[#1732ca] transition-shadow"
            >
              {availableWeeks.map(week => (
                <option 
                  key={`${week.year}-${week.weekNumber}`} 
                  value={`${week.year}-${week.weekNumber}`}
                >
                  Week {week.weekNumber} ({format(week.startDate, 'MMM d')} - {format(addDays(week.startDate, 4), 'MMM d, yyyy')})
                </option>
              ))}
            </select>
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={() => setSelectedDate(prev => addDays(prev, 7))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <p>Hours submitted successfully!</p>
        </div>
      )}

      {editingTimesheet && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <p>Editing timesheet for Week {editingTimesheet.week_number}, {editingTimesheet.year}</p>
          </div>
          <button
            onClick={() => {
              setEditingTimesheet(null);
              setHours({});
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Cancel Edit
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 w-1/4">Project</th>
                {weekDays.map(day => (
                  <th key={day.toString()} className="py-4 px-6 text-center w-1/6">
                    <div className="text-sm font-semibold text-gray-900">{format(day, 'EEE')}</div>
                    <div className="text-xs text-gray-500 mt-1">{format(day, 'MMM d')}</div>
                  </th>
                ))}
                <th className="py-4 px-6 text-center text-sm font-semibold text-gray-900 w-1/6">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map(project => {
                const projectHours = hours[project.id] || {};
                const total = calculateWeeklyTotal(projectHours);

                return (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1732ca]/10 rounded-lg">
                          <Clock className="w-5 h-5 text-[#1732ca]" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{project.allocated_hours} hours allocated</div>
                        </div>
                      </div>
                    </td>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                      <td key={day} className="py-4 px-6">
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={projectHours[`${day}_hours`] || ''}
                            onChange={e => handleHourChange(project.id, day, e.target.value)}
                            className="w-20 text-center rounded-lg border-gray-300 shadow-sm
                              focus:border-[#1732ca] focus:ring focus:ring-[#1732ca] focus:ring-opacity-50
                              hover:border-gray-400 transition-colors
                              placeholder-gray-400"
                            placeholder="0.0"
                          />
                        </div>
                      </td>
                    ))}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 bg-[#1732ca]/10 rounded-full">
                        <span className="font-semibold text-[#1732ca]">{total}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No projects found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90 
            focus:outline-none focus:ring-2 focus:ring-[#1732ca] focus:ring-offset-2 
            disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Submitting...' : editingTimesheet ? 'Update Hours' : 'Submit Hours'}
        </button>
      </div>

      {/* Submitted Timesheets Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submittedTimesheets.map(timesheet => (
                <tr key={timesheet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Week {timesheet.week_number}, {timesheet.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {timesheet.project.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateTotalHours(timesheet)} hours
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-4">
                    {timesheet.rejection_reason && (
                      <div className="text-sm text-red-600">
                        {timesheet.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {timesheet.status !== 'approved' && (
                      <button
                        onClick={() => handleEditTimesheet(timesheet)}
                        className="text-[#1732ca] hover:text-[#1732ca]/80 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {submittedTimesheets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No submissions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Submit Hours</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your hours for Week {weekNumber}? This will overwrite any existing submissions for this week.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={saving}
                className="px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};