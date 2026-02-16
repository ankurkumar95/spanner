import { NavLink } from 'react-router';
import {
  Wrench,
  LayoutDashboard,
  Users,
  PieChart,
  Building2,
  Contact,
  ClipboardCheck,
  Settings,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'User Management' },
];

const workspaceNav = [
  { to: '/segments', icon: PieChart, label: 'Segments' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/contacts', icon: Contact, label: 'Contacts' },
];

const operationsNav = [
  { to: '/approvals', icon: ClipboardCheck, label: 'Approval Queue', badge: 12 },
];

const bottomNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '#', icon: HelpCircle, label: 'Help & Support' },
];

export default function Sidebar() {
  const { sidebarTheme, toggleSidebarTheme } = useThemeStore();
  const isDark = sidebarTheme === 'dark';

  return (
    <aside
      className={cn(
        'w-64 flex flex-col border-r',
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-300'
          : 'bg-white border-slate-200'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'h-16 flex items-center px-6 border-b',
          isDark ? 'border-slate-800' : 'border-slate-100'
        )}
      >
        <div className="flex items-center gap-2">
          <Wrench
            className={cn(
              'w-6 h-6',
              isDark ? 'text-indigo-400' : 'text-blue-600'
            )}
          />
          <span
            className={cn(
              'text-xl font-bold tracking-tight',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            Spanner
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Main Section */}
        <div className="px-3 mb-2">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isDark ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Main
          </p>
        </div>
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                isDark
                  ? isActive
                    ? 'bg-slate-800 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="mr-3 w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {/* Workspace Section */}
        <div className="px-3 mt-6 mb-2">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isDark ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Workspace
          </p>
        </div>
        {workspaceNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                isDark
                  ? isActive
                    ? 'bg-slate-800 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="mr-3 w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {/* Operations Section */}
        <div className="px-3 mt-6 mb-2">
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              isDark ? 'text-slate-500' : 'text-slate-400'
            )}
          >
            Operations
          </p>
        </div>
        {operationsNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                isDark
                  ? isActive
                    ? 'bg-slate-800 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <div className="flex items-center">
              <item.icon className="mr-3 w-5 h-5" />
              {item.label}
            </div>
            {item.badge && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div
        className={cn(
          'p-4 border-t',
          isDark ? 'border-slate-800' : 'border-slate-100'
        )}
      >
        {bottomNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <item.icon className="mr-3 w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {/* Theme Toggle */}
        <button
          onClick={toggleSidebarTheme}
          className={cn(
            'flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors mt-2',
            isDark
              ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          {isDark ? (
            <Sun className="mr-3 w-5 h-5" />
          ) : (
            <Moon className="mr-3 w-5 h-5" />
          )}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}
