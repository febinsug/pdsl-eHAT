import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, AlertTriangle, Loader2, ChevronDown, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { User, Project, Timesheet } from '../types';

interface TimesheetWithDetails extends Timesheet {
  user: User;
  project: Project;
  approver?: User;
}

interface ApprovalError {
  timesheetId: string;
  message: string;
}

interface RejectionDialog {
  show: boolean;
  timesheetId: string;
  reason: string;
}

const PendingSubmissionsModal: React.FC<{
  show: boolean;
  onClose: () => void;
  timesheets: TimesheetWithDetails[];
}> = ({ show, onClose, timesheets }) => {
  if (!show) return null;

  // Group timesheets by user
  const userTimesheets = timesheets.reduce((acc, timesheet) => {
    if (!acc[timesheet.user.id]) {
      acc[timesheet.user.id] = {
        user: timesheet.user,
        timesheets: []
      };
    }
    acc[timesheet.user.id].timesheets.push(timesheet);
    return acc;
  }, {} as Record<string, { user: User; timesheets: TimesheetWithDetails[] }>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Pending Submissions Overview</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="space-y-6">
          {Object.values(userTimesheets).map(({ user, timesheets }) => (
            <div key={user.id} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                {user.full_name || user.username}
              </h4>
              <div className="space-y-2">
                {timesheets.map(timesheet => (
                  <div key={timesheet.id} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{timesheet.project.name}</p>
                        <p className="text-sm text-gray-500">
                          Week {timesheet.week_number}, {timesheet.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{timesheet.total_hours} hours</p>
                        <p className="text-sm text-gray-500">
                          Submitted {format(parseISO(timesheet.submitted_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TimesheetSection: React.FC<{
  title: string;
  timesheets: TimesheetWithDetails[];
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  processing?: Record<string, boolean>;
  errors?: ApprovalError[];
  showActions?: boolean;
  showApprover?: boolean;
}> = ({ 
  title, 
  timesheets, 
  onApprove, 
  onReject, 
  processing = {}, 
  errors = [], 
  showActions = false,
  showApprover = false
}) => {
  const [expandedTimesheet, setExpandedTimesheet] = useState<string | null>(null);

  const calculateTotalHours = (timesheet: Timesheet) => {
    return (
      timesheet.monday_hours +
      timesheet.tuesday_hours +
      timesheet.wednesday_hours +
      timesheet.thursday_hours +
      timesheet.friday_hours
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Week
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {showApprover && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
              )}
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timesheets.map(timesheet => {
              const error = errors.find(e => e.timesheetId === timesheet.id);
              const isExpanded = expandedTimesheet === timesheet.id;

              return (
                <React.Fragment key={timesheet.id}>
                  <tr className={timesheet.status === 'pending' ? 'bg-yellow-50' : undefined}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {timesheet.user?.full_name || timesheet.user?.username || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">{timesheet.user?.role || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{timesheet.project?.name || 'Unknown Project'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Week {timesheet.week_number}, {timesheet.year}
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted {format(parseISO(timesheet.submitted_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {calculateTotalHours(timesheet)} hours
                      </div>
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
                        {timesheet.status === 'pending' && <AlertTriangle className="w-3 h-3" />}
                        {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                      </span>
                    </td>
                    {showApprover && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {timesheet.approver ? (
                            <>
                              <div>{timesheet.approver.full_name || timesheet.approver.username}</div>
                              <div className="text-xs text-gray-500">
                                {timesheet.approved_at && format(parseISO(timesheet.approved_at), 'MMM d, yyyy')}
                              </div>
                            </>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                    )}
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedTimesheet(isExpanded ? null : timesheet.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {timesheet.status === 'pending' && onApprove && onReject && (
                            <>
                              <button
                                onClick={() => onApprove(timesheet.id)}
                                disabled={processing[timesheet.id]}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => onReject(timesheet.id)}
                                disabled={processing[timesheet.id]}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={showActions ? (showApprover ? 7 : 6) : (showApprover ? 6 : 5)} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-4">
                            <div>
                              <div className="text-sm font-medium text-gray-500">Monday</div>
                              <div className="text-sm text-gray-900">{timesheet.monday_hours} hours</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Tuesday</div>
                              <div className="text-sm text-gray-900">{timesheet.tuesday_hours} hours</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Wednesday</div>
                              <div className="text-sm text-gray-900">{timesheet.wednesday_hours} hours</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Thursday</div>
                              <div className="text-sm text-gray-900">{timesheet.thursday_hours} hours</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Friday</div>
                              <div className="text-sm text-gray-900">{timesheet.friday_hours} hours</div>
                            </div>
                          </div>
                          {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              {error.message}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {timesheets.length === 0 && (
              <tr>
                <td colSpan={showActions ? (showApprover ? 7 : 6) : (showApprover ? 6 : 5)} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm">No timesheets found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Approvals = () => {
  const { user } = useAuthStore();
  const [managerTimesheets, setManagerTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [approvedTimesheets, setApprovedTimesheets] = useState<TimesheetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<ApprovalError[]>([]);
  const [rejectionDialog, setRejectionDialog] = useState<RejectionDialog>({
    show: false,
    timesheetId: '',
    reason: ''
  });
  const [showPendingDetails, setShowPendingDetails] = useState(false);

  useEffect(() => {
    const fetchTimesheets = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (user.role === 'manager') {
          // Fetch pending timesheets for team members
          const { data: teamMembers } = await supabase
            .from('users')
            .select('id')
            .eq('manager_id', user.id);

          if (teamMembers && teamMembers.length > 0) {
            const { data: pendingTimesheets } = await supabase
              .from('timesheets')
              .select(`
                *,
                user:users!timesheets_user_id_fkey(id, username, full_name, role),
                project:projects!inner(id, name)
              `)
              .eq('status', 'pending')
              .in('user_id', teamMembers.map(member => member.id));

            setManagerTimesheets(pendingTimesheets as TimesheetWithDetails[] || []);
          }
        } else if (user.role === 'admin') {
          // First get all pending timesheets
          const { data: pendingTimesheets } = await supabase
            .from('timesheets')
            .select(`
              *,
              user:users!timesheets_user_id_fkey(id, username, full_name, role, manager_id),
              project:projects!inner(id, name)
            `)
            .eq('status', 'pending');

          // Filter for managers and unassigned users
          const filteredTimesheets = pendingTimesheets?.filter(timesheet => 
            timesheet.user.role === 'manager' || !timesheet.user.manager_id
          ) || [];

          setManagerTimesheets(filteredTimesheets as TimesheetWithDetails[]);
        }

        // Fetch approved timesheets
        let query = supabase
          .from('timesheets')
          .select(`
            *,
            user:users!timesheets_user_id_fkey(id, username, full_name, role),
            project:projects!inner(id, name),
            approver:users!timesheets_approved_by_fkey(id, username, full_name, role)
          `)
          .eq('status', 'approved');

        if (user.role === 'manager') {
          const { data: teamMembers } = await supabase
            .from('users')
            .select('id')
            .eq('manager_id', user.id);

          if (teamMembers && teamMembers.length > 0) {
            query = query.in('user_id', teamMembers.map(member => member.id));
          }
        }

        const { data: approvedSheets } = await query.order('submitted_at', { ascending: false });
        setApprovedTimesheets(approvedSheets as TimesheetWithDetails[] || []);
      } catch (error) {
        console.error('Error fetching timesheets:', error);
        setErrors(prev => [...prev, { 
          timesheetId: 'fetch',
          message: 'Failed to load timesheets. Please try refreshing the page.'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, [user]);

  const handleApproval = async (timesheetId: string, approved: boolean) => {
    if (!user) return;

    if (!approved) {
      setRejectionDialog({
        show: true,
        timesheetId,
        reason: ''
      });
      return;
    }

    setProcessing(prev => ({ ...prev, [timesheetId]: true }));
    setErrors(prev => prev.filter(e => e.timesheetId !== timesheetId));

    try {
      const { error: timesheetError } = await supabase
        .from('timesheets')
        .update({ 
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', timesheetId);

      if (timesheetError) throw timesheetError;

      // Update local state
      setManagerTimesheets(prev => prev.filter(t => t.id !== timesheetId));
      const approvedTimesheet = managerTimesheets.find(t => t.id === timesheetId);
      if (approvedTimesheet) {
        setApprovedTimesheets(prev => [{ 
          ...approvedTimesheet, 
          status: 'approved',
          approver: user,
          approved_at: new Date().toISOString()
        } as TimesheetWithDetails, ...prev]);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      setErrors(prev => [...prev, {
        timesheetId,
        message: 'Failed to approve timesheet. Please try again.'
      }]);
    } finally {
      setProcessing(prev => ({ ...prev, [timesheetId]: false }));
    }
  };

  const handleReject = async () => {
    if (!user || !rejectionDialog.timesheetId) return;

    setProcessing(prev => ({ ...prev, [rejectionDialog.timesheetId]: true }));
    setErrors(prev => prev.filter(e => e.timesheetId !== rejectionDialog.timesheetId));

    try {
      const { error: timesheetError } = await supabase
        .from('timesheets')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionDialog.reason,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', rejectionDialog.timesheetId);

      if (timesheetError) throw timesheetError;

      // Update local state
      setManagerTimesheets(prev => prev.filter(t => t.id !== rejectionDialog.timesheetId));
      setRejectionDialog({ show: false, timesheetId: '', reason: '' });
    } catch (error) {
      console.error('Error processing rejection:', error);
      setErrors(prev => [...prev, {
        timesheetId: rejectionDialog.timesheetId,
        message: 'Failed to reject timesheet. Please try again.'
      }]);
    } finally {
      setProcessing(prev => ({ ...prev, [rejectionDialog.timesheetId]: false }));
    }
  };

  const downloadTimesheets = (status: 'approved' | 'pending') => {
    const timesheetsToDownload = status === 'approved' ? approvedTimesheets : managerTimesheets;
    const csvData = [
      ['Week', 'Year', 'Project', 'User', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Total Hours', 'Status', 'Submitted', 'Approved By', 'Approved At', 'Rejection Reason'],
      ...timesheetsToDownload.map(t => [
        t.week_number,
        t.year,
        t.project.name,
        t.user.full_name || t.user.username,
        t.monday_hours,
        t.tuesday_hours,
        t.wednesday_hours,
        t.thursday_hours,
        t.friday_hours,
        t.total_hours,
        t.status,
        format(parseISO(t.submitted_at), 'yyyy-MM-dd'),
        t.approver ? (t.approver.full_name || t.approver.username) : '',
        t.approved_at ? format(parseISO(t.approved_at), 'yyyy-MM-dd') : '',
        t.rejection_reason || ''
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${status}-timesheets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1732ca]" />
      </div>
    );
  }

  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <AlertCircle className="w-12 h-12 mb-4 text-gray-400" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Timesheet Approvals</h1>
        <div className="flex gap-3">
          <button
            onClick={() => downloadTimesheets('approved')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1732ca] text-white rounded-lg hover:bg-[#1732ca]/90"
          >
            <Download className="w-4 h-4" />
            Download Approved
          </button>
          <button
            onClick={() => downloadTimesheets('pending')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Download Pending
          </button>
        </div>
      </div>

      {errors.find(e => e.timesheetId === 'fetch') && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{errors.find(e => e.timesheetId === 'fetch')?.message}</p>
        </div>
      )}

      <div className="space-y-8">
        {(user.role === 'admin' || user.role === 'manager') && managerTimesheets.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {user.role === 'admin' ? "Pending Manager & Unassigned Approvals" : "Pending Approvals"}
              </h2>
              <button
                onClick={() => setShowPendingDetails(true)}
                className="text-[#1732ca] hover:text-[#1732ca]/80 text-sm font-medium"
              >
                View Details
              </button>
            </div>
            <TimesheetSection
              title=""
              timesheets={managerTimesheets}
              onApprove={(id) => handleApproval(id, true)}
              onReject={(id) => handleApproval(id, false)}
              processing={processing}
              errors={errors}
              showActions={true}
            />
          </div>
        )}

        <TimesheetSection
          title="Approved Timesheets"
          timesheets={approvedTimesheets}
          showActions={false}
          showApprover={user.role === 'admin'}
        />
      </div>

      <PendingSubmissionsModal
        show={showPendingDetails}
        onClose={() => setShowPendingDetails(false)}
        timesheets={managerTimesheets}
      />

      {rejectionDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Reject Timesheet</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionDialog.reason}
              onChange={e => setRejectionDialog(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4 focus:border-[#1732ca] focus:outline-none focus:ring-1 focus:ring-[#1732ca]"
              rows={3}
              required
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectionDialog({ show: false, timesheetId: '', reason: '' })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionDialog.reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};