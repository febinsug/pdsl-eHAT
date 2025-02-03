import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  CheckSquare,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-white/10 text-white'
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isAdmin = user.role === 'admin';
  const isManagerOrAdmin = user.role === 'manager' || isAdmin;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500 text-white';
      case 'manager':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-[#1732ca] p-4 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3">
          <Clock className="w-6 h-6 text-white" />
          <h1 className="text-lg font-bold text-white">PDSL Hour Tracker</h1>
        </div>
        
        <nav className="mt-8 space-y-1 flex-1">
          <SidebarItem
            to="/"
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Overview"
            active={location.pathname === '/'}
          />
          <SidebarItem
            to="/hours"
            icon={<Clock className="w-5 h-5" />}
            label="Hour Submission"
            active={location.pathname === '/hours'}
          />
          {isManagerOrAdmin && (
            <>
              <SidebarItem
                to="/projects"
                icon={<FolderKanban className="w-5 h-5" />}
                label="Manage Projects"
                active={location.pathname === '/projects'}
              />
              <SidebarItem
                to="/approvals"
                icon={<CheckSquare className="w-5 h-5" />}
                label="Approvals"
                active={location.pathname === '/approvals'}
              />
            </>
          )}
          {isAdmin && (
            <SidebarItem
              to="/people"
              icon={<Users className="w-5 h-5" />}
              label="People"
              active={location.pathname === '/people'}
            />
          )}
        </nav>

        <div className="border-t border-white/10 pt-4 space-y-4">
          {/* User Profile Section */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {(user.full_name || user.username)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || user.username}
                </p>
                <div className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium capitalize whitespace-nowrap truncate max-w-[120px]"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>

          <SidebarItem
            to="/settings"
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            active={location.pathname === '/settings'}
          />
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};