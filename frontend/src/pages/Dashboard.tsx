import { Building2, Users, FileText, CheckCircle, UserCheck, TrendingUp, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';
import { LoadingSpinner, StatusBadge } from '@/components/shared';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  indigo: 'bg-indigo-100 text-indigo-600',
};

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value.toLocaleString()}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`w-4 h-4 ${trend.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`}
              />
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-slate-500 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface PipelineStageProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

function PipelineStage({ label, count, percentage }: PipelineStageProps) {
  return (
    <div className="flex-1">
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{count}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    totalSegments,
    totalCompanies,
    totalContacts,
    pendingCompanies,
    assignedContacts,
    meetingScheduled,
    contactsByStatus,
    isLoading,
    error
  } = useDashboardStats();
  const { data: recentActivity, isLoading: isLoadingActivity } = useRecentActivity();
  const navigate = useNavigate();

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Error loading dashboard: {error.message}</p>
        </div>
      </div>
    );
  }

  const totalPendingApprovals = pendingCompanies + contactsByStatus.uploaded;
  const totalContactsInPipeline = Object.values(contactsByStatus).reduce((a, b) => a + b, 0);

  // Calculate pipeline percentages
  const pipelineData = [
    { label: 'Uploaded', count: contactsByStatus.uploaded, percentage: 0 },
    { label: 'Approved', count: contactsByStatus.approved, percentage: 0 },
    { label: 'Assigned to SDR', count: contactsByStatus.assigned_to_sdr, percentage: 0 },
    { label: 'Meeting Scheduled', count: contactsByStatus.meeting_scheduled, percentage: 0 },
  ];

  // Calculate percentages based on total
  if (totalContactsInPipeline > 0) {
    pipelineData.forEach((stage) => {
      stage.percentage = (stage.count / totalContactsInPipeline) * 100;
    });
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's what's happening with your CRM.</p>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="Total Segments" value={totalSegments} icon={FileText} color="blue" />
            <StatCard title="Total Companies" value={totalCompanies} icon={Building2} color="green" />
            <StatCard title="Total Contacts" value={totalContacts} icon={Users} color="purple" />
            <StatCard
              title="Pending Approvals"
              value={totalPendingApprovals}
              icon={CheckCircle}
              color="orange"
            />
            <StatCard
              title="Active Assignments"
              value={assignedContacts}
              icon={UserCheck}
              color="indigo"
            />
          </div>

          {/* Pipeline Velocity */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Contact Pipeline Velocity</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track the progression of contacts through your sales pipeline
              </p>
            </div>

            <div className="space-y-4">
              {pipelineData.map((stage) => (
                <PipelineStage
                  key={stage.label}
                  label={stage.label}
                  count={stage.count}
                  percentage={stage.percentage}
                  color="primary-600"
                />
              ))}
            </div>

            {/* Pipeline Summary */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{contactsByStatus.uploaded}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Awaiting Approval</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{assignedContacts}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Assigned to SDRs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{meetingScheduled}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Meetings Scheduled</p>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                <button
                  onClick={() => navigate('/companies')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all
                </button>
              </div>

              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-4">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === 'company'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {activity.type === 'company' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {activity.type === 'company' ? 'Company' : 'Contact'} created
                            </p>
                          </div>
                          <StatusBadge status={activity.status} />
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mb-3">
                    <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">No recent activity</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/companies')}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-slate-700 dark:hover:border-slate-600 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Upload Companies</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Import new company data</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/contacts')}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-slate-700 dark:hover:border-slate-600 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Upload Contacts</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Import new contact data</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/approvals')}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-slate-700 dark:hover:border-slate-600 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">View Approvals</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Review pending items</p>
                    </div>
                    {totalPendingApprovals > 0 && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                        {totalPendingApprovals}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
